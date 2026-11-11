=== Silo Suites Design Importer ===
Contributors: homlay
Requires at least: 6.8
Requires PHP: 7.4
Stable tag: 0.1.1
License: GPLv2 or later

Installs original supplied media, editable homepage templates, and separate header/footer sections.

== Installation ==
1. Activate Elementor.
2. Upload and activate this ZIP as a WordPress plugin.
3. Open Tools > Silo Suites Design and click Import Silo Suites design.
4. Insert the saved Home content template in a new draft with Elementor Full Width, or the Complete homepage template with Elementor Canvas.
5. Check the new draft on desktop and phone before replacing anything on the live site.
6. To use global header/footer parts with Elementor Pro, create each part in Theme Builder and insert its matching saved section. Set display conditions after review. Use the content-only homepage with Elementor Full Width alongside global parts.

This creates templates and Media Library images only. Existing pages and the homepage are not changed. An administrator with unfiltered_html capability must perform the import. The scoped style widget and date form are the only code-based parts; editorial sections use native Elementor elements. The date form is a preview and never claims live availability or creates reservations. No Hostaway credentials are included or read.

The plugin may be deactivated after import. Repeating an import reuses this version's saved templates and images; it does not overwrite client edits.

== Changelog ==
= 0.1.1 =
Added independent header and footer saved-section templates, each with self-contained styles. Standalone navigation anchors now target the homepage from every page. Updated installer to import all four templates while preserving 0.1.0 releases and prior editorial edits. Mobile navigation closes on link selection, Escape, and outside clicks.

= 0.1.0 =
Initial local-media installer and native homepage templates based on the supplied current-homepage export and approved HTML direction.
