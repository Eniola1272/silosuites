<?php
/**
 * Plugin Name: Silo Suites Booking
 * Description: Server-side Hostaway live availability search, property mapping and quote calculation.
 * Version: 0.2.0
 * Requires at least: 6.8
 * Requires PHP: 7.4
 * Author: Homlay
 * License: GPL-2.0-or-later
 * Text Domain: silosuites-booking
 */
namespace SiloSuites\Booking;
defined( 'ABSPATH' ) || exit;
const VERSION = '0.2.0';

require_once __DIR__ . '/includes/class-hostaway-client.php';
require_once __DIR__ . '/includes/class-availability-service.php';

function properties() {
    return array(
        'silo-1'    => 'Silo Suite 1',
        'silo-2'    => 'Silo Suite 2',
        'silo-3'    => 'Silo Suite 3',
        'silo-4'    => 'Silo Suite 4',
        'dairy'     => 'The Dairy Suite',
        'all-silos' => 'All Four Silos',
    );
}

function refresh_metadata() {
    if ( ! current_user_can( 'manage_options' ) ) { return new \WP_Error( 'ssb_forbidden', 'Administrator access is required.' ); }
    $client = new Hostaway_Client();
    if ( ! $client->configured() ) { return new \WP_Error( 'ssb_config', 'Hostaway credentials are not configured on this server.' ); }
    if ( get_transient( 'ssb_discovery_cooldown' ) ) { return new \WP_Error( 'ssb_cooldown', 'Wait one minute before another connection check.' ); }
    $lock = get_option( 'ssb_discovery_lock' );
    if ( $lock && (int) $lock < time() - 600 ) { delete_option( 'ssb_discovery_lock' ); }
    if ( ! add_option( 'ssb_discovery_lock', time(), '', false ) ) { return new \WP_Error( 'ssb_busy', 'A connection check is already running.' ); }
    set_transient( 'ssb_discovery_cooldown', 1, MINUTE_IN_SECONDS );
    try {
        $rows = $client->listings();
        if ( is_wp_error( $rows ) ) {
            update_option( 'ssb_last_check', array( 'at' => gmdate( 'c' ), 'ok' => false, 'message' => $rows->get_error_message() ), false );
            return $rows;
        }
        update_option( 'ssb_listing_snapshot', array( 'checked_at_utc' => gmdate( 'c' ), 'listings' => $rows ), false );
        update_option( 'ssb_last_check', array( 'at' => gmdate( 'c' ), 'ok' => true, 'message' => 'Authentication and listing metadata succeeded. Checkout and sync remain unverified.' ), false );
        return $rows;
    } finally { delete_option( 'ssb_discovery_lock' ); }
}

function save_mapping( $input ) {
    if ( ! current_user_can( 'manage_options' ) ) { return new \WP_Error( 'ssb_forbidden', 'Administrator access is required.' ); }
    if ( ! is_array( $input ) ) { return new \WP_Error( 'ssb_mapping', 'Invalid property mapping.' ); }
    $snapshot = get_option( 'ssb_listing_snapshot', array() );
    $available = array_column( $snapshot['listings'] ?? array(), 'id' );
    $mapping = array();
    foreach ( properties() as $slug => $label ) {
        $id = $input[ $slug ] ?? '';
        if ( ! is_string( $id ) || ( '' !== $id && ! in_array( $id, $available, true ) ) ) { return new \WP_Error( 'ssb_mapping', 'Every mapped ID must come from a successful Hostaway listing check.' ); }
        if ( '' !== $id ) {
            if ( in_array( $id, $mapping, true ) ) { return new \WP_Error( 'ssb_duplicate', 'Each property needs its own listing ID. Group relationships must be verified separately.' ); }
            $mapping[ $slug ] = $id;
        }
    }
    update_option( 'ssb_property_mapping', $mapping, false );
    return true;
}

add_action( 'admin_menu', function () {
    add_management_page( 'Silo Suites Booking', 'Silo Suites Booking', 'manage_options', 'silosuites-booking', __NAMESPACE__ . '\\admin_page' );
} );

