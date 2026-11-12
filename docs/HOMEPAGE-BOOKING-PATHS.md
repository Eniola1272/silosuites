# Homepage property grid and two booking paths

## Brief and approved extension

The supplied brief specifies an Elementor homepage with a dynamic featured suite grid, a date-first global search, and an Our Suites page showing all properties. It does not prescribe a maximum number of homepage cards. On 12 November 2026 the user requested all properties on the homepage and two explicit card actions. This extends the brand board's initial one-CTA card direction while preserving the brief's primary date-first discovery path.

The local homepage now renders all six configured options from the shared property fixture data: Silos 1–4, Dairy and All Four Silos. The group is a combined option, not a sixth independent inventory. It must not be enabled for live checkout until Hostaway identity and blocking relationships are verified.

## Implemented HTML behaviour

- **View suite:** opens the corresponding property page with carried search values. Its existing booking review now links to the shared checkout preview.
- **Check availability:** opens one reusable native dialog populated for the selected property, with a calendar, guests limited to its capacity, minimum-stay validation, date-range validation and a sample quote. It does not navigate through the property page.
- Reserved fixture nights cannot be arrivals. Ranges crossing a reserved night cannot continue. A valid departure may fall on the first unavailable night because that night is not occupied by the departing guest.
- Group fixture calendars combine individual silo blocks; silo fixture calendars also honour a group block. Dairy remains separate.
- The shortcut starts with the existing search values, lets guests revise them, and carries the selected property/dates/guests into checkout.html. The two paths converge on the same checkout preview and validation.
- Mobile uses a full-height scrolling dialog; desktop uses calendar and summary columns. Escape, explicit close, outside click, native modal focus and focus return are supported.
- The checkout preview revalidates fixture inputs, rejects unknown properties/invalid ranges, shows an itemised sample total, and provides no active payment/reservation action. No inventory is held or API reservation created.

Source: prototype/app.mjs (data-rendered cards), quick-booking.mjs, quick-booking.css, checkout.html, checkout.mjs, checkout.css. These remain local review code. No plugin or released Elementor payload changed in this iteration.

## Production implementation decision

Use the existing versioned WordPress booking plugin with PHP rendering plus small JavaScript modules. React is unnecessary for this flow. Do not embed API credentials or booking logic in Elementor HTML widgets.

1. **Editable property records.** Maintain the card photograph, description, feature text, property-page URL, visibility and ordering in client-editable WordPress records. Associate each record with a verified Hostaway listing ID. Provider-managed capacity, inventory, restrictions, prices and transaction state remain authoritative. Validate editorial/provider conflicts rather than silently accepting them.
2. **Dynamic Elementor grid widget.** Render cards in PHP from these records and safe cached Hostaway metadata. Give the client widget controls for which properties appear, order, columns and visual styling. The surrounding homepage remains native Elementor. Shared card layout is edited once; property content is edited in its records rather than in duplicated page markup. Provide a shortcode fallback for non-Elementor use.
3. **Shared popup component.** Enqueue one dialog/runtime per page. Buttons carry only the public property identifier. Fetch narrow calendar/restriction data through our WordPress server; include loading, retry, unavailable and stale-calendar states. No guest/reservation records are returned to the browser.
4. **Authoritative quotes.** Both property-page booking panels and the popup use the same server quote service. Validate property, arrival/departure in America/Denver, guests, minimum/maximum stays, closed arrivals/departures, fees, taxes and configured extras. Treat cached calendars as browsing information, not proof of a booking hold. Browser-supplied amounts are never payable totals.
5. **One checkout-session service.** Revalidate availability and the quote before redirecting to the verified checkout route. Bind any custom session to its owner, listing, dates, guests, extras, currency, quote expiry and acceptance of any changed total. Do not use client storage or URL amounts as payment authority. Prevent duplicate session/reservation submission through the proven provider lifecycle.
6. **Same operational system.** The shortcut must preserve every current Hostaway add-on and the existing processor, with the same reservation, channel-blocking, messaging and recovery outcomes as the detail-page route. If hosted checkout requires a domain handoff, document that against the brief's on-site checkout requirement and obtain the required decision. Do not assume iframe embedding or a custom reservation hold is supported.
7. **Rollout.** Configure staging credentials privately; verify live calendar/quote/checkout capabilities; implement adapter/widget/endpoints; bump Booking plugin for each delivered update; test both routes under an approved reservation/payment procedure; then convert the approved homepage into Elementor. Keep the imported static cards until the replacement widget is ready for review; never present fixture prices as live values.

## Verification

`tests/quick-booking-browser.mjs` passes against the local server for six dynamically rendered cards, all six property-specific titles/capacity limits, focus return, reserved arrivals, ranges crossing blocks, valid turnover departure, group child blocking, minimum stays, guest/date carry, both routes into the same checkout, malformed checkout parameters, mobile layout and no JavaScript runtime errors. The existing site smoke test is updated to expect six homepage cards. These are fixture/UI tests, not evidence of live checkout or synchronisation.
