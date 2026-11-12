# Elementor homepage verification

## Header and footer release 0.1.1

Separate Header and Footer saved-section JSONs were imported through Elementor in the isolated WordPress site. Both include independent scoped styles and resolve the supplied logo to a local Media Library attachment. Their structure, no additional H1, homepage-targeted anchor links, repeat-import preservation, and access restrictions passed the integration checks.

Browser checks passed at 1440, 768, 390, and 320 px, including no horizontal overflow, local logo loading, correct homepage/phone links, and mobile navigation open/Escape. Desktop and phone screenshots of each standalone section were visually inspected. The previous 0.1.0 release ZIPs are preserved.

These are portable saved sections, designed to be inserted into new Header/Footer parts in Elementor Pro Theme Builder. Global display conditions are deliberately not assigned by the importer. Their actual Pro site-wide placement remains a staging setup step described in the import guide; verification here used standard Elementor section imports and isolated rendering.

## Initial homepage release 0.1.0

11 November 2026. Installer and template release 0.1.0.

The source export `elementor-3801-2026-11-11.json` was preserved. Its original property, family, Hot Springs, and guide photos were downloaded; the new no-pig logo was taken from the user's supplied original file. The new templates contain no borrowed global-style IDs, obsolete placeholder layers, reviews-script embeds, API secrets, or development-server links.

## Real WordPress import

An isolated WordPress installation was created under a temporary directory with a separate SQLite database. Existing Local sites and the live Silo Suites site were not changed. The environment used PHP 8.2.29, WordPress 7.0.1, and Elementor 4.4.0.

The actual Elementor import API accepted both the content-only and complete-page templates. The installer imported all 16 original assets into the Media Library and replaced the template's source image IDs/URLs with local attachments. The complete page contains 45 native containers, 33 headings, 7 images, 23 buttons, 12 text editors, and three small HTML widgets for scoped styles, search preview, and mobile navigation.

Integration checks passed for media/template reuse on repeat import, saving a native headline change, preserving that editorial change when importing again, exactly one native H1, resolving every referenced image to a real local attachment, and rejecting import when unauthenticated.

## Rendering and editing

Desktop and mobile screenshots were inspected from actual imported WordPress pages. Below-the-fold images were scrolled into view and decoded before full-page screenshots. The native search and mobile-menu behaviour were exercised. The verification script checks both page variants at 1440, 1024, 768, 390, and 320 px for horizontal overflow.

The browser checks passed for both page variants at every listed width. The actual WordPress administrator import button was exercised successfully. In the real Elementor editor, the native headline field was edited using keyboard input, the preview updated, and the original text was restored. Detailed results and screenshots are saved in the ignored `test-results/` folder; the editor loading overlay must finish before interacting with the sidebar.

Both imported pages also rendered in fresh HTTP requests with the installer deactivated. The installer was reactivated afterward in the isolated QA site. The packaged release therefore has no continuing frontend dependency on this importer.

## Limits

This verifies the homepage design import. It does not verify Hostaway availability, rates, payments, add-ons, guest messaging, site-wide Theme Builder conditions, physical-phone behaviour, or production Core Web Vitals. The date form is deliberately a preview. The importer does not replace the homepage or modify existing pages, and it can be deactivated after importing.

The complete JSON's portable logo reference is resolved by the installer. When importing that JSON manually without the installer, select the supplied logo in the two Image widgets. The direct content-only JSON relies on the original media host being reachable; the installer bundles originals and removes that dependency.


## Property release 0.2.1

Imported the 0.2.1 payload through Elementor's real template import API into the isolated WordPress 7.0.1 / Elementor 4.4.0 / PHP 8.2.29 site. All ten templates import; 21 original media assets are local. Property content contains 32 native containers, 29 headings, 24 Text Editor widgets, 8 Image widgets and 15 Button widgets. Four HTML widgets supply styles, the preview form, map mount point and interaction runtime. Four popup content containers remain native Elementor content.

`tests/elementor-property-import.php` verifies media remapping, native popup storage, repeat-import deduplication, and saved text edits. A native popup heading was saved with a new title, colour #123456 and 29px size. `tests/elementor-property.mjs` verified all three values in the opened frontend modal while the importer was deactivated. The runtime preserves Elementor's document CSS scope around portalled content, so native style edits survive opening a popup.

Browser checks cover both property-only and complete property pages, all four editorial popups, gallery, hidden-until-sticky Overview navigation, OSM tiles, the safe preview date form, and 768/390/320px widths. The real Elementor editor shows all four popup containers; clicking its native Heading control and typing updates the visible popup-content heading. No runtime modal is created in editor mode. Screenshots: `test-results/elementor-property-popup-editor.png`, `elementor-property-amenities.png`, `elementor-property-desktop.png`, `elementor-property-popup-mobile.png`, and complete-page equivalents.

This is a saved page template for Silo Suite 2, not yet an automated Theme Builder Single template connected to Hostaway property records. Other suites require property-specific content replacement. The booking form remains a design preview; no reservation/payment operation is implemented. Leaflet uses a labelled town reference until verified coordinates are available. No live site was modified.
