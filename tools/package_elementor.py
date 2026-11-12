#!/usr/bin/env python3
"""Validate and package the native templates and immutable installer release."""
import hashlib
import io
import json
from pathlib import Path
import re
import zipfile

ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'elementor/release.json').read_text())
VERSION=CONFIG['version']
PLUGIN=ROOT/'wordpress/plugins'/CONFIG['plugin_slug']
OUTPUT=ROOT/'releases'


def template_check(path):
    data=json.loads(path.read_text())
    assert data['version']=='0.4' and data['type'] in ('page','section') and data['content']
    ids=set(); headings=[]; widgets=[]
    def walk(nodes):
        for node in nodes:
            assert re.fullmatch(r'[a-f0-9]{8}',node['id']) and node['id'] not in ids
            ids.add(node['id'])
            assert isinstance(node['settings'],dict) and isinstance(node['elements'],list)
            if node['elType']=='widget':
                assert node['widgetType'] in ('heading','text-editor','button','image','html')
                widgets.append(node['widgetType'])
                if node['widgetType']=='heading' and node['settings'].get('header_size')=='h1':headings.append(node)
                link=node['settings'].get('link',{}).get('url','')
                assert 'hostingersite.com' not in link and '127.0.0.1' not in link
            else:assert node['elType']=='container'
            assert '__globals__' not in node['settings']
            walk(node['elements'])
    walk(data['content'])
    if data['type']=='page':
        assert len(headings)==1 and widgets.count('heading')>20
    elif 'popup-' in path.name:
        assert not headings and widgets.count('heading') >= 1
        assert any('sp-popup-source' in n['settings'].get('css_classes','') for n in data['content'])
    else:
        assert not headings and widgets.count('image')==1
        assert any(any(marker in n['settings'].get('css_classes','').split() for marker in ('ss-site-header','ss-site-footer')) for n in data['content'])
    raw=path.read_text()
    assert not any(value in raw for value in ('client_secret','access_token','elfsightcdn','file://'))


def archive(entries):
    result=io.BytesIO()
    with zipfile.ZipFile(result,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name,data in sorted(entries):
            info=zipfile.ZipInfo(name,(2026,11,11,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED
            info.external_attr=0o100644<<16
            z.writestr(info,data)
    return result.getvalue()


def release(name,data):
    path=OUTPUT/name
    if path.exists() and path.read_bytes()!=data:
        raise SystemExit(f'{name} already exists with different content. Bump the release/plugin version before packaging.')
    path.write_bytes(data)
    (OUTPUT/(name+'.sha256')).write_text(hashlib.sha256(data).hexdigest()+'  '+name+'\n')
    print(path.relative_to(ROOT),len(data),'bytes')


def main():
    php=(PLUGIN/'silosuites-design-importer.php').read_text()
    readme=(PLUGIN/'readme.txt').read_text()
    assert re.search(r'\* Version: '+re.escape(VERSION)+r'\s',php)
    assert f"const VERSION = '{VERSION}';" in php
    assert f'Stable tag: {VERSION}\n' in readme and f'= {VERSION} =' in readme
    parts=['home-content','home-complete','header','footer','property','property-complete','popup-about','popup-amenities','popup-rules','popup-cancellation']
    names=[f'silosuites-{part}-{VERSION}.json' for part in parts]
    for name in names:template_check(ROOT/'elementor'/name)
    manifest=json.loads((PLUGIN/'payload/media-manifest.json').read_text())
    assert len(manifest)>=16
    for asset in manifest:
        assert Path(asset['filename']).name==asset['filename']
        path=PLUGIN/'payload/assets'/asset['filename']
        assert hashlib.sha256(path.read_bytes()).hexdigest()==asset['sha256']
    for name,short in zip(names,[part+'.json' for part in parts]):
        assert (ROOT/'elementor'/name).read_bytes()==(PLUGIN/'payload'/short).read_bytes()
    entries=[]
    for p in PLUGIN.rglob('*'):
        if p.is_file():
            assert p.suffix.lower() in ('.php','.txt','.json','.png','.jpg','.jpeg')
            entries.append((CONFIG['plugin_slug']+'/'+str(p.relative_to(PLUGIN)),p.read_bytes()))
    installer=archive(entries)
    templates=archive([(name,(ROOT/'elementor'/name).read_bytes()) for name in names])
    OUTPUT.mkdir(exist_ok=True)
    release(f'silosuites-design-importer-{VERSION}.zip',installer)
    release(f'silosuites-home-templates-{VERSION}.zip',templates)
    release(f'silosuites-property-templates-{VERSION}.zip',archive([(name,(ROOT/'elementor'/name).read_bytes()) for name in names if '-property-' in name or '-popup-' in name]+[('PROPERTY-IMPORT.md',(ROOT/'elementor/PROPERTY-IMPORT.md').read_bytes())]))
    release(f'silosuites-header-footer-{VERSION}.zip',archive([(name,(ROOT/'elementor'/name).read_bytes()) for name in names if '-header-' in name or '-footer-' in name]))
    delivery=archive([('IMPORT.md',(ROOT/'elementor/IMPORT.md').read_bytes()),(f'silosuites-design-importer-{VERSION}.zip',installer),*[(name,(ROOT/'elementor'/name).read_bytes()) for name in names]])
    release(f'silosuites-homepage-delivery-{VERSION}.zip',delivery)
    release(f'silosuites-property-delivery-{VERSION}.zip',archive([('PROPERTY-IMPORT.md',(ROOT/'elementor/PROPERTY-IMPORT.md').read_bytes()),(f'silosuites-design-importer-{VERSION}.zip',installer),*[(name,(ROOT/'elementor'/name).read_bytes()) for name in names if '-property-' in name or '-popup-' in name]]))
    print('PASS: template structure, unique IDs, native widgets, media checksums, version consistency, payload parity, and immutable release checks.')


if __name__=='__main__':main()
