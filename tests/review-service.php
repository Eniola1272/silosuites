<?php
/** Synthetic HTTP/WordPress stubs. No network, real guest data, or database writes. */
define('ABSPATH', __DIR__.'/');define('SILOSUITES_HOSTAWAY_ACCOUNT_ID','123');define('SILOSUITES_HOSTAWAY_CLIENT_SECRET','synthetic-test-secret');
class WP_Error{private $code;private $message;function __construct($c,$m){$this->code=$c;$this->message=$m;}function get_error_code(){return $this->code;}function get_error_message(){return $this->message;}}
function is_wp_error($v){return $v instanceof WP_Error;}
function wp_salt($s){return 'synthetic-review-test';}
function wp_strip_all_tags($s){return strip_tags($s);}
function get_option($key,$default=[]){return $key==='ssb_property_mapping'?$GLOBALS['mapping']:$default;}
function get_transient($k){return strpos($k,'ssb_token_')===0?'synthetic-token':($GLOBALS['cache'][$k]??false);}
function set_transient($k,$v,$ttl){$GLOBALS['cache'][$k]=$v;$GLOBALS['ttls'][$k]=$ttl;}
function delete_transient($k){unset($GLOBALS['cache'][$k]);}
function wp_remote_retrieve_response_code($r){return $r['code'];}
function wp_remote_retrieve_body($r){return $r['body'];}
function wp_remote_get($url,$options){
    $GLOBALS['calls']++;
    check(strpos($url,'https://api.hostaway.com/v1/reviews?')===0,'Only the GET reviews endpoint may be called');
    check($options['sslverify']===true&&$options['redirection']===0,'HTTPS and no redirects');
    parse_str(parse_url($url,PHP_URL_QUERY),$q);
    check($q['listingMapIds']===['143823']&&$q['statuses']===['published']&&$q['type']==='guest-to-host','Correct bracketed filters');
    return ['code'=>200,'body'=>json_encode(['status'=>'success','result'=>$GLOBALS['pages'][(int)$q['offset']]??[]])];
}
function properties(){return ['silo-1'=>'Silo 1','silo-2'=>'Silo 2','silo-3'=>'Silo 3','silo-4'=>'Silo 4','dairy'=>'Dairy'];}
function check($condition,$message){if(!$condition)throw new Exception($message);}
require __DIR__.'/../wordpress/plugins/silosuites-booking/includes/class-hostaway-client.php';
require __DIR__.'/../wordpress/plugins/silosuites-booking/includes/class-review-service.php';
use SiloSuites\Booking\Review_Service;
$base=['id'=>1,'listingMapId'=>'143823','type'=>'guest-to-host','status'=>'published','bookingEngineVisibility'=>1,'isHidden'=>0,'isCancelled'=>0,'channelId'=>2002,'publicReview'=>'Synthetic public review.','rating'=>10,'submittedAt'=>'2026-10-05 12:00:00','privateFeedback'=>'PRIVATE SENTINEL','guestName'=>'PRIVATE SENTINEL','reservationId'=>'PRIVATE SENTINEL','reviewerName'=>'PRIVATE SENTINEL'];
$public=Review_Service::normalize($base,'143823');check($public['source']==='Vrbo'&&$public['month']==='2026-10'&&$public['scale']===10,'Known source, month and rating scale');check(strpos(json_encode($public),'PRIVATE SENTINEL')===false,'No private fields copied');
foreach([['channelId'=>2018],['bookingEngineVisibility'=>0],['isHidden'=>1],['isCancelled'=>1],['status'=>'pending'],['type'=>'host-to-guest'],['rating'=>11],['rating'=>null],['publicReview'=>'  '],['listingMapId'=>'143824'],['channelId'=>9999]] as $change)check(Review_Service::normalize(array_replace($base,$change),'143823')===null,'Reject ineligible review');
$missing=$base;unset($missing['bookingEngineVisibility']);check(Review_Service::normalize($missing,'143823')===null,'Missing visibility fails closed');
$clean=Review_Service::normalize(array_replace($base,['publicReview'=>'<b>Synthetic text</b>']),'143823');check($clean['text']==='Synthetic text','Plain text only');
$GLOBALS['mapping']=['silo-2'=>'143823'];$GLOBALS['cache']=[];$GLOBALS['calls']=0;$GLOBALS['pages']=[0=>[$base,array_replace($base,['id'=>2,'channelId'=>2005,'rating'=>8]),array_replace($base,['id'=>3,'channelId'=>2018])]];
$service=new Review_Service();$result=$service->get('silo-2');check($result['count']===2&&$result['average']===9.0,'Count and average only eligible reviews');check(count($result['reviews'])===2&&strpos(json_encode($result),'PRIVATE SENTINEL')===false,'Only safe fields in payload/cache');$calls=$GLOBALS['calls'];check($service->get('silo-2')===$result&&$GLOBALS['calls']===$calls,'Cached reads do not call provider');check(in_array(900,$GLOBALS['ttls'],true),'Fifteen-minute cache');
check(is_wp_error($service->get('all-silos'))&&is_wp_error($service->get('dairy')),'Unknown group and unmapped property denied without provider access');
$GLOBALS['cache']=[];$GLOBALS['pages']=[0=>[]];$empty=$service->get('silo-2');check($empty['count']===0&&$empty['average']===null,'Honest empty state');
$GLOBALS['cache']=[];$GLOBALS['pages']=[0=>[array_replace($base,['listingMapId'=>'143824'])]];check(is_wp_error($service->get('silo-2')),'Reject cross-property provider response');
$GLOBALS['cache']=[];$GLOBALS['pages']=[0=>[],100=>[array_replace($base,['id'=>101,'rating'=>6])]];for($i=1;$i<=100;$i++)$GLOBALS['pages'][0][]=array_replace($base,['id'=>$i]);$all=$service->get('silo-2');check($all['count']===101,'All pages included');
$GLOBALS['cache']=[];$GLOBALS['pages'][100]=[$base];check(is_wp_error($service->get('silo-2')),'Duplicate provider pages fail closed');
echo "PASS: review visibility/source rules; private-field exclusion; per-property matching; full pagination; duplicates; cache; average; empty/error states; no real network or writes.\n";
