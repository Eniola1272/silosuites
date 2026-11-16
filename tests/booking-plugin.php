<?php
/** Synthetic HTTP fixtures only, restricted to the isolated local QA WordPress. */
if(!defined('WP_CLI')||!WP_CLI||wp_get_environment_type()!=='local'||get_option('siteurl')!=='http://127.0.0.1:4190')throw new RuntimeException('Local QA only');
function ssb_test($value,$message){if(!$value)throw new RuntimeException($message);}
$names=['ssb_property_mapping','ssb_listing_snapshot','ssb_last_check'];$original=[];foreach($names as $name)$original[$name]=get_option($name,null);
$fixture_account='999999';$fixture_secret='fixture-only-not-a-real-api-key';$fixture_token='fixture-only-not-a-real-token';
$scenario='success';$calls=[];$auth_count=0;$list_count=0;$cal_count=0;
$mock=function($pre,$args,$url)use(&$scenario,&$calls,&$auth_count,&$list_count,&$cal_count,$fixture_token){
 $calls[]=[$args['method'],$url];
 ssb_test($args['redirection']===0 && $args['sslverify']===true,'No redirect or TLS bypass');
 $json=function($data,$code=200){return ['headers'=>[],'body'=>wp_json_encode($data),'response'=>['code'=>$code,'message'=>'fixture']];};
 if($url==='https://api.hostaway.com/v1/accessTokens'){
  ++$auth_count;ssb_test($args['method']==='POST','Only auth can use POST');return $json(['access_token'=>$fixture_token,'expires_in'=>3600]);
 }
 if(strpos($url,'https://api.hostaway.com/v1/listings?limit=100&')===0){
  ssb_test($args['method']==='GET','Only allowlisted listing GETs');
  ++$list_count;ssb_test($args['headers']['Authorization']==='Bearer '.$fixture_token,'Server authorization');
  if($scenario==='rate')return $json(['private'=>'must-not-be-rendered'],429);
  if($scenario==='network')return new WP_Error('fixture','sensitive-provider-body-must-not-leak');
  if($scenario==='unauthorized' && $list_count===1)return $json([],401);
  if($scenario==='duplicate')return $json(['status'=>'success','result'=>[['id'=>143823],['id'=>143823]]]);
  if($scenario==='malformed')return ['headers'=>[],'body'=>'not JSON: sensitive-provider-body','response'=>['code'=>200]];
  if($scenario==='second-page-fail'){
   if(strpos($url,'offset=100')!==false)return $json([],503);
   $rows=[];for($i=1;$i<=100;++$i)$rows[]=['id'=>$i,'name'=>'Fixture '.$i];return $json(['status'=>'success','result'=>$rows]);
  }
  return $json(['status'=>'success','result'=>[['id'=>143823,'name'=>'Fixture Suite 2','personCapacity'=>5,'minNights'=>1,'maxNights'=>27,'bedroomsNumber'=>2,'bathroomsNumber'=>1,'bedsNumber'=>3,'currencyCode'=>'USD','doorCode'=>'never-store','guestEmail'=>'never-store','listingImages'=>[['url'=>'never-store']]],['id'=>143824,'name'=>'Fixture Suite 1','personCapacity'=>4,'currencyCode'=>'USD','minNights'=>2,'maxNights'=>30],['id'=>143825,'name'=>'Fixture Suite 4','personCapacity'=>4,'currencyCode'=>'USD','minNights'=>2,'maxNights'=>30],['id'=>143826,'name'=>'Fixture Suite 3','personCapacity'=>5,'currencyCode'=>'USD','minNights'=>2,'maxNights'=>30],['id'=>603415,'name'=>'Fixture Dairy','personCapacity'=>4,'currencyCode'=>'USD','minNights'=>2,'maxNights'=>30]]]);
 }
 if(preg_match('#^https://api.hostaway.com/v1/listings/([0-9]+)/calendar\?startDate=([0-9-]+)&endDate=([0-9-]+)$#',$url,$m)){
  ++$cal_count;ssb_test($args['method']==='GET','Calendar must use GET');
  ssb_test($args['headers']['Authorization']==='Bearer '.$fixture_token,'Calendar authorization');
  $lid=$m[1];$start=$m[2];$end=$m[3];
  $days=[];$curr=new DateTime($start);$end_dt=new DateTime($end);
  while($curr<=$end_dt){
   $d=$curr->format('Y-m-d');
   // Listing 143826 (Silo 3) has 2027-03-14 blocked
   $is_avail=($lid==='143826'&&$d==='2027-03-14')?0:1;
   $days[]=['date'=>$d,'isAvailable'=>$is_avail,'price'=>175.00,'minimumStay'=>2,'maximumStay'=>30,'closedOnArrival'=>0,'closedOnDeparture'=>0];
   $curr->modify('+1 day');
  }
  return $json(['status'=>'success','result'=>$days]);
 }
 if(preg_match('#^https://api.hostaway.com/v1/listings/[0-9]+/calendar/priceDetails$#',$url)){
  ssb_test($args['method']==='POST','Price details must use POST');
  return $json(['status'=>'success','result'=>['totalPrice'=>664.50,'components'=>[['type'=>'accommodation','name'=>'baseRate','title'=>'Base rate','total'=>525.0,'isIncludedInTotalPrice'=>1],['type'=>'fee','name'=>'cleaningFee','title'=>'Cleaning fee','total'=>75.0,'isIncludedInTotalPrice'=>1],['type'=>'tax','name'=>'occupancyTax','title'=>'Tax','total'=>64.5,'isIncludedInTotalPrice'=>1]]]]);
 }
 throw new RuntimeException('Unexpected mock request: '.$url);
};
try{
 add_filter('pre_http_request',$mock,10,3);wp_set_current_user(1);
 putenv('SILOSUITES_HOSTAWAY_ACCOUNT_ID');putenv('SILOSUITES_HOSTAWAY_CLIENT_SECRET');
 $client=new \SiloSuites\Booking\Hostaway_Client();ssb_test(!$client->configured(),'Missing credentials detected');
 ssb_test(is_wp_error($client->listings())&&count($calls)===0,'No unauthenticated network call');
 putenv('SILOSUITES_HOSTAWAY_ACCOUNT_ID='.$fixture_account);putenv('SILOSUITES_HOSTAWAY_CLIENT_SECRET='.$fixture_secret);
 $key='ssb_token_'.hash_hmac('sha256',$fixture_account.'|'.$fixture_secret,wp_salt('auth'));delete_transient($key);
 $client=new \SiloSuites\Booking\Hostaway_Client();$rows=$client->listings();ssb_test(count($rows)===5&&$rows[0]['id']==='143823','Safe string listing IDs');
 ssb_test(strpos(wp_json_encode($rows),'never-store')===false,'Private fields removed');
 $client->listings();ssb_test($auth_count===1,'Server token reused');
 $scenario='unauthorized';$list_count=0;$client->listings();ssb_test($list_count===2&&$auth_count===2,'401 refresh retried once');
 foreach(['rate','network','duplicate','malformed'] as $scenario){$result=$client->listings();ssb_test(is_wp_error($result),'Reject '.$scenario);ssb_test(strpos($result->get_error_message(),'sensitive')===false,'Redacted '.$scenario);}
 $scenario='success';delete_transient('ssb_discovery_cooldown');delete_option('ssb_discovery_lock');
 ssb_test(count(\SiloSuites\Booking\refresh_metadata())===5,'Admin refresh');$snapshot=get_option('ssb_listing_snapshot');
 ssb_test(is_wp_error(\SiloSuites\Booking\refresh_metadata()),'Cooldown enforced');
 delete_transient('ssb_discovery_cooldown');$scenario='second-page-fail';$result=\SiloSuites\Booking\refresh_metadata();
 ssb_test(is_wp_error($result)&&get_option('ssb_listing_snapshot')===$snapshot,'Failed pagination preserves previous snapshot');
 ssb_test(\SiloSuites\Booking\save_mapping(['silo-1'=>'143824','silo-2'=>'143823','silo-3'=>'143826','silo-4'=>'143825','dairy'=>'603415'])===true,'Validated mappings');
 $mapping=get_option('ssb_property_mapping');
 ssb_test(is_wp_error(\SiloSuites\Booking\save_mapping(['silo-2'=>'999999'])),'Unknown mapping rejected');
 ssb_test(is_wp_error(\SiloSuites\Booking\save_mapping(['silo-2'=>'143823','silo-1'=>'143823'])),'Duplicate mapping rejected');
 ssb_test(get_option('ssb_property_mapping')===$mapping,'Invalid mappings do not overwrite settings');
 ob_start();\SiloSuites\Booking\admin_page();$html=ob_get_clean();
 ssb_test(strpos($html,$fixture_secret)===false&&strpos($html,$fixture_token)===false,'Admin output has no credentials');
 
 // Phase 4 Availability & Quote Service checks
 $service=new \SiloSuites\Booking\Availability_Service($client);
 ssb_test(is_wp_error($service->validate_dates('2027-02-30','2027-03-02')),'Invalid leap calendar day rejected');
 ssb_test(is_wp_error($service->validate_dates('2020-01-01','2020-01-03')),'Past arrival date rejected');
 ssb_test(is_wp_error($service->validate_dates('2027-03-15','2027-03-12')),'Reversed dates rejected');
 ssb_test($service->validate_dates('2027-03-12','2027-03-15')===3,'Valid 3 night span');
 
 // Evaluate availability: 2027-03-12 to 2027-03-15 covers 2027-03-14 (Silo 3 blocked)
 $cal_before=$cal_count;
 $eval=$service->evaluate_availability('2027-03-12','2027-03-15',2);
 ssb_test($eval['status']==='success'&&$eval['nights']===3,'Evaluated search');
 ssb_test($eval['properties']['silo-1']['available']===true,'Silo 1 available');
 ssb_test($eval['properties']['silo-3']['available']===false,'Silo 3 blocked');
 ssb_test(!isset($eval['properties']['all-silos']),'Group excluded from online inventory');
 ssb_test($eval['properties']['dairy']['available']===true,'Dairy remains independent');
 
 // Transient caching check: second call uses cached calendar
 $service->evaluate_availability('2027-03-12','2027-03-15',2);
 ssb_test($cal_count===$cal_before+5,'Transient caching prevented repeated network requests');
 
 // Quote generation
 $quote=$service->generate_quote('silo-1','2027-03-12','2027-03-15',2);
 ssb_test($quote['status']==='success'&&$quote['components'][0]['total']===525.0&&$quote['total']===664.5,'Quote accommodation calculated');
 ssb_test(!empty($quote['expires_at_utc'])&&$quote['holds_inventory']===false&&$quote['checkout_enabled']===false,'Browsing quote cannot reserve or charge');

 wp_set_current_user(0);$n=count($calls);
 ssb_test(is_wp_error(\SiloSuites\Booking\refresh_metadata())&&is_wp_error(\SiloSuites\Booking\save_mapping([]))&&count($calls)===$n,'Anonymous operations rejected before HTTP');
 ob_start();\SiloSuites\Booking\admin_page();ssb_test(ob_get_clean()==='','No anonymous diagnostics');
 echo 'PASS: Phase 4 availability, quote service, calendar parsing, composite group blocking, transient caching, safe mapping and admin authorization.';
}finally{
 remove_filter('pre_http_request',$mock,10);putenv('SILOSUITES_HOSTAWAY_ACCOUNT_ID');putenv('SILOSUITES_HOSTAWAY_CLIENT_SECRET');
 if(isset($key))delete_transient($key);delete_transient('ssb_discovery_cooldown');delete_option('ssb_discovery_lock');
 foreach($original as $name=>$value){if($value===null)delete_option($name);else update_option($name,$value,false);}
 wp_set_current_user(1);
}
