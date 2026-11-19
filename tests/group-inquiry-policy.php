<?php
/** Standalone public-catalog regression; no real WordPress database or network. */
define('ABSPATH',__DIR__.'/');define('OBJECT','OBJECT');
class WP_Error {private $code;private $message;function __construct($c,$m){$this->code=$c;$this->message=$m;}function get_error_code(){return $this->code;}function get_error_message(){return $this->message;}}
function is_wp_error($v){return $v instanceof WP_Error;}
function add_action(...$args){}function add_filter(...$args){}function add_shortcode(...$args){}function register_activation_hook(...$args){}
function wp_salt($s){return 'policy-fixture-only';}function get_option($name,$default=false){return $GLOBALS['options'][$name]??$default;}
function get_page_by_path($slug,...$args){$GLOBALS['queried'][]=$slug;return null;}
function home_url($p){return 'https://example.test'.$p;}function wp_strip_all_tags($s){return strip_tags($s);}
function policy_assert($ok,$m){if(!$ok)throw new Exception($m);}
require __DIR__.'/../wordpress/plugins/silosuites-booking/silosuites-booking.php';
$GLOBALS['options']=['ssb_group_verified'=>true,'ssb_property_mapping'=>['all-silos'=>'999999','silo-2'=>'143823'],'ssb_listing_snapshot'=>['listings'=>[['id'=>'999999','personCapacity'=>18,'currencyCode'=>'USD','minNights'=>1,'maxNights'=>30],['id'=>'143823','personCapacity'=>5,'currencyCode'=>'USD','minNights'=>1,'maxNights'=>27]]]];
$catalog=\SiloSuites\Booking\properties();policy_assert(count($catalog)===5&&!isset($catalog['all-silos']),'Only five individual rentals in catalog/widget selectors');
$service=new \SiloSuites\Booking\Availability_Service();$error=$service->property('all-silos');policy_assert(is_wp_error($error)&&$error->get_error_code()==='ssb_unknown_property','Legacy group mapping and verified flag cannot enable booking');
$in=(new DateTimeImmutable($service->get_today_in_utah()))->modify('+2 days')->format('Y-m-d');$out=(new DateTimeImmutable($in))->modify('+2 days')->format('Y-m-d');
policy_assert(is_wp_error($service->generate_quote('all-silos',$in,$out,2)),'Group quote denied before provider access');
policy_assert(is_wp_error($service->calendar_range('all-silos',$in,$out)),'Group calendar denied before provider access');
$GLOBALS['queried']=[];$rows=\SiloSuites\Booking\public_properties();policy_assert(count($rows)===5&&!in_array('all-silos',array_column($rows,'slug'),true),'Dynamic property records exclude retained group content');policy_assert(!in_array('all-silos',$GLOBALS['queried'],true),'Group editorial record never queried');
$html=strip_tags(\SiloSuites\Booking\group_contact_html());policy_assert($html==='','Group invitation is removed');
echo 'PASS: five public properties; group absent from widgets/catalog; legacy mapped group rejected by quote/calendar; existing private group data retained; no group inquiry message; no network or database mutations.'.PHP_EOL;
