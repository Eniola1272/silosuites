<?php
/** Run only in the isolated local WordPress QA installation. */
if(!defined('WP_CLI')||!WP_CLI||wp_get_environment_type()!=='local'||get_option('siteurl')!=='http://127.0.0.1:4190')throw new RuntimeException('Local QA only');
wp_set_current_user(1);
function spp_assert($condition,$message){if(!$condition)throw new RuntimeException($message);}
$templates=\SiloSuites\DesignImporter\import_design();
spp_assert(!is_wp_error($templates)&&count($templates)===10,'Ten templates required');
$before_media=wp_count_posts('attachment')->inherit;
$before_templates=wp_count_posts('elementor_library')->publish;
$pages=json_decode(file_get_contents('/Users/mac/Pictures/projects/silosuites/test-results/property-elementor-pages.json'),true);
$doc=\Elementor\Plugin::$instance->documents->get($pages['property']['id']);
$original=$doc->get_elements_data();$changed=$original;$count=[];$popup_count=0;
$walk=function(&$nodes)use(&$walk,&$count,&$popup_count){foreach($nodes as &$n){
 $kind=$n['widgetType']??$n['elType'];$count[$kind]=($count[$kind]??0)+1;
 if(strpos($n['settings']['css_classes']??'','sp-popup-source')!==false)++$popup_count;
 if(($n['settings']['_title']??'')==='Property — Popup Amenities heading'){
  $n['settings']['title']='Amenities edited and saved';$n['settings']['title_color']='#123456';$n['settings']['typography_font_size']=['unit'=>'px','size'=>29,'sizes'=>[]];
 }
 foreach(['image','background_image'] as $key)if(!empty($n['settings'][$key]['url']))spp_assert(strpos($n['settings'][$key]['url'],'http://127.0.0.1:4190/wp-content/uploads/')===0,'Media must be local');
 if(!empty($n['elements']))$walk($n['elements']);
}};$walk($changed);
spp_assert($popup_count===4 && $count['html']===4,'Four native popup containers and four functional widgets required');
$doc->save(['elements'=>$changed]);
file_put_contents('/tmp/silo-property-elements-original.json',wp_json_encode($original));
$again=\SiloSuites\DesignImporter\import_design();
spp_assert($again===$templates,'Import idempotence');
spp_assert($before_media===wp_count_posts('attachment')->inherit,'No duplicate media');
spp_assert($before_templates===wp_count_posts('elementor_library')->publish,'No duplicate templates');
spp_assert(strpos(get_post_meta($pages['property']['id'],'_elementor_data',true),'Amenities edited and saved')!==false,'Native popup edits persisted');
\Elementor\Plugin::$instance->files_manager->clear_cache();
deactivate_plugins('silosuites-design-importer/silosuites-design-importer.php');
echo json_encode(['version'=>\SiloSuites\DesignImporter\VERSION,'native_counts'=>$count,'editable_popups'=>$popup_count,'media_total'=>$before_media,'repeat_import'=>'passed','popup_edit_saved'=>'passed','importer_deactivated'=>true]);
