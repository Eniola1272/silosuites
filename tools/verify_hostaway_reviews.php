<?php
/** Read-only live review adapter proof with a minimal HTTP harness, not a WordPress install test. */
define('ABSPATH', __DIR__.'/');
class WP_Error {private $code;private $message;function __construct($c,$m){$this->code=$c;$this->message=$m;}function get_error_code(){return $this->code;}function get_error_message(){return $this->message;}}
function is_wp_error($v){return $v instanceof WP_Error;}
function private_json($name){$folder=dirname(__DIR__).'/.secrets';$path=$folder.'/'.$name;if(is_link($folder)||is_link($path)||(fileperms($folder)&0077)||(fileperms($path)&0077))throw new Exception('Private configuration permissions are invalid.');$data=json_decode(file_get_contents($path),true);if(!is_array($data))throw new Exception('Invalid private configuration.');return $data;}
function wp_salt($s){return 'live-review-harness-namespace';}
function get_option($key,$default=[]){return $key==='ssb_property_mapping'?['silo-1'=>'143824','silo-2'=>'143823','silo-3'=>'143826','silo-4'=>'143825','dairy'=>'603415']:$default;}
function get_transient($k){if(strpos($k,'ssb_token_')===0)return $GLOBALS['token'];return $GLOBALS['cache'][$k]??false;}
function set_transient($k,$v,$ttl){$GLOBALS['cache'][$k]=$v;}
function delete_transient($k){unset($GLOBALS['cache'][$k]);}
function wp_strip_all_tags($s){return strip_tags(preg_replace('@<(script|style)[^>]*?>.*?</\\1>@si','',$s));}
function wp_remote_retrieve_response_code($r){return $r['code'];}
function wp_remote_retrieve_body($r){return $r['body'];}
function wp_remote_get($url,$options){
    $parts=parse_url($url);if(($parts['scheme']??'')!=='https'||($parts['host']??'')!=='api.hostaway.com'||($parts['path']??'')!=='/v1/reviews')throw new Exception('Operation outside read-only reviews allowlist.');
    $curl=curl_init($url);$body='';
    curl_setopt_array($curl,[CURLOPT_FOLLOWLOCATION=>false,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_TIMEOUT=>25,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_HTTPHEADER=>['Accept: application/json','Authorization: '.$options['headers']['Authorization']],CURLOPT_WRITEFUNCTION=>function($c,$chunk)use(&$body){if(strlen($body)+strlen($chunk)>8388608)return 0;$body.=$chunk;return strlen($chunk);}]);
    $ok=curl_exec($curl);$code=curl_getinfo($curl,CURLINFO_RESPONSE_CODE);curl_close($curl);
    return $ok===false?new WP_Error('ssb_network','Read-only review request failed.'):['code'=>$code,'body'=>$body];
}
function properties(){return ['silo-1'=>'Silo 1','silo-2'=>'Silo 2','silo-3'=>'Silo 3','silo-4'=>'Silo 4','dairy'=>'Dairy'];}
try {
    $config=private_json('hostaway.json');$token=private_json('hostaway-token.json');
    if((string)$token['account_id']!==(string)$config['account_id']||$token['expires_at']<time()+60)throw new Exception('Refresh the private authentication token with the read-only review cache tool.');
    define('SILOSUITES_HOSTAWAY_ACCOUNT_ID',(string)$config['account_id']);define('SILOSUITES_HOSTAWAY_CLIENT_SECRET',$config['client_secret']);$GLOBALS['token']=$token['access_token'];$GLOBALS['cache']=[];
    require dirname(__DIR__).'/wordpress/plugins/silosuites-booking/includes/class-hostaway-client.php';
    require dirname(__DIR__).'/wordpress/plugins/silosuites-booking/includes/class-review-service.php';
    $service=new \SiloSuites\Booking\Review_Service();$counts=[];
    foreach(properties() as $slug=>$label){$result=$service->get($slug);if(is_wp_error($result))throw new Exception('Review adapter check failed ('.$result->get_error_code().').');foreach($result['reviews'] as $review){if(array_keys($review)!==['text','rating','scale','source','month'])throw new Exception('Unexpected public review fields.');}$counts[$slug]=$result['count'];}
    echo json_encode(['eligible_counts'=>$counts,'scope'=>'Read-only real Hostaway requests through PHP service/HTTP harness. No WordPress installation test or provider mutation. Only aggregate counts printed.'],JSON_PRETTY_PRINT).PHP_EOL;
} catch(Throwable $e){fwrite(STDERR,"Live review check stopped. Credentials and provider payload suppressed.\n");exit(1);}
