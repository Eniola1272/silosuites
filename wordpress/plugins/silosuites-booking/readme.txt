=== Silo Suites Booking ===
Contributors: homlay
Requires at least: 6.8
Requires PHP: 7.4
Stable tag: 0.2.1
License: GPLv2 or later

Server-side Hostaway live availability search, property mapping and quote calculation.

== Installation ==
1. Install and activate on the private WordPress staging site.
2. Configure SILOSUITES_HOSTAWAY_ACCOUNT_ID and SILOSUITES_HOSTAWAY_CLIENT_SECRET in private environment variables or wp-config.php. Never add credentials to Elementor, frontend JS, exports, logs or chat.
3. Open Tools > Silo Suites Booking and run the read-only connection check.
4. Map the six property slots to the verified listing IDs.

Only authentication, listing-metadata, calendar availability, and price calculation operations are implemented. The safe metadata snapshot is administrator-only. No guest, reservation, payment or message endpoint is called. API tokens are server-side transients, never rendered. Credentials are read from server configuration, not saved in plugin options. Provider error bodies are never displayed or logged.

This plugin is independent of Silo Suites Design Importer. It does not replace the preview forms, install webhooks or provide an unverified booking checkout. API access alone is not proof of payment, add-on or group-inventory capabilities. A previous successful metadata snapshot is preserved on error and labelled with its timestamp.

Deactivate to stop using these diagnostics. No scheduled jobs are registered. A future data-removal workflow must explicitly address server token caches and retained mapping/snapshots; deactivation preserves settings.

== Changelog ==
= 0.2.1 =
* Bugfix: Ensure class-availability-service.php is packaged with the plugin to prevent fatal missing-file errors on activation.
* Phase 4 live availability and quote services: Hostaway calendar endpoint adapter, server-side America/Denver date validation, minimum-stay and capacity rules, multi-silo composite availability for All Four Silos, transient-backed calendar caching, quote generation with tax and fee line items, and public REST endpoints (/wp-json/silosuites/v1/availability and /wp-json/silosuites/v1/quote).

= 0.2.0 =
Phase 4 live availability and quote services: Hostaway calendar endpoint adapter, server-side America/Denver date validation, minimum-stay and capacity rules, multi-silo composite availability for All Four Silos, transient-backed calendar caching, quote generation with tax and fee line items, and public REST endpoints (/wp-json/silosuites/v1/availability and /wp-json/silosuites/v1/quote).

= 0.1.0 =
Initial development foundation: server-only Hostaway authentication, bounded listing metadata reads, token caching/refresh, redacted failures, admin diagnostics and validated property mapping. No live checkout or booking-sync claim.
