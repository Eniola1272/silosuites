<?php
namespace SiloSuites\Booking;
defined( 'ABSPATH' ) || exit;

/**
 * Evaluates date-first stay availability and calculates quotes across individual and group suites.
 */
final class Availability_Service {
    private $client;
    private $properties_config;

    public function __construct( Hostaway_Client $client = null ) {
        $this->client = $client ?: new Hostaway_Client();
        $this->properties_config = array(
            'silo-1'    => array( 'name' => 'Silo Suite 1', 'capacity' => 4, 'min_stay' => 2, 'cleaning_fee' => 75.0, 'category' => 'silo' ),
            'silo-2'    => array( 'name' => 'Silo Suite 2', 'capacity' => 5, 'min_stay' => 2, 'cleaning_fee' => 75.0, 'category' => 'silo' ),
            'silo-3'    => array( 'name' => 'Silo Suite 3', 'capacity' => 5, 'min_stay' => 2, 'cleaning_fee' => 75.0, 'category' => 'silo' ),
            'silo-4'    => array( 'name' => 'Silo Suite 4', 'capacity' => 4, 'min_stay' => 2, 'cleaning_fee' => 75.0, 'category' => 'silo' ),
            'dairy'     => array( 'name' => 'The Dairy Suite', 'capacity' => 4, 'min_stay' => 2, 'cleaning_fee' => 75.0, 'category' => 'suite' ),
            'all-silos' => array( 'name' => 'All Four Silos', 'capacity' => 18, 'min_stay' => 2, 'cleaning_fee' => 250.0, 'category' => 'group' ),
        );
    }

    public function get_today_in_utah() {
        try {
            $tz = new \DateTimeZone( 'America/Denver' );
            $now = new \DateTime( 'now', $tz );
            return $now->format( 'Y-m-d' );
        } catch ( \Exception $e ) {
            return gmdate( 'Y-m-d' );
        }
    }

    public function validate_dates( $check_in, $check_out ) {
        if ( ! is_string( $check_in ) || ! preg_match( '/^[0-9]{4}-([0-9]{2})-([0-9]{2})$/D', $check_in, $m_in ) ) {
            return new \WP_Error( 'ssb_date_format', 'Invalid arrival date format.' );
        }
        if ( ! checkdate( (int) $m_in[1], (int) $m_in[2], (int) substr( $check_in, 0, 4 ) ) ) {
            return new \WP_Error( 'ssb_date_invalid', 'Arrival date is not a valid calendar day.' );
        }

        if ( ! is_string( $check_out ) || ! preg_match( '/^[0-9]{4}-([0-9]{2})-([0-9]{2})$/D', $check_out, $m_out ) ) {
            return new \WP_Error( 'ssb_date_format', 'Invalid departure date format.' );
        }
        if ( ! checkdate( (int) $m_out[1], (int) $m_out[2], (int) substr( $check_out, 0, 4 ) ) ) {
            return new \WP_Error( 'ssb_date_invalid', 'Departure date is not a valid calendar day.' );
        }

        $today = $this->get_today_in_utah();
        if ( $check_in < $today ) {
            return new \WP_Error( 'ssb_date_past', 'Arrival date cannot be in the past.' );
        }

        if ( $check_out <= $check_in ) {
            return new \WP_Error( 'ssb_date_order', 'Departure date must be after arrival date.' );
        }

        $d_in = new \DateTime( $check_in );
        $d_out = new \DateTime( $check_out );
        $diff = $d_in->diff( $d_out );
        $nights = (int) $diff->days;

        if ( $nights > 30 ) {
            return new \WP_Error( 'ssb_date_overlong', 'Maximum stay length is 30 nights.' );
        }

        return $nights;
    }

    public function get_stay_nights_list( $check_in, $nights ) {
        $dates = array();
        $curr = new \DateTime( $check_in );
        for ( $i = 0; $i < $nights; ++$i ) {
            $dates[] = $curr->format( 'Y-m-d' );
            $curr->modify( '+1 day' );
        }
        return $dates;
    }

    public function get_property_calendar( $listing_id, $check_in, $check_out ) {
        $cache_key = 'ssb_cal_' . hash( 'sha256', $listing_id . '|' . $check_in . '|' . $check_out );
        $cached = get_transient( $cache_key );
        if ( is_array( $cached ) ) {
            return $cached;
        }

        $calendar = $this->client->calendar( $listing_id, $check_in, $check_out );
        if ( is_wp_error( $calendar ) ) {
            return $calendar;
        }

        // Cache for 300 seconds (5 minutes) for browsing performance
        set_transient( $cache_key, $calendar, 5 * MINUTE_IN_SECONDS );
        return $calendar;
    }

