Current delivery: **0.2.1**, adding property pages and editable popup content. Follow [PROPERTY-IMPORT.md](PROPERTY-IMPORT.md) for the property workflow. Install `silosuites-design-importer-0.2.1.zip`; it imports ten saved templates and 21 media originals. The homepage-only 0.1.1 instructions below remain available for that earlier package.

# Import the Silo Suites homepage

Release 0.1.1. This converts the new homepage direction into native Elementor containers, headings, images, text, and buttons. It reuses the original photos referenced in `elementor-3801-2026-11-11.json` and your supplied no-pig logo.

## Recommended import with bundled media

1. Work on staging or a new draft. Ensure Elementor is active.
2. In WordPress, open **Plugins → Add New Plugin → Upload Plugin** and upload `silosuites-design-importer-0.1.1.zip`.
3. Activate it and open **Tools → Silo Suites Design**.
4. Click **Import Silo Suites design**. It imports 15 original photos and the supplied logo into the Media Library, then creates four saved Elementor templates. It does not change any existing page or the homepage setting.
5. Create a new draft page and edit it with Elementor. Open the template library, select **My Templates**, and insert one of the templates below.
6. Choose the matching page layout and review on desktop and phone. Keep this as a draft until the design and booking integration are approved.

| Saved template | Page layout | Use |
| --- | --- | --- |
| Silo Suites — Home content v0.1.1 | Elementor Full Width | New homepage body with the current site's header and footer |
| Silo Suites — Complete homepage v0.1.1 | Elementor Canvas | New homepage including its own navigation and footer; avoids duplicate theme headers |

If Elementor offers to apply the template's page settings, apply them to the new draft, or set the layout manually. The complete version's header and footer are editable page sections. The separate Header and Footer templates can be inserted into Theme Builder parts; the importer never activates display conditions automatically.

After importing, the installer can be deactivated or removed. Images live in the Media Library and the design uses standard Elementor widgets; there is no continuing dependency on the installer. Repeating the same version's import reuses its media and saved templates instead of overwriting editorial edits. A future installer version creates a separate versioned template.

## Import the JSON files directly

The four `.json` files are standard Elementor template files with schema version `0.4`. They can be uploaded from **Templates → Saved Templates → Import Templates**, or the editor's template-library import button.

The content-only JSON references the original public media URLs from the source export. On a new site, Elementor must be able to download those images. The complete-page JSON also includes a portable logo reference that is resolved by the bundled-media installer; use the recommended installer first for a complete result, or upload the supplied logo and select it in the two native Image widgets manually.

The `silosuites-home-templates-0.1.1.zip` contains all four JSONs and can be used with Elementor's multi-template ZIP import. It does not contain the media. The separate installer ZIP contains all 16 originals and avoids relying on the old site's image host.

## Separate header and footer templates

Import `silosuites-header-0.1.1.json` and `silosuites-footer-0.1.1.json` into Saved Templates, or use the updated installer to import both with their media. These are portable **saved sections**, each with its own scoped styles; they work independently of the homepage body. The two files are also available together in `silosuites-header-footer-0.1.1.zip`.

For global use with Elementor Pro:

1. Open **Templates → Theme Builder**, create a **Header**, and open it in Elementor.
2. Open the template library's **My Templates** tab and insert **Silo Suites — Header v0.1.1**.
3. Create a **Footer** and insert **Silo Suites — Footer v0.1.1** the same way.
4. After reviewing on staging, choose the intended display conditions, such as Entire Site.
5. Use the **Home content** version with **Elementor Full Width** so the global header/footer can render. The Complete homepage already includes its own header/footer and uses Canvas.

Header/footer section links to Our Story and the date search point back to the homepage, so they also work from suite and guide pages. The mobile menu closes on link selection, Escape, or a click outside. The Book action still leads to the existing preview search; it is not a live reservation action.

If media was already imported with installer 0.1.0, the new files reuse the registered logo reference. Otherwise use installer 0.1.1, or select your uploaded logo in each standalone Image widget after manual JSON import. The installer creates new versioned templates and preserves the earlier templates and their edits.

[Elementor header guide](https://elementor.com/help/header-site-part/), [Elementor footer guide](https://elementor.com/help/footer-site-part/).

## What the client can edit

Use Elementor's Structure/Navigator panel to locate clearly named sections: Editorial hero, Date-first search, Introduction, Featured stays, Farm story, Stay and Soak, Local guide, and Closing invitation. In the complete version, Header and Footer are separate named sections too.

Headlines, paragraphs, photos, links, buttons, cards, colours, typography, layout, and spacing use native controls. A complete page contains 45 native containers, 33 Heading widgets, 7 Image widgets, 23 Button widgets, and 12 Text Editor widgets.

Three small HTML widgets provide the scoped presentation stylesheet, temporary date-form behaviour, and complete version's mobile dropdown. They do not contain the page's editorial content. Keep the first widget named **00 — Design styles — keep this widget**. The content-only version has no mobile-menu widget because navigation belongs to the existing theme.

No Pro-only widgets or external Elementor add-on packs are required for these page templates. Elementor Pro is required to create global Header/Footer parts and assign display conditions; the supplied saved sections themselves use standard widgets.

## Booking status

This release is a design import. Featured cards are static native elements sourced from the supplied export. They are not a live Hostaway grid. No rates, taxes, or availability claims are published by this template.

The temporary date form accepts and validates dates, then explicitly explains that live availability is not connected. It does not send guest information, redirect to a falsely filtered result, make reservations, or take payment. Its Browse link opens the existing suite overview. The custom Hostaway booking connector and final checkout are later work, after account capability verification.

Internal links use the current site's page paths. Verify the phone number and destination paths on staging, along with property facts, offers, and final content. Existing reviews scripts, parallax layers, placeholder images, and old global-style IDs were not carried into the new design.

## Verification

The release was imported through Elementor's actual template-import API in a fresh isolated WordPress installation using PHP 8.2.29, WordPress 7.0.1, and Elementor 4.4.0. All 16 media originals were installed locally. Import repetition, native headline saving, preservation of editorial edits, and rejection of unauthenticated import were checked. Desktop/phone rendering and the editor are covered in `docs/ELEMENTOR-VERIFICATION.md`.

The installer is version **0.1.1**. Every later delivered plugin update must increment that version. Elementor's JSON schema version **0.4** is a different value and should not be changed to match the plugin version.
