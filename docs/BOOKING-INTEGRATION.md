# Hostaway integration: development build 0.1.0

## What exists

The separate **Silo Suites Booking** WordPress plugin now provides server-only Hostaway authentication, administrator connection diagnostics, a safe listing metadata snapshot, and validated mapping for the six property slots. It is independent of the design importer (0.2.3, with staging import completion confirmed by the user). The new plugin has no public endpoints, scheduled jobs, frontend booking forms or reservation/payment operations.

Only `POST /v1/accessTokens` and `GET /v1/listings?limit=100&offset=...` exist in its adapter. Hostaway documents a one-second delay before new tokens become usable; the adapter observes it. Tokens are cached server-side, scoped by a credential fingerprint, and refreshed once after a 401. TLS verification stays enabled and redirects are disabled so a token cannot be forwarded elsewhere. Rate-limit, HTTP and network failures return generic messages without provider response bodies. Safe fields are explicitly allowlisted. An incomplete response never replaces the last successful snapshot.

## Secure setup

For local discovery, run from this project:

```sh
python3 tools/configure_hostaway.py
python3 tools/hostaway_discover.py
```

The first command prompts for the actual Hostaway Account ID and API key without echoing either. An API-key row ID is not necessarily the Account ID. Private files stay in ignored `.secrets/`, outside the served prototype.

For WordPress staging, install `releases/silosuites-booking-0.1.0.zip` and configure these two names in the hosting secret manager/environment or private `wp-config.php`:

- `SILOSUITES_HOSTAWAY_ACCOUNT_ID`
- `SILOSUITES_HOSTAWAY_CLIENT_SECRET`

The plugin reads constants first, then environment variables. Do not paste actual values into documentation or Elementor. It does not automatically copy the local discovery credentials onto a WordPress server.

Open **Tools → Silo Suites Booking** and click **Check Hostaway connection and listings**. With a successful snapshot, map each property to its listing ID. The provisional Silo Suite 2 ID `143823` comes from the supplied export; it is not automatically treated as verified. Duplicate/unknown IDs are rejected. Mapping the group listing does not verify its parent/child relationships.

## Checkout path

Hostaway's supported calendar widget displays availability and leads to a listing checkout/inquiry page. It requires a published Booking Website and supports one calendar widget per page. Its payment page must not be framed or masked inside another site. A branded `book.silosuites.com` handoff is a candidate, pending account-specific publication, extras, processor and group-inventory proof. The existing export references that domain; the domain has not been certified as a working checkout in this project.

References:

- https://support.hostaway.com/hc/en-us/articles/4421614267931-Booking-Website-Calendar-Widget
- https://support.hostaway.com/hc/en-us/articles/50219711579419-Booking-Website-Common-Questions
- https://api.hostaway.com/documentation
- https://support.hostaway.com/hc/en-us/articles/360041235433-Set-up-your-Cross-Listings

A custom payment flow remains a separate engineering path until the account's capabilities are proven. Never silently drop an extra, change processors or create a second independent reservation source.

## Tests and limits

`tests/booking-plugin.php` runs against an isolated local WordPress installation with synthetic responses intercepted using `pre_http_request`. It checks the HTTP allowlist, secure request options, private-field filtering, token cache and refresh, rate/network/schema errors, incomplete pagination recovery, cooldown, mapping validation and anonymous access rejection. `tests/booking-admin-browser.mjs` checks the actual admin page, disabled state without configuration, six mapping controls and nonce enforcement.

These tests do not prove live account access, availability correctness, a successful booking, payment, an add-on, a channel block, a message automation, webhook authentication or recovery. No real Hostaway request, reservation or payment was made by those tests. Subsequent local read-only discovery authenticated successfully and returned five listing identities; the staging server still requires its own credential configuration.

Deactivation preserves metadata and mappings. No cron job is installed. Tokens are stored as server-only WordPress transients, so protect the database/backups as part of normal secret handling.