    public function evaluate_availability( $check_in, $check_out, $guests = 1 ) {
        $nights = $this->validate_dates( $check_in, $check_out );
        if ( is_wp_error( $nights ) ) {
            return $nights;
        }

        $guests = max( 1, (int) $guests );
        $mapping = get_option( 'ssb_property_mapping', array() );
        $stay_dates = $this->get_stay_nights_list( $check_in, $nights );

        $results = array();
        $child_silo_status = array();

        // 1. Evaluate single properties first
        foreach ( array( 'silo-1', 'silo-2', 'silo-3', 'silo-4', 'dairy' ) as $slug ) {
            $config = $this->properties_config[ $slug ];
            $listing_id = $mapping[ $slug ] ?? '';

            if ( empty( $listing_id ) ) {
                $results[ $slug ] = array(
                    'slug'         => $slug,
                    'name'         => $config['name'],
                    'available'    => false,
                    'reason'       => 'Listing ID not mapped.',
                    'capacity'     => $config['capacity'],
                    'eligible'     => ( $guests <= $config['capacity'] ),
                );
                $child_silo_status[ $slug ] = false;
                continue;
            }

            $calendar = $this->get_property_calendar( $listing_id, $check_in, $check_out );
            if ( is_wp_error( $calendar ) ) {
                $results[ $slug ] = array(
                    'slug'         => $slug,
                    'name'         => $config['name'],
                    'available'    => false,
                    'reason'       => 'Calendar could not be retrieved.',
                    'capacity'     => $config['capacity'],
                    'eligible'     => false,
                );
                $child_silo_status[ $slug ] = false;
                continue;
            }

            $is_avail = true;
            $unavail_reason = '';
            $total_acc = 0.0;
            $min_req = $config['min_stay'];

            // Check arrival day rules
            if ( isset( $calendar[ $check_in ] ) ) {
                if ( ! empty( $calendar[ $check_in ]['closed_arrival'] ) ) {
                    $is_avail = false;
                    $unavail_reason = 'Arrival is closed on this date.';
                }
                if ( ! empty( $calendar[ $check_in ]['minimum_stay'] ) ) {
                    $min_req = max( $min_req, (int) $calendar[ $check_in ]['minimum_stay'] );
                }
            }

            if ( $nights < $min_req ) {
                $is_avail = false;
                $unavail_reason = sprintf( 'Minimum stay is %d nights.', $min_req );
            }

            // Check each night
            foreach ( $stay_dates as $date ) {
                if ( ! isset( $calendar[ $date ] ) || empty( $calendar[ $date ]['is_available'] ) ) {
                    $is_avail = false;
                    $unavail_reason = 'Selected dates are unavailable.';
                    break;
                }
                $total_acc += (float) ( $calendar[ $date ]['price'] ?? 0.0 );
            }

            // Check departure day rule
            if ( isset( $calendar[ $check_out ] ) && ! empty( $calendar[ $check_out ]['closed_departure'] ) ) {
                $is_avail = false;
                $unavail_reason = 'Departure is closed on this date.';
            }

            $child_silo_status[ $slug ] = $is_avail;

            $eligible = ( $guests <= $config['capacity'] );
            $results[ $slug ] = array(
                'slug'                => $slug,
                'name'                => $config['name'],
                'available'           => ( $is_avail && $eligible ),
                'reason'              => ( ! $eligible ) ? 'Exceeds capacity.' : $unavail_reason,
                'capacity'            => $config['capacity'],
                'eligible'            => $eligible,
                'min_stay'            => $min_req,
                'accommodation_total' => $total_acc,
                'nightly_rate_avg'    => $nights > 0 ? round( $total_acc / $nights, 2 ) : 0.0,
            );
        }

        // 2. Evaluate All Four Silos (group)
        $group_config = $this->properties_config['all-silos'];
        $group_mapped = $mapping['all-silos'] ?? '';

        if ( ! empty( $group_mapped ) ) {
            $calendar = $this->get_property_calendar( $group_mapped, $check_in, $check_out );
            if ( is_wp_error( $calendar ) ) {
                $results['all-silos'] = array(
                    'slug'      => 'all-silos',
                    'name'      => $group_config['name'],
                    'available' => false,
                    'reason'    => 'Group calendar could not be retrieved.',
                    'capacity'  => $group_config['capacity'],
                    'eligible'  => ( $guests <= $group_config['capacity'] ),
                );
            } else {
                $is_avail = true;
                $total_acc = 0.0;
                $min_req = $group_config['min_stay'];
                if ( isset( $calendar[ $check_in ]['minimum_stay'] ) ) {
                    $min_req = max( $min_req, (int) $calendar[ $check_in ]['minimum_stay'] );
                }
                if ( $nights < $min_req ) {
                    $is_avail = false;
                }
                foreach ( $stay_dates as $date ) {
                    if ( ! isset( $calendar[ $date ] ) || empty( $calendar[ $date ]['is_available'] ) ) {
                        $is_avail = false;
                        break;
                    }
                    $total_acc += (float) ( $calendar[ $date ]['price'] ?? 0.0 );
                }
                $eligible = ( $guests <= $group_config['capacity'] );
                $results['all-silos'] = array(
                    'slug'                => 'all-silos',
                    'name'                => $group_config['name'],
                    'available'           => ( $is_avail && $eligible ),
                    'reason'              => ( ! $eligible ) ? 'Exceeds capacity.' : ( ! $is_avail ? 'Selected dates unavailable.' : '' ),
                    'capacity'            => $group_config['capacity'],
                    'eligible'            => $eligible,
                    'min_stay'            => $min_req,
                    'accommodation_total' => $total_acc,
                    'nightly_rate_avg'    => $nights > 0 ? round( $total_acc / $nights, 2 ) : 0.0,
                );
            }
        } else {
            // Composite multi-unit evaluation: all 4 individual silos must be available
            $all_silos_available = true;
            $group_total_acc = 0.0;
            foreach ( array( 'silo-1', 'silo-2', 'silo-3', 'silo-4' ) as $s_slug ) {
                if ( empty( $child_silo_status[ $s_slug ] ) ) {
                    $all_silos_available = false;
                }
                $group_total_acc += ( $results[ $s_slug ]['accommodation_total'] ?? 0.0 );
            }
            $eligible = ( $guests <= $group_config['capacity'] );
            $results['all-silos'] = array(
                'slug'                => 'all-silos',
                'name'                => $group_config['name'],
                'available'           => ( $all_silos_available && $eligible ),
                'reason'              => ( ! $eligible ) ? 'Exceeds capacity.' : ( ! $all_silos_available ? 'One or more individual silos are booked.' : '' ),
                'capacity'            => $group_config['capacity'],
                'eligible'            => $eligible,
                'min_stay'            => $group_config['min_stay'],
                'accommodation_total' => $group_total_acc,
                'nightly_rate_avg'    => $nights > 0 ? round( $group_total_acc / $nights, 2 ) : 0.0,
            );
        }

        return array(
            'status'     => 'success',
            'check_in'   => $check_in,
            'check_out'  => $check_out,
            'nights'     => $nights,
            'guests'     => $guests,
            'properties' => $results,
        );
    }

