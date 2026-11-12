<?php
/**
 * Plugin Name: Silo Suites Design Importer
 * Description: Imports the supplied Silo Suites media and editable Elementor homepage and property templates. Does not change the live homepage or connect to Hostaway.
 * Version: 0.2.3
 * Requires at least: 6.8
 * Requires PHP: 7.4
 * Author: Homlay
 * License: GPL-2.0-or-later
 * Text Domain: silosuites-design-importer
 */

namespace SiloSuites\DesignImporter;

defined( 'ABSPATH' ) || exit;
const VERSION = '0.2.3';

add_action( 'admin_menu', function () {
    add_management_page( 'Silo Suites Design', 'Silo Suites Design', 'manage_options', 'silosuites-design', __NAMESPACE__ . '\\admin_page' );
} );

add_action( 'admin_post_ssdi_import_design', function () {
    if ( ! current_user_can( 'manage_options' ) || ! current_user_can( 'unfiltered_html' ) ) {
        wp_die( esc_html__( 'An administrator with permission to import HTML is required.', 'silosuites-design-importer' ), '', array( 'response' => 403 ) );
    }
    check_admin_referer( 'ssdi_import_design' );
    $batch = isset( $_POST['ssdi_batch'] ) && '1' === $_POST['ssdi_batch'];
    $pending = false;
    $result = import_design( 1, $pending );
    if ( $batch ) {
        if ( is_wp_error( $result ) ) { wp_send_json_error( array( 'message' => $result->get_error_message() ), 400 ); }
        $complete = 10 === count( $result ) && ! $pending;
        if ( $complete ) { set_transient( 'ssdi_result_' . get_current_user_id(), 'Imported successfully. All ten saved templates are ready.', 120 ); }
        wp_send_json_success( array( 'complete' => $complete, 'templates' => count( $result ), 'total' => 10 ) );
    }
    $message = is_wp_error( $result ) ? $result->get_error_message() : ( $pending ? 'Step saved. Click Continue one step to resume; completed content is preserved.' : 'Imported successfully. All ten saved templates are ready.' );
    set_transient( 'ssdi_result_' . get_current_user_id(), $message, 120 );
    wp_safe_redirect( admin_url( 'tools.php?page=silosuites-design' ) );
    exit;
} );

