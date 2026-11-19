<?php
namespace SiloSuites\Booking;
defined('ABSPATH') || exit;

/** Only public, visible incoming reviews from supported display sources leave this service. */
final class Review_Service {
    private $client;
    public function __construct(Hostaway_Client $client = null) { $this->client = $client ?: new Hostaway_Client(); }

    public static function normalize($row, $listing_id) {
        if (!is_array($row) || (string)($row['listingMapId'] ?? '') !== (string)$listing_id || ($row['type'] ?? '') !== 'guest-to-host' || ($row['status'] ?? '') !== 'published') return null;
        $sources = ['2002'=>'Vrbo', '2005'=>'Booking.com', '2000'=>'Direct booking', '2013'=>'Direct booking', '2017'=>'Direct booking'];
        $channel = (string)($row['channelId'] ?? '');
        if (!isset($sources[$channel]) || !in_array($row['bookingEngineVisibility'] ?? null, [1, '1', true], true) || !in_array($row['isHidden'] ?? null, [0, '0', false], true) || !in_array($row['isCancelled'] ?? null, [0, '0', false], true)) return null;
        $text = $row['publicReview'] ?? null;
        $rating = $row['rating'] ?? null;
        if (!is_string($text) || strlen($text) > 20000 || !is_numeric($rating) || (float)$rating < 0 || (float)$rating > 10) return null;
        $text = trim(wp_strip_all_tags($text));
        if ('' === $text) return null;
        $submitted = (string)($row['submittedAt'] ?? '');
        $month = preg_match('/^([0-9]{4})-(0[1-9]|1[0-2])(?:-|$)/D', $submitted, $m) ? $m[1].'-'.$m[2] : '';
        // Do not expose guest/reviewer names, private feedback, reservation IDs or full provider objects.
        return ['text'=>$text, 'rating'=>(float)$rating, 'scale'=>10, 'source'=>$sources[$channel], 'month'=>$month];
    }

    public function get($slug) {
        if (!is_string($slug) || !isset(properties()[$slug])) return new \WP_Error('ssb_unknown_property', 'Unknown property.');
        $mapping = get_option('ssb_property_mapping', []);
        $id = $mapping[$slug] ?? '';
        if (!is_string($id) || !preg_match('/^[0-9]{1,32}$/D', $id)) return new \WP_Error('ssb_review_mapping', 'Reviews are not connected for this suite yet.');
        $key = 'ssb_reviews_'.hash('sha256', $this->client->cache_namespace().'|'.$id.'|v1');
        $cached = get_transient($key);
        if (is_array($cached)) return $cached;
        if (is_wp_error($cached)) return $cached;
        $lock = $key.'_lock';
        if (get_transient($lock)) return new \WP_Error('ssb_reviews_busy', 'Reviews are updating. Please try again shortly.');
        set_transient($lock, 1, 30);
        try {
            $reviews = [];
            $seen = [];
            for ($page = 0; $page < 10; ++$page) {
                $data = $this->client->review_page($id, $page * 100);
                if (is_wp_error($data)) { set_transient($key, $data, 60); return $data; }
                foreach ($data['reviews'] as $item) {
                    if (isset($seen[$item['key']])) return new \WP_Error('ssb_review_duplicates', 'Reviews could not be confirmed. Please try again later.');
                    $seen[$item['key']] = true;
                    $reviews[] = $item['review'];
                }
                if ($data['raw_count'] < 100) {
                    $count = count($reviews);
                    $result = ['property'=>$slug, 'reviews'=>$reviews, 'count'=>$count, 'average'=>$count ? round(array_sum(array_column($reviews, 'rating')) / $count, 2) : null, 'scale'=>10, 'checked_at_utc'=>gmdate('c')];
                    set_transient($key, $result, 900);
                    return $result;
                }
            }
            return new \WP_Error('ssb_review_limit', 'Reviews could not be loaded completely. Please try again later.');
        } finally { delete_transient($lock); }
    }
}
