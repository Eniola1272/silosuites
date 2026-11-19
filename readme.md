# Current client review — 16 November 2026

Client-sharing build: run `python3 tools/build_booking_review.py --with-review-snapshot` and use [the Netlify client preview](releases/silosuites-netlify-client-preview-2026-11-19-olive.zip). This build includes anonymous eligible public-review snapshots so ratings and review popups work on static hosting. No API credentials or booking submission are included. See [Netlify upload instructions and verification](docs/NETLIFY-CLIENT-PREVIEW.md).

Preserve the original marketing site. The current review covers booking pages only: [Silo Suite 2 example](http://127.0.0.1:4173/suite.html?id=silo-2) and [suite search](http://127.0.0.1:4173/stays.html). Build the client Netlify package with `python3 tools/build_booking_review.py`; use `releases/silosuites-booking-review-2026-11-19-olive.zip`. Do not resend the older full-site redesign archive or replace original marketing pages with its templates.

White backgrounds are used for the custom booking pages, panels and popups, matching the client preference confirmed on 18 November. Booking 0.3.3 includes this styling update.

Booking 0.3.7 includes per-property Hostaway reviews, title-rating widgets, full-review popups, SVG date/guest chevrons and a dynamic Explore other properties widget limited to two recommendations. The current olive is #81ad7b and property cards show the client-published Rates from values. Starting rates are editable under Suite content and do not replace selected-date Hostaway quotes. The four-silo inquiry message is removed. The online group option remains disabled. The Open map link is removed while the Leaflet map remains. The HTML example uses existing client copy and original-site font families with upright headings. See [revision scope and verification](docs/CLIENT-REVISION-2026-11-16.md). Stripe access and transactional integration remain pending. Historical progress follows below.

Each local property example now includes Meet your hosts with the original family photo and Our story copy, followed by two other properties and View all properties. Every HTML property page has five property-specific photos in a one-large/four-small gallery, with its eligible review rating beside the title above the photos. Dairy has an honest No reviews yet state. Host editorial content is in HTML review; its native Elementor migration is still pending.

For genuine reviews in the local HTML preview, run `python3 tools/cache_hostaway_reviews.py`, then restart `python3 tools/serve.py`. Reviews are anonymized, filtered and cached privately, outside the served folder. The standard static ZIP does not bundle review data; the explicit `--with-review-snapshot` client build includes a dated anonymous snapshot, never a live API feed; connected WordPress uses `[silosuites_reviews property="silo-2"]` or the widget’s Guest reviews mode. See [review integration](docs/HOSTAWAY-REVIEWS-DISCOVERY.md).

# Silo Suites

Website and direct-booking project for Silo Suites in La Verkin, Utah.

The implementation sequence is local HTML design and review, native Elementor conversion, then the production Hostaway booking integration and acceptance testing. Hostaway remains the operational source of truth.

## Project documents

- [Implementation plan](docs/IMPLEMENTATION-PLAN.md): scope, page map, design direction, PHP plugin architecture, Elementor delivery, release rules, and acceptance criteria.
- [Discovery record](docs/HOSTAWAY-DISCOVERY.md): source review, initial public-site findings, account questions, and integration proof requirements.
- [Written design brief](<docs/SILO SUITES DESIGN BRIEF.docx>).
- [Visual brand board](<docs/SILO SUITES VISUAL BRAND BOARD new.pdf>).
- [Project instructions](AGENTS.md), including the mandatory plugin version increment rule.

## Current state

The first local HTML design build is ready: homepage, suites/search, six property variants, Hot Springs, Local Guide, date selection, galleries, and sample stay review. Read [Local preview and secure API setup](docs/LOCAL-PREVIEW.md).

The property page is also available as native Elementor templates with editable popup content. See [property import and client editing instructions](elementor/PROPERTY-IMPORT.md).

The property HTML has been redesigned using the supplied CC Stays layout reference and the current Silo Suite 2 export. Review [Silo Suite 2 locally](http://127.0.0.1:4173/suite.html?id=silo-2); see [property design notes](docs/PROPERTY-DESIGN.md) for source details and the Elementor conversion boundary.

The homepage is now also available as two native Elementor page templates plus independent header/footer saved sections, using original photos from the supplied current-homepage JSON. The optional **Silo Suites Design Importer 0.2.3** imports those photos, the supplied logo, and the saved templates without replacing existing pages. See [Elementor import instructions](elementor/IMPORT.md) and [verification](docs/ELEMENTOR-VERIFICATION.md).

```sh
python3 tools/serve.py
```

The homepage HTML has a new review iteration with an exterior hero, larger typography, comparison details, sourced guest quotes, image-led destinations and FAQs. See [homepage review notes](docs/HOMEPAGE-REVIEW.md). Elementor/staging conversion of this revision awaits design approval.

Open **http://127.0.0.1:4173**. The preview now uses original Elementor-export photos and supplied logo files. Booking data is explicitly synthetic; no reservation or payment can be made. The native homepage templates and media installer are implemented; the new Hostaway booking plugin 0.1.0 adds server-side connection diagnostics and mapping; live availability, checkout and booking sync remain unimplemented.

Configure Hostaway credentials at hidden terminal prompts with `python3 tools/configure_hostaway.py`. Optional connection check: `python3 tools/hostaway_discover.py`. Credentials and reports remain outside the served folder in ignored `.secrets/`. Local API authentication and metadata discovery succeeded on 12 November 2026: five listings were returned. All Four Silos was not returned; checkout, availability, payment and sync verification remain pending. WordPress server credentials must be configured separately.

Next milestone: review the imported homepage on staging, validate the Hostaway integration path, and replace preview booking components with the real connector.

## Plugin releases

Every delivered plugin update must increment its version and include a changelog entry. The current design importer is `0.2.3`; earlier `0.1.0` artifacts remain unchanged; the separate Hostaway booking plugin starts at `0.1.0` with read-only connection diagnostics and mapping; it does not enable checkout or booking sync. Elementor's JSON schema version remains `0.4` and is separate from plugin release numbering.

Rebuild the templates and payload with `python3 tools/build_elementor.py` followed by `python3 tools/build_property_elementor.py`. Package a release with `python3 tools/package_elementor.py`; this checks version consistency, native structure, media hashes, and prevents changed content from replacing an existing release ZIP under the same version.

Read [current project status](docs/PROJECT-STATUS.md) and [booking integration setup](docs/BOOKING-INTEGRATION.md). Build the separate development booking plugin with `python3 tools/package_booking.py`.

Homepage booking shortcuts: all six configured stay options now appear in the local HTML. Check availability opens a property-specific calendar/guest/quote dialog; View suite opens its property page. Both lead to the same explicitly non-transactional checkout preview. See [booking paths and production PHP widget plan](docs/HOMEPAGE-BOOKING-PATHS.md). No live booking/plugin upgrade is implied by this prototype revision.

Latest design delivery: **Design Importer 0.2.6**, synchronising the reviewed homepage and count-free gallery button into native Elementor templates. Reimporting creates new saved versions; existing page instances must be replaced deliberately on a review copy. Native editorial content remains editable; quick-calendar prices and dates in this design package are samples. Booking plugin remains independently versioned at 0.2.1 and was not changed in this design update.

Latest functional build: **Booking 0.3.0** adds live-data WordPress/Elementor browsing, provider-calculated quotes and an on-site checkout review. See [setup and exact limits](docs/BOOKING-0.3.0.md). Payment/reservation creation remains disabled pending same-account Stripe test configuration and an approved integration test. No hosted checkout handoff is enabled.