function admin_page() {
    if ( ! current_user_can( 'manage_options' ) ) { return; }
    $ready = class_exists( '\\Elementor\\Plugin' );
    $history = get_option( 'ssdi_import_history', array() );
    $templates = isset( $history[ VERSION ]['templates'] ) ? $history[ VERSION ]['templates'] : array();
    ?>
    <div class="wrap">
        <h1>Silo Suites Design</h1>
        <p>Version <?php echo esc_html( VERSION ); ?>. Import the original media, homepage and property templates, editable popup sections, and header/footer sections into this site's Elementor library.</p>
        <p>This creates saved templates only. It does not replace pages, change the homepage, connect to Hostaway, or create bookings.</p>
        <?php $message = get_transient( 'ssdi_result_' . get_current_user_id() ); ?>
        <?php if ( $message ) : ?>
            <div class="notice notice-info"><p><?php echo esc_html( $message ); ?></p></div>
            <?php delete_transient( 'ssdi_result_' . get_current_user_id() ); ?>
        <?php endif; ?>
        <?php if ( ! $ready ) : ?>
            <div class="notice notice-error"><p>Install and activate Elementor before importing.</p></div>
        <?php elseif ( ! current_user_can( 'unfiltered_html' ) ) : ?>
            <div class="notice notice-error"><p>This template includes a scoped stylesheet and a preview date form. An administrator allowed to import HTML must run the import.</p></div>
        <?php else : ?>
            <form id="ssdi-import-form" action="<?php echo esc_url( admin_url( 'admin-post.php', 'relative' ) ); ?>" method="post">
                <input type="hidden" name="action" value="ssdi_import_design">
                <?php wp_nonce_field( 'ssdi_import_design' ); ?>
                <?php submit_button( 'Import Silo Suites design' ); ?>
                <p><button type="submit" class="button" name="ssdi_compat" value="1">Continue one step</button> — standard page submission, useful if automatic import reports a network error.</p>
                <noscript><p>JavaScript is unavailable. Each submission imports one item; repeat until all ten templates are ready.</p></noscript>
            </form>
            <p id="ssdi-import-progress" role="status" aria-live="polite"></p>
            <script>
            (function () {
                var form = document.getElementById('ssdi-import-form');
                var progress = document.getElementById('ssdi-import-progress');
                var active = false;
                form.addEventListener('submit', async function (event) {
                    if (event.submitter && event.submitter.name === 'ssdi_compat') return;
                    event.preventDefault();
                    if (active) return;
                    active = true;
                    var button = form.querySelector('[type=submit]');
                    var compatibility = form.querySelector('[name=ssdi_compat]');
                    button.disabled = true;
                    compatibility.disabled = true;
                    try {
                        for (var step = 0; step < 64; step++) {
                            progress.textContent = 'Importing in small steps. Keep this tab open. Previously imported content will be preserved.';
                            var body = new FormData(form);
                            body.set('ssdi_batch', '1');
                            var response = await fetch(form.getAttribute('action'), {method:'POST', credentials:'same-origin', redirect:'error', body:body});
                            if (response.status === 401 || response.status === 403) throw new Error('WordPress rejected this request (HTTP ' + response.status + '). Reload this page to refresh your login and security token, then continue.');
                            var result;
                            try { result = await response.json(); } catch (_) { throw new Error('The server did not finish this step. Reload this page and continue; completed steps are preserved.'); }
                            if (!response.ok || !result.success) throw new Error(result.data && result.data.message || 'Import paused. Reload this page and continue.');
                            progress.textContent = result.data.templates + ' of ' + result.data.total + ' templates ready. Preparing any remaining media or templates…';
                            if (result.data.complete) {
                                progress.textContent = 'All ten templates imported successfully.';
                                window.location.reload();
                                return;
                            }
                        }
                        throw new Error('Import paused at its step limit. Reload this page and continue.');
                    } catch (error) {
                        progress.textContent = error instanceof TypeError ? 'Automatic import could not reach WordPress. Click Continue one step to use a standard page submission. Completed steps are preserved. If that also fails, note the error shown on the resulting page.' : error.message;
                    } finally {
                        active = false;
                        button.disabled = false;
                        compatibility.disabled = false;
                    }
                });
            })();
            </script>
        <?php endif; ?>
        <?php if ( $templates ) : ?>
            <h2>Saved templates</h2><ul>
            <?php foreach ( $templates as $name => $id ) : ?>
                <?php if ( 'elementor_library' !== get_post_type( $id ) ) { continue; } ?>
                <li><a href="<?php echo esc_url( admin_url( 'post.php?post=' . absint( $id ) . '&action=elementor' ) ); ?>"><?php echo esc_html( get_the_title( $id ) ); ?></a></li>
            <?php endforeach; ?>
            </ul>
        <?php endif; ?>
        <h2>Choose the right template</h2>
        <p><strong>Home content</strong> uses your existing theme's header and footer. Insert it into a new draft using Elementor Full Width.</p>
        <p><strong>Complete homepage</strong> includes the new navigation and footer. Use Elementor Canvas to avoid duplicate theme headers and footers.</p>
        <p><strong>Header and Footer</strong> are independent saved sections with their own styles. With Elementor Pro, create the matching Theme Builder part and insert its saved section. Review and set display conditions there; this importer does not activate site-wide conditions.</p>
        <p>Use the content-only homepage with Elementor Full Width when your Theme Builder header and footer are active.</p>
        <p>The date form is a design preview. It validates dates but does not claim live availability. The Hostaway booking connector is a separate implementation.</p>
        <p>After importing, you can deactivate this installer. The Media Library assets and native Elementor content remain.</p>
    </div>
    <?php
}

function rewrite_media( $value, $mapping ) {
    if ( ! is_array( $value ) ) { return $value; }
    if ( isset( $value['url'], $mapping[ $value['url'] ] ) ) {
        $media = $mapping[ $value['url'] ];
        $value['id'] = $media['id'];
        $value['url'] = $media['url'];
    } elseif ( isset( $value['url'] ) && is_string( $value['url'] ) && 0 === strpos( $value['url'], '/' ) && 0 !== strpos( $value['url'], '//' ) ) {
        $value['url'] = home_url( $value['url'] );
    }
    if ( isset( $value['html'] ) && is_string( $value['html'] ) ) {
        $value['html'] = str_replace( 'href="/', 'href="' . esc_url( trailingslashit( home_url() ) ), $value['html'] );
    }
    foreach ( $value as $key => $child ) {
        if ( is_array( $child ) ) { $value[ $key ] = rewrite_media( $child, $mapping ); }
    }
    return $value;
}

function current_templates() {
    $history = get_option( 'ssdi_import_history', array() );
    $templates = $history[ VERSION ]['templates'] ?? array();
    return array_filter( $templates, function ( $id ) { return 'elementor_library' === get_post_type( $id ); } );
}

