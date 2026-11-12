<?php
if(!defined('WP_CLI')||!WP_CLI||wp_get_environment_type()!=='local'||get_option('siteurl')!=='http://127.0.0.1:4190')throw new RuntimeException('Local QA only');
wp_set_current_user(1);
function ssbi_assert($ok,$message){if(!$ok)throw new RuntimeException($message);}
$version=\SiloSuites\DesignImporter\VERSION;
ssbi_assert(count(\SiloSuites\DesignImporter\current_templates())===0,'Run this check before importing the new version');
$media=wp_count_posts('attachment')->inherit;$templates=(int) wp_count_posts('elementor_library')->publish;$history_before=get_option('ssdi_import_history',[]);
$first_original=null;$first_doc=null;
for($i=1;$i<=10;++$i){
 $result=\SiloSuites\DesignImporter\import_design(1);
 ssbi_assert(!is_wp_error($result)&&count($result)===$i,'Exactly one new template per request');
 ssbi_assert(!get_option('ssdi_import_lock'),'Lock released after every step');
 if($i===1){
  $first_doc=\Elementor\Plugin::$instance->documents->get($result['home-content']);$first_original=$first_doc->get_elements_data();$changed=$first_original;
  $edit=function(&$nodes)use(&$edit){foreach($nodes as &$n){if(($n['settings']['_title']??'')==='01 — Main headline'){$n['settings']['title']='Batch import retained native edit';return true;}if(!empty($n['elements'])&&$edit($n['elements']))return true;}return false;};
  ssbi_assert($edit($changed),'Editable heading found');$first_doc->save(['elements'=>$changed]);
 }
 ssbi_assert(strpos(get_post_meta($result['home-content'],'_elementor_data',true),'Batch import retained native edit')!==false,'Resuming preserves client edits');
}
$again=\SiloSuites\DesignImporter\import_design(1);
ssbi_assert($again===$result,'Completed batch is idempotent');
ssbi_assert(wp_count_posts('attachment')->inherit===$media,'No duplicate media');
ssbi_assert((int) wp_count_posts('elementor_library')->publish===$templates+10,'Exactly ten versioned templates');
$history_after=get_option('ssdi_import_history');foreach($history_before as $old=>$data)ssbi_assert($history_after[$old]===$data,'Old version history preserved');
$first_doc->save(['elements'=>$first_original]);
add_option('ssdi_import_lock',time(),'',false);$busy=\SiloSuites\DesignImporter\import_design(1);ssbi_assert(is_wp_error($busy)&&$busy->get_error_code()==='ssdi_busy','Parallel import rejected');delete_option('ssdi_import_lock');
wp_set_current_user(0);ssbi_assert(is_wp_error(\SiloSuites\DesignImporter\import_design(1)),'Anonymous batch rejected');
echo 'PASS: '.$version.' one-template steps, durable progress, edit preservation, old-version preservation, idempotence, media deduplication, lock release/concurrency, and anonymous rejection.';
