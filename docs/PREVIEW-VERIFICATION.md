# First HTML preview verification

Checked 11 November 2026 against the local design preview. This report concerns fixture behaviour and the current HTML design, not the client's live Hostaway account.

## Automated checks

Seven Node booking-logic tests passed:

- Date-only stay arithmetic across the Utah daylight-saving boundary and property-local today calculation.
- Invalid/impossible/past dates, reversed dates, excessive stay length, and invalid guest counts.
- Non-overlapping check-in/check-out boundaries.
- A blocked child silo makes the group option unavailable without blocking siblings.
- A group booking blocks the four silos while Dairy remains independent.
- Minimum stay and capacity restrictions.
- Sample quote line-item totals using integer cents.

The headless Chrome browser smoke check passed:

- Home loads the original logo and reference photographs without JavaScript errors or failed local assets.
- Date selection proceeds to results with dates preserved in the URL.
- Filter chips, six sample options, group selection, an 18-person sample group, and stay review work.
- Gallery open/close and Escape handling work.
- Invalid URL date input produces an error and no eligible results.
- Project-private paths return 404 from the preview server.
- Phone menu and full-screen calendar open and close.
- Home, results, Dairy property, Local Guide, and Hot Springs have no horizontal overflow at viewport widths 1440, 768, 390, and 320 px.

Python helper syntax was checked without accessing credentials or calling Hostaway.

## Visual checks

Reviewed desktop and phone screenshots of the homepage, desktop/phone date picker, and property layout. Corrected image sizing so original dimensions do not distort responsive images. Screenshots of the complete homepage load lazy images for inspection; the site itself retains below-the-fold lazy loading.

The original `SILO-LOGO-NO-PIG.png` and transparent logo were copied unchanged from Downloads. The no-pig mark is the one displayed. Original property and family photography is extracted from the supplied brand board; the source inventory is `prototype/assets/sources.json`.

## Limits and next checks

This was browser emulation, not testing on physical phones. Real iPhone/Android, cross-browser accessibility, Lighthouse/field performance, fresh Elementor import, and live booking/payment/message tests remain future acceptance work. Property assignments, rates, tax, capacity, rules, and calendar fixtures require authoritative verification. The stay review is explicitly a simulation, and there is no live checkout.

No PHP plugin exists yet, so there is no plugin release version in this milestone. The first installable build will start at `0.1.0` and every subsequent delivered plugin change will increment it.
