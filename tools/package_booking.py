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
buffer=io.BytesIO()
with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(PLUGIN.rglob('*')):
  if not p.is_file():continue
  assert p.suffix in ('.php','.txt') and not p.is_symlink()
  name='silosuites-booking/'+p.relative_to(PLUGIN).as_posix()
  info=zipfile.ZipInfo(name,(2026,11,11,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
  z.writestr(info,p.read_bytes())
folder=ROOT/'releases';folder.mkdir(exist_ok=True)
target=folder/f'silosuites-booking-{version}.zip';content=buffer.getvalue()
if target.exists() and target.read_bytes()!=content:raise SystemExit('An archive already exists with different content. Increment the plugin version.')
target.write_bytes(content)
(target.with_suffix('.zip.sha256')).write_text(hashlib.sha256(content).hexdigest()+'  '+target.name+'\n')
print('PASS:',target.relative_to(ROOT),'version',version,'with no source outside the plugin directory.')
