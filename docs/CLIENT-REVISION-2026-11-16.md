Update, 18 November: the four-silo contact invitation described below is superseded. Remove it from booking/search/property UI; group booking remains disabled. White backgrounds and per-property guest reviews are the current direction.

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

Run `python3 tools/build_booking_review.py`. Deliver `releases/silosuites-booking-review-2026-11-18-galleries.zip` to Netlify Drop. The root is the suite search, not a new marketing homepage. Homepage, Hot Springs and Local Guide navigation links point to the unchanged live site. The archive excludes their redesigned HTML files and excludes PHP, credentials and live API data. Only the labelled synthetic booking preview is included.

Local property example: http://127.0.0.1:4173/suite.html?id=silo-2
Local search/results: http://127.0.0.1:4173/stays.html

Do not resend the old full-site prototype archive or replace the original homepage with the 0.2.6 redesign. Do not regenerate an Elementor redesign kit before this booking-only layout is reviewed. Native Elementor conversion must continue to keep the client's own property content editable.

## Verification and limits

`tests/client-revision-browser.mjs` passes for five visible rentals, no group filter/card, the exact contact invitation, source copy, original font families, upright headings, heading-before-gallery layout, gallery/amenity popups, phone booking-first order, date selection/review, per-property guest limits and inquiry-only legacy group links. Phone overflow and JavaScript errors are checked. Desktop/mobile screenshots are under test-results; full-page screenshots suppress fixed UI only to avoid capture artifacts.

`tests/group-inquiry-policy.php` passes with isolated WordPress function stubs: exactly five catalog entries, no group in public properties/widget options, old mapped/verified group denied for quote/calendar, exact inquiry wording, and no network/database writes. PHP syntax checks and immutable packaging are also run for 0.3.2.

The earlier temporary WordPress QA installation was no longer complete in this session. The attempted full WordPress regression could not run against that expired fixture. Do not claim a new 0.3.2 full WordPress import or staging installation test; prior 0.3.0 integration evidence remains separate. No original live page was changed, and no new staging upload was performed.

Stripe access is still pending from the client. This design revision does not enable payment or reservation creation, and the static preview is not connected to live inventory.

## White background preference — 18 November 2026

The current booking HTML uses white page, booking-panel, checkout-summary and popup backgrounds, including the sticky submenu. Olive buttons and calendar selection indicators remain visible. Booking plugin 0.3.3 applies white backgrounds to its widgets and availability popup summary. These are local changes and separately packaged releases; original marketing pages and staging have not been changed.

Verification for the white update: the existing client-revision browser checks pass on desktop and phone with no JavaScript errors. Computed styles confirm white page backgrounds, booking panel, sticky menu, gallery/amenities/date popup surfaces, and isolated plugin widget surfaces. The inquiry-only policy check, PHP syntax check, release validation and archive build pass. This is not a new full WordPress integration test or a staging deployment.

## Property review sections — 18 November 2026

Booking 0.3.4 adds `[silosuites_reviews property="silo-2"]` and a Guest reviews widget mode, plus automatic insertion into the existing `.sp-property` design wrapper on recognized individual property URLs. Original unmodified pages require placing the shortcode/widget; no remote page was edited. The current HTML examples have a Reviews submenu item, four review excerpts and accessible dialogs for individual/all reviews. The Open map action is removed while Leaflet attribution stays. The former four-silo contact message is removed from search, property pages and legacy group URL output.

The local server serves only anonymized, eligible public review fields from a private cache at `/api/property-reviews?property=silo-2`. It does not expose the cache file or credentials. Refresh with `python3 tools/cache_hostaway_reviews.py`; reviews in the standalone static ZIP are not live and are not bundled. The displayed count/average cover only visible, published text reviews from supported non-Airbnb sources. See HOSTAWAY-REVIEWS-DISCOVERY.md for counts, provenance and verification.

## Host section, other properties and chevrons — 18 November 2026

The five individual HTML examples now include Meet your hosts after the property details and Explore other properties below it. The host photo is the original `our_story.jpeg` from the supplied homepage export, shown as a landscape image to retain the whole family. Both story paragraphs are extracted verbatim from that export into `prototype/client-host-content.mjs`. No host names, biography, response stats or badges are inferred from the DI reference. This is an HTML editorial section awaiting review and native Elementor conversion, not a plugin-owned biography or a newly delivered Elementor host template.

Other-properties cards are generated from the five-property collection, exclude the current rental, include the other four only, and use existing photography and room facts without speculative prices or new promotional descriptions. Two desktop columns become one on phones. View-property and all-suites links retain selected dates and guests, including later date changes through the existing carry-dates mechanism.

Date and guest dropdowns use the same crisp SVG chevron, replacing the Unicode and browser-specific arrows in the current booking preview. Native select behavior and accessible form labels remain. Booking 0.3.5 provides matching date/guest control styles plus `[silosuites_related_properties property="silo-2"]` and an Explore other properties widget mode; the selected property is the one to exclude. Cards use WordPress Suite content and mapped provider metadata. An existing `.sp-property` template can be enhanced automatically; other native property layouts require placing the widget/shortcode.

`tests/client-revision-browser.mjs` now checks host source copy, four alternatives without the current/group rental across all five examples, and vector/native-select styling alongside the existing desktop/mobile regression. Additional isolated browser checks confirm date/guest carry, the production related renderer and single-column phone layout. Desktop/mobile screenshots are under `test-results`. No new full WordPress integration test or staging deployment is claimed.

