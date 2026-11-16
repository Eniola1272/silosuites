# Booking plugin 0.3.0 — live browsing and on-site checkout foundation

## Verified work

A bounded non-transactional account probe retrieved all five listings, their published booking URLs, 90 days of Silo Suite 2 calendar data and one successful version-2 provider price calculation. The published booking URLs required the documented attachObjects[]=bookingEngineUrls parameter; earlier empty arrays were not evidence of an unpublished booking website. Reports stay in .secrets/hostaway-booking-proof.json. No reservation, payment, message or inventory was created or changed.

The old price client called an undocumented /reservations/price route and the quote service added fixed cleaning fees and an estimated tax percentage. The new adapter calls POST /listings/{id}/calendar/priceDetails with version=2. It validates totalPrice and all returned components, preserves their inclusion/mandatory flags, and rejects totals that do not reconcile. Prices and currency are not supplied by the browser. There is no estimated-fee fallback.

Calendar failures, absent nights, absent availability flags, missing departure data, closed arrivals/departures, capacity, minimum and maximum stay violations fail closed. Guests must be whole numbers in range, dates use America/Denver, ranges are bounded. The cache is credential-scoped; browsing calendars are cached for one minute and quote requests recheck the calendar. A quote is not an inventory hold.

All Four Silos no longer receives a synthetic quote by summing child prices. It remains disabled until both a real listing mapping and separately verified group configuration exist.

## WordPress and Elementor

Install releases/silosuites-booking-0.3.0.zip on private staging. Server-side Hostaway constants/environment remain unchanged. Refresh the metadata in Tools → Silo Suites Booking, then verify/save the five mappings. New metadata includes capacities, currency, stay limits and safe public image URLs.

An Elementor **Silo Suites Booking** widget provides four modes:

- All stay cards: PHP reads client-editable Suite content records and safe Hostaway metadata. Edit titles, excerpts and featured images in WordPress → Suite content.
- Search: the custom calendar chooses dates; results show eligible available suites and provider-calculated full totals.
- Single suite booking: choose the property in widget controls. Opens the same live-data calendar and quote panel as homepage shortcuts.
- Checkout review: stays in WordPress and revalidates the selected dates and total. Payment and reservation submission are explicitly disabled in this release.

Equivalent shortcodes:

```
[silosuites_properties]
[silosuites_search]
[silosuites_booking property="silo-2"]
[silosuites_checkout]
```

Create a draft/private checkout page named checkout with the Checkout review widget/shortcode. Use a private review workflow while payment is incomplete. The plugin uses the actual page permalink, including query-based permalinks. It does not publish a page or alter Elementor display conditions.

Design Importer 0.2.6's existing native homepage card actions are enhanced to open the plugin's live-data dialog while Booking is active. Its custom search form displays live results after date selection. Canonical individual suite URLs can replace the old preview booking form; for other URLs or cloned property pages insert the Single suite booking widget with the explicit correct property. Prefer replacing static card grids with the All stay cards widget for centrally edited records. Do not place a static and dynamic grid together inadvertently.

Public responses contain no credentials, access instructions, guest records or reservation details. Public calendars/quotes use no-store responses and per-source browsing request limits. No third-party payment page is framed or masked. The standalone HTML/Netlify prototype intentionally remains a labelled fixture preview.

## Checkout decision and actual remaining dependency

The user explicitly chose checkout entirely inside WordPress and confirmed Stripe as the existing Hostaway-connected processor. Do not substitute a book.silosuites.com handoff. The hosted route was investigated and is not activated.

The next phase needs test-mode access to that SAME Stripe account. tools/configure_stripe_test.py accepts hidden test publishable/secret keys, rejects live keys, saves with 0600 permissions under the protected .secrets folder and performs no network request. Keys must not be pasted in chat, Elementor or documentation.

Custom payment still requires proof of tokenised Stripe fields, matching Stripe account ownership, authentication/SCA, Hostaway's supported payment-method association and financial reporting, existing direct-channel auto-payment rules, all current optional extras, a reservation/payment state machine, duplicate prevention and ambiguous-timeout recovery. Do not create a reservation before understanding whether its creation triggers an automatic charge. Do not use deprecated WordPress channel 2017; current Hostaway documentation supports direct 2000 or partner 2020 for this path. Do not use forceOverbooking. Never treat a browsing quote token as a reservation lock.

No payment endpoint, card form, reserve/confirm endpoint, webhook or live reservation adapter is enabled in 0.3.0. This release is not booking-ready or a completed payment integration. Server credentials on staging, an approved test procedure and controlled test data are required before transactional testing. Channel blocking, guest confirmations, automations and reconciliation remain unverified.

## Evidence

- tests/booking-plugin.php: synthetic HTTP, auth caching/refresh, sanitisation, metadata/mapping permissions, calendar/service and provider quotes.
- tests/booking-live-service.php: strict dates/guests, the documented price endpoint, exact provider components, group gating, missing calendar fields/departure, max stay, closed departure, malformed/mismatched totals and outages. No transactional endpoint allowed by its mock.
- tests/booking-live-browser.cjs: actual local WordPress/REST/shortcode integration with synthetic provider HTTP; dynamic cards, property-specific calendar, guest limits, full total, on-site checkout query carry, no active payment action, provider failure/retry, global search, mobile overflow and existing Elementor preview interception.
- tools/hostaway_booking_probe.py: actual account read/calculation proof, independently of the synthetic tests. No live payment or reservation proof is claimed.

Sources checked 15 November 2026: https://api.hostaway.com/documentation (calendar, version-2 priceDetails, paymentCards addPaymentMethodId, reservation channels); https://support.hostaway.com/hc/en-us/articles/50219711579419-Booking-Website-Common-Questions (no payment iframe masking). The custom payment path remains subject to account-specific verification.
