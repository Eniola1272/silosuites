<?php
/** Run through wp eval-file only in the isolated local QA site. */
if ( ! defined( 'WP_CLI' ) || ! WP_CLI || 'local' !== wp_get_environment_type() || 'http://127.0.0.1:4190' !== get_option( 'siteurl' ) ) {
    throw new RuntimeException( 'This check is restricted to the isolated Silo Suites QA site.' );
}
function ssqa_assert( $condition, $message ) {
    if ( ! $condition ) { throw new RuntimeException( $message ); }
}
wp_set_current_user( 1 );
$media_before = (int) wp_count_posts( 'attachment' )->inherit;
$templates_before = (int) wp_count_posts( 'elementor_library' )->publish;
$result = \SiloSuites\DesignImporter\import_design();
ssqa_assert( ! is_wp_error( $result ) && 10 === count( $result ), 'Ten imported templates required.' );
ssqa_assert( $media_before === (int) wp_count_posts( 'attachment' )->inherit, 'Repeat import duplicated media.' );
ssqa_assert( $templates_before === (int) wp_count_posts( 'elementor_library' )->publish, 'Repeat import duplicated templates.' );

$counts = array();
$urls = array();
$heading_count = 0;
$inspect = function ( $nodes ) use ( &$inspect, &$counts, &$urls, &$heading_count ) {
    foreach ( $nodes as $node ) {
        $kind = isset( $node['widgetType'] ) ? $node['widgetType'] : $node['elType'];
        $counts[ $kind ] = isset( $counts[ $kind ] ) ? $counts[ $kind ] + 1 : 1;
        if ( 'heading' === $kind && 'h1' === ( $node['settings']['header_size'] ?? '' ) ) { ++$heading_count; }
        foreach ( array( 'image', 'background_image' ) as $key ) {
            if ( ! empty( $node['settings'][ $key ]['url'] ) ) {
                $image = $node['settings'][ $key ];
                ssqa_assert( 0 === strpos( $image['url'], 'http://127.0.0.1:4190/wp-content/uploads/' ), 'Media URL was not remapped.' );
                ssqa_assert( 'attachment' === get_post_type( $image['id'] ) && is_file( get_attached_file( $image['id'] ) ), 'Media attachment is missing.' );
                $urls[] = $image['url'];
            }
        }
        $inspect( $node['elements'] ?? array() );
    }
};
$complete = \Elementor\Plugin::$instance->documents->get( $result['home-complete'] );
$original = $complete->get_elements_data();
$inspect( $original );
ssqa_assert( 1 === $heading_count, 'Exactly one native H1 is required.' );
ssqa_assert( $counts['heading'] > 20 && $counts['image'] >= 7, 'Editorial content must remain native Elementor widgets.' );
ssqa_assert( 3 === $counts['html'], 'Only styles, search, and mobile-menu widgets may use HTML.' );

$complete_counts = $counts;
$changed = $original;
$edit = function ( &$nodes ) use ( &$edit ) {
    foreach ( $nodes as &$node ) {
        if ( ( $node['settings']['_title'] ?? '' ) === '01 — Main headline' ) { $node['settings']['title'] = 'QA native heading edit'; return true; }
        if ( ! empty( $node['elements'] ) && $edit( $node['elements'] ) ) { return true; }
    }
    return false;
};
ssqa_assert( $edit( $changed ), 'Native headline not found.' );
$complete->save( array( 'elements' => $changed ) );
ssqa_assert( false !== strpos( get_post_meta( $result['home-complete'], '_elementor_data', true ), 'QA native heading edit' ), 'Native heading edit did not save.' );
$again = \SiloSuites\DesignImporter\import_design();
ssqa_assert( $again === $result, 'Repeat import returned different templates.' );
ssqa_assert( false !== strpos( get_post_meta( $result['home-complete'], '_elementor_data', true ), 'QA native heading edit' ), 'Repeat import overwrote an editorial change.' );
$complete->save( array( 'elements' => $original ) );

$part_report = array();
foreach ( array( 'header', 'footer' ) as $part ) {
    ssqa_assert( 'section' === get_post_meta( $result[ $part ], '_elementor_template_type', true ), 'Standalone parts must import as portable saved sections.' );
    $document = \Elementor\Plugin::$instance->documents->get( $result[ $part ] );
    $nodes = $document->get_elements_data();
    ssqa_assert( 2 === count( $nodes ) && false !== strpos( $nodes[1]['settings']['css_classes'], 'ss-site-' . $part ) && 'div' === $nodes[1]['settings']['html_tag'], 'Standalone part structure is incorrect; Theme Builder supplies its landmark.' );
    ssqa_assert( 'html' === $nodes[0]['elements'][0]['widgetType'] && false !== strpos( $nodes[0]['elements'][0]['settings']['html'], '<style>' ), 'Standalone styles are missing.' );
    $raw = wp_json_encode( $nodes );
    ssqa_assert( false === strpos( $raw, '"url":"#' ), 'Global navigation must target homepage anchors.' );
    $heading_count = 0;
    $inspect( $nodes );
    ssqa_assert( 0 === $heading_count, 'Site parts must not add a page H1.' );
    $part_report[ $part ] = array( 'template_id' => $result[ $part ], 'type' => 'section', 'self_contained_styles' => true );
}

wp_set_current_user( 0 );
$denied = \SiloSuites\DesignImporter\import_design();
ssqa_assert( is_wp_error( $denied ) && 'ssdi_forbidden' === $denied->get_error_code(), 'Unauthenticated import was not rejected.' );
wp_set_current_user( 1 );

$report = array( 'status' => 'pass', 'wordpress' => get_bloginfo( 'version' ), 'elementor' => ELEMENTOR_VERSION, 'installer' => \SiloSuites\DesignImporter\VERSION, 'media_count' => $media_before, 'native_counts' => $complete_counts, 'site_parts' => $part_report, 'checks' => array( 'real_elementor_import', 'all_images_local', 'single_h1', 'native_editorial_widgets', 'media_and_template_deduplication', 'native_heading_save', 'editorial_edits_survive_repeat_import', 'anonymous_import_rejected', 'standalone_site_parts', 'homepage_anchor_links' ) );
file_put_contents( __DIR__ . '/../test-results/elementor-import-report.json', wp_json_encode( $report, JSON_PRETTY_PRINT ) );
echo wp_json_encode( $report, JSON_PRETTY_PRINT );
