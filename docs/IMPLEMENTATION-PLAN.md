# Silo Suites implementation plan

Prepared 11 November 2026. This plan covers the local HTML design, WordPress and Elementor implementation, Hostaway connector, testing, packaging, and handover.

We will design and refine the entire guest journey in HTML first. After design sign-off, we will recreate editorial content as native Elementor elements and deliver an installable PHP plugin for the dynamic booking system. Hostaway will remain the operational system of record.

Implementation update, 11 November 2026: the first local HTML preview is built, including the homepage, sample availability search, six property variants, galleries, Hot Springs, and Local Guide. Local setup and secure API configuration are documented in [Local preview](LOCAL-PREVIEW.md). Live Hostaway integration, checkout, Elementor conversion, and the plugin are still pending.

## Project understanding

Silo Suites is a boutique stay on the historic Church Dairy Farm in La Verkin, Utah, near Zion National Park. The experience should express the property's history and contemporary comfort through real photography, editorial typography, and calm, practical booking controls.

The central improvement is date-first discovery: choose dates and guests once, see every eligible available option with its stay total, and carry those choices through the property page and checkout. Guests should not have to inspect four separate calendars to find a stay.

The six booking options are Silo 1, Silo 2, Silo 3, Silo 4, The Dairy Suite, and All Four Silos. The group option shares inventory with the four silos; it is not six independent inventories.

Reviewed sources: [written brief](<SILO SUITES DESIGN BRIEF.docx>), [ten-page brand board](<SILO SUITES VISUAL BRAND BOARD new.pdf>), and an initial read-only review of the public website. Detailed findings and integration questions are in [Hostaway discovery](HOSTAWAY-DISCOVERY.md).

User confirmations on 11 November 2026: original logos, property photographs, and an Elementor Pro licence are available; Hostaway dashboard/API access can be configured securely. Those assets and credentials have not yet been provisioned in this workspace.

## Implementation decisions

| Area | Planned approach |
| --- | --- |
| Local design | Semantic HTML, CSS, and small JavaScript modules; locally served and responsive |
| Production CMS | WordPress and Elementor Pro; lean compatible theme selected after the existing-site audit |
| Editorial pages | Native Elementor containers, headings, images, text, buttons, galleries, and reusable sections |
| Booking functionality | One custom PHP plugin, working independently of page-builder layout |
| Elementor integration | Custom widgets for search, listing grids, booking panels, and the selected checkout path |
| Booking source | Hostaway for live availability, rates, reservation records, guest records, add-ons, and operational messages |
| Checkout | Conditional on account-level proof; custom, Hostaway-native, or hybrid as described below |
| Inventory | Map actual Hostaway listing IDs; validate the All Four Silos parent/child relationship |
| Delivery | Elementor kit/templates, separate plugin ZIP, local prototype source, documentation, and verification results |
| Versioning | Every delivered plugin change receives a new version, changelog entry, and uniquely versioned package |

## Design direction

Use Georgia for headlines and editorial statements, Georgia Italic for emphasis, and Arial/system sans-serif for body copy and controls. Body and form text start at 16 px. System font stacks avoid a dependency on remote font loading.

| Token | Value | Use |
| --- | --- | --- |
| Heritage Olive | `#7E8E76` | Brand fields and restrained accents |
| Warm Cream | `#F8F5EB` | Supporting sections and soft surfaces |
| Natural Tan | `#D6C3AE` | Rules, supporting panels, subtle accents |
| Classic Black | `#000000` | Typography, controls, supplied black mark |
| White | `#FFFFFF` | Main page field and supplied reverse mark |

Use large property photography, generous space, fine rules, short captions, and considered asymmetry. Keep the supplied logo lockup intact with its required clear space. Use the client's photographs and logo artwork; any temporary review assets must be identified in the asset inventory. Do not invent amenities, reviews, offers, or ownership history.

One accessibility adjustment is needed when translating the board to controls. Calculated white text on Heritage Olive has approximately 3.49:1 contrast; black on Olive has approximately 6.02:1. Use black text for small controls on Olive, or white text on black, and reserve white on Olive for sufficiently large text. WCAG's normal-text threshold is 4.5:1. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

