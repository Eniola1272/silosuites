# Silo Suites project instructions

## Current client direction — 16 November 2026

- Preserve the original live Homepage, Hot Springs and Local Guide designs and client wording. Work on their performance and a minimal availability-search insertion, not a marketing-page redesign.
- Custom design is limited to search/results, individual property booking pages and checkout. Review HTML first; use the supplied DI Home Rentals image for layout reference only. Never copy its property facts, host biography, badges or reviews.
- Use existing client copy, original photography and the client's palette. Use US spelling (favorite). Do not introduce "distinctive" or new promotional descriptions. Keep headings upright and fonts consistent. Original export typography includes Playfair Display and Figtree.
- All Four Silos is inquiry-only. It must never appear as a rental card, available result, calendar/quote/checkout property or widget property selector, even if old mapping/group-verification options exist. Use exactly: "Interested in reserving all four silos? Contact us for availability."
- The earlier redesigned homepage and importer homepage deliveries through 0.2.6 are historical concepts. Do not deploy them over the original marketing pages. Use tools/build_booking_review.py for the current client preview; it packages booking pages and links marketing navigation to the unchanged live site.
- See docs/CLIENT-REVISION-2026-11-16.md for scope, content provenance and evidence.

## Project direction

- Read `docs/IMPLEMENTATION-PLAN.md` and `docs/HOSTAWAY-DISCOVERY.md` before implementation.
- Design and review the site as a local HTML/CSS/JavaScript prototype before Elementor conversion.
- Use the supplied brief and brand board as the design authority. Preserve the original logo artwork.
- Build editorial content as native, rearrangeable Elementor elements. Use a custom PHP plugin for booking functionality.
- Hostaway remains the system of record for inventory, rates, add-ons, reservations, guests, payments, and operational messaging.
- Verify account capabilities before treating custom checkout, add-ons, tokenised payments, inventory holds, or embedding as supported.
- Never silently lose an add-on or replace the client's current payment-processing arrangement.

## Mandatory plugin versioning

The user requires a version update for every plugin update.

- Every changed plugin build delivered for testing or installation must have a strictly newer semantic version.
- This includes changes to PHP, JavaScript, CSS, dependencies, and packaged resources. Never replace a released ZIP with changed content under the same version.
- Start the first installable development build at `0.1.0`; first accepted production release is `1.0.0`.
- Keep the plugin header, canonical runtime version, stable tag, asset cache versions, changelog, and ZIP name consistent. Track schema versions separately when migrations are needed.
- Add release validation once code exists; document the version change in the final implementation report.
- Changes limited to planning documents or the standalone HTML prototype do not imply that a plugin version already exists.

## Data and environment

- Never place credentials or personal guest data in source, fixtures, Elementor exports, logs, or chat.
- Keep API credentials on the server. No direct browser-to-Hostaway calls.
- Use `America/Denver` date-only semantics for stays; use UTC for operational timestamps.
- All Four Silos shares inventory with the individual silos. Validate the provider relationship, not just the visual filter.
- Use explicit fixture/demo data in the local prototype and simulate payment without collecting card details.
- Keep staging private and do not publish or alter the live site without the written approval required by the brief.
- Do not send messages to outside parties without explicit instructions.
- Account/booking operations must follow the approved test environment and procedure; read-only discovery is not permission to charge, refund, cancel, or alter inventory.

## Delivery quality

- Keep `readme.md` accurate about what exists and what is planned.
- Verify genuine Elementor import/editability on a fresh supported WordPress installation before calling templates importable.
- Package the Elementor kit separately from the custom plugin. Exclude secrets and paid third-party binaries.
- Test booking integrity and duplicate/recovery scenarios, as well as layout and phone usability.

## Elementor delivery

- The original reference export is `elementor-3801-2026-11-11.json`; preserve it unchanged.
- `tools/build_elementor.py` generates native homepage templates and the design-importer's payload from `elementor/` source files.
- Canonical release version: `elementor/release.json`. Keep the design-importer PHP header/runtime constant, readme stable tag/changelog, payload, and ZIP names consistent.
- `tools/package_elementor.py` rejects changes to an existing release ZIP without a version increment. Do not bypass that check.
- The design importer only installs media and saved templates. Keep it independent of Hostaway credentials and booking operations; imported editorial content must work with the importer deactivated.
- The three small HTML widgets contain styles, search preview, and mobile navigation only. Keep editorial content native. Date search must not claim live availability until the booking connector supports it.

- Property templates: run `tools/build_property_elementor.py` after `tools/build_elementor.py` before packaging. Native popup containers own editorial content; `elementor/property-runtime.js` only supplies behaviour. Preserve Elementor document CSS scope when moving popup content into dialogs, and disable that runtime in editor mode. Read `elementor/PROPERTY-IMPORT.md` for client editing instructions.
