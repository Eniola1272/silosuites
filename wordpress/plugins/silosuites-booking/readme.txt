=== Silo Suites Booking ===
Contributors: homlay
Requires at least: 6.8
Requires PHP: 7.4
Stable tag: 0.3.7
License: GPLv2 or later

Server-side Hostaway live availability search, property mapping and quote calculation.

== Installation ==
1. Install and activate on the private WordPress staging site.
2. Configure SILOSUITES_HOSTAWAY_ACCOUNT_ID and SILOSUITES_HOSTAWAY_CLIENT_SECRET in private environment variables or wp-config.php. Never add credentials to Elementor, frontend JS, exports, logs or chat.
3. Open Tools > Silo Suites Booking and run the read-only connection check.
4. Map the five individual properties to the verified listing IDs.

Only authentication, listing metadata, calendar availability, price calculation and public review reads are implemented. The safe metadata snapshot is administrator-only. No guest, reservation, payment or message endpoint is called. API tokens are server-side transients, never rendered. Credentials are read from server configuration, not saved in plugin options. Provider error bodies are never displayed or logged.

This plugin is independent of Silo Suites Design Importer. It adds live booking widgets and a checkout review, but does not install webhooks, collect card details, charge payments or create reservations. API access alone is not proof of payment, add-on or group-inventory capabilities. A previous successful metadata snapshot is preserved on error and labelled with its timestamp.

Deactivate to stop using these diagnostics. No scheduled jobs are registered. A future data-removal workflow must explicitly address server token caches and retained mapping/snapshots; deactivation preserves settings.

== Changelog ==
= 0.3.7 =
Match the client olive #81ad7b. Add published Rates from copy to property cards, with defaults from the client homepage and an editable Suite content field. Keep marketing starting rates separate from Hostaway date-specific quotes, fees and tax.

= 0.3.6 =
Limit Explore other properties to two alternatives and use View all properties. Add a Property rating widget/shortcode sharing the public review response and its display rules; no fabricated rating for empty properties. Gallery composition is updated in the HTML review using verified property-specific photo sets.

= 0.3.5 =
Use consistent SVG date/guest chevrons. Add Explore other properties widget mode and shortcode, excluding the current suite and retaining valid search dates and guests. Offer only the five individual rentals. Host story/photo remain native editorial content for the reviewed Elementor layout.

= 0.3.4 =
Add cached, per-property Hostaway reviews with visible published text from supported sources, excluding Airbnb and private guest fields. Add a Guest reviews Elementor mode and shortcode, accessible review dialogs, retry and empty states. Remove the four-silo inquiry message from booking components and the Open map action from enhanced property templates. No reservation or payment operations added.

= 0.3.3 =
Use white backgrounds for booking widgets, checkout review, loading panels and availability popup summaries. Preserve visible calendar selection states.

= 0.3.2 =
Clarify the permanent inquiry-only group policy in setup/admin text and remove the unused group URL branch. Five individual properties are mapped for online booking.

= 0.3.1 =
Remove All Four Silos from the public rental catalog, search results, booking widget options and API property allowlist. Retain only the client-approved contact invitation. Use original-site font families with upright headings. Existing group data is retained privately; no reservation or inventory record is deleted.

= 0.3.0 =
Live calendar and provider-authoritative quote browsing with the documented version-2 priceDetails endpoint. Remove estimated fees/tax and unverified composite group quotes. Add client-editable property records, an Elementor Booking widget and shortcodes for dynamic cards, search, single-property booking and on-site checkout review. Enhance existing design card actions. Payment and reservation creation remain disabled pending Stripe/Hostaway test proof. No hosted checkout handoff.

= 0.2.1 =
* Bugfix: Ensure class-availability-service.php is packaged with the plugin to prevent fatal missing-file errors on activation.
* Phase 4 live availability and quote services: Hostaway calendar endpoint adapter, server-side America/Denver date validation, minimum-stay and capacity rules, multi-silo composite availability for All Four Silos, transient-backed calendar caching, quote generation with tax and fee line items, and public REST endpoints (/wp-json/silosuites/v1/availability and /wp-json/silosuites/v1/quote).

= 0.2.0 =
Phase 4 live availability and quote services: Hostaway calendar endpoint adapter, server-side America/Denver date validation, minimum-stay and capacity rules, multi-silo composite availability for All Four Silos, transient-backed calendar caching, quote generation with tax and fee line items, and public REST endpoints (/wp-json/silosuites/v1/availability and /wp-json/silosuites/v1/quote).

= 0.1.0 =
Initial development foundation: server-only Hostaway authentication, bounded listing metadata reads, token caching/refresh, redacted failures, admin diagnostics and validated property mapping. No live checkout or booking-sync claim.

== On-site components ==
Add the Silo Suites Booking widget in Elementor and choose All stay cards, Search, Single suite booking, Checkout review, or Guest reviews.
Shortcodes: [silosuites_properties], [silosuites_search], [silosuites_booking property="silo-2"], [silosuites_checkout], [silosuites_reviews property="silo-2"].
Create a WordPress checkout page at /checkout/ with the Checkout review widget or shortcode. Update Suite content records for editorial titles, descriptions and featured images. Refresh Hostaway metadata after updating this plugin so capacity, currency and stay limits are current.
Existing 0.2.6 design card actions are enhanced when the plugin is active; no fixtures are used in those live dialogs. Unknown/unmapped properties fail closed. All Four Silos is not an online rental option. The group inquiry message is also removed; old provider mapping settings cannot restore group booking.

Reviews are cached for 15 minutes. Only published guest-to-host reviews with bookingEngineVisibility=1, isHidden=0, isCancelled=0, a rating and public text are displayed. Airbnb text and unsupported channels are excluded. Counts and averages describe the displayed eligible reviews on Hostaway's 10-point scale. Guest names, private feedback and reservation IDs are excluded. Use Hostaway visibility controls to hide a review. A live WordPress connection and property mapping are required; no reviews are bundled into the plugin.

Explore other properties: [silosuites_related_properties property="silo-2"], or choose Explore other properties in the booking widget. Property selects the current suite to exclude. Cards use client-editable Suite content and verified provider metadata; no speculative rates are shown. Existing redesigned .sp-property pages receive this section automatically. Host story/photo remain native editorial content, not plugin-owned copy.

Title rating: [silosuites_rating property="silo-2"] or Property rating widget mode. Place it beside the native property title above the gallery, and give the reviews section the HTML ID sp-reviews. Ratings reuse the eligible visible review count and ten-point scale; unrated properties show No reviews yet. Related properties now show at most two alternatives, plus View all properties.

Card starting rates: edit Suite content > the individual property > Property card starting rate. Values are in USD; leave blank to hide the starting rate. These are published marketing prices, not live calendar prices or stay totals. Hostaway remains authoritative for the price after dates are chosen. Original published defaults: Silo 1 $150, Silo 2 $165, Silo 3 $165, Silo 4 $159, Dairy $159.