function import_design( $max_work = null, &$pending = null ) {
    $pending = false;
    if ( ! current_user_can( 'manage_options' ) || ! current_user_can( 'unfiltered_html' ) ) {
        return new \WP_Error( 'ssdi_forbidden', 'Administrator permission is required.' );
    }
    if ( ! class_exists( '\\Elementor\\Plugin' ) ) {
        return new \WP_Error( 'ssdi_elementor_missing', 'Activate Elementor first.' );
    }
    $lock = get_option( 'ssdi_import_lock' );
    if ( $lock && (int) $lock < time() - 600 ) { delete_option( 'ssdi_import_lock' ); }
    if ( ! add_option( 'ssdi_import_lock', time(), '', false ) ) {
        return new \WP_Error( 'ssdi_busy', 'An import is already running. Wait for it to finish.' );
    }
    $work = 0;
    try {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
        $payload = __DIR__ . '/payload/';
        $manifest = json_decode( file_get_contents( $payload . 'media-manifest.json' ), true );
        if ( ! is_array( $manifest ) ) { return new \WP_Error( 'ssdi_manifest', 'The bundled media manifest is invalid.' ); }
        $mapping = array();
        foreach ( $manifest as $asset ) {
            $filename = isset( $asset['filename'] ) ? $asset['filename'] : '';
            $file = realpath( $payload . 'assets/' . $filename );
            $asset_root = realpath( $payload . 'assets' ) . DIRECTORY_SEPARATOR;
            if ( ! $file || 0 !== strpos( $file, $asset_root ) || basename( $filename ) !== $filename || empty( $asset['sha256'] ) || ! hash_equals( $asset['sha256'], hash_file( 'sha256', $file ) ) ) {
                return new \WP_Error( 'ssdi_media_invalid', 'A bundled image could not be verified.' );
            }
            $existing = get_posts( array( 'post_type' => 'attachment', 'post_status' => 'inherit', 'fields' => 'ids', 'posts_per_page' => 1, 'meta_key' => '_ssdi_source_sha256', 'meta_value' => $asset['sha256'] ) );
            $id = $existing ? (int) $existing[0] : 0;
            if ( ! $id || ! is_file( (string) get_attached_file( $id ) ) ) {
                if ( null !== $max_work && $work >= $max_work ) { $pending = true; return current_templates(); }
                $temporary = wp_tempnam( $filename );
                if ( ! $temporary || ! copy( $file, $temporary ) ) { return new \WP_Error( 'ssdi_copy_failed', 'Could not prepare a bundled image for import.' ); }
                $id = media_handle_sideload( array( 'name' => $filename, 'tmp_name' => $temporary ), 0 );
                if ( is_wp_error( $id ) ) { @unlink( $temporary ); return $id; }
                update_post_meta( $id, '_ssdi_source_sha256', $asset['sha256'] );
                update_post_meta( $id, '_wp_attachment_image_alt', sanitize_text_field( $asset['alt'] ) );
                ++$work;
            }
            $url = wp_get_attachment_url( $id );
            if ( ! $url ) { return new \WP_Error( 'ssdi_media_url', 'An imported image has no Media Library URL.' ); }
            $mapping[ $asset['template_url'] ] = array( 'id' => (int) $id, 'url' => $url );
            // Let Elementor reuse these attachments both during this import and on a later manual JSON import.
            foreach ( array_unique( array( $url, $asset['template_url'] ) ) as $source_url ) {
                $hash = sha1( $source_url );
                if ( ! in_array( $hash, get_post_meta( $id, '_elementor_source_image_hash' ), true ) ) {
                    add_post_meta( $id, '_elementor_source_image_hash', $hash );
                }
            }
        }
        $history = get_option( 'ssdi_import_history', array() );
        if ( ! isset( $history[ VERSION ] ) ) { $history[ VERSION ] = array( 'templates' => array() ); }
        foreach ( array( 'home-content', 'home-complete', 'header', 'footer', 'property', 'property-complete', 'popup-about', 'popup-amenities', 'popup-rules', 'popup-cancellation' ) as $name ) {
            $existing_id = isset( $history[ VERSION ]['templates'][ $name ] ) ? $history[ VERSION ]['templates'][ $name ] : 0;
            if ( $existing_id && 'elementor_library' === get_post_type( $existing_id ) ) { continue; }
            if ( null !== $max_work && $work >= $max_work ) { $pending = true; return current_templates(); }
            $data = json_decode( file_get_contents( $payload . $name . '.json' ), true );
            $expected_type = ( in_array( $name, array( 'header', 'footer' ), true ) || 0 === strpos( $name, 'popup-' ) ) ? 'section' : 'page';
            if ( ! is_array( $data ) || empty( $data['content'] ) || $expected_type !== $data['type'] ) { return new \WP_Error( 'ssdi_template', 'A bundled template is invalid.' ); }
            $data = rewrite_media( $data, $mapping );
            $temporary = wp_tempnam( $name . '.json' );
            if ( ! $temporary || false === file_put_contents( $temporary, wp_json_encode( $data ) ) ) { return new \WP_Error( 'ssdi_template_write', 'Could not prepare the Elementor import.' ); }
            try {
                $result = \Elementor\Plugin::$instance->templates_manager->get_source( 'local' )->import_template( $name . '.json', $temporary );
            } finally { @unlink( $temporary ); }
            if ( is_wp_error( $result ) ) { return $result; }
            if ( empty( $result[0]['template_id'] ) ) { return new \WP_Error( 'ssdi_template_id', 'Elementor did not return an imported template ID.' ); }
            ++$work;
            $history[ VERSION ]['templates'][ $name ] = (int) $result[0]['template_id'];
            $history[ VERSION ]['imported_at'] = gmdate( 'c' );
            update_option( 'ssdi_import_history', $history, false );
        }
        \Elementor\Plugin::$instance->files_manager->clear_cache();
        return $history[ VERSION ]['templates'];
    } finally {
        delete_option( 'ssdi_import_lock' );
    }
}