The homepage design will open with quiet navigation and a persistent Book action, a strong interior photograph, a short editorial headline, and a prominent date search. Below it: suite selection, a concise farm story, Stay and Soak, a local-guide preview, and a useful footer. Mobile gets a deliberate composition with readable imagery and a stacked search, rather than a squeezed desktop layout.

## Site map and design scope

Retain existing public URLs where practical. The paths below are initial routing intentions, not approved URL changes. Create a redirect map for any changes after the full crawl.

| Page or template | Initial URL | Content and interactions |
| --- | --- | --- |
| Home | `/` | Hero, search, featured live grid, story, Hot Springs, guide, contact footer |
| Our Suites | `/our-silo-suites/` | Editable introduction, all six options, All Suites/Silos/Group Stays filters |
| Availability | `/availability/` | Dates, guests, eligible available suites, full stay totals, loading/error/empty states |
| Silo 1–4 | Preserve `/silo-suite-1/` and audit the other slugs | Shared property layout with individual content and inventory |
| Dairy Suite | Preserve audited existing slug | Same property layout; launch availability confirmed with the host |
| All Four Silos | `/entire-silo-suites/` if retained | Group-specific explanation, capacities, pricing, and shared inventory rules |
| Checkout | `/checkout/` or approved Hostaway integration route | Guest details, optional extras, itemised review, payment |
| Confirmation | `/booking-confirmation/` where supported | Verified booking reference, payment state, next steps, support |
| Local Guide | `/local-guide/` | Attractions, repeatable restaurant sections, direct links and tap-to-call |
| Hot Springs | `/hot-springs/` | Confirmed offer, eligibility, purchase/redemption steps, partner links |
| Supporting pages | Confirm existing URLs | Contact/help, privacy, terms, cancellation information, and 404 |
| Global components | Shared | Desktop/mobile navigation, footer, date dialog, lightbox, booking bars |

Supporting policies require client-approved content. A contact page is optional if the contact/footer experience is sufficient. FAQs can be reusable sections. A separate About page is optional; the farm story initially lives on Home. These additions do not expand the six booking options.

## Phase 1 — Discovery and technical proof

1. Audit a staging copy of the existing WordPress installation: theme, plugins, Elementor structure, PHP/runtime support, hosting, scheduled jobs, caching/CDN, media, URLs, SEO settings, forms, and analytics. Recommend retaining the install or rebuilding cleanly based on evidence. Public-page inspection alone cannot establish its technical condition.
2. Inventory the supplied photos and original logo variants, identify each suite, and confirm usage rights, image crops, and required text. Reconcile stale public content with Hostaway and host confirmation.
3. Configure credentials through server configuration or a secure secret channel; never paste secrets into project files or chat. Retrieve and map the six Hostaway listings in a controlled environment.
4. Prove availability and authoritative pricing for representative dates, guest counts, minimum stays, fees, and taxes.
5. Inventory every current add-on and test the account's supported route for selection, quantity, taxation, charging, and persistence on the reservation.
6. Verify the connected processor, payment timing, any deposits, authentication challenges, supported wallets, refunds, and automated messages. Confirm that no raw card data needs to pass through WordPress.
7. Prove the All Four Silos relationship, including a single-silo booking blocking the group and a group booking blocking all four. Verify cancellation restores the appropriate inventory.
8. Record the checkout decision, limitations, costs, and evidence. Homlay approves the concrete checkout path in writing, as the brief requires.

HTML design can progress while access is being provisioned. Live checkout engineering and final checkout sign-off depend on this proof.

### Checkout decision

| Path | Choose when | Required proof |
| --- | --- | --- |
| A — Custom | The account supports all required operations through supported APIs and tokenised/hosted payment fields | Every add-on, financial total, charge, reservation, guest record, and message automation works end to end |
| B — Hostaway-native final step | Hostaway's supported booking experience meets the add-on and payment requirements | Parameter handoff, branding, mobile usability, completion tracking, and return behaviour work in practice |
| C — Hybrid | A supported handoff can preserve choices without splitting the booking into conflicting records | No re-entry, duplicated charges, missing add-ons, or inconsistent totals |

