<?php
define('ABSPATH', __DIR__ . '/');

require_once __DIR__ . '/../wordpress/plugins/silosuites-booking/includes/class-hostaway-client.php';
require_once __DIR__ . '/../wordpress/plugins/silosuites-booking/includes/class-availability-service.php';

// Mock WordPress functions if not present
if (!function_exists('is_wp_error')) {
    class WP_Error {
        private $code;
        private $message;
        public function __construct($code = '', $message = '') {
            $this->code = $code;
            $this->message = $message;
        }
        public function get_error_code() { return $this->code; }
        public function get_error_message() { return $this->message; }
    }
    function is_wp_error($thing) { return $thing instanceof WP_Error; }
}

if (!function_exists('get_option')) {
    $GLOBALS['_options'] = array(
        'ssb_property_mapping' => array(
            'silo-1' => '143824',
            'silo-2' => '143823',
            'silo-3' => '143826',
            'silo-4' => '143825',
            'dairy'  => '603415',
        ),
    );
    function get_option($key, $default = false) {
        return $GLOBALS['_options'][$key] ?? $default;
    }
}

if (!function_exists('get_transient')) {
    $GLOBALS['_transients'] = array();
    function get_transient($key) { return $GLOBALS['_transients'][$key] ?? false; }
    function set_transient($key, $val, $exp) { $GLOBALS['_transients'][$key] = $val; return true; }
}

if (!function_exists('wp_generate_password')) {
    function wp_generate_password($length = 12, $special = true) {
        return bin2hex(random_bytes((int)($length / 2)));
    }
}

// Test Availability_Service with real Hostaway_Client and simulated HTTP responses if needed
// or test with an unconfigured client to verify error handling.
if (!defined('DAY_IN_SECONDS')) {
    define('MINUTE_IN_SECONDS', 60);
    define('HOUR_IN_SECONDS', 3600);
    define('DAY_IN_SECONDS', 86400);
}

if (!function_exists('wp_salt')) {
    function wp_salt($scheme = 'auth') { return 'mock_salt_value'; }
}

if (!function_exists('wp_remote_get')) {
    function wp_remote_get($url, $args = array()) {
        $json = function($data, $code = 200) {
            return array('headers' => array(), 'body' => json_encode($data), 'response' => array('code' => $code));
        };
        if (preg_match('#^https://api.hostaway.com/v1/listings/([0-9]+)/calendar#', $url, $m)) {
            $lid = $m[1];
            $days = array();
            $curr = new \DateTime('2027-04-14');
            for ($i = 0; $i < 5; ++$i) {
                $d = $curr->format('Y-m-d');
                $is_avail = ($lid === '143826' && $d === '2027-04-15') ? 0 : 1;
                $days[] = array(
                    'date'              => $d,
                    'isAvailable'       => $is_avail,
                    'price'             => 185.00,
                    'minimumStay'       => 2,
                    'maximumStay'       => 30,
                    'closedOnArrival'   => 0,
                    'closedOnDeparture' => 0,
                );
                $curr->modify('+1 day');
            }
            return $json(array('status' => 'success', 'result' => $days));
        }
        return new WP_Error('mock_http', 'URL not mocked');
    }
}

if (!function_exists('wp_remote_post')) {
    function wp_remote_post($url, $args = array()) {
        $json = function($data, $code = 200) {
            return array('headers' => array(), 'body' => json_encode($data), 'response' => array('code' => $code));
        };
        if ($url === 'https://api.hostaway.com/v1/accessTokens') {
            return $json(array('access_token' => 'mock_access_token', 'expires_in' => 3600));
        }
        return new WP_Error('mock_http', 'URL not mocked');
    }
}

if (!function_exists('wp_remote_retrieve_response_code')) {
    function wp_remote_retrieve_response_code($response) {
        return $response['response']['code'] ?? 0;
    }
}

if (!function_exists('wp_remote_retrieve_body')) {
    function wp_remote_retrieve_body($response) {
        return $response['body'] ?? '';
    }
}

putenv('SILOSUITES_HOSTAWAY_ACCOUNT_ID=12345');
putenv('SILOSUITES_HOSTAWAY_CLIENT_SECRET=mock_secret');

$client = new \SiloSuites\Booking\Hostaway_Client();
assert($client->configured() === true);

$service = new \SiloSuites\Booking\Availability_Service($client);

echo "Testing date validation...\n";
assert(is_wp_error($service->validate_dates('invalid', '2027-04-10')));
assert(is_wp_error($service->validate_dates('2027-04-10', '2027-04-05')));
assert(is_wp_error($service->validate_dates('2020-01-01', '2020-01-05')));
assert($service->validate_dates('2027-04-10', '2027-04-13') === 3);
assert(count($service->get_stay_nights_list('2027-04-10', 3)) === 3);

echo "Testing availability evaluation...\n";
$res = $service->evaluate_availability('2027-04-14', '2027-04-17', 2);
assert($res['status'] === 'success');
assert($res['nights'] === 3);
assert($res['properties']['silo-1']['available'] === true);
assert($res['properties']['silo-3']['available'] === false, 'Silo 3 must be blocked on 2027-04-15');
assert($res['properties']['all-silos']['available'] === false, 'All-silos composite must be blocked when child Silo 3 is blocked');
assert($res['properties']['dairy']['available'] === true, 'Dairy must be available');

echo "Testing quote generation...\n";
$quote = $service->generate_quote('silo-1', '2027-04-14', '2027-04-17', 2);
assert($quote['status'] === 'success');
assert($quote['line_items']['accommodation'] === 555.0); // 3 * 185.00
assert($quote['line_items']['cleaning'] === 75.0);
assert(!empty($quote['quote_id']));
assert(isset($GLOBALS['_transients']['ssb_quote_' . $quote['quote_id']]));

echo "ALL TESTS PASSED SUCCESSFULLY!\n";
