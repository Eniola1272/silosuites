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
    public function cache_namespace() { return $this->token_key; }
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
        $response = wp_remote_get( 'https://api.hostaway.com/v1/listings?limit=100&includeResources=1&offset=' . (int) $offset, array(
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
                foreach ( array( 'personCapacity', 'bedroomsNumber', 'bathroomsNumber', 'bedsNumber', 'minNights', 'maxNights' ) as $field ) {
                    $value = $listing[ $field ] ?? null;
                    $row[ $field ] = is_numeric( $value ) && $value >= 0 && $value <= 10000 ? (float) $value : null;
                }
                $currency = (string) ( $listing['currencyCode'] ?? '' );
                $row['currencyCode'] = preg_match( '/^[A-Z]{3}$/D', $currency ) ? $currency : null;
                $row['images']=[];
                foreach (array_slice($listing['listingImages']??[],0,8) as $image) {
                    $url=$image['url']??'';$parts=wp_parse_url($url);
                    if (is_array($parts) && ($parts['scheme']??'')==='https' && !isset($parts['user']) && !isset($parts['query'])) $row['images'][]=esc_url_raw($url,['https']);
                }
                $rows[ $row['id'] ] = $row;
            }
            if ( count( $data['result'] ) < 100 ) { return array_values( $rows ); }
        }
        return new \WP_Error( 'ssb_pagination', 'Listing limit reached. No incomplete metadata snapshot was saved.' );
    }
    public function calendar( $listing_id, $start_date, $end_date, $retry = true ) {
        if ( ! preg_match( '/^[0-9]{1,32}$/D', (string) $listing_id ) ) {
            return new \WP_Error( 'ssb_invalid_id', 'Invalid listing ID.' );
        }
        if ( ! preg_match( '/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/D', (string) $start_date ) || ! preg_match( '/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/D', (string) $end_date ) ) {
            return new \WP_Error( 'ssb_invalid_dates', 'Invalid date format. Expected YYYY-MM-DD.' );
        }
        $token = $this->token();
        if ( is_wp_error( $token ) ) { return $token; }

        $url = 'https://api.hostaway.com/v1/listings/' . rawurlencode( (string) $listing_id ) . '/calendar?startDate=' . rawurlencode( (string) $start_date ) . '&endDate=' . rawurlencode( (string) $end_date );
        $response = wp_remote_get( $url, array(
            'timeout' => 20, 'redirection' => 0, 'sslverify' => true, 'limit_response_size' => 8388609,
            'headers' => array( 'Accept' => 'application/json', 'Authorization' => 'Bearer ' . $token ),
        ) );
        if ( ! is_wp_error( $response ) && 401 === wp_remote_retrieve_response_code( $response ) && $retry ) {
            delete_transient( $this->token_key );
            return $this->calendar( $listing_id, $start_date, $end_date, false );
        }
        $data = $this->response( $response );
        if ( is_wp_error( $data ) ) { return $data; }

        $result = $data['result'] ?? null;
        if ( ! is_array( $result ) ) {
            return new \WP_Error( 'ssb_calendar', 'Hostaway returned unexpected calendar format.' );
        }

        $days = array();
        foreach ( $result as $entry ) {
            if ( ! is_array( $entry ) || empty( $entry['date'] ) || ! preg_match( '/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/D', (string) $entry['date'] ) ) {
                return new \WP_Error('ssb_calendar_schema','Hostaway returned invalid calendar data.');
            }
            $date = (string) $entry['date'];
            if (!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4))) return new \WP_Error('ssb_calendar_schema','Invalid provider calendar date.');
            if (isset($days[$date])) return new \WP_Error('ssb_calendar_schema','Hostaway returned duplicate calendar days.');
            $is_available = false;
            if ( isset( $entry['isAvailable'] ) ) {
                $is_available = ( (int) $entry['isAvailable'] === 1 );
            } elseif ( isset( $entry['status'] ) ) {
                $is_available = ( 'available' === strtolower( (string) $entry['status'] ) );
            }

            $price = isset( $entry['price'] ) && is_numeric( $entry['price'] ) ? (float) $entry['price'] : 0.0;
            $min_stay = isset( $entry['minimumStay'] ) && is_numeric( $entry['minimumStay'] ) ? max( 1, (int) $entry['minimumStay'] ) : null;
            $max_stay = isset( $entry['maximumStay'] ) && is_numeric( $entry['maximumStay'] ) && $entry['maximumStay'] > 0 ? (int) $entry['maximumStay'] : null;
            $closed_arrival = !array_key_exists('closedOnArrival',$entry) || !empty($entry['closedOnArrival']);
            $closed_departure = !array_key_exists('closedOnDeparture',$entry) || !empty($entry['closedOnDeparture']);

            $days[ $date ] = array(
                'date'              => $date,
                'is_available'      => $is_available,
                'price'             => $price,
                'minimum_stay'      => $min_stay,
                'maximum_stay'      => $max_stay,
                'closed_arrival'    => $closed_arrival,
                'closed_departure'  => $closed_departure,
            );
        }

        return $days;
    }
    public function price_details( $listing_id, $starting_date, $ending_date, $number_of_guests, $retry = true ) {
        if ( ! preg_match( '/^[0-9]{1,32}$/D', (string) $listing_id ) ) {
            return new \WP_Error( 'ssb_invalid_id', 'Invalid listing ID.' );
        }
        if ( ! preg_match( '/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/D', (string) $starting_date ) || ! preg_match( '/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/D', (string) $ending_date ) ) {
            return new \WP_Error( 'ssb_invalid_dates', 'Invalid date format. Expected YYYY-MM-DD.' );
        }
        $guests = filter_var($number_of_guests,FILTER_VALIDATE_INT,['options'=>['min_range'=>1,'max_range'=>18]]);
        if (!$guests) return new \WP_Error('ssb_guests','Invalid guest count.');

        $token = $this->token();
        if ( is_wp_error( $token ) ) { return $token; }

        $url = 'https://api.hostaway.com/v1/listings/' . rawurlencode((string)$listing_id) . '/calendar/priceDetails';
        $body = wp_json_encode( array(
            'version'        => 2,
            'startingDate'   => (string) $starting_date,
            'endingDate'     => (string) $ending_date,
            'numberOfGuests' => $guests,
        ) );

        $response = wp_remote_post( $url, array(
            'timeout' => 20, 'redirection' => 0, 'sslverify' => true, 'limit_response_size' => 8388609,
            'headers' => array( 'Accept' => 'application/json', 'Content-Type' => 'application/json', 'Authorization' => 'Bearer ' . $token ),
            'body'    => $body,
        ) );

        if ( ! is_wp_error( $response ) && 401 === wp_remote_retrieve_response_code( $response ) && $retry ) {
            delete_transient( $this->token_key );
            return $this->price_details( $listing_id, $starting_date, $ending_date, $number_of_guests, false );
        }

        $data = $this->response( $response );
        if ( is_wp_error( $data ) ) { return $data; }

        $result = $data['result'] ?? null;
        if ( ! is_array( $result ) ) {
            return new \WP_Error( 'ssb_price', 'Hostaway returned unexpected price calculation format.' );
        }

        if (!isset($result['totalPrice'],$result['components']) || !is_numeric($result['totalPrice']) || !is_finite((float)$result['totalPrice']) || (float)$result['totalPrice']<=0 || !is_array($result['components']) || count($result['components'])>100) return new \WP_Error('ssb_price_schema','Hostaway did not return a complete stay total.');
        $components=[]; $included=0.0;
        foreach ($result['components'] as $c) {
            if (!is_array($c) || !isset($c['type'],$c['title'],$c['total'],$c['isIncludedInTotalPrice']) || !is_string($c['type']) || !is_string($c['title']) || !is_numeric($c['total']) || !is_finite((float)$c['total']) || !in_array($c['isIncludedInTotalPrice'],[0,1,'0','1'],true)) return new \WP_Error('ssb_price_schema','Hostaway price components could not be validated.');
            $deleted=!empty($c['isDeleted']);
            $component=['type'=>sanitize_key($c['type']),'name'=>sanitize_key($c['name']??''),'title'=>sanitize_text_field($c['title']),'total'=>(float)$c['total'],'included'=>(bool)$c['isIncludedInTotalPrice'],'mandatory'=>!empty($c['isMandatory']),'deleted'=>$deleted];
            if (!$deleted && $component['included']) $included+=$component['total'];
            $components[]=$component;
        }
        if (abs(round($included,2)-round((float)$result['totalPrice'],2))>0.02) return new \WP_Error('ssb_price_mismatch','Hostaway total and price components do not reconcile. Please retry.');
        return ['total_price'=>(float)$result['totalPrice'],'components'=>$components];
    }
}