Reject any approach that drops an existing add-on or changes the client's payment-processing arrangement. Do not add WooCommerce or another reservation system by default.

The brief asks for booking without leaving the site, but a Hostaway-hosted final step may need a different domain or may restrict embedding. Verify supported custom domains/embedding and actual mobile behaviour. Any unavoidable departure from that requirement must be recorded and approved; it cannot be promised away through styling.

## Phase 2 — Complete local HTML prototype

### Build sequence

1. Establish tokens, typography, spacing, buttons, fields, navigation, and suite-card components. Design the homepage at phone and desktop widths first.
2. Build Our Suites, date selection, availability results, and one full property detail page. Connect the dates/guests through the complete journey.
3. Populate the remaining property variants, including Dairy and the group stay, with clearly identified sample content wherever source details are unconfirmed.
4. Build Local Guide, Hot Springs, global layouts, supporting content, and error pages.
5. Prototype checkout, optional extras, itemised review, payment states, and confirmation against the selected route. Before account proof, label any custom checkout as a provisional concept.
6. Review the whole site locally, iterate on copy and interactions, and record desktop/mobile design sign-off.

Use small shared assets and components; avoid a separate application framework unless a concrete requirement justifies it. Organise `prototype/` for the site, `shared/` for approved design tokens and reusable booking assets, and `docs/` for specifications. A local server will provide a single repeatable preview command once the prototype exists.

### Prototype behaviour

- Working mobile menu, keyboard navigation, full-screen mobile date picker, guest selector, gallery/lightbox, filters, and booking-panel interactions.
- Shareable query parameters for non-sensitive choices, for example `check_in=2027-03-12&check_out=2027-03-15&guests=2`; the example is illustrative, not a proposed booking.
- Back/forward navigation and refresh preserve dates; invalid, past, excessive, and incomplete inputs are handled clearly.
- Fixture data covers success, no availability, insufficient capacity, minimum stay, changed price, expired session, provider outage, and payment failure. Prototype payment is a simulation and does not collect card details or send reservations.
- Checkout requires no account: collect guest name, email, phone, and guest count; make arrival time and special requests optional. Show cancellation terms and the privacy notice, capture required terms acceptance, and keep any marketing consent a separate unchecked opt-in. Use autofill and appropriate email/phone keyboards.
- Show a clear checkout progress indicator and persistent total in one column on mobile, with an explicit add-or-skip choice for extras. Property pages use a sticky desktop booking panel and a mobile bottom price/Reserve bar that does not obscure content or focus.
- Group results appear only when all four child silos and the group listing/rules are eligible. Nearby-date suggestions are checked against fixtures rather than fabricated.
- Every dynamic area has loading, empty, unavailable, and error designs. Resuming after payment must not invite an accidental second charge.

Prototype acceptance: every page is navigable; dates persist; there is no horizontal overflow; the desktop and phone experience is approved; demo data and provisional content are identifiable during review.

## Phase 3 — WordPress and Elementor conversion