Current static review archive: `releases/silosuites-booking-review-2026-11-18-galleries.zip`. It retains the earlier static-review limitation: actual reviews are served by the private local cache or connected WordPress, and are not bundled into the ZIP.

## Five-photo galleries, title ratings, two alternatives — 18 November 2026

This update supersedes the previous four-recommendation layout: show only two other individual properties, excluding the current rental, followed by **View all properties** linking to the suite collection and retaining selected dates/guests. The supplied DI/Boho screenshots remain layout references only; none of their photos, location facts, ratings or copy are used.

Every local property page now has five distinct images in one large/four small composition. Phones retain access to all five, arranged as one wide photograph above four smaller photographs. All five properties use five public images each from their corresponding verified Hostaway listing metadata; no generic bedroom or another property's photo fills a missing slot. `tools/cache_property_photos.py` downloads without an Authorization header, allows only the observed HTTPS Hostaway asset host and image formats, refuses redirects and oversized files, and writes the public asset provenance to `prototype/assets/properties/sources.json`. These twenty-five assets total about 5.62 MiB. Silo 2’s separate sleeping-section images remain from its supplied export, with their own lightbox entries. `prototype/client-property-photos.mjs` is the property-specific mapping. Search/other-property thumbnails use the same primary photo.

A rating link sits beside the native title, above the gallery, using the same eligible review response as the Guest reviews section. Both use Hostaway's ten-point scale; no reference-site score is copied. Dairy displays No reviews yet rather than a made-up zero or star score. Failed review requests leave an unverified rating hidden. The shared browser request cache prevents a title-rating widget plus a full-review widget from requesting the same response twice.

Booking 0.3.6 adds `[silosuites_rating property="silo-2"]` / Property rating widget mode, for placement beside the title in the native layout. The native reviews section should use HTML ID `sp-reviews`; the current HTML preview uses `reviews`. This plugin update does not replace native Elementor galleries or claim a new importable property kit. Their five-photo composition remains in the HTML design pending native conversion/review.

`tests/property-gallery-browser.mjs` covers five distinct property-matched images on all five pages, desktop one-large/four-small geometry, phone visibility/overflow, title ratings, Dairy empty state, gallery dialog, two alternatives, exact collection link, reference-content exclusion, a single shared review/rating request, and the production related-card renderer. Existing client-revision/review browser checks and PHP review/group policy checks are also run. Screenshots: `property-title-rating-gallery-desktop.png`, `property-title-rating-gallery-mobile.png` under test-results. No real booking operation, live/staging page update or full WordPress installation test is performed in this revision.

## Client-sharing Netlify build — 18 November 2026

The new `--with-review-snapshot` build option supersedes the earlier no-embedded-reviews limitation for the explicit client-sharing artifact only. Deliver `releases/silosuites-netlify-client-preview-2026-11-18.zip`; it includes the same anonymous eligible public testimonial fields already used on the property pages, with a visible snapshot date and static JSON routes. No raw guest/private data, credentials, PHP or booking submission is bundled. Standard no-flag archives retain their prior backend requirement. See NETLIFY-CLIENT-PREVIEW.md for schema controls, manual deployment steps and extracted-archive verification. No production plugin or site is changed.

## Preferred homepage olive and Rates from — 19 November 2026

The client specified olive **#81ad7b**, superseding the earlier brand-board olive for the current booking designs. Apply it to the current preview/plugin accent, button/selected-filter fills and branded borders; keep white page surfaces, readable dark button text, upright headings and consistent Playfair Display/Figtree type. The original marketing pages, original export and old importer artifacts are not modified.

The preferred live homepage was read on 19 November and corroborates the original Elementor export: Silo 1 Rates from $150, Silo 2 $165, Silo 3 $165, Silo 4 $159, Dairy $159. Source: https://silosuites.com/. These are the client's published marketing starting rates, not live calendar minima, available-night promises, inclusive totals or a substitute for provider quotes. No new descriptions or arbitrary starting prices are invented.

`shared/client-starting-rates.json` owns these default labels/provenance in USD minor units. `python3 tools/build_client_rates.py` generates the preview map and identical plugin defaults. Packaging verifies both match the canonical source. Our suites and the two other-property recommendations show Rates from; the original live homepage remains unchanged.

Booking 0.3.7 adds the separate `starting_rate` field to card data and a Property card starting rate box under the native Suite content editor. A permitted editor can update it or leave it blank to hide it. Saved values require a nonce/capability check, reject malformed/negative/overlarge values, preserve exact cents and skip revisions/autosaves and unknown/group properties. No automatic migration overwrites client values. Availability/quote services do not use this field; actual stay pricing remains provider-calculated after dates/guests are chosen.

`tests/card-rates.php` covers published defaults, exact-cent formatting, invalid inputs, nonce/capability gating, overrides, explicit blank-to-hide and group exclusion using synthetic state only. Public catalog/group and release checks remain required. The WordPress package is not claimed newly installed or tested on a fresh full WordPress site in this session.

Current Netlify sharing archive: `releases/silosuites-netlify-client-preview-2026-11-19-olive.zip`; it retains the dated anonymous review snapshot and disabled sample checkout. Gallery/layout/marketing-page boundaries remain unchanged.
