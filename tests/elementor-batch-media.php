<?php
if(!defined('WP_CLI')||!WP_CLI||wp_get_environment_type()!=='local'||get_option('siteurl')!=='http://127.0.0.1:4190')throw new RuntimeException('Local QA only');
wp_set_current_user(1);$manifest=json_decode(file_get_contents(WP_PLUGIN_DIR.'/silosuites-design-importer/payload/media-manifest.json'),true);
$before=get_posts(['post_type'=>'attachment','post_status'=>'inherit','fields'=>'ids','numberposts'=>-1]);$restore=[];
try{
 foreach(array_slice($manifest,0,2)as $a){$ids=get_posts(['post_type'=>'attachment','post_status'=>'inherit','fields'=>'ids','numberposts'=>-1,'meta_key'=>'_ssdi_source_sha256','meta_value'=>$a['sha256']]);foreach($ids as $id){$restore[$id]=get_post_meta($id,'_ssdi_source_sha256',false);delete_post_meta($id,'_ssdi_source_sha256');}}
 $pending=false;$first=\SiloSuites\DesignImporter\import_design(1,$pending);
 if(is_wp_error($first)||!$pending)throw new RuntimeException('Unfinished media must be reported even when template history is complete');
 $after_first=get_posts(['post_type'=>'attachment','post_status'=>'inherit','fields'=>'ids','numberposts'=>-1]);
 if(count(array_diff($after_first,$before))!==1)throw new RuntimeException('One media asset per request required');
 $second=\SiloSuites\DesignImporter\import_design(1,$pending);if(is_wp_error($second)||$pending||count($second)!==10)throw new RuntimeException('Second media step must finish');
 echo 'PASS: one-media steps, explicit pending-media flag with complete template history, and resumable completion.';
}finally{
 $after=get_posts(['post_type'=>'attachment','post_status'=>'inherit','fields'=>'ids','numberposts'=>-1]);foreach(array_diff($after,$before)as $id)wp_delete_attachment($id,true);
 foreach($restore as $id=>$values){delete_post_meta($id,'_ssdi_source_sha256');foreach($values as $value)add_post_meta($id,'_ssdi_source_sha256',$value);}
}
