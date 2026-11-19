#!/usr/bin/env python3
"""Package an immutable, version-checked booking plugin. Never packages project secrets."""
import hashlib,io,re,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PLUGIN=ROOT/'wordpress/plugins/silosuites-booking'
source=(PLUGIN/'silosuites-booking.php').read_text()
version=re.search(r'\* Version: ([0-9]+\.[0-9]+\.[0-9]+)',source).group(1)
assert "const VERSION = '"+version+"';" in source
readme=(PLUGIN/'readme.txt').read_text()
assert 'Stable tag: '+version+'\n' in readme and '= '+version+' =' in readme
required=['silosuites-booking.php','includes/class-hostaway-client.php','includes/class-availability-service.php','includes/frontend.php','includes/widgets.php','includes/card-rates.php','data/starting-rates.json','includes/class-review-service.php','assets/reviews.js','assets/reviews.css','assets/booking.js','assets/booking.css','readme.txt']
for name in required:
 p=PLUGIN/name
 assert p.is_file() and not p.is_symlink(), 'Missing required runtime file: '+name
for name in ['reviews.js','reviews.css']:
 assert (PLUGIN/'assets'/name).read_bytes()==(ROOT/'prototype/assets'/('booking-'+name)).read_bytes(), 'Preview/release review asset mismatch: '+name
assert (PLUGIN/'data/starting-rates.json').read_bytes()==(ROOT/'shared/client-starting-rates.json').read_bytes(), 'Published card-rate default mismatch'
import json
preview_rates=re.search(r'const rates = (\{.*?\});', (ROOT/'prototype/client-starting-rates.mjs').read_text(), re.S)
assert preview_rates and json.loads(preview_rates.group(1))==json.loads((ROOT/'shared/client-starting-rates.json').read_text())['rates_minor'], 'Preview card-rate default mismatch'
buffer=io.BytesIO()
with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(PLUGIN.rglob('*')):
  if not p.is_file():continue
  assert (p.suffix in ('.php','.txt','.js','.css') or p.relative_to(PLUGIN).as_posix()=='data/starting-rates.json') and not p.is_symlink()
  name='silosuites-booking/'+p.relative_to(PLUGIN).as_posix()
  info=zipfile.ZipInfo(name,(2026,11,11,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
  z.writestr(info,p.read_bytes())
folder=ROOT/'releases';folder.mkdir(exist_ok=True)
target=folder/f'silosuites-booking-{version}.zip';content=buffer.getvalue()
if target.exists() and target.read_bytes()!=content:raise SystemExit('An archive already exists with different content. Increment the plugin version.')
target.write_bytes(content)
(target.with_suffix('.zip.sha256')).write_text(hashlib.sha256(content).hexdigest()+'  '+target.name+'\n')
print('PASS:',target.relative_to(ROOT),'version',version,'with no source outside the plugin directory.')
