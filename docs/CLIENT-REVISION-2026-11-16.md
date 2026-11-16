# Client revision: preserve the existing site, improve booking

The client's feedback supersedes the earlier full-site visual redesign. Preserve the existing live Homepage, Hot Springs and Local Guide layouts and copy. Limit their future changes to performance work and adding the availability search to the homepage. The live site was not edited in this revision.

Custom page design now covers search/results, individual property booking and checkout, using the original site's content and colors. The supplied DI Home Rentals image is a structural reference, not a content source. Use a title above the gallery, a clear booking panel beside the details, sleeping photographs, amenities and policy sections. Do not borrow the reference's host names, ratings, badges, distances, claims, icons or payment integration.

## Implemented local preview

- Silo Suite 2 is the full property-page example because its original Elementor export was supplied. The layout now puts the name/facts above the gallery, with a booking card on the right for desktop and before the details on phones. The longer original space list is accessible with Read more.
- Main description and space bullets come from the supplied single_property_page_elementor_template.zip / elementor-3920-2026-11-11.json, including the unfold_editor field. The source's spelling error "thougth-out" is corrected to "thought-out"; list formatting and trailing punctuation are cleaned without adding facts. Source text is preserved in prototype/client-property-content.mjs.
- Playfair Display headings and Figtree body copy come from the supplied original homepage export's typography settings. They are locally served with their OFL licenses. Headings use normal upright styling, with no decorative italic lines. Buttons retain the client's Heritage Olive.
- Removed the newly invented farm signature, numbered marketing highlights and promotional section headings from the booking-page example. No reference-site ratings, superhost badges or host biography were introduced. Other suite previews only use available room facts; their complete original copy/photos still need migration before production.
- Search/results show five individual rentals. An old all-silos property URL displays only the contact invitation and no property booking form. The contact line uses the existing site phone number.
- Gallery, full amenities, source space text, house rules/cancellation, hidden-until-sticky Overview navigation and Leaflet area map remain available. The map remains a clearly labelled town reference, not a guessed exact property location.

The original live site content was read for comparison on 16 November 2026. Direct stylesheet retrieval returned HTTP 403, so typography was verified from the supplied original export rather than claiming a complete live CSS audit. The original Silo 2 page corroborates the supplied description, bed facts, amenities, arrival rules and cancellation wording. Existing source facts still need final Hostaway reconciliation before live checkout.

## Group policy: Booking 0.3.2

The group is removed from the public PHP catalog, property records returned to browsers, widget property selector, quote/calendar property allowlist and local online-rental fixtures. Previously stored group configuration is retained privately but cannot enable an online booking. Existing redesign card widgets for the group are removed from the rendered booking UI when this plugin is active. Contact invitation only:

> Interested in reserving all four silos? Contact us for availability.

This change does not cancel, delete or modify any reservation, calendar, payment or Hostaway listing. Marketing pages containing their own original group block need the exact approved contact line substituted during the manual staging edit; the plugin does not guess which original-page layout containers to remove.

## Current client preview package

Run `python3 tools/build_booking_review.py`. Deliver `releases/silosuites-booking-review-2026-11-16.zip` to Netlify Drop. The root is the suite search, not a new marketing homepage. Homepage, Hot Springs and Local Guide navigation links point to the unchanged live site. The archive excludes their redesigned HTML files and excludes PHP, credentials and live API data. Only the labelled synthetic booking preview is included.

Local property example: http://127.0.0.1:4173/suite.html?id=silo-2
Local search/results: http://127.0.0.1:4173/stays.html

Do not resend the old full-site prototype archive or replace the original homepage with the 0.2.6 redesign. Do not regenerate an Elementor redesign kit before this booking-only layout is reviewed. Native Elementor conversion must continue to keep the client's own property content editable.

## Verification and limits

`tests/client-revision-browser.mjs` passes for five visible rentals, no group filter/card, the exact contact invitation, source copy, original font families, upright headings, heading-before-gallery layout, gallery/amenity popups, phone booking-first order, date selection/review, per-property guest limits and inquiry-only legacy group links. Phone overflow and JavaScript errors are checked. Desktop/mobile screenshots are under test-results; full-page screenshots suppress fixed UI only to avoid capture artifacts.

`tests/group-inquiry-policy.php` passes with isolated WordPress function stubs: exactly five catalog entries, no group in public properties/widget options, old mapped/verified group denied for quote/calendar, exact inquiry wording, and no network/database writes. PHP syntax checks and immutable packaging are also run for 0.3.2.

The earlier temporary WordPress QA installation was no longer complete in this session. The attempted full WordPress regression could not run against that expired fixture. Do not claim a new 0.3.2 full WordPress import or staging installation test; prior 0.3.0 integration evidence remains separate. No original live page was changed, and no new staging upload was performed.

Stripe access is still pending from the client. This design revision does not enable payment or reservation creation, and the static preview is not connected to live inventory.
