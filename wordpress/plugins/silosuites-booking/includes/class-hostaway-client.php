<?php
namespace SiloSuites\Booking;
defined( 'ABSPATH' ) || exit;

/** Server-only, read-only adapter. No reservation, guest or payment endpoints exist here. */
final class Hostaway_Client {
    private $account;
    private $secret;
    private $token_key;
    public function __construct() {
        $this->account = defined( 'SILOSUITES_HOSTAWAY_ACCOUNT_ID' ) ? (string) SILOSUITES_HOSTAWAY_ACCOUNT_ID : (string) getenv( 'SILOSUITES_HOSTAWAY_ACCOUNT_ID' );
        $this->secret = defined( 'SILOSUITES_HOSTAWAY_CLIENT_SECRET' ) ? (string) SILOSUITES_HOSTAWAY_CLIENT_SECRET : (string) getenv( 'SILOSUITES_HOSTAWAY_CLIENT_SECRET' );
        $this->token_key = 'ssb_token_' . hash_hmac( 'sha256', $this->account . '|' . $this->secret, wp_salt( 'auth' ) );
    }
    public function configured() {
        return (bool) preg_match( '/^[0-9]{1,32}$/D', $this->account ) && '' !== $this->secret && ! preg_match( '/[\r\n]/', $this->secret );
    }
    private function response( $response ) {
        if ( is_wp_error( $response ) ) { return new \WP_Error( 'ssb_network', 'Hostaway could not be reached securely. Retry later.' ); }
        $code = wp_remote_retrieve_response_code( $response );
        if ( 429 === $code ) { return new \WP_Error( 'ssb_rate', 'Hostaway rate limit reached. Wait before trying again.' ); }
        if ( $code < 200 || $code >= 300 ) { return new \WP_Error( 'ssb_http_' . $code, 'Hostaway returned HTTP ' . (int) $code . '. Check access or retry later.' ); }
        $body = wp_remote_retrieve_body( $response );
        if ( strlen( $body ) > 8388608 ) { return new \WP_Error( 'ssb_size', 'Hostaway response exceeded the permitted size.' ); }
        $data = json_decode( $body, true );
        if ( ! is_array( $data ) || JSON_ERROR_NONE !== json_last_error() || ( isset( $data['status'] ) && 'success' !== $data['status'] ) ) {
            return new \WP_Error( 'ssb_response', 'Hostaway returned an unexpected response. No provider details were logged.' );
        }
        return $data;
    }
    private function token() {
        if ( ! $this->configured() ) { return new \WP_Error( 'ssb_config', 'Set the Hostaway Account ID and API key in server configuration first.' ); }
        $cached = get_transient( $this->token_key );
        if ( is_string( $cached ) && '' !== $cached ) { return $cached; }
        $data = $this->response( wp_remote_post( 'https://api.hostaway.com/v1/accessTokens', array(
            'timeout' => 20, 'redirection' => 0, 'sslverify' => true, 'limit_response_size' => 8388609,
            'headers' => array( 'Accept' => 'application/json' ),
            'body' => array( 'grant_type' => 'client_credentials', 'client_id' => $this->account, 'client_secret' => $this->secret, 'scope' => 'general' ),
        ) ) );
        if ( is_wp_error( $data ) ) { return $data; }
        if ( ! isset( $data['access_token'], $data['expires_in'] ) || ! is_string( $data['access_token'] ) || '' === $data['access_token'] || ! is_numeric( $data['expires_in'] ) || $data['expires_in'] <= 60 || preg_match( '/[\r\n]/', $data['access_token'] ) ) {
            return new \WP_Error( 'ssb_token', 'Hostaway did not return a usable access token.' );
        }
        // Hostaway documents a one-second delay before a new token is usable.
        sleep( 1 );
        set_transient( $this->token_key, $data['access_token'], min( DAY_IN_SECONDS, (int) $data['expires_in'] - 60 ) );
        return $data['access_token'];
    }
    private function page( $offset, $retry = true ) {
        $token = $this->token();
        if ( is_wp_error( $token ) ) { return $token; }
        $response = wp_remote_get( 'https://api.hostaway.com/v1/listings?limit=100&offset=' . (int) $offset, array(
            'timeout' => 20, 'redirection' => 0, 'sslverify' => true, 'limit_response_size' => 8388609,
            'headers' => array( 'Accept' => 'application/json', 'Authorization' => 'Bearer ' . $token ),
        ) );
        if ( ! is_wp_error( $response ) && 401 === wp_remote_retrieve_response_code( $response ) && $retry ) {
            delete_transient( $this->token_key );
            return $this->page( $offset, false );
        }
        return $this->response( $response );
    }
    public function listings() {
        $rows = array();
        for ( $page = 0; $page < 20; ++$page ) {
            $data = $this->page( $page * 100 );
            if ( is_wp_error( $data ) ) { return $data; }
            if ( ! isset( $data['result'] ) || ! is_array( $data['result'] ) || array_values( $data['result'] ) !== $data['result'] || count( $data['result'] ) > 100 ) {
                return new \WP_Error( 'ssb_listings', 'Hostaway listing metadata could not be validated.' );
            }
            foreach ( $data['result'] as $listing ) {
                if ( ! is_array( $listing ) || ! isset( $listing['id'] ) || ! preg_match( '/^[0-9]{1,32}$/D', (string) $listing['id'] ) || isset( $rows[ (string) $listing['id'] ] ) ) {
                    return new \WP_Error( 'ssb_listing', 'Hostaway returned invalid or duplicate listing IDs. Previous metadata was preserved.' );
                }
                $row = array( 'id' => (string) $listing['id'], 'name' => sanitize_text_field( $listing['name'] ?? '' ) );
                foreach ( array( 'personCapacity', 'bedroomsNumber', 'bathroomsNumber', 'bedsNumber' ) as $field ) {
                    $value = $listing[ $field ] ?? null;
                    $row[ $field ] = is_numeric( $value ) && $value >= 0 && $value <= 10000 ? (float) $value : null;
                }
                $currency = (string) ( $listing['currencyCode'] ?? '' );
                $row['currencyCode'] = preg_match( '/^[A-Z]{3}$/D', $currency ) ? $currency : null;
                $rows[ $row['id'] ] = $row;
            }
            if ( count( $data['result'] ) < 100 ) { return array_values( $rows ); }
        }
        return new \WP_Error( 'ssb_pagination', 'Listing limit reached. No incomplete metadata snapshot was saved.' );
    }
}
