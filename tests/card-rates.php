<?php
/** Synthetic edit/permission harness; no WordPress database or provider calls. */
define('ABSPATH',__DIR__.'/');
function properties(){return ['silo-1'=>'Silo 1','silo-2'=>'Silo 2','silo-3'=>'Silo 3','silo-4'=>'Silo 4','dairy'=>'Dairy'];}
function add_action(...$args){}
function metadata_exists($type,$id,$key){return array_key_exists($id,$GLOBALS['meta']);}
function get_post_meta($id,$key,$single){return $GLOBALS['meta'][$id]??'';}
function update_post_meta($id,$key,$value){$GLOBALS['meta'][$id]=$value;$GLOBALS['writes']++;}
function wp_is_post_revision($id){return false;}function wp_is_post_autosave($id){return false;}
function wp_verify_nonce($nonce,$action){return $nonce==='synthetic-nonce'&&$action==='ssb_card_rate_42';}
function current_user_can(...$args){return $GLOBALS['may_edit'];}function wp_unslash($s){return stripslashes($s);}
function check($ok,$label){if(!$ok)throw new Exception($label);}
require __DIR__.'/../wordpress/plugins/silosuites-booking/includes/card-rates.php';
use function SiloSuites\Booking\published_starting_rate;
use function SiloSuites\Booking\published_rate_minor;
use function SiloSuites\Booking\save_published_starting_rate;
$GLOBALS['meta']=[];$GLOBALS['writes']=0;$GLOBALS['may_edit']=true;
$source=json_decode(file_get_contents(__DIR__.'/../shared/client-starting-rates.json'),true);
foreach($source['rates_minor'] as $slug=>$minor){$value=published_starting_rate($slug);check($value===['amount_minor'=>$minor,'currency'=>'USD'],'Published source default');}
check(published_starting_rate('all-silos')===null,'Group has no card rate');
foreach(['-1','0','150.001','1e2','150<script>','1,500','1000000.01',[],null] as $value)check(published_rate_minor($value)===null,'Invalid money format rejected');
check(published_rate_minor('0.01')===1&&published_rate_minor('150.5')===15050&&published_rate_minor('150.50')===15050,'Exact cent parsing');
$post=(object)['ID'=>42,'post_name'=>'silo-2','post_type'=>'ss_property'];
$_POST=['ssb_card_rate_nonce'=>'wrong','ssb_published_starting_rate'=>'125.50'];save_published_starting_rate(42,$post);check($GLOBALS['writes']===0,'Nonce required');
$_POST['ssb_card_rate_nonce']='synthetic-nonce';$GLOBALS['may_edit']=false;save_published_starting_rate(42,$post);check($GLOBALS['writes']===0,'Edit permission required');
$GLOBALS['may_edit']=true;$_POST['ssb_published_starting_rate']='-10';save_published_starting_rate(42,$post);check($GLOBALS['writes']===0,'Invalid edit does not overwrite default');
$_POST['ssb_published_starting_rate']='125.50';save_published_starting_rate(42,$post);check(published_starting_rate('silo-2',$post)['amount_minor']===12550,'Valid client override');
$_POST['ssb_published_starting_rate']='';save_published_starting_rate(42,$post);check(published_starting_rate('silo-2',$post)===null,'Explicit blank hides price instead of restoring default');
check(!array_key_exists('rate',published_starting_rate('silo-1')),'Marketing rate has a separate public field contract');
echo 'PASS: published card defaults; exact cents; client override/hide; malformed input; nonce and capability checks; group exclusion; no provider calls or real database writes.'.PHP_EOL;
