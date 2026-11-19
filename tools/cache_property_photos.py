#!/usr/bin/env python3
"""Download five public listing photos per suite from verified Hostaway metadata, without API credentials in requests."""
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, build_opener
from hostaway_discover import NoRedirect, read_private
ROOT = Path(__file__).resolve().parents[1]
IDS = {'silo-1':'143824', 'silo-2':'143823', 'silo-3':'143826', 'silo-4':'143825', 'dairy':'603415'}


def download(task):
    slug, index, image = task
    url = image['url']; parts = urlsplit(url)
    if parts.scheme != 'https' or parts.hostname != 'hostaway-platform.s3.us-west-2.amazonaws.com' or parts.username or parts.password or parts.query or parts.fragment:
        raise ValueError('Unapproved public photo URL')
    with build_opener(NoRedirect()).open(Request(url, headers={'Accept':'image/jpeg,image/png,image/webp'}), timeout=30) as response:
        raw = response.read(12 * 1024 * 1024 + 1)
    if len(raw) > 12 * 1024 * 1024: raise ValueError('Photo too large')
    if raw.startswith(b'\xff\xd8\xff'): suffix = '.jpg'
    elif raw.startswith(b'\x89PNG\r\n\x1a\n'): suffix = '.png'
    elif raw[:4] == b'RIFF' and raw[8:12] == b'WEBP': suffix = '.webp'
    else: raise ValueError('Unexpected photo format')
    target = ROOT / 'prototype/assets/properties' / slug / ('photo-'+str(index+1)+suffix)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(raw)
    return slug, index, {'file':target.relative_to(ROOT/'prototype/assets').as_posix(), 'source_url':url, 'listing_id':IDS[slug]}


def main():
    listings = {str(r['id']):r for r in read_private('hostaway-booking-proof.json')['listings']}
    tasks = []
    for slug, listing_id in IDS.items():
        images = sorted(listings[listing_id]['images'], key=lambda image: image.get('sortOrder') if isinstance(image.get('sortOrder'), (int,float)) else 9999)
        images = list({i['url']:i for i in images}.values())[:5]
        if len(images) != 5: raise ValueError('Five verified photos required per listing')
        tasks.extend((slug, n, image) for n, image in enumerate(images))
    result = {slug:[] for slug in IDS}
    with ThreadPoolExecutor(max_workers=4) as pool:
        for slug, index, row in pool.map(download, tasks):
            result[slug].append((index, row))
    manifest = {slug:[row for _, row in sorted(rows)] for slug, rows in result.items()}
    (ROOT/'prototype/assets/properties/sources.json').write_text(json.dumps(manifest, indent=2)+'\n')
    (ROOT/'prototype/client-property-photos.mjs').write_text('// Public listing photos from the property-specific Hostaway metadata.\nexport const propertyPhotoFiles = '+json.dumps({slug:[r['file'] for r in rows] for slug, rows in manifest.items()},indent=2)+';\n')
    print('Downloaded five property-specific public Hostaway photos for each of the five individual properties.')


if __name__ == '__main__':
    try: main()
    except Exception:
        raise SystemExit('Photo download stopped. No private configuration or provider payload displayed.')
