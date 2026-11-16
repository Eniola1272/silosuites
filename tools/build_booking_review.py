#!/usr/bin/env python3
"""Package booking pages only; original marketing pages stay on the client's live site."""
import shutil,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'prototype';OUT=ROOT/'dist-booking-review'
if OUT.exists():shutil.rmtree(OUT)
OUT.mkdir()
for p in PUBLIC.iterdir():
 if p.is_file() and p.suffix in ['.mjs','.css']:
  shutil.copyfile(p,OUT/p.name)
for name in ['stays.html','suite.html','checkout.html']:shutil.copyfile(PUBLIC/name,OUT/name)
shutil.copyfile(PUBLIC/'stays.html',OUT/'index.html')
shutil.copytree(PUBLIC/'assets',OUT/'assets',ignore=shutil.ignore_patterns('.DS_Store','._*'))
(OUT/'_headers').write_text('/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n/*.mjs\n  Content-Type: text/javascript; charset=utf-8\n')
(OUT/'_redirects').write_text('/our-silo-suites /stays.html 200\n/hot-springs https://silosuites.com/hot-springs/ 302\n/local-guide https://silosuites.com/local-guide/ 302\n'+''.join(f'/silo-suite-{i} /suite.html?id=silo-{i} 302\n' for i in range(1,5))+'/the-dairy-suite /suite.html?id=dairy 302\n/entire-silo-suites /suite.html?id=all-silos 302\n')
archive=ROOT/'releases/silosuites-booking-review-2026-11-16.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(OUT.rglob('*')):
  if p.is_file():z.write(p,p.relative_to(OUT).as_posix())
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 assert not any('.secrets' in n or n.endswith('.php') for n in z.namelist())
 assert 'hot-springs.html' not in z.namelist() and 'local-guide.html' not in z.namelist()
print('Built',archive.relative_to(ROOT),'- booking-only review; homepage is the suite search, marketing links use the unchanged live site.')
