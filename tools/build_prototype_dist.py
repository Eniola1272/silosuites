#!/usr/bin/env python3
"""Build a clean static distribution and Netlify Drop package from prototype/."""
import io
from pathlib import Path
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PROTOTYPE = ROOT / "prototype"
DIST = ROOT / "dist"
RELEASES = ROOT / "releases"


def build():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True, exist_ok=True)
    RELEASES.mkdir(parents=True, exist_ok=True)

    # Copy prototype files, excluding OS junk
    file_count = 0
    for item in PROTOTYPE.rglob("*"):
        if not item.is_file():
            continue
        if item.name == ".DS_Store" or item.name.startswith("._"):
            continue
        rel = item.relative_to(PROTOTYPE)
        target = DIST / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, target)
        file_count += 1

    # Netlify clean URL rewrites and redirects
    redirects = (
        "/our-silo-suites      /stays.html            301\n"
        "/stays                /stays.html            200\n"
        "/hot-springs          /hot-springs.html      200\n"
        "/local-guide          /local-guide.html      200\n"
        "/checkout             /checkout.html         200\n"
        "/silo-suite-1         /suite.html?id=silo-1  302\n"
        "/silo-suite-2         /suite.html?id=silo-2  302\n"
        "/silo-suite-3         /suite.html?id=silo-3  302\n"
        "/silo-suite-4         /suite.html?id=silo-4  302\n"
        "/the-dairy-suite      /suite.html?id=dairy   302\n"
        "/entire-silo-suites   /suite.html?id=all-silos 302\n"
    )
    (DIST / "_redirects").write_text(redirects)

    # Netlify headers for private preview and JS MIME types
    headers = (
        "/*\n"
        "  X-Robots-Tag: noindex, nofollow\n"
        "  X-Frame-Options: SAMEORIGIN\n"
        "  X-Content-Type-Options: nosniff\n"
        "\n"
        "/*.mjs\n"
        "  Content-Type: text/javascript\n"
    )
    (DIST / "_headers").write_text(headers)

    # Create root-level Netlify Drop ZIP
    zip_path = RELEASES / "silosuites-prototype-netlify.zip"
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p in sorted(DIST.rglob("*")):
            if not p.is_file():
                continue
            name = p.relative_to(DIST).as_posix()
            z.write(p, arcname=name)

    zip_path.write_bytes(buffer.getvalue())
    zip_mb = len(buffer.getvalue()) / (1024 * 1024)

    print(f"Successfully built static site in {DIST.relative_to(ROOT)} ({file_count} files).")
    print(f"Netlify Drop ZIP created: {zip_path.relative_to(ROOT)} ({zip_mb:.2f} MB).")


if __name__ == "__main__":
    build()

