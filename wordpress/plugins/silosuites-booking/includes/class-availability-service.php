<?php
namespace SiloSuites\Booking;
defined('ABSPATH') || exit;

/** Browsing availability and provider-calculated quotes; never creates inventory holds. */
final class Availability_Service {
    private $client;
    public function __construct(Hostaway_Client $client = null) { $this->client = $client ?: new Hostaway_Client(); }
    public function get_today_in_utah() { return (new \DateTimeImmutable('now', new \DateTimeZone('America/Denver')))->format('Y-m-d'); }
    private function day($value) {
        if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $value)) return false;
        $date=\DateTimeImmutable::createFromFormat('!Y-m-d', $value, new \DateTimeZone('America/Denver'));
        return $date && $date->format('Y-m-d') === $value ? $date : false;
    }
    public function validate_dates($in, $out) {
        $a=$this->day($in); $b=$this->day($out);
        if (!$a || !$b) return new \WP_Error('ssb_date_invalid','Choose valid arrival and departure dates.');
        if ($in < $this->get_today_in_utah() || $out <= $in) return new \WP_Error('ssb_date_order','Choose a future arrival and a later departure.');
        if ($out > (new \DateTimeImmutable($this->get_today_in_utah()))->modify('+365 days')->format('Y-m-d')) return new \WP_Error('ssb_date_horizon','Choose dates within the next year.');
        $n=(int)$a->diff($b)->days;
        return $n <= 30 ? $n : new \WP_Error('ssb_date_overlong','Online searches support up to 30 nights.');
    }
    public function validate_guests($guests) {
        return (is_int($guests) || is_string($guests)) && preg_match('/^(?:[1-9]|1[0-8])$/D',(string)$guests) ? (int)$guests : new \WP_Error('ssb_guests','Choose a whole number of guests between 1 and 18.');
    }
    public function get_stay_nights_list($in,$nights) {
        $dates=[]; $d=$this->day($in); if (!$d) return $dates;
        for ($i=0;$i<$nights;$i++) $dates[]=$d->modify('+'.$i.' days')->format('Y-m-d');
        return $dates;
    }
    public function property($slug) {
        $names=properties(); if (!is_string($slug) || !isset($names[$slug])) return new \WP_Error('ssb_unknown_property','Unknown property.');
        $map=get_option('ssb_property_mapping',[]); $id=$map[$slug]??'';
        if ($slug==='all-silos' && !get_option('ssb_group_verified',false)) return new \WP_Error('ssb_group_setup','Group booking is not enabled. Contact us to arrange all four silos.');
        if (!is_string($id) || !preg_match('/^[0-9]{1,32}$/D',$id)) return new \WP_Error('ssb_mapping','This property is not connected for online booking.');
        foreach ((get_option('ssb_listing_snapshot',[])['listings']??[]) as $row) {
            if ((string)$row['id']!==$id) continue;
            if (empty($row['personCapacity']) || empty($row['minNights']) || empty($row['maxNights']) || !preg_match('/^[A-Z]{3}$/D',$row['currencyCode']??'')) return new \WP_Error('ssb_metadata','Refresh Hostaway property metadata before accepting bookings.');
            return ['slug'=>$slug,'id'=>$id,'name'=>$names[$slug],'capacity'=>(int)$row['personCapacity'],'currency'=>$row['currencyCode'],'min_stay'=>max(1,(int)($row['minNights']??1)),'max_stay'=>max(1,(int)($row['maxNights']??30))];
        }
        return new \WP_Error('ssb_metadata','Refresh Hostaway property metadata before accepting bookings.');
    }
    public function get_property_calendar($id,$in,$out,$fresh=false) {
        $key='ssb_cal_'.hash('sha256',$this->client->cache_namespace().'|'.$id.'|'.$in.'|'.$out);
        $cached=$fresh?false:get_transient($key); if (is_array($cached)) return $cached;
        $days=$this->client->calendar($id,$in,$out);
        if (!is_wp_error($days)) set_transient($key,$days,60);
        return $days;
    }
    public function calendar_range($slug,$in,$out) {
        $p=$this->property($slug); if (is_wp_error($p)) return $p;
        $a=$this->day($in);$b=$this->day($out);
        if (!$a || !$b || $out<$in || $a->diff($b)->days>61 || $in<substr($this->get_today_in_utah(),0,7).'-01' || $out>(new \DateTimeImmutable($this->get_today_in_utah()))->modify('+365 days')->format('Y-m-d')) return new \WP_Error('ssb_calendar_range','Choose a calendar range of up to 62 days within the next year.');
        $days=$this->get_property_calendar($p['id'],$in,$out);if (is_wp_error($days)) return $days;
        $safe=[];
        for ($d=$a;$d<=$b;$d=$d->modify('+1 day')) {
            $date=$d->format('Y-m-d');$row=$days[$date]??null;
            $safe[]=['date'=>$date,'available'=>$row ? (bool)$row['is_available']:false,'closed_arrival'=>$row?(bool)$row['closed_arrival']:true,'closed_departure'=>$row?(bool)$row['closed_departure']:true,'minimum_stay'=>$row['minimum_stay']??$p['min_stay'],'maximum_stay'=>$row['maximum_stay']??$p['max_stay']];
        }
        return ['property'=>$slug,'capacity'=>$p['capacity'],'days'=>$safe,'checked_at_utc'=>gmdate('c'),'holds_inventory'=>false];
    }
    private function check($p,$in,$out,$guests,$nights,$fresh=false) {
        if ($guests>$p['capacity']) return new \WP_Error('ssb_capacity','This suite cannot accommodate that many guests.');
        $days=$this->get_property_calendar($p['id'],$in,$out,$fresh);if (is_wp_error($days)) return $days;
        if (!isset($days[$in],$days[$out])) return new \WP_Error('ssb_incomplete_calendar','Availability could not be confirmed. Please retry.');
        $arrival=$days[$in];$departure=$days[$out];
        $min=$arrival['minimum_stay']??$p['min_stay'];$max=$arrival['maximum_stay']??$p['max_stay'];
        if ($arrival['closed_arrival'] || $departure['closed_departure'] || $nights<$min || $nights>$max) return new \WP_Error('ssb_restriction','These dates do not meet the property’s arrival, departure or stay-length rules.');
        foreach ($this->get_stay_nights_list($in,$nights) as $d) if (empty($days[$d]['is_available'])) return new \WP_Error('ssb_unavailable','These dates are not available.');
        return true;
    }
    public function evaluate_availability($in,$out,$guests=1) {
        $n=$this->validate_dates($in,$out);if (is_wp_error($n)) return $n;
        $guests=$this->validate_guests($guests);if (is_wp_error($guests)) return $guests;
        $rows=[];
        foreach (properties() as $slug=>$name) {
            $p=$this->property($slug);$result=is_wp_error($p)?$p:$this->check($p,$in,$out,$guests,$n);
            $rows[$slug]=['slug'=>$slug,'name'=>$name,'available'=>!is_wp_error($result),'reason'=>is_wp_error($result)?$result->get_error_message():'','capacity'=>is_wp_error($p)?null:$p['capacity']];
        }
        return ['status'=>'success','check_in'=>$in,'check_out'=>$out,'nights'=>$n,'guests'=>$guests,'properties'=>$rows,'holds_inventory'=>false];
    }
    public function generate_quote($slug,$in,$out,$guests=1,$fresh=false) {
        $n=$this->validate_dates($in,$out);if (is_wp_error($n)) return $n;
        $guests=$this->validate_guests($guests);if (is_wp_error($guests)) return $guests;
        $p=$this->property($slug);if (is_wp_error($p)) return $p;
        $ok=$this->check($p,$in,$out,$guests,$n,$fresh);if (is_wp_error($ok)) return $ok;
        $price=$this->client->price_details($p['id'],$in,$out,$guests);if (is_wp_error($price)) return $price;
        $quote=['status'=>'success','property'=>$slug,'property_name'=>$p['name'],'check_in'=>$in,'check_out'=>$out,'nights'=>$n,'guests'=>$guests,'currency'=>$p['currency'],'total'=>$price['total_price'],'components'=>$price['components'],'checked_at_utc'=>gmdate('c'),'expires_at_utc'=>gmdate('c',time()+300),'holds_inventory'=>false,'checkout_enabled'=>false];
        return $quote;
    }
}
