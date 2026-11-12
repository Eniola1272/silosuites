=== Silo Suites Design Importer ===
Contributors: homlay
Requires at least: 6.8
Requires PHP: 7.4
Stable tag: 0.2.1
License: GPLv2 or later

Installs supplied media, editable homepage and property pages, popup-content sections, and header/footer sections.

== Installation ==
1. Activate Elementor.
2. Upload and activate this ZIP as a WordPress plugin.
3. Open Tools > Silo Suites Design and click Import Silo Suites design.
4. Insert the saved Home content template in a new draft with Elementor Full Width, or the Complete homepage template with Elementor Canvas.
5. Check the new draft on desktop and phone before replacing anything on the live site.
6. To use global header/footer parts with Elementor Pro, create each part in Theme Builder and insert its matching saved section. Set display conditions after review. Use the content-only homepage with Elementor Full Width alongside global parts.

This creates templates and Media Library images only. Existing pages and the homepage are not changed. An administrator with unfiltered_html capability must perform the import. Styles, booking preview, map and interaction widgets supply functional code; editorial content and popup content use native Elementor elements. See PROPERTY-IMPORT.md for the property editing workflow. The date form is a preview and never claims live availability or creates reservations. No Hostaway credentials are included or read.

The plugin may be deactivated after import. Repeating an import reuses this version's saved templates and images; it does not overwrite client edits.

== Changelog ==
= 0.2.1 =
Preserve native Elementor document styles inside editable popup dialogs and refine property heading spacing.

= 0.2.0 =
Added native Silo Suite 2 property templates, four editable popup-content sections, a portable popup runtime, sticky Overview navigation, and a Leaflet area map. Bundles property export photographs. Popup content is edited directly in the property page; separate saved sections are reusable copies. No live booking or checkout.

= 0.1.1 =
Added independent header and footer saved-section templates, each with self-contained styles. Standalone navigation anchors now target the homepage from every page. Updated installer to import all four templates while preserving 0.1.0 releases and prior editorial edits. Mobile navigation closes on link selection, Escape, and outside clicks.

= 0.1.0 =
Initial local-media installer and native homepage templates based on the supplied current-homepage export and approved HTML direction.
