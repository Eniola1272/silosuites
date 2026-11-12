# Staging review — 12 November 2026

Staging: https://darkseagreen-butterfly-103736.hostingersite.com/

Final migration target: https://silosuites.com/

## Completed through the signed-in WordPress dashboard

Native Chrome UI access succeeded after the browser-extension host was unavailable. The dashboard, installed plugin list, Elementor template library and Duplicator backup workflow were inspected through the UI. No authentication credentials were requested or copied.

Observed software: WordPress 7.1.4, Blocksy theme, Elementor 4.3.6 and Elementor Pro 4.0.2. The dashboard displays an expired Elementor Pro subscription notice. There are 32 installed plugins, 18 active and 14 inactive. The existing Hostaway 2.0.1 plugin is inactive. Neither Silo Suites Design Importer nor Silo Suites Booking is installed yet. Existing saved templates include Home content v0.1.0 and the exported Single_property_page reference. Earlier client content was not overwritten.

## Pre-change backup

Created `20261112_silosuites_pre_design` using Duplicator Pro 5.1.1. Only Default Local storage was selected, on the existing staging server. No cloud destination was selected. The backup completed at 718.64 MB. Duplicator shows download/restore controls and reports that it is available for disaster recovery. A restore has not been exercised, so this is evidence of successful creation, not a tested recovery.

The existing backup defaults were retained; the archive is not encrypted. Keep its archive, installer and any recovery URL private. No backup archive or recovery link was copied into this repository or sent to another service.

## Pending action

An explicit confirmation request is pending for installing and activating the tested Design Importer 0.2.1 and Booking 0.1.0 ZIPs on staging. The browser tool requires action-time confirmation for custom software outside the official plugin directory. Both release checksums were verified against their existing release checksum files. No custom plugin has been uploaded or installed in this review.

After approval: install the two plugins, import versioned media/saved templates, verify that previous templates remain intact, and create draft review pages. Do not switch the public homepage or global header/footer display conditions during the review. The booking plugin adds diagnostics only; activation is not proof of checkout, prices, availability or synchronisation. Configure WordPress server credentials separately, then run the account check and map the five verified listings. All Four Silos remains unresolved.

No plugin/theme updates, deactivations, account changes, booking/payment operations or live-domain migration were performed.
