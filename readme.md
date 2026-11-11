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

The homepage is now also available as two native Elementor page templates plus independent header/footer saved sections, using original photos from the supplied current-homepage JSON. The optional **Silo Suites Design Importer 0.1.1** imports those photos, the supplied logo, and the saved templates without replacing existing pages. See [Elementor import instructions](elementor/IMPORT.md) and [verification](docs/ELEMENTOR-VERIFICATION.md).

```sh
python3 tools/serve.py
```

Open **http://127.0.0.1:4173**. The preview now uses original Elementor-export photos and supplied logo files. Booking data is explicitly synthetic; no reservation or payment can be made. The native homepage templates and media installer are implemented; the Hostaway booking connector and live checkout remain later milestones.

Configure Hostaway credentials at hidden terminal prompts with `python3 tools/configure_hostaway.py`. Optional connection check: `python3 tools/hostaway_discover.py`. Credentials and reports remain outside the served folder in ignored `.secrets/`. Live account verification is pending secure configuration.

Next milestone: review the imported homepage on staging, validate the Hostaway integration path, and replace preview booking components with the real connector.

## Plugin releases

Every delivered plugin update must increment its version and include a changelog entry. The current design importer is `0.1.1`; earlier `0.1.0` artifacts remain unchanged; the Hostaway booking plugin has not been implemented yet. Elementor's JSON schema version remains `0.4` and is separate from plugin release numbering.

Rebuild the templates and payload with `python3 tools/build_elementor.py`. Package a release with `python3 tools/package_elementor.py`; this checks version consistency, native structure, media hashes, and prevents changed content from replacing an existing release ZIP under the same version.
