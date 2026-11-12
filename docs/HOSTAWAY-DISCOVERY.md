# Silo Suites discovery record

Reviewed 11 November 2026. This is a planning and read-only discovery record, not a completed WordPress audit or an account-level integration test. Do not use public-site prices, offers, or amenities as the final production source.

## Available materials and access

- `SILO SUITES DESIGN BRIEF.docx`, prepared by Homlay, dated 7 November 2026.
- `SILO SUITES VISUAL BRAND BOARD new.pdf`, ten pages, dated 6 November 2026.
- Ten brand-board page images supplied in the conversation.
- Original logo files, property photos, and Elementor Pro licence: user confirms available; workspace asset locations still to identify.
- Hostaway dashboard/API access: user confirms it can be configured securely; account access has not yet been exercised.
- Workspace initially contains only the two supplied documents and an empty `readme.md`; no existing site source, WordPress installation, or plugin was found.

The written brief's contents lists section 13, Open items before build starts, but the supplied document body ends at the phase table in section 12. Its references to acceptance items below do not include a subsequent checklist in this copy. The implementation plan therefore records explicit discovery questions and derives acceptance tests from the substantive requirements; it does not claim a missing section was reviewed.

## Initial public-site findings

| Finding | Consequence | Source |
| --- | --- | --- |
| Current navigation covers suites, Hot Springs, and Local Guide | Preserve recognisable navigation and audit existing routes before restructuring | [Home](https://silosuites.com/) |
| Suite selection is organised around individual property links | Make dates and guests the common entry point across the new journey | [Our Suites](https://silosuites.com/our-silo-suites/) |
| Dairy is still marked Coming soon | Confirm whether to launch as bookable, future availability, or informational | [Our Suites](https://silosuites.com/our-silo-suites/) |
| Group summary lists six bathrooms, while four displayed silo cards list one each | Validate group facts and capacity rather than carrying this content forward | [Our Suites](https://silosuites.com/our-silo-suites/) |
| Property content includes detailed amenities and cancellation language | Reconcile with Hostaway/host; remove unsupported or stale details | [Silo 1](https://silosuites.com/silo-suite-1/) |
| Hot Springs presents both a discounted Premium Pass offer and a separate 10% discount | Obtain a single, accurate explanation of eligibility and purchase/redemption | [Hot Springs](https://silosuites.com/hot-springs/) |
| Local Guide contains an empty Our Top Picks heading and restaurant phone labels linking to websites | Complete/remove the heading and provide real telephone links | [Local Guide](https://silosuites.com/local-guide/) |

This content review does not establish current performance, installed plugins, booking iframe behaviour, payment operation, SEO traffic, or account configuration. Inspect those on staging and actual devices. A failed retrieval of a public page is not proof that the live page is broken.

## Verified documentation and remaining proof

The public Hostaway reference documents listing/calendar access, price calculation, reservation operations, payment-related operations, and unified webhooks. It also documents duplicate webhook notifications. These capabilities are useful building blocks; their presence does not prove this account supports every required add-on and payment workflow. Treat the documentation as the starting point for a controlled integration spike, not evidence that custom checkout has already passed. [Hostaway public API](https://api.hostaway.com/documentation).

Hostaway documents custom-fee upsells through its direct-reservation tools, Booking Engine, Guest Portal, and online check-in. Guest Portal extras may be charged separately. We must therefore prove the timing and financial treatment of add-ons in the selected checkout, not assume every Hostaway upsell surface meets the brief's combined booking requirement. [Custom fees and upsells](https://support.hostaway.com/hc/en-us/articles/19918681033755-Listings-Manage-Custom-Fees-and-Upsells).

Hostaway documents cross-listing relationships in which child reservations block a parent and parent reservations block the children. This suggests a suitable model for All Four Silos, subject to validating the client's actual configuration and API/native-booking behaviour. [Cross-listing setup](https://support.hostaway.com/hc/en-us/articles/360041235433-Set-up-your-Cross-Listings).

Elementor documents JSON page structures, custom widgets, and kit import/export. We will use these supported surfaces and verify actual imports on the selected versions. The HTML prototype is a design source, not an automatically editable Elementor export. [Data structure](https://developers.elementor.com/docs/data-structure/), [widgets](https://developers.elementor.com/docs/widgets/), [kit import/export](https://elementor.com/help/what-is-import-export/?lid=qr1umybrr5v4).

## Questions to resolve through secure access and client confirmation

| Priority | Question | Required outcome |
| --- | --- | --- |
| P0 | What are the six actual listing IDs, publication states, capacities, and group relationships? | Approved mapping and group inventory tests |
| P0 | Can the account's supported API enumerate every eligible upsell and apply it with correct quantities/taxes? | Written capability evidence plus a controlled example |
| P0 | Can the current processor complete the supported custom checkout with hosted/tokenised fields? | Proof of card-data isolation, authentication, charge linkage, and recovery |
| P0 | What supported hold/reservation lifecycle prevents a cross-channel race before charging? | Proven sequence and documented timeouts/failure behaviour |
| P0 | Can a Hostaway-native fallback stay on an approved domain or embed reliably? | Real mobile demonstration and documented limitation if not |
| P0 | What test mode/account and charge/cancellation procedure are approved? | Safe integration test plan before any mutation or charge |
| P1 | What are the current upsell catalogue, eligibility rules, per-person/night/stay basis, quantities, and refunds? | Complete extras test matrix |
| P1 | What are the cancellation, deposit, damage, tax, minimum-stay, arrival, and guest-category rules? | Authoritative quote and policy mapping |
| P1 | Are wallet payments supported and enabled for this account/domain? | Verified availability; no unconditional wallet promise |
| P1 | Do API/direct bookings create the expected Inbox thread and trigger existing automations? | Host/guest message round trip and automation evidence |
| P1 | Which webhook events and authentication mechanisms are available? | Secured, tested event receiver and reconciliation design |
| P1 | Can ambiguous reservation/payment outcomes be reconciled through a supported reference/idempotency mechanism? | Retry and recovery procedure without duplicates |
| P1 | Is Dairy now open to direct bookings? | Correct live publication/availability state |
| P1 | Which Hot Springs discount applies, where is payment taken, and how are passes redeemed? | Client-approved offer copy and working purchase links |
| P1 | Which public capacities, bath/bed counts, amenities, policies, and rates are stale? | Clean content inventory from authoritative sources |
| P1 | Where are original assets, and which image belongs to each suite? | Approved local asset inventory and crops |
| P1 | What WordPress hosting/staging, version, licence, scheduler, and backup facilities exist? | Written retain/rebuild recommendation |
| P2 | Who owns alerts, refunds, failures, maintenance, content approval, and licences? | Named operational responsibilities and costs |
| P2 | Which analytics property, consent configuration, email delivery, and existing redirects must be retained? | Migration and measurement plan |

API credentials belong in server configuration or an approved secret store. They must not be put in Markdown, Elementor JSON, fixture files, source control, screenshots, logs, or browser code.

Update 11 November 2026: the user has created an API key. The original logo files were located in Downloads and copied unchanged to `prototype/assets/`. Local hidden-prompt configuration and a read-only listing-metadata discovery helper are now available; see [local setup](LOCAL-PREVIEW.md). No live account connection or booking/payment test has been performed yet. The public homepage now presents a Dairy booking link while the older Suites page snapshot says Coming soon, reinforcing the need to reconcile against Hostaway rather than treat either snapshot as definitive.

## Integration spike acceptance

The spike must produce a concrete recommendation, with evidence for each item:

1. Read all six intended listings, verify field mapping, and identify unpublished/coming-soon records.
2. Search representative date ranges and validate capacities, restrictions, total price, fees, and taxes.
3. Validate the parent/child blocking and cancellation behaviour for the group option, including bookings originating outside the website.
4. Enumerate all eligible extras and prove their total and reservation representation. Changing an extra in Hostaway must be reflected through a supported refresh path.
5. Complete an authorised test booking and verify reservation, guest details, extras, payment status, source, and policy fields in Hostaway.
6. Verify guest/host messages and existing automations.
7. Exercise a decline, interrupted flow, expired quote, taken dates, duplicate submission, and an ambiguous timeout/reconciliation scenario.
8. Demonstrate the selected final payment step on an actual phone, including any supported wallet or authentication challenge.
9. Record checkout choice A/B/C, account dependencies, unsupported requirements, cost differences, and Homlay's written decision.

Do not send a support request, create bookings, charge/refund, alter inventory, or modify the live website as part of this read-only planning task. Prepare the exact questions/test procedure first and perform external operations only within the user's explicit instructions and the approved test setup.

Development update: Silo Suites Booking 0.1.0 now implements server-side read-only authentication/listing metadata diagnostics and manual listing mapping. Integration tests used synthetic HTTP responses in isolated WordPress; they did not contact the live account. The secure local credential file was still absent at the latest review. Checkout, add-on, processor, group blocking, channel sync and messaging capabilities remain unverified. See BOOKING-INTEGRATION.md and PROJECT-STATUS.md.


## Live account connection confirmed — 12 November 2026 (Africa/Lagos)

Authenticated successfully using privately configured credentials and read listing metadata. Five listings were returned: Silo Suite 1 (143824), Silo Suite 2 (143823), Silo Suite 3 (143826), Silo Suite 4 (143825), and Dairy Suite (603415). The returned Silo Suite 2 counts are 5 guests, 2 bedrooms, 3 beds and 1 bathroom, matching the supplied property export. A safe public-field mapping is recorded in `shared/hostaway-listing-map.json`; credentials and the discovery report remain private.

No separate All Four Silos/group listing was returned by this API credential. This does not establish that a group listing is absent from every account or access scope. Group checkout remains blocked pending verified listing identity, publication and parent/child relationships. Dairy is present in the API; that does not establish that it is published or accepting direct bookings. Fee settings present on a listing do not prove that optional extras are complete or purchasable in the selected checkout.

No reservations, guest records, messages, payments, inventory or webhooks were read or changed by this check. Only authentication and listing metadata were exercised. Live availability, rates, checkout, extras, payment processing, group inventory and channel sync remain unverified. The local discovery connection does not automatically configure credentials on WordPress staging or a live server.


## User environment confirmation — 12 November 2026

User confirmed https://darkseagreen-butterfly-103736.hostingersite.com/ as staging and silosuites.com as the final migration target. Their current Hostaway listing screenshot shows five listings total on a single page: Silos 1–4 and Dairy, all with Live badges. No separate All Four Silos listing is shown. Direct booking availability, account cross-listing relationships and transaction behaviour remain separate checks. Remote WordPress admin/server access is still needed; no staging changes were performed.