add_action( 'admin_post_ssb_discover', function () {
    if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Administrator access is required.', '', array( 'response' => 403 ) ); }
    check_admin_referer( 'ssb_discover' );
    $result = refresh_metadata();
    set_transient( 'ssb_notice_' . get_current_user_id(), is_wp_error( $result ) ? $result->get_error_message() : 'Hostaway listing metadata refreshed. No bookings or payments changed.', 120 );
    wp_safe_redirect( admin_url( 'tools.php?page=silosuites-booking' ) ); exit;
} );

add_action( 'admin_post_ssb_mapping', function () {
    if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Administrator access is required.', '', array( 'response' => 403 ) ); }
    check_admin_referer( 'ssb_mapping' );
    $result = save_mapping( wp_unslash( $_POST['mapping'] ?? array() ) );
    set_transient( 'ssb_notice_' . get_current_user_id(), is_wp_error( $result ) ? $result->get_error_message() : 'Listing mapping saved. This does not enable checkout or verify group inventory.', 120 );
    wp_safe_redirect( admin_url( 'tools.php?page=silosuites-booking' ) ); exit;
} );

add_action( 'rest_api_init', function () {
    register_rest_route( 'silosuites/v1', '/availability', array(
        'methods'             => 'GET',
        'callback'            => __NAMESPACE__ . '\\rest_availability',
        'permission_callback' => '__return_true',
    ) );
    register_rest_route( 'silosuites/v1', '/quote', array(
        'methods'             => 'GET',
        'callback'            => __NAMESPACE__ . '\\rest_quote',
        'permission_callback' => '__return_true',
    ) );
} );

function rest_availability( \WP_REST_Request $request ) {
    $service = new Availability_Service();
    $check_in = sanitize_text_field( $request->get_param( 'check_in' ) ?? '' );
    $check_out = sanitize_text_field( $request->get_param( 'check_out' ) ?? '' );
    $guests = (int) ( $request->get_param( 'guests' ) ?? 1 );

    $result = $service->evaluate_availability( $check_in, $check_out, $guests );
    if ( is_wp_error( $result ) ) {
        return new \WP_REST_Response( array(
            'status'  => 'error',
            'code'    => $result->get_error_code(),
            'message' => $result->get_error_message(),
        ), 400 );
    }

    return new \WP_REST_Response( $result, 200 );
}

function rest_quote( \WP_REST_Request $request ) {
    $service = new Availability_Service();
    $property = sanitize_text_field( $request->get_param( 'property' ) ?? '' );
    $check_in = sanitize_text_field( $request->get_param( 'check_in' ) ?? '' );
    $check_out = sanitize_text_field( $request->get_param( 'check_out' ) ?? '' );
    $guests = (int) ( $request->get_param( 'guests' ) ?? 1 );

    $result = $service->generate_quote( $property, $check_in, $check_out, $guests );
    if ( is_wp_error( $result ) ) {
        return new \WP_REST_Response( array(
            'status'  => 'error',
            'code'    => $result->get_error_code(),
            'message' => $result->get_error_message(),
        ), 400 );
    }

    return new \WP_REST_Response( $result, 200 );
}

