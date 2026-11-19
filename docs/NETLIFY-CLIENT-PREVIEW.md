# Netlify client design preview — 19 November 2026

Deliver `releases/silosuites-netlify-client-preview-2026-11-19-olive.zip`. This package contains the current booking/search/property/checkout design only. The original marketing homepage, Hot Springs and Local Guide are linked on the unchanged live website.

## Upload

1. Unzip the archive into a folder.
2. Open [Netlify Drop](https://app.netlify.com/drop).
3. Upload the extracted folder containing `index.html` and `assets` (not the source project or the WordPress plugins).
4. Share the resulting Netlify preview URL with the client. Open Our suites first, then any property page.

No build command, PHP server, plugin installation, API key or environment variable is required. Netlify's [manual deployment instructions](https://docs.netlify.com/deploy/create-deploys/#drag-and-drop) require the built/output folder; manual upload does not run a build.

## Included

- The five individual properties, five property-specific gallery photographs each, title ratings, hosts section, and two other-property recommendations with View all properties.
- Playfair Display and Figtree served locally, with their licenses.
- Photo, amenities, source-content, house-rule and review popups; mobile navigation; sample date/guest selection; disabled payment review.
- A dated snapshot of already-eligible, anonymous public review display fields: Silo 1 (52), Silo 2 (62), Silo 3 (34), Silo 4 (11), Dairy (0). Each property page labels the snapshot date, 18 November 2026. Dairy shows No reviews yet.
- Netlify redirects, JavaScript MIME headers, robots/noindex instructions, and root-level index.html.

The snapshot is public testimonial content already approved for the property review sections. Only text, rating, source label and submitted month are exported, plus property-level totals/average and snapshot timestamp. Guest/reviewer names, reservation IDs, private feedback, raw provider records, credentials and PHP are excluded. An export validation gate rejects review text containing email/phone contact patterns. Snapshot JSON exists only in the generated distribution and delivery archive, not source fixtures. Airbnb text remains excluded.

## Build again

```sh
python3 tools/build_booking_review.py --with-review-snapshot
```

This reads the existing private, filtered review cache; it makes no Hostaway requests. To refresh the eligible review content beforehand, run the separate read-only `python3 tools/cache_hostaway_reviews.py`, then rebuild. The standard build without the flag remains a booking-only static archive without embedded reviews.

## Scope and verification

Dates, availability, prices and checkout are demonstrative. The preview does not reserve dates, charge payments or sync a booking. Review content is a saved snapshot rather than a live feed. All API reads required for the review design have been replaced in this distribution with static JSON paths; the local development API and production WordPress integration are unchanged.

The delivered ZIP is extracted into a clean temporary folder and served by an ordinary static HTTP server for `tests/netlify-client-preview.mjs`. Checks cover the root collection, all property pages, static rating/review content, five-photo galleries, two recommendations, source host content, dialogs, phone overflow/navigation, demo checkout, and absence of Hostaway/local API requests or missing files. This verifies the archive locally; it does not claim a Netlify deployment or a staging update.

No plugin code changed for this build; Booking remains 0.3.6. No original live or WordPress staging page is changed.

19 November update: Our suites now explicitly paints the full page canvas, search fields, listing cards, image placeholders, empty-results area, header and footer pure white, including the Netlify root page. Olive buttons and selected filters remain. The review snapshot is still dated 18 November. This is a standalone preview/CSS build; no plugin update or staging change.

19 November olive/card-rate update: the current bundle uses #81ad7b and Rates from values from the preferred live homepage, corroborated by the original export. This preserves upright Playfair Display/Figtree styling and white backgrounds. Published starting rates are separate from date-specific totals. The corresponding WordPress changes are Booking 0.3.7; no staging update is performed.
