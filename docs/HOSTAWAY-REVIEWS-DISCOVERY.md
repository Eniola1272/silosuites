# Hostaway review discovery — 18 November 2026

Read-only account check using `python3 tools/hostaway_reviews_probe.py` succeeded at 13:13 UTC. The probe authenticates using private server-side configuration, then requests `GET /v1/reviews` with bracketed `listingMapIds[]`, `type=guest-to-host`, `statuses[]=published`, limit 100 and descending submitted date. It verifies each returned row matches the requested property/type/status. No review text, names, reservation IDs or private feedback are printed or saved. Only aggregate counts are saved privately.

| Property | Provider-reported published count | Sample inspected | Sample with public text |
| --- | ---: | ---: | ---: |
| Silo Suite 1 | 126 | 100 | 100 |
| Silo Suite 2 | 128 | 100 | 96 |
| Silo Suite 3 | 128 | 100 | 86 |
| Silo Suite 4 | 181 | 100 | 99 |
| The Dairy Suite | 0 | 0 | 0 |

Total provider-reported count: 563. These are published incoming reviews across channels, not an Airbnb-only count or a verified count eligible for public website display. Samples include channel IDs 2018, 2002 and 2005; not all 563 records were paginated or inspected. Ratings/text are available in the samples. No average rating was calculated.

The API supports retrieval, but website display eligibility remains a separate implementation decision. Hostaway states that its Booking Engine requires published, publicly visible reviews with ratings and comments; it hides Airbnb review text due to Airbnb terms, while including Airbnb in average rating calculations. Do not treat API access or a non-empty publicReview field as blanket permission to republish every channel's review. Respect visibility and source restrictions; never expose privateFeedback or guest reservation data.

The first production review integration is implemented in Booking 0.3.4 (not deployed to staging yet). The initial design requirements follow; the implementation details and evidence are below. It should fetch server-side, cache per property, allow only approved display fields and eligible sources, escape output, retain source attribution, avoid repeated calls during page rendering and preserve client editorial control. This discovery changed no plugin, staging page, reservation, inventory or review publication setting.

Sources:
- [Hostaway API reference — Get reviews list](https://hostaway.github.io/api/#get-reviews-list)
- [Hostaway — Displaying reviews in the Booking Engine](https://support.hostaway.com/hc/en-us/articles/13949494929051-Guest-Reviews-Displaying-reviews-in-the-Booking-Engine)

## Implemented in Booking 0.3.4

- Server-side GET /v1/reviews, exact property/type/status validation, up to ten 100-record pages, duplicate and partial-read rejection, 15-minute credential/property-scoped cache, one-minute error cache and a short in-progress guard. Public WordPress GET /wp-json/silosuites/v1/reviews?property=silo-2 uses the existing anonymous request budget.
- Only known supported channels: Vrbo (2002), Booking.com (2005) and direct channels (2000/2013/2017). Airbnb (2018) and unknown channels are excluded. Reviews must explicitly have bookingEngineVisibility=1, isHidden=0, isCancelled=0, published incoming status, nonempty public text and rating 0–10. Missing visibility fails closed.
- Allowlisted output: text, rating, scale, source and submitted month. Guest/reviewer names, reservation references, private feedback and raw provider responses are not stored in the public cache or returned. Comments retain original wording/language; HTML tags are removed and browser output is escaped.
- Counts/averages describe only the displayed eligible text reviews, using Hostaway's ten-point scale. They do not claim to reproduce an Airbnb score or total.
- Four excerpts, individual/full-review dialogs, source labels, month/year, retry and no-review states. Native dialogs support Escape, focus return and keyboard navigation; white responsive surfaces match the current preview.
- `[silosuites_reviews property="silo-2"]` or the Silo Suites Booking widget's Guest reviews mode, with a per-property selector. Client moderation uses Hostaway's visibility controls (cache delay up to 15 minutes). No bundled reviews or paid third-party binaries.

Eligible counts after full pagination on 18 November: Silo 1 **52**, Silo 2 **62**, Silo 3 **34**, Silo 4 **11**, Dairy **0**. These differ from the 563 incoming published records above because of source, text and visibility filtering. The earlier published-count probe sampled 100 per property; the new display cache paginates all published records for the chosen property.

`tools/cache_hostaway_reviews.py` saves only these anonymized public display fields to the private local cache. `tools/serve.py` allows only the five individual slugs at the dedicated local endpoint. The static preview ZIP contains no API secrets, raw review records or review cache; its reviews require a connected backend and otherwise display the unavailable/retry state. No public guest records were copied to source or fixtures.

## Validation for this release

- `tests/review-service.php`: synthetic WordPress/HTTP harness covers eligibility, private-field exclusion, cross-property rejection, source scale, count/average, full pagination, duplicates, empty state and caching without real network or database writes.
- `tools/verify_hostaway_reviews.php`: the actual PHP adapter made read-only Hostaway calls through a minimal HTTP harness and returned the same 52/62/34/11/0 eligible counts. This is an adapter proof, not a full WordPress installation test.
- `tests/property-reviews-browser.mjs`: all five local pages, no group inquiry or Open map action, review dialogs and focus return, white mobile dialog/overflow, Dairy empty state, retry, escaped untrusted text and blocked private file URLs. Real review content is not copied into test fixtures.
- Existing client-revision browser and public group-policy checks, PHP/JS syntax and immutable plugin packaging are also run. No reservation, payment, review publishing or live/staging page is changed.

## Title ratings — Booking 0.3.6

A Property rating widget/shortcode can be placed beside the page title, above the native gallery. It reuses the same eligible per-property review response and ten-point scale; the local HTML title link updates from its review section. The renderer checks a finite average, matches the property, hides failed/unverified ratings and shows No reviews yet for zero reviews. A shared pending/result cache deduplicates rating + review requests on the same page. Counts and averages remain limited to eligible displayed sources; no Airbnb or reference-site rating is substituted.
