<?php
namespace SiloSuites\Booking;
defined('ABSPATH') || exit;

/** Published marketing copy only. Availability_Service never reads these values. */
function published_rate_minor($value) {
    if (!is_string($value) || !preg_match('/^(?:0|[1-9][0-9]{0,6})(?:\.[0-9]{1,2})?$/D', $value)) return null;
    $parts = explode('.', $value);
    $amount = (int)$parts[0] * 100 + (int)str_pad($parts[1] ?? '', 2, '0');
    return $amount > 0 && $amount <= 100000000 ? $amount : null;
}
function published_starting_rate($slug, $post = null) {
    if (!is_string($slug) || !isset(properties()[$slug])) return null;
    if ($post && metadata_exists('post', $post->ID, '_ssb_published_starting_rate')) {
        $amount = published_rate_minor(get_post_meta($post->ID, '_ssb_published_starting_rate', true));
    } else {
        static $defaults;
        if ($defaults === null) $defaults = json_decode(file_get_contents(dirname(__DIR__).'/data/starting-rates.json'), true);
        $amount = $defaults['rates_minor'][$slug] ?? null;
    }
    return is_int($amount) && $amount > 0 && $amount <= 100000000 ? ['amount_minor'=>$amount, 'currency'=>'USD'] : null;
}
function save_published_starting_rate($post_id, $post) {
    if (!$post || $post->post_type !== 'ss_property' || !isset(properties()[$post->post_name]) || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) return;
    $nonce = $_POST['ssb_card_rate_nonce'] ?? null;
    if (!is_string($nonce) || !wp_verify_nonce($nonce, 'ssb_card_rate_'.$post_id) || !current_user_can('edit_post', $post_id)) return;
    $raw = $_POST['ssb_published_starting_rate'] ?? null;
    if (!is_string($raw)) return;
    $raw = trim(wp_unslash($raw));
    if ($raw !== '' && published_rate_minor($raw) === null) return;
    // Empty means intentionally hidden; absence of an override uses the client's published default.
    update_post_meta($post_id, '_ssb_published_starting_rate', $raw);
}
add_action('save_post_ss_property', __NAMESPACE__.'\\save_published_starting_rate', 10, 2);
add_action('add_meta_boxes_ss_property', function($post) {
    if (!$post || !isset(properties()[$post->post_name])) return;
    add_meta_box('ssb-card-rate', 'Property card starting rate', function($post) {
        $rate = published_starting_rate($post->post_name, $post);
        wp_nonce_field('ssb_card_rate_'.$post->ID, 'ssb_card_rate_nonce');
        echo '<p><label for="ssb-card-rate-value">Rates from (USD)</label></p><input id="ssb-card-rate-value" name="ssb_published_starting_rate" type="number" min="0.01" max="1000000" step="0.01" value="'.esc_attr($rate ? number_format($rate['amount_minor']/100, 2, '.', '') : '').'" class="widefat">';
        echo '<p>Published starting nightly rate for property cards. Leave blank to hide it. Guests choose dates to see the current stay total.</p>';
    }, 'ss_property', 'side');
});
