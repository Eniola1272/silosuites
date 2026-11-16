<?php
namespace SiloSuites\Booking;
defined('ABSPATH') || exit;
final class Booking_Widget extends \Elementor\Widget_Base {
 public function get_name(){return 'silosuites-booking';}
 public function get_title(){return 'Silo Suites Booking';}
 public function get_icon(){return 'eicon-calendar';}
 public function get_categories(){return ['general'];}
 public function get_style_depends(){return [];}
 protected function register_controls(){
  $this->start_controls_section('booking',['label'=>'Booking component']);
  $this->add_control('component',['label'=>'Display','type'=>\Elementor\Controls_Manager::SELECT,'default'=>'properties','options'=>['properties'=>'All stay cards','search'=>'Date-first search and results','booking'=>'Single suite booking panel','checkout'=>'On-site checkout review']]);
  $this->add_control('property',['label'=>'Property','type'=>\Elementor\Controls_Manager::SELECT,'default'=>'silo-2','options'=>properties(),'condition'=>['component'=>'booking']]);
  $this->end_controls_section();
 }
 protected function render(){ if(\Elementor\Plugin::$instance->editor->is_edit_mode()){echo '<div class="ssb-panel"><strong>Silo Suites Booking</strong><p>Choose the component in the widget settings. Preview the page to check live dates and prices.</p></div>';return;} $s=$this->get_settings_for_display();echo render_component(in_array($s['component']??'',['properties','search','booking','checkout'],true)?$s['component']:'properties',$s['property']??''); }
}
