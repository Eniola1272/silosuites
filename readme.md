# Silo Suites

Website and direct-booking project for Silo Suites in La Verkin, Utah.

The implementation sequence is local HTML design and review, native Elementor conversion, then the production Hostaway booking integration and acceptance testing. Hostaway remains the operational source of truth.

## Project documents

- [Implementation plan](docs/IMPLEMENTATION-PLAN.md): scope, page map, design direction, PHP plugin architecture, Elementor delivery, release rules, and acceptance criteria.
- [Discovery record](docs/HOSTAWAY-DISCOVERY.md): source review, initial public-site findings, account questions, and integration proof requirements.
- [Written design brief](<docs/SILO SUITES DESIGN BRIEF.docx>).
- [Visual brand board](<docs/SILO SUITES VISUAL BRAND BOARD new.pdf>).
- [Project instructions](AGENTS.md), including the mandatory plugin version increment rule.

## Current state

The first local HTML design build is ready: homepage, suites/search, six property variants, Hot Springs, Local Guide, date selection, galleries, and sample stay review. Read [Local preview and secure API setup](docs/LOCAL-PREVIEW.md).

```sh
python3 tools/serve.py
```

Open **http://127.0.0.1:4173**. The preview uses original reference photographs and supplied logo files. Booking data is explicitly synthetic; no reservation or payment can be made. WordPress, Elementor exports, and the PHP plugin remain later milestones.

Configure Hostaway credentials at hidden terminal prompts with `python3 tools/configure_hostaway.py`. Optional connection check: `python3 tools/hostaway_discover.py`. Credentials and reports remain outside the served folder in ignored `.secrets/`. Live account verification is pending secure configuration.

Next milestone: refine the HTML design and validate the Hostaway integration path before Elementor conversion.

## Plugin releases

Every delivered plugin update must increment its version and include a changelog entry. The first installable development version will be `0.1.0`; there is no plugin version yet. Templates and prototype revisions are tracked separately from plugin releases.
