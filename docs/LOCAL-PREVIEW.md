# Silo Suites local preview

## Open the site

From the project folder, run:

```sh
python3 tools/serve.py
```

Open **http://127.0.0.1:4173**. To use another port: `python3 tools/serve.py --port 4174`.

The preview is plain HTML, CSS, and JavaScript. There is no npm install or build step. Serve the site rather than opening HTML directly, so browser modules and navigation work correctly. Only `prototype/` is served; the project root and `.secrets/` are not public. The server is bound to this computer, not the local network.

## Included in the first design build

- Responsive homepage with the supplied original logo, interior photography, suite cards, farm story, Stay & Soak, local-guide preview, and footer.
- Our Suites / sample availability results, with All Suites, Silos, and Group Stays filters.
- All six property variants, using one layout, a lightbox, sample quotes, and a sticky phone booking action.
- Hot Springs and Local Guide pages, including external destination links and telephone links.
- Full-screen phone date picker and two-month desktop picker, keyboard support, guest selection, and dates carried between pages through URLs and browser storage.
- A stay-review dialog that explicitly creates no reservation and takes no payment.

The Design preview button opens review notes. All booking data is synthetic: nightly rates, fees, tax, availability blocks, minimum stays, group capacity, and room facts are for design review. Do not interpret displayed totals as live quotes. Image-to-suite assignments still need to be reconciled with Hostaway. The prototype does not include a live checkout, plugin, or Elementor exports yet.

Sample calendar blocks are relative to the current property-local date. For example, Silo 3 is blocked from day 7 through day 10. A blocked child suppresses the All Four Silos option; a group block suppresses each child. Dairy is independent.

## Configure the Hostaway key privately

Run this in your own terminal:

```sh
python3 tools/configure_hostaway.py
```

Enter the **Hostaway Account ID** and API key at the hidden prompts. Hostaway's API expects the account ID as `client_id`; an integration/API-key row identifier may not be the same value. [Hostaway API reference](https://api.hostaway.com/documentation).

The helper saves `.secrets/hostaway.json` with owner-only permissions inside an owner-only folder. `.gitignore` excludes this folder. Nothing is transmitted during configuration. Do not paste the key into chat or put it in the HTML, browser storage, a screenshot, or a command-line argument.

After saving, run the optional read-only connection check:

```sh
python3 tools/hostaway_discover.py
```

It authenticates against Hostaway and reads listing metadata only. The access token and a small allowlisted report remain in `.secrets/`; no token or response payload is printed. It does not read reservations, guests, or messages, and it does not alter bookings, inventory, payments, or webhooks. This is an initial connection check, not proof that every add-on or custom checkout requirement is supported. The helper has been syntax-checked but cannot be verified against the account until credentials are configured.

These scripts are development utilities. The eventual WordPress plugin will use production server configuration and WordPress APIs; it will not depend on Python or this preview server.

## Edit and verify

- `prototype/index.html`: homepage content and layout.
- `prototype/styles.css`: responsive component and page styles.
- `shared/tokens.css`: master brand tokens; copy changes to `prototype/assets/tokens.css` for the current standalone preview.
- `prototype/app.mjs`: navigation, date picker, galleries, and rendering.
- `prototype/booking.mjs`: isolated sample booking data and date/eligibility logic.
- `prototype/assets/sources.json`: original asset provenance.

Booking logic checks use Node's built-in test runner:

```sh
node --test tests/booking.test.mjs
```

Optional browser verification uses `tests/browser-smoke.mjs`, Playwright, and a local browser. Set `SILO_PLAYWRIGHT_MODULE` to the available Playwright package and `SILO_CHROME_EXECUTABLE` if using an existing Chrome. It checks the date-first journey, filters, property review, gallery, mobile controls, responsive overflow, and private-file isolation. Screenshots are saved in the ignored `test-results/` folder. Browser checks use local fixtures and never access the client's Hostaway account.

No plugin code has been created in this milestone. The mandatory version bump applies when the first plugin build is delivered and on every subsequent plugin update.
