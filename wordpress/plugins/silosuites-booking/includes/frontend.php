<?php
namespace SiloSuites\Booking;
defined('ABSPATH') || exit;

add_action('init',function(){
 register_post_type('ss_property',['labels'=>['name'=>'Suite content','singular_name'=>'Suite content'],'public'=>false,'show_ui'=>true,'show_in_rest'=>true,'capability_type'=>'page','map_meta_cap'=>true,'supports'=>['title','editor','excerpt','thumbnail','page-attributes']]);
});
function seed_properties() {
 if(!post_type_exists('ss_property'))register_post_type('ss_property',['public'=>false]);
 foreach(properties() as $slug=>$name){if(get_page_by_path($slug,OBJECT,'ss_property'))continue;wp_insert_post(['post_type'=>'ss_property','post_name'=>$slug,'post_title'=>$name,'post_status'=>'publish','menu_order'=>array_search($slug,array_keys(properties()),true)]);}
}
register_activation_hook(dirname(__DIR__).'/silosuites-booking.php',__NAMESPACE__.'\\seed_properties');
function public_properties() {
 $service=new Availability_Service();$snapshot=get_option('ssb_listing_snapshot',[])['listings']??[];$map=get_option('ssb_property_mapping',[]);$rows=[];
 foreach(properties() as $slug=>$name){
  $post=get_page_by_path($slug,OBJECT,'ss_property');if($post&&$post->post_status!=='publish')continue;
  $metadata=[];foreach($snapshot as $r)if((string)$r['id']===($map[$slug]??'')){$metadata=$r;break;}
  $connected=$service->property($slug);$image=$post?get_the_post_thumbnail_url($post,'large'):false;
  $url=$slug==='dairy'?'/the-dairy-suite/':'/silo-suite-'.substr($slug,-1).'/';
  $rows[]=['slug'=>$slug,'name'=>$post?$post->post_title:$name,'description'=>$post?wp_strip_all_tags($post->post_excerpt):'','image'=>$image?:($metadata['images'][0]??''),'capacity'=>$metadata['personCapacity']??null,'bedrooms'=>$metadata['bedroomsNumber']??null,'beds'=>$metadata['bedsNumber']??null,'bathrooms'=>$metadata['bathroomsNumber']??null,'url'=>home_url($url),'connected'=>!is_wp_error($connected),'reason'=>is_wp_error($connected)?$connected->get_error_message():''];
 }
 return $rows;
}
function checkout_url() { $page=get_page_by_path('checkout');return $page?get_permalink($page):home_url('/checkout/'); }
function frontend_assets() {
 wp_enqueue_style('silosuites-booking',plugins_url('assets/booking.css',dirname(__DIR__).'/silosuites-booking.php'),[],VERSION);
 wp_enqueue_script('silosuites-booking',plugins_url('assets/booking.js',dirname(__DIR__).'/silosuites-booking.php'),[],VERSION,true);
 static $configured=false;if(!$configured){$configured=true;wp_add_inline_script('silosuites-booking','window.SiloSuitesBooking='.wp_json_encode(['api'=>rest_url('silosuites/v1/'),'checkout'=>checkout_url(),'properties'=>public_properties()],JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT).';','before');}
}
function group_contact_html() { return '<p class="ssb-group-contact">Interested in reserving all four silos? <a href="tel:+14355868658">Contact us for availability.</a></p>'; }
function render_component($type,$property='') {
 frontend_assets();
 $props=public_properties();$config=['api'=>esc_url_raw(rest_url('silosuites/v1/')),'checkout'=>checkout_url(),'type'=>$type,'property'=>$property,'properties'=>$props];
 return '<div class="ssb-app" data-ssb-config="'.esc_attr(wp_json_encode($config)).'"><p class="ssb-loading" role="status">Loading booking options…</p></div>';
}
add_shortcode('silosuites_properties',function(){return render_component('properties');});
add_shortcode('silosuites_search',function(){return render_component('search');});
add_shortcode('silosuites_booking',function($attrs){$a=shortcode_atts(['property'=>'silo-2'],$attrs);return render_component('booking',sanitize_key($a['property']));});
add_shortcode('silosuites_checkout',function(){return render_component('checkout');});

/** Narrow anonymous browsing endpoints. No reservation/payment endpoints are registered. */
function public_response($result) {
 $code=200;
 if(is_wp_error($result)){$code=strpos($result->get_error_code(),'ssb_rate')===0?429:400;$result=['status'=>'error','message'=>$result->get_error_message(),'code'=>$result->get_error_code()];}
 $r=new \WP_REST_Response($result,$code);$r->header('Cache-Control','no-store, private');return $r;
}
function public_budget() {
 // Use server REMOTE_ADDR, never spoofable forwarding headers. Counters store hashes only.
 $key='ssb_budget_'.hash_hmac('sha256',($_SERVER['REMOTE_ADDR']??'unknown').'|'.gmdate('YmdHi'),wp_salt('nonce'));
 $n=(int)get_transient($key);if($n>=60)return new \WP_Error('ssb_rate_local','Too many requests. Wait a minute and retry.');set_transient($key,$n+1,65);return true;
}
add_action('rest_api_init',function(){
 register_rest_route('silosuites/v1','/properties',['methods'=>'GET','permission_callback'=>'__return_true','callback'=>function(){return public_response(['properties'=>public_properties()]);}]);
 register_rest_route('silosuites/v1','/calendar',['methods'=>'GET','permission_callback'=>'__return_true','callback'=>function($r){$budget=public_budget();if(is_wp_error($budget))return public_response($budget);return public_response((new Availability_Service())->calendar_range($r->get_param('property'),$r->get_param('start'),$r->get_param('end')));}]);
});
add_filter('rest_pre_dispatch',function($result,$server,$r){if(in_array($r->get_route(),['/silosuites/v1/quote','/silosuites/v1/availability'],true)){$budget=public_budget();if(is_wp_error($budget))return public_response($budget);}return $result;},10,3);
add_filter('rest_post_dispatch',function($response,$server,$r){if(strpos($r->get_route(),'/silosuites/v1/')===0 && $response instanceof \WP_REST_Response)$response->header('Cache-Control','no-store, private');return $response;},10,3);

add_action('elementor/widgets/register',function($manager){
 require_once __DIR__.'/widgets.php';
 $manager->register(new Booking_Widget());
});

add_action('wp_enqueue_scripts',function(){if(!is_singular())return;$post=get_post();if($post && preg_match('/\[silosuites_(?:properties|search|booking|checkout)/',$post->post_content))frontend_assets();$data=get_post_meta(get_queried_object_id(),'_elementor_data',true);if(is_string($data)&&(strpos($data,'ss-quick-')!==false||strpos($data,'sp-preview-form')!==false||strpos($data,'data-ss-design-search')!==false||strpos($data,'silosuites-booking')!==false))frontend_assets();});
