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


## Approved installation outcome — 12 November 2026

The user explicitly approved installing both staging plugins and then confirmed each installation at its submission step. Verified on the remote Plugins screen: **Silo Suites Design Importer 0.2.1** and **Silo Suites Booking 0.1.0** both display Deactivate links, confirming active status. The two Tools menu entries are present. No plugin release files were modified during deployment.

The remote Booking diagnostics page was opened and shows **Credentials: not configured**, no listing snapshot, and all six mapping slots not mapped. Its connection button is disabled. The local credential configuration does not configure the WordPress server. No API secret was entered into WordPress, and no booking, payment, inventory or messaging operation was performed.

The design import was started. Home content v0.2.1 was confirmed in the import history, and a later real Elementor editor screen confirmed Complete homepage v0.2.1 (template ID 4235). The importer also displayed its concurrent-import lock message during processing. The complete ten-template set, property/popup imports and 21 media attachments have **not** yet been verified on staging. Do not report the full import as complete or infer a specific server error from the partial history alone. Resume by checking the current template library and importer status before submitting another import.

Native browser focus/state changed repeatedly between the staging controls, other Chrome windows and ChatGPT. This prevented completing final template verification during this session. Both plugin activation states were verified through the native Plugins UI and screenshot. No public homepage assignment or global header/footer condition was changed by the agent, and no existing template edit was saved by the agent. The pre-change recovery backup remains recorded above.


## Resumable update prepared; remote update not performed

A subsequent review confirmed three 0.2.1 templates in importer history: Home content, Complete homepage and Header. The remaining seven were not verified. To avoid one long import request, importer 0.2.2 was built and packaged with a resumable admin workflow: one new media asset or template per request, preserved progress, failure/retry handling, authenticated nonce checks, and accurate completion status.

Local verification passed: one-template steps, one-media steps, pending-media status, native edit/history preservation, media deduplication, locking, unauthenticated rejection, the real browser JSON workflow, simulated network-failure recovery, and the original Elementor import/security tests. Earlier release archives are unchanged. The new package is `releases/silosuites-design-importer-0.2.2.zip`.

Remote deployment of 0.2.2 could not proceed: native Chrome access returned `cgWindowNotFound` and the browser host remained unavailable after refreshing inventory and retrying the app identifier. The user was asked to open a normal Chrome window on the staging dashboard. **Staging still has Design Importer 0.2.1 and Booking 0.1.0.** No 0.2.2 staging upload, full ten-template completion, or new property draft is claimed. Do not clear the old import lock or overwrite existing templates manually; inspect current state when access resumes.


## Browser reconnection follow-up

The user reopened the staging window. The Chrome Window menu exposed a separate Silo Suites Design window; switching to it confirmed that staging still displayed importer 0.2.1 with three templates. Subsequent control returned to another Chrome dashboard, and the tool timed out with a kernel reset while reselecting the staging window. No 0.2.2 upload or update was submitted. The tested update remains available locally; a one-time manual WordPress upload is a practical fallback to repeated unreliable foreground-window automation.


## 0.2.2 staging error and 0.2.3 recovery update

A direct browser observation confirmed Version 0.2.2 on staging and the visible error “Failed to fetch”. This supersedes the earlier installed-version record. No completed 0.2.2 import was verified. The user prefers manual browser actions because remote control is slow; browser control stopped after this read-only observation.

Version 0.2.3 adds an ordinary, nonce-protected standard form submission (Continue one step), bounded to one media item or template just like automatic mode. The request action uses the current origin. Automatic failures now explain recovery instead of displaying a raw fetch exception. No PHP/server/WAF root cause is asserted from the browser's generic error. The new update has not been installed on staging by the agent; remote completion remains to be confirmed.
