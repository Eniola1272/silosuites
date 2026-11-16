=== Silo Suites Booking ===
Contributors: homlay
Requires at least: 6.8
Requires PHP: 7.4
Stable tag: 0.3.2
License: GPLv2 or later

Server-side Hostaway live availability search, property mapping and quote calculation.

== Installation ==
1. Install and activate on the private WordPress staging site.
2. Configure SILOSUITES_HOSTAWAY_ACCOUNT_ID and SILOSUITES_HOSTAWAY_CLIENT_SECRET in private environment variables or wp-config.php. Never add credentials to Elementor, frontend JS, exports, logs or chat.
3. Open Tools > Silo Suites Booking and run the read-only connection check.
4. Map the five individual properties to the verified listing IDs.

Only authentication, listing-metadata, calendar availability, and price calculation operations are implemented. The safe metadata snapshot is administrator-only. No guest, reservation, payment or message endpoint is called. API tokens are server-side transients, never rendered. Credentials are read from server configuration, not saved in plugin options. Provider error bodies are never displayed or logged.

This plugin is independent of Silo Suites Design Importer. It adds live booking widgets and a checkout review, but does not install webhooks, collect card details, charge payments or create reservations. API access alone is not proof of payment, add-on or group-inventory capabilities. A previous successful metadata snapshot is preserved on error and labelled with its timestamp.

Deactivate to stop using these diagnostics. No scheduled jobs are registered. A future data-removal workflow must explicitly address server token caches and retained mapping/snapshots; deactivation preserves settings.

== Changelog ==
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
Add the Silo Suites Booking widget in Elementor and choose All stay cards, Search, Single suite booking, or Checkout review.
Shortcodes: [silosuites_properties], [silosuites_search], [silosuites_booking property="silo-2"], [silosuites_checkout].
Create a WordPress checkout page at /checkout/ with the Checkout review widget or shortcode. Update Suite content records for editorial titles, descriptions and featured images. Refresh Hostaway metadata after updating this plugin so capacity, currency and stay limits are current.
Existing 0.2.6 design card actions are enhanced when the plugin is active; no fixtures are used in those live dialogs. Unknown/unmapped properties fail closed. All Four Silos is not an online rental option. Show only the contact invitation, regardless of old provider mapping settings.