    public function generate_quote( $property_slug, $check_in, $check_out, $guests = 1 ) {
        if ( ! isset( $this->properties_config[ $property_slug ] ) ) {
            return new \WP_Error( 'ssb_unknown_property', 'Unknown property.' );
        }

        $avail = $this->evaluate_availability( $check_in, $check_out, $guests );
        if ( is_wp_error( $avail ) ) {
            return $avail;
        }

        $prop_avail = $avail['properties'][ $property_slug ] ?? null;
        if ( ! $prop_avail || empty( $prop_avail['available'] ) ) {
            return new \WP_Error( 'ssb_unavailable', $prop_avail['reason'] ?? 'Property is not available for requested dates.' );
        }

        $config = $this->properties_config[ $property_slug ];
        $acc_total = (float) $prop_avail['accommodation_total'];
        $cleaning = (float) $config['cleaning_fee'];
        // Utah lodging tax ~ 10.75%
        $tax_rate = 0.1075;
        $taxes = round( ( $acc_total + $cleaning ) * $tax_rate, 2 );
        $total = round( $acc_total + $cleaning + $taxes, 2 );

        $quote_id = 'ssq_' . wp_generate_password( 24, false );
        $expires = gmdate( 'c', time() + 30 * MINUTE_IN_SECONDS );

        $quote_data = array(
            'quote_id'            => $quote_id,
            'status'              => 'success',
            'property'            => $property_slug,
            'property_name'       => $config['name'],
            'check_in'            => $check_in,
            'check_out'           => $check_out,
            'nights'              => $avail['nights'],
            'guests'              => $guests,
            'currency'            => 'USD',
            'line_items'          => array(
                'accommodation' => $acc_total,
                'cleaning'      => $cleaning,
                'taxes'         => $taxes,
                'total'         => $total,
            ),
            'expires_at_utc'      => $expires,
        );

        set_transient( 'ssb_quote_' . $quote_id, $quote_data, 30 * MINUTE_IN_SECONDS );

        return $quote_data;
    }
}
