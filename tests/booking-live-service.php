<?php
if(!defined('WP_CLI')||wp_get_environment_type()!=='local'||get_option('siteurl')!=='http://127.0.0.1:4190')throw new Exception('Local QA only');
function sb_assert($ok,$msg){if(!$ok)throw new Exception($msg);}
$keys=['ssb_property_mapping','ssb_listing_snapshot','ssb_group_verified'];$old=[];foreach($keys as $k)$old[$k]=get_option($k,null);
$scenario='success';$calls=[];$daysCalled=0;
$mock=function($pre,$args,$url)use(&$scenario,&$calls,&$daysCalled){$calls[]=$url;$json=function($r,$code=200){return ['headers'=>[],'response'=>['code'=>$code],'body'=>wp_json_encode($r)];};
 sb_assert($args['sslverify']===true&&$args['redirection']===0,'TLS and no redirect');
 if(strpos($url,'/accessTokens')!==false)return $json(['access_token'=>'fixture-live-service','expires_in'=>3600]);
 if(strpos($url,'/calendar?')!==false){++$daysCalled;parse_str(wp_parse_url($url,PHP_URL_QUERY),$q);$rows=[];for($d=$q['startDate'];$d<=$q['endDate'];$d=(new DateTimeImmutable($d))->modify('+1 day')->format('Y-m-d')){$row=['date'=>$d,'isAvailable'=>1,'minimumStay'=>1,'maximumStay'=>27,'closedOnArrival'=>0,'closedOnDeparture'=>0];if($scenario==='missing-availability')unset($row['isAvailable']);if($scenario==='closed-departure'&&$d===$q['endDate'])$row['closedOnDeparture']=1;if($scenario==='max-stay')$row['maximumStay']=1;if($scenario==='missing-departure'&&$d===$q['endDate'])continue;$rows[]=$row;}return $json(['status'=>'success','result'=>$rows]);}
 if(preg_match('#/listings/143823/calendar/priceDetails$#',$url)){sb_assert($args['method']==='POST','Quote calculator POST');$body=json_decode($args['body'],true);sb_assert($body['version']===2&&!isset($body['totalPrice']),'Provider calculates amount');if($scenario==='outage')return $json([],503);$result=['totalPrice'=>365.6,'components'=>[['type'=>'accommodation','name'=>'baseRate','title'=>'Base rate','total'=>290,'isIncludedInTotalPrice'=>1],['type'=>'fee','name'=>'cleaningFee','title'=>'Cleaning fee','total'=>35,'isIncludedInTotalPrice'=>1],['type'=>'tax','name'=>'occupancyTax','title'=>'Occupancy tax','total'=>40.6,'isIncludedInTotalPrice'=>1]]];if($scenario==='mismatch')$result['totalPrice']=1;if($scenario==='missing-price')unset($result['totalPrice']);return $json(['status'=>'success','result'=>$result]);}
 throw new Exception('Unapproved endpoint in test');};
try{
 putenv('SILOSUITES_HOSTAWAY_ACCOUNT_ID=999998');putenv('SILOSUITES_HOSTAWAY_CLIENT_SECRET=fixture-only-service');add_filter('pre_http_request',$mock,999,3);
 update_option('ssb_property_mapping',['silo-2'=>'143823']);update_option('ssb_listing_snapshot',['listings'=>[['id'=>'143823','personCapacity'=>5,'currencyCode'=>'USD','minNights'=>1,'maxNights'=>27]]]);delete_option('ssb_group_verified');
 $s=new \SiloSuites\Booking\Availability_Service();$in=(new DateTimeImmutable($s->get_today_in_utah()))->modify('+4 days')->format('Y-m-d');$out=(new DateTimeImmutable($in))->modify('+2 days')->format('Y-m-d');
 $q=$s->generate_quote('silo-2',$in,$out,2,true);sb_assert(!is_wp_error($q)&&$q['total']===365.6&&$q['components'][1]['total']===35.0,'Actual provider fee/tax components, no estimated additions');sb_assert(!$q['holds_inventory']&&!$q['checkout_enabled'],'Quote is not a hold or payment');
 $n=count($calls);foreach([0,-1,19,'2.5','2abc',[],true] as $bad)sb_assert(is_wp_error($s->generate_quote('silo-2',$in,$out,$bad,true)),'Reject malformed guest count');sb_assert(count($calls)===$n,'Invalid guests rejected before network');
 sb_assert(is_wp_error($s->generate_quote('all-silos',$in,$out,2,true)),'Group has no summed fallback');
 foreach(['missing-availability','missing-departure','closed-departure','max-stay','mismatch','missing-price','outage'] as $scenario)sb_assert(is_wp_error($s->generate_quote('silo-2',$in,$out,2,true)),'Fail closed: '.$scenario);
 $scenario='success';$service_calendar=$s->calendar_range('silo-2',$in,$out);sb_assert(count($service_calendar['days'])===3,'Inclusive calendar range');
 sb_assert(is_wp_error($s->calendar_range('silo-2',$in,(new DateTimeImmutable($in))->modify('+62 days')->format('Y-m-d'))),'Calendar bounds');
 foreach($calls as $u)sb_assert(strpos($u,'/reservations')===false&&strpos($u,'/payment')===false,'No transactional endpoints');
 echo 'PASS: documented provider price endpoint, actual fee/tax components, strict guests, missing/malformed calendar fail-closed, turnover restrictions, max stay, missing/mismatched totals, provider outage, group gating, calendar bounds, no reservation/payment calls.';
}finally{remove_filter('pre_http_request',$mock,999);putenv('SILOSUITES_HOSTAWAY_ACCOUNT_ID');putenv('SILOSUITES_HOSTAWAY_CLIENT_SECRET');foreach($old as $k=>$v){if($v===null)delete_option($k);else update_option($k,$v,false);}}
