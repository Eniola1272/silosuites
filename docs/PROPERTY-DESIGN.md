# Property HTML redesign

Preview: http://127.0.0.1:4173/suite.html?id=silo-2

The CC Stays reference supplied in chat informed the photo mosaic, generous editorial column, slim sticky booking card, sleeping photographs, amenities, location and arrival sections. Silo Suites retains its supplied logo, Georgia/Arial typography and olive/cream/tan palette. No CC Stays reviews, claims, marks or copy are reused.

## Supplied property export

`single_property_page_elementor_template.zip` remains unchanged. Its Elementor document describes **Silo Suite 2** only. Five original JPEGs and seven small amenity icons were extracted into `prototype/assets/property-2/`. Third-party add-on archives were not installed or executed. The export's amenities popup contains only “Popup Text Here”, so no additional amenity content can be recovered from it.

The HTML uses its 5 guests, 2 bedrooms, 3 beds, 1 bath, king/queen/twin sleeping arrangements, description, kitchenette details, amenities, arrival rules and cancellation text. Bedroom photos show the supplied interiors without assigning an unsupported bed type to an individual room. The cancellation section identifies the supplied template as its source and requires Hostaway confirmation before live checkout. Other suites use the redesigned layout with their existing preview content and imagery; this export's room details and rules are not copied into those listings.

Existing booking metadata in the export: listing ID `143823`, hosted booking base `https://book.silosuites.com/`. This is a listing reference, not a credential. The calendar embed and nested addon code are not executed in the prototype. This source is not evidence of custom checkout, add-on or payment capabilities. Live API discovery remains pending.

## Review and implementation boundary

`prototype/property.mjs` owns the editorial rendering and photo mapping. `prototype/property.css` owns the new property layout. Shared date selection, sample quotes, capacity and group availability logic remain in the existing app modules. Gallery buttons open a keyboard navigable dialog and restore focus on close. Description, all amenities, rules and cancellation open native modal dialogs with scrollable content, Escape/backdrop dismissal, keyboard focus containment and return to the invoking button. The full amenity list is grouped by comfort, kitchen, bathroom, and outdoors. A scroll-aware section bar appears beneath the main header, tracks the current section, scrolls its links horizontally on narrow screens, and keeps section headings and the booking card clear of both headers. Location now renders a Leaflet map with OpenStreetMap tiles, muted styling, zoom controls, and a marker using the supplied Silo Suites logo. It is explicitly a town-area reference, not the exact property location.

Booking remains a clearly labelled fixture preview with no payment or reservation creation. No live WordPress pages were altered. No plugin or released Elementor package was modified; the current design importer remains 0.1.1. Convert the reviewed design to native Elementor elements in the next template release, with a new plugin version if its packaged payload changes.

Verification: `tests/property-browser.mjs`, the existing `tests/browser-smoke.mjs`, and `tests/booking.test.mjs`. Browser screenshots are saved under ignored `test-results/silo-2-desktop.png` and `test-results/silo-2-mobile.png`.

Reference implementation reviewed read-only: `../cc-stays-guesty-sync/cc-stays-guesty-sync.php` (`render_property_full_subnav`, `property_subnav_script`, amenity/modal renderers), `src/PropertySections.css`, and `src/AmenitiesSection.jsx`. Silo uses its own theme, content and native dialog implementation; the CC Stays project was not changed.

## Leaflet property map

Adapted from the CC Stays `src/PropertyMap.jsx` implementation and its map styles in `src/PropertySections.css`. This standalone prototype uses Leaflet directly instead of adding React. Leaflet 1.9.4 JS, CSS, default control images, and the BSD license are vendored in `prototype/assets/vendor/leaflet/` from the reference project's installed dependency. No CC branding or project files were modified.

`prototype/property-map.mjs` lazy-loads Leaflet and tiles near the location section. It disables scroll-wheel zoom, keeps keyboard-accessible zoom/marker controls and OSM attribution, refreshes dimensions on resize, respects reduced motion, and retains an external map link with a failure message if tiles cannot load. Real map tiles require an internet connection; the library is local. No API credential is needed.

The supplied Elementor map names La Verkin without coordinates. All prototype suites therefore show a clearly labelled town reference at 37.2011, -113.2697 (not a property pin). Coordinate reference: https://topoquest.com/place/utah/populated-place/laverkin/1429398. Replace it with verified Hostaway public listing coordinates and the intended location precision before production. Do not infer an exact address from these preview values.

Verification: `tests/property-map-browser.mjs` checks real tile loading, logo marker popup, zoom, attribution, phone resize and blocked-tile fallback. The existing property and site browser checks cover modal/navigation/booking regressions. This is an HTML-only update; no plugin payload changed, so importer 0.1.1 remains unchanged.

Navigation refinement: removed the duplicate inline submenu. The single property submenu is hidden (including its keyboard targets) until the overview reaches its sticky region, then appears beneath the main header. Its first link is Overview. Returning to the top hides it again.