function admin_page() {
    if ( ! current_user_can( 'manage_options' ) ) { return; }
    $client = new Hostaway_Client(); $snapshot = get_option( 'ssb_listing_snapshot', array() ); $last = get_option( 'ssb_last_check', array() ); $mapping = get_option( 'ssb_property_mapping', array() );
    $notice = get_transient( 'ssb_notice_' . get_current_user_id() ); delete_transient( 'ssb_notice_' . get_current_user_id() );
    ?>
    <div class="wrap"><h1>Silo Suites Booking <small><?php echo esc_html( VERSION ); ?></small></h1>
    <?php if ( $notice ) : ?><div class="notice notice-info"><p><?php echo esc_html( $notice ); ?></p></div><?php endif; ?>
    <p><strong>Phase 4 Development Build:</strong> Server-side Hostaway availability search, property mapping, multi-silo composite availability, and quote calculation are active. Checkout transaction and reservation creation remain in staging testing.</p>
    <h2>Server configuration</h2><p>Credentials: <strong><?php echo $client->configured() ? 'configured' : 'not configured'; ?></strong>. Values are never displayed here.</p>
    <p>Set <code>SILOSUITES_HOSTAWAY_ACCOUNT_ID</code> and <code>SILOSUITES_HOSTAWAY_CLIENT_SECRET</code> in private server environment variables or wp-config.php. Use the Hostaway Account ID, not an API-key row ID. No credentials are accepted from a browser form.</p>
    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>"><input type="hidden" name="action" value="ssb_discover"><?php wp_nonce_field( 'ssb_discover' ); ?><p><button class="button button-primary" <?php disabled( ! $client->configured() ); ?>>Check Hostaway connection and listings</button></p></form>
    <?php if ( $last ) : ?><p>Last check: <?php echo esc_html( $last['at'] ); ?> — <?php echo esc_html( $last['message'] ); ?></p><?php endif; ?>
    <h2>Listing metadata snapshot</h2><p>Snapshot time: <?php echo esc_html( $snapshot['checked_at_utc'] ?? 'none' ); ?>. After a failed check, the last successful snapshot remains for reference.</p>
    <table class="widefat striped"><thead><tr><th>ID</th><th>Name</th><th>Guests</th><th>Bedrooms</th><th>Beds</th><th>Bathrooms</th><th>Currency</th></tr></thead><tbody>
    <?php foreach ( $snapshot['listings'] ?? array() as $row ) : ?><tr><?php foreach ( array( 'id', 'name', 'personCapacity', 'bedroomsNumber', 'bedsNumber', 'bathroomsNumber', 'currencyCode' ) as $key ) : ?><td><?php echo esc_html( $row[ $key ] ?? 'Unknown' ); ?></td><?php endforeach; ?></tr><?php endforeach; ?>
    </tbody></table><h2>Property mapping</h2><p>Mapped listing IDs are queried for live calendar availability and pricing calculations.</p>
    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>"><input type="hidden" name="action" value="ssb_mapping"><?php wp_nonce_field( 'ssb_mapping' ); ?><table class="form-table">
    <?php foreach ( properties() as $slug => $label ) : ?><tr><th><label for="ssb-<?php echo esc_attr( $slug ); ?>"><?php echo esc_html( $label ); ?></label></th><td><select id="ssb-<?php echo esc_attr( $slug ); ?>" name="mapping[<?php echo esc_attr( $slug ); ?>]"><option value="">Not mapped</option>
    <?php if ( ! empty( $mapping[ $slug ] ) && ! in_array( $mapping[ $slug ], array_column( $snapshot['listings'] ?? array(), 'id' ), true ) ) : ?><option selected value="">Previous ID absent from latest snapshot — remap required</option><?php endif; ?>
    <?php foreach ( $snapshot['listings'] ?? array() as $row ) : ?><option value="<?php echo esc_attr( $row['id'] ); ?>" <?php selected( $mapping[ $slug ] ?? '', $row['id'] ); ?>><?php echo esc_html( $row['id'] . ' — ' . $row['name'] ); ?></option><?php endforeach; ?></select></td></tr><?php endforeach; ?></table><?php submit_button( 'Save listing mapping' ); ?></form>
    <h2>REST API Endpoints</h2>
    <ul>
        <li><code>GET /wp-json/silosuites/v1/availability?check_in=YYYY-MM-DD&amp;check_out=YYYY-MM-DD&amp;guests=N</code></li>
        <li><code>GET /wp-json/silosuites/v1/quote?property={slug}&amp;check_in=YYYY-MM-DD&amp;check_out=YYYY-MM-DD&amp;guests=N</code></li>
    </ul>
    </div><?php
}