Elementor stores structured page data as JSON and supports custom widgets. The deliverable will translate the approved HTML into that structure rather than placing the whole site inside an HTML widget. [Elementor data structure](https://developers.elementor.com/docs/data-structure/), [custom widgets](https://developers.elementor.com/docs/widgets/).

| Content | Client control |
| --- | --- |
| Editorial headings, text, photos, buttons, layouts | Native Elementor editing, positioning, duplication, and removal |
| Header/footer/navigation | Elementor Theme Builder with WordPress-managed menus |
| Local Guide places and offers | Repeatable native sections/templates |
| Property editorial extras | Editable gallery/intro/amenity commentary/rules notes around the shared layout |
| Hostaway property facts and source gallery | Synced data with optional explicit editorial overrides; editing an override never silently changes operational Hostaway data |
| Listing grids | Widget controls for columns, ordering, inclusion, labels, and card presentation |
| Search/calendar/booking/checkout | Moveable widgets with selected presentation controls; functional rules and live values remain plugin-owned |
| Prices, availability, add-on catalogue, payments | Managed through Hostaway and the verified payment flow |

Keep an explicit source map for gallery, descriptions, amenities, and policies. Default operational facts to Hostaway; allow separate editorial content in Elementor without creating contradictory capacities or offers. A synced gallery remains available even if an editor adds a separate editorial gallery.

Deliver reusable section templates, global colour/type settings, header/footer, page templates, and the shared property layout. Six content records/pages use that layout. Document where an intentional per-property variation is configured.

Import verification must happen on a fresh WordPress installation using the supported Elementor/Pro versions. Test media remapping, widget dependencies, menus, page assignment, property mapping, permalinks, theme display conditions, mobile settings, and editor usability. A generated JSON file is not accepted as importable until this test passes.

The Elementor kit and PHP plugin are separate packages. The kit carries the supported site/template configuration; the plugin carries application code. Production credentials, guest data, and paid plugin binaries are excluded from export. [Elementor import/export](https://elementor.com/help/what-is-import-export/?lid=qr1umybrr5v4).

## Phase 4 — Custom PHP plugin

Working name: **Silo Suites Booking**, slug `silosuites-booking`, namespace/prefix unique to the project. Initial installable version: `0.1.0`. No plugin implementation is included in this planning milestone.

### Planned modules

| Module | Responsibility |
| --- | --- |
| Bootstrap and compatibility | Dependency checks, supported runtime declarations, activation, upgrades, safe deactivation |
| Settings and diagnostics | Listing mapping, environment, checkout mode, sync health, last successful jobs, actionable admin notices |
| Hostaway client | Server-side HTTP, token handling, timeouts, validation, pagination, bounded retries, redacted logs |
| Listing synchronisation | Approved listing cache, media references, source/override mapping, scheduled refresh |
| Availability and quote service | Date/capacity validation, restrictions, group eligibility, authoritative totals, short-lived quote references |
| REST controllers | Narrow public browsing endpoints; session-bound quote/checkout endpoints; protected administrative operations |
| Checkout adapter | Selected supported API or native/hybrid handoff, extras, payment lifecycle, return handling |
| Webhooks and jobs | Fast acknowledgement, event deduplication, background refresh, reconciliation and alerts |
| Elementor bridge | Widgets, controls, dynamic tags where useful, meaningful editor previews |
| Frontend assets | Accessible calendar, results, booking panel, state management, progressive enhancements |
| Lifecycle and packaging | Version/schema migrations, uninstall policy, release manifest, versioned ZIP |

Use WordPress HTTP and platform APIs where suitable. Separate the provider adapter from guest-facing components so changing a supported endpoint or checkout path does not require rebuilding every page. Keep function logic out of Elementor JSON and miscellaneous theme snippets.

### Data ownership and storage

Hostaway owns operational listings, inventory, pricing, reservations, guests, add-ons, and messages. WordPress owns editorial pages and layout. WordPress may hold disposable listing/calendar caches, expiring quote metadata, and the minimum operational identifiers needed to reconcile a booking attempt.

Do not build a parallel reservation, guest, or chat database. An operational job/attempt record is not the reservation record: retain opaque attempt/provider references, state, timestamps, and deduplication keys without unnecessary guest details. Define retention and deletion explicitly. If a required recovery workflow needs temporary personal data, document and approve that requirement before implementing it.

### Booking integrity

1. Validate dates and guest counts server-side. Treat stay dates as property-local date-only values in `America/Denver`; do not shift them through a visitor's timezone. Use UTC for operational event timestamps. Obtain the account's currency, tax, and rounding rules.
2. Read cached data for browsing and obtain a fresh authoritative availability/price check before reservation/payment commitment. Bind each quote to listing, dates, guest breakdown, extras, currency, expiry, and a private session. The browser cannot supply the payable total.
3. Use a supported inventory hold/reservation-and-payment lifecycle proven during discovery. A fresh availability check alone is not a reservation lock. Do not assume a pending/hold status is available or use forced overbooking.
4. Resolve the payment/reservation order against actual provider guarantees. Use provider-hosted or tokenised payment inputs; raw card numbers/CVC must never reach WordPress, application logs, or analytics.
5. Use local attempt deduplication and provider idempotency where supported. Disable repeated submission as a UX measure, but enforce duplicate protection on the server. Following an ambiguous timeout, reconcile against provider records before repeating a mutation; never blindly retry a charge or reservation creation.
6. Support authentication challenges, declines, abandonment, retry, expired quotes, changed prices, and dates taken during checkout. Get explicit guest acceptance of material price changes.
7. Verify completed reservation and payment state from a trusted provider response/event before presenting success. A successful browser return URL alone is insufficient.
8. For a mismatched payment/reservation outcome, reconcile and alert the responsible team, retry only safe operations, and use the verified void/refund or recovery procedure. Show a truthful processing state and support reference. Define alert ownership and response expectations; do not promise that a distributed outage cannot occur.

### Synchronisation and security

Proposed cache policy, to be tuned after measurement: listing content roughly hourly; browsing calendars roughly 1–5 minutes; live quote freshness enforced at checkout. Use webhook-driven invalidation where supported plus scheduled reconciliation for missed events. Keep rate/fee changes and the group listing in the invalidation scope.

Respect current provider limits and retry instructions, use backoff with jitter, and prevent refresh stampedes. Production jobs need a reliable scheduler rather than depending on a page visit. Durable retries and dead-letter/admin visibility must survive a PHP request ending.

Authenticate webhook delivery using the mechanism actually supported by Hostaway. Validate schemas, restrict payloads, deduplicate, and re-fetch authoritative state before sensitive transitions. Do not invent an HMAC/signature contract. Process duplicate, delayed, and out-of-order events safely.

Use HTTPS; least-privilege credentials; validation and output escaping; WordPress capability checks for admin actions; session ownership and CSRF protection for checkout actions; and rate limiting on public APIs. A public WordPress nonce alone is not anonymous-session authentication. Treat external IDs as opaque strings, not numbers for arithmetic.

Cache only safe public data. Exclude quotes, checkout, confirmation, private endpoints, and webhooks from full-page/CDN caches. Never expose full guest/reservation payloads through a public endpoint or guessable confirmation reference. Strip secrets, personal details, payment payloads, and private URLs from logs.

Hostaway continues to send operational confirmations and pre-arrival messages. The site shows verified status and does not duplicate those automations. Test inbox creation and the guest-host reply round trip.

## Release and version policy

Every delivered change to plugin PHP, JavaScript, CSS, dependencies, behaviour, or packaged resources must bump the plugin version. No changed plugin ZIP may reuse a previous version. Draft edits within one unreleased change can share its planned next version; once a build is supplied for testing or installation, it is immutable.

- Patch, for fixes and small adjustments: `0.1.0` → `0.1.1`.
- Minor, for backward-compatible features: `0.1.1` → `0.2.0`.
- Major, for breaking changes after stable release. Use `1.0.0` for the first production release after acceptance.
- Maintain one canonical release version and verify the plugin header, runtime constant/metadata, readme stable tag, changelog, asset cache versions, and ZIP name agree.
- Track database schema version separately and run explicit, idempotent migrations when needed; a release bump does not itself require a schema change.
- Package as `silosuites-booking-X.Y.Z.zip` with one `silosuites-booking/` root folder. Record supported dependencies and a package checksum. Preserve rollback artifacts and migration compatibility notes.
- Add an automated release check once plugin code exists: reject a package when plugin contents changed without a version increment or version fields disagree.

This rule is also recorded in the repository's [AGENTS.md](../AGENTS.md) for future implementation work.

## Phase 5 — Verification and acceptance

| Area | Required evidence |
| --- | --- |
| Design | Approved phone/desktop pages, component guide, complete state coverage |
| Date-first journey | Dates/guests survive Home → results → property → checkout, refresh, and back navigation |
| Inventory | Minimum stays, arrival restrictions, capacity, sold-out dates, concurrent attempts, group/child blocking and release |
| Reservations | Each of six options tested with and without an applicable add-on; full fields, source, totals, extras, and payment recorded in Hostaway |
| Add-ons | Every configured eligible add-on, pricing basis, quantity, taxes, catalogue changes, optional skip behaviour |
| Payments | Success, decline, challenge, interruption, duplicate submission, ambiguous timeout, changed inventory, refund/void/recovery |
| Messaging | Confirmation and scheduled automations plus host-to-guest-to-host round trip in the same Hostaway thread |
| Reliability | Provider outage, rate limit, missed/duplicate/reordered webhook, expired token, worker failure, redacted logs, alert delivery |
| Elementor | Client edits/moves editorial elements and allowed widgets; fresh-install kit/plugin import is proven |
| Accessibility | Keyboard and screen-reader spot checks, focus restoration, date picker semantics, 44 px targets, contrast, zoom and reduced motion |
| Browsers and devices | Current supported Safari/iPhone, Chrome/Android, desktop Chrome/Safari/Firefox/Edge; actual phones for booking/payment |
| Performance | Mobile Lighthouse target ≥90 on Home/property pages, LCP ≤2.5 s, CLS ≤0.1, INP ≤200 ms target; test all page types |
| SEO and delivery | URLs/redirects, metadata, canonical policy, sitemap, forms, partner links, analytics consent and staging index protection |

Use lab performance reports on staging and distinguish them from field data. Field Core Web Vitals need real traffic; a Lighthouse score does not prove production INP or guarantee all guests meet the targets. Record test conditions and third-party limitations. Optimise the hero, image variants, layout dimensions, Elementor DOM, and route-specific scripts early.

Build meaningful service/integration tests for date validation, quote integrity, group eligibility, duplicate protection, and payment/reservation reconciliation. Test the principal browser journey against fixtures, then validate provider behaviour in the approved test environment. Real charges or cancellation tests require an explicitly authorised test procedure; public discovery does not authorise transactions.

Analytics events: search, property view, begin checkout, add-on selection, confirmed purchase, and actionable booking errors. Apply consent rules and exclude personal information. Deduplicate purchase events and verify cross-domain measurement if the chosen checkout requires it.

## Phase 6 — Launch and handover

Launch requires Homlay's written approval under the brief. Before that point, complete the staging build, import verification, acceptance results, redirects, full backup, and concrete rollback procedure. Keep staging private/noindex and prevent unintended live integrations while testing.

Deliver the versioned plugin ZIP, Elementor kit and individual templates where useful, source code, asset inventory, installation instructions, technical runbook, editing guide or video, and recorded test/performance results. State which costs and licence renewals belong to the client. Never bundle credentials.

Configure production scheduler, webhook endpoints, cache exclusions, monitored alerts, backups, secure access, and operational ownership. Smoke-test deployment and verify the first authorised live booking in Hostaway. Rollback must preserve reservations already created in Hostaway; restoring WordPress alone cannot undo external bookings or payments.

## Work order and dependencies

| Milestone | Completion condition | Main dependency |
| --- | --- | --- |
| Plan | Written implementation plan and recorded unknowns | Complete in this milestone |
| First HTML review | Home, global navigation/footer, search, phone and desktop layouts | Identify supplied assets in workspace |
| Booking discovery proof | Written supported checkout path and group-inventory evidence | Secure account/staging access |
| Full HTML review | All pages and guest-flow states available locally | Content validation; chosen checkout before final sign-off |
| Elementor/plugin build | Editable staging site connected to approved services | Design sign-off and integration proof |
| Acceptance | Import, functional, device, performance, and operations evidence | Approved test environment and procedure |
| Launch | Approved deployment, rollback, first-booking verification | Written launch approval |

Discovery and HTML design can overlap. Allow separate revision cycles for design and integration. Set calendar dates and a firm engineering estimate after the checkout proof; custom checkout can change the effort materially.

The commercial estimate must separate one-off design/prototype, Elementor conversion, plugin/integration, content migration, testing, and handover. List recurring hosting/CDN, Elementor licence renewal, Hostaway plan/API/booking-engine charges if any, processor fees, email/monitoring, and maintenance. Confirm vendor/account pricing rather than inventing monthly totals. Quote the viable checkout paths separately.

## Next implementation milestone

Review and refine the first HTML preview, reconcile property photographs and facts against Hostaway, and complete the account-level integration proof. The first preview now includes mobile and desktop compositions, navigation, date/guest selection, sample suite results and property layouts, galleries, the farm story, Hot Springs, Local Guide, and footer. Finalise the supported checkout design before Elementor conversion.
