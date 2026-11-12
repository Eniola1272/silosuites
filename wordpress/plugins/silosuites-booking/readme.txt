=== Silo Suites Booking ===
Contributors: homlay
Requires at least: 6.8
Requires PHP: 7.4
Stable tag: 0.1.0
License: GPLv2 or later

Development foundation for the server-side Hostaway integration. Live checkout and booking sync are not enabled.

== Installation ==
1. Install and activate on the private WordPress staging site.
2. Configure SILOSUITES_HOSTAWAY_ACCOUNT_ID and SILOSUITES_HOSTAWAY_CLIENT_SECRET in private environment variables or wp-config.php. Never add credentials to Elementor, frontend JS, exports, logs or chat.
3. Open Tools > Silo Suites Booking and run the read-only connection check.
4. Map the six property slots to the verified listing IDs.

Only authentication and listing-metadata HTTP operations are implemented. The safe metadata snapshot is administrator-only. No guest, reservation, payment or message endpoint is called. API tokens are server-side transients, never rendered. Credentials are read from server configuration, not saved in plugin options. Provider error bodies are never displayed or logged.

This plugin is independent of Silo Suites Design Importer. It does not replace the preview forms, enable checkout, install webhooks or provide a live inventory feed. API access alone is not proof of payment, add-on or group-inventory capabilities. A previous successful metadata snapshot is preserved on error and labelled with its timestamp.

Deactivate to stop using these diagnostics. No scheduled jobs are registered. A future data-removal workflow must explicitly address server token caches and retained mapping/snapshots; deactivation preserves settings.

== Changelog ==
= 0.1.0 =
Initial development foundation: server-only Hostaway authentication, bounded listing metadata reads, token caching/refresh, redacted failures, admin diagnostics and validated property mapping. No live checkout or booking-sync claim.
