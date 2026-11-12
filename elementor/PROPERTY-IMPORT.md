# Silo Suites property template 0.2.2

## Recommended import

1. Install or update **Silo Suites Design Importer 0.2.2** from the supplied ZIP. Activate Elementor first.
2. Go to **Tools → Silo Suites Design → Import Silo Suites design**. This installs original media and saved templates. It does not replace pages or change the live site.
3. Create a draft property page, open Elementor and insert **Silo Suites — Silo Suite 2 v0.2.2** from My Templates. Use **Elementor Full Width** with your global header/footer.
4. Alternatively use **Complete Silo Suite 2** with **Elementor Canvas**, which includes a header and footer.
5. Review on staging before publishing. This release's source content describes Silo Suite 2 only.

The `silosuites-property-templates-0.2.2.zip` can also be imported through Elementor's template-library ZIP importer. Install the media importer first: some new original photographs and the logo use portable media references, resolved by that importer. Manual JSON-only import requires selecting your uploaded images in the native Image widgets. The importer can be deactivated after import.

## How the client edits popup content

1. Open the actual property page with **Edit with Elementor**.
2. Open **Structure / Navigator** and expand **Property — Silo Suite 2 page → Property — Page inner**.
3. Select a named container near the bottom:
   - **Property — Popup — Amenities — edit all content here**
   - **Property — Popup — About — edit all content here**
   - **Property — Popup — Rules — edit all content here**
   - **Property — Popup — Cancellation — edit all content here**
4. The popup content is visible as normal content blocks in the editor. Click its Heading or Text Editor widgets to edit text. Add, remove or rearrange native widgets as needed. For amenities, edit the Text Editor list in each named group. No HTML or JavaScript editing is needed.
5. Update the page and preview it outside the editor. Its normal popup button opens the edited content.

The frontend moves those same native containers into modal dialogs. Content is not copied into a JavaScript string. Popup behaviour includes Escape/backdrop dismissal, keyboard focus containment, background scroll lock and focus return. On the editor canvas, modal behaviour stays off so the content remains directly editable.

Four **Popup content** saved sections are included as reusable copies. They are not synchronised with property pages: editing a saved copy does not alter a page where it was inserted previously. Edit the page's Popup container for that property's live content. To reuse one, insert its section and move its native content into the matching popup container; retain that container's CSS ID.

## Editing other page content

The property name, capacity text, descriptions, photos, captions, amenities preview, arrival copy, contact copy, links and popup buttons use native Elementor controls. The first gallery photo is large; the following four occupy the smaller cells. Replacing those image widgets also changes the frontend photo popup. Keep the gallery's structural classes when rearranging it.

The amenity preview and full amenity list are separate editable blocks. When changing an amenity, update both where applicable. The button says “See all amenities” so it cannot show an outdated count.

Keep the first **00 Styles** widget, the last **99 Interactions** widget, popup CSS IDs, and sticky navigation anchor IDs. These provide design layout and behaviour. Do not duplicate this entire property template twice on the same page.

## What remains functional code

- The Leaflet area map and its latitude/longitude settings, attribution and tile handling.
- Sticky navigation, modal/gallery opening and accessibility behaviour.
- The date/guest form, which is explicitly a design preview. It creates no booking, quotes no live prices and takes no payment. The Hostaway booking connector will replace this area later.

Leaflet 1.9.4 and its BSD license are embedded in the functional widget for portability. No API secrets, third-party paid binaries, React build or additional popup addon are included. Core Elementor is sufficient for the page and editable popup content. Elementor Pro is only needed for global Theme Builder header/footer assignment if you use those parts.

## Content review

The map shows a labelled La Verkin town reference until verified property coordinates are supplied. Confirm listing facts, cancellation policy, amenities, telephone number and destination slugs before publishing. Duplicating this page for another suite requires replacing its property-specific facts, all gallery and sleeping photos, popup content and eventual Hostaway listing mapping.

No released 0.1.x ZIPs have been replaced. This update increments the design importer to **0.2.2**.

The importer processes one new media asset or template per request. Keep the tab open until it reports all ten templates ready. If a request stops, reload and run it again to continue from completed work. Earlier versioned templates and edits remain intact.
