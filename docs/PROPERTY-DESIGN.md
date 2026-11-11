# Property HTML redesign

Preview: http://127.0.0.1:4173/suite.html?id=silo-2

The CC Stays reference supplied in chat informed the photo mosaic, generous editorial column, slim sticky booking card, sleeping photographs, amenities, location and arrival sections. Silo Suites retains its supplied logo, Georgia/Arial typography and olive/cream/tan palette. No CC Stays reviews, claims, marks or copy are reused.

## Supplied property export

`single_property_page_elementor_template.zip` remains unchanged. Its Elementor document describes **Silo Suite 2** only. Five original JPEGs and seven small amenity icons were extracted into `prototype/assets/property-2/`. Third-party add-on archives were not installed or executed. The export's amenities popup contains only “Popup Text Here”, so no additional amenity content can be recovered from it.

The HTML uses its 5 guests, 2 bedrooms, 3 beds, 1 bath, king/queen/twin sleeping arrangements, description, kitchenette details, amenities, arrival rules and cancellation text. Bedroom photos show the supplied interiors without assigning an unsupported bed type to an individual room. The cancellation section identifies the supplied template as its source and requires Hostaway confirmation before live checkout. Other suites use the redesigned layout with their existing preview content and imagery; this export's room details and rules are not copied into those listings.

Existing booking metadata in the export: listing ID `143823`, hosted booking base `https://book.silosuites.com/`. This is a listing reference, not a credential. The calendar embed and nested addon code are not executed in the prototype. This source is not evidence of custom checkout, add-on or payment capabilities. Live API discovery remains pending.

## Review and implementation boundary

`prototype/property.mjs` owns the editorial rendering and photo mapping. `prototype/property.css` owns the new property layout. Shared date selection, sample quotes, capacity and group availability logic remain in the existing app modules. Gallery buttons open a keyboard navigable dialog and restore focus on close. Description, extra amenities, rules and cancellation use native accessible disclosure controls. Location links to a city-level map without implying an exact property address.

Booking remains a clearly labelled fixture preview with no payment or reservation creation. No live WordPress pages were altered. No plugin or released Elementor package was modified; the current design importer remains 0.1.1. Convert the reviewed design to native Elementor elements in the next template release, with a new plugin version if its packaged payload changes.

Verification: `tests/property-browser.mjs`, the existing `tests/browser-smoke.mjs`, and `tests/booking.test.mjs`. Browser screenshots are saved under ignored `test-results/silo-2-desktop.png` and `test-results/silo-2-mobile.png`.
