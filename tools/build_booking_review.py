#!/usr/bin/env python3
"""Package booking pages for Netlify; optional anonymous public-review snapshot for client design review."""
import argparse
import json
import math
import re
import shutil
import zipfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'prototype'
OUT = ROOT / 'dist-booking-review'
PROPERTIES = ('silo-1', 'silo-2', 'silo-3', 'silo-4', 'dairy')


def export_review_snapshot():
    from hostaway_discover import read_private
    private = read_private('hostaway-public-reviews.json')
    dates, counts = {}, {}
    contact = re.compile(r'[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?<!\d)(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}(?!\d)', re.I)
    destination = OUT / 'data/reviews'
    destination.mkdir(parents=True)
    for slug in PROPERTIES:
        data = private[slug]
        assert data['property'] == slug and data['scale'] == 10
        checked = datetime.fromisoformat(data['checked_at_utc'])
        reviews = []
        for review in data['reviews']:
            # Copy only already-authorized public testimonial fields. Never copy raw provider/guest records.
            assert set(review) == {'text', 'rating', 'scale', 'source', 'month'}
            assert isinstance(review['text'], str) and review['text'].strip() and len(review['text'].encode()) <= 20000
            assert not contact.search(review['text']), 'Review contains contact information; snapshot export stopped.'
            assert review['source'] in ('Vrbo', 'Booking.com', 'Direct booking')
            assert not isinstance(review['rating'], bool) and isinstance(review['rating'], (int, float)) and math.isfinite(review['rating']) and 0 <= review['rating'] <= 10
            assert review['scale'] == 10 and isinstance(review['month'], str) and (not review['month'] or re.fullmatch(r'\d{4}-(0[1-9]|1[0-2])', review['month']))
            reviews.append({key: review[key] for key in ('text', 'rating', 'scale', 'source', 'month')})
        assert len(reviews) == data['count'] and len(reviews) <= 1000
        average = round(sum(review['rating'] for review in reviews) / len(reviews), 2) if reviews else None
        assert average is None and data['average'] is None or average is not None and abs(average - data['average']) < .011
        safe = {'property': slug, 'reviews': reviews, 'count': len(reviews), 'average': average, 'scale': 10, 'checked_at_utc': checked.isoformat()}
        (destination / (slug + '.json')).write_text(json.dumps(safe, ensure_ascii=False, allow_nan=False) + '\n')
        dates[slug] = checked.strftime('%B %d, %Y').replace(' 0', ' ')
        counts[slug] = len(reviews)
    module = OUT / 'property.mjs'
    source = module.read_text()
    assert source.count('data-api="/api/property-reviews"') == 1
    source = source.replace('data-api="/api/property-reviews"', 'data-api="/data/reviews/${s.id}.json"')
    source = 'const reviewSnapshotDates = ' + json.dumps(dates) + ';\n' + source
    source = source.replace('<section class="stay-section" id="reviews">', '<section class="stay-section" id="reviews"><p class="sample-note">Reviews shown as of ${reviewSnapshotDates[s.id]}.</p>', 1)
    module.write_text(source)
    app = OUT / 'app.mjs'
    source = app.read_text().replace('This is a local design preview. Dates, availability, room facts, and prices use sample data. No reservations or payments are sent.', 'This is a design preview. Dates, availability and prices are samples. No reservations or payments are sent.')
    source = source.replace('The original supplied logo is used unchanged. Photos are extracted from the supplied brand board; individual suite assignments and final property facts still need validation.', 'The original logo and client photographs are used. Reviews and ratings are shown from a dated, anonymous snapshot.')
    source = source.replace('Try the date picker, guest count, suite filters, room galleries, and mobile navigation. Live checkout will follow the Hostaway capability checks.', 'Try the dates, photos, amenities and review popups. This preview cannot reserve dates or take payment.')
    app.write_text(source)
    return counts


def build(with_reviews=False):
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    for path in PUBLIC.iterdir():
        if path.is_file() and path.suffix in ('.mjs', '.css'):
            shutil.copyfile(path, OUT / path.name)
    for name in ('stays.html', 'suite.html', 'checkout.html'):
        shutil.copyfile(PUBLIC / name, OUT / name)
    shutil.copyfile(PUBLIC / 'stays.html', OUT / 'index.html')
    shutil.copytree(PUBLIC / 'assets', OUT / 'assets', ignore=shutil.ignore_patterns('.DS_Store', '._*'))
    counts = export_review_snapshot() if with_reviews else None
    (OUT / '_headers').write_text('/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: SAMEORIGIN\n/*.mjs\n  Content-Type: text/javascript; charset=utf-8\n')
    (OUT / 'robots.txt').write_text('User-agent: *\nDisallow: /\n')
    (OUT / '_redirects').write_text('/our-silo-suites /stays.html 200\n/stays /stays.html 200\n/checkout /checkout.html 200\n/hot-springs https://silosuites.com/hot-springs/ 302\n/local-guide https://silosuites.com/local-guide/ 302\n' + ''.join(f'/silo-suite-{i} /suite.html?id=silo-{i} 302\n' for i in range(1, 5)) + '/the-dairy-suite /suite.html?id=dairy 302\n/entire-silo-suites /suite.html?id=all-silos 302\n')
    (OUT / 'README-NETLIFY.txt').write_text('Silo Suites client design preview\n\nUnzip the archive and upload this folder (the one containing index.html) to Netlify Drop: https://app.netlify.com/drop\nNo build command or API environment variables are required.\nThe opening page is Our suites. Open any property to review the updated design.\nThe Homepage, Hot Springs and Local Guide links open the unchanged live website.\nDates, availability and prices are samples; no reservations, holds or payments are created.\n' + ('Reviews/ratings are an anonymous public-review snapshot dated 18 November 2026, not a live feed. No guest names, private feedback or API credentials are bundled.\n' if with_reviews else 'Reviews require a connected backend and are not bundled in this build.\n'))
    name = 'silosuites-netlify-client-preview-2026-11-19-olive.zip' if with_reviews else 'silosuites-booking-review-2026-11-19-olive.zip'
    archive = ROOT / 'releases' / name
    archive.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as output:
        for path in sorted(OUT.rglob('*')):
            if path.is_file():
                output.write(path, path.relative_to(OUT).as_posix())
    with zipfile.ZipFile(archive) as output:
        assert output.testzip() is None
        assert not any('.secrets' in name or name.endswith('.php') or name.startswith('.') for name in output.namelist())
        assert 'hot-springs.html' not in output.namelist() and 'local-guide.html' not in output.namelist()
        assert 'index.html' in output.namelist()
    print('Built', archive.relative_to(ROOT), '(' + str(round(archive.stat().st_size / 1024 / 1024, 2)) + ' MiB)')
    if counts is not None:
        print('Anonymous public review snapshot counts:', json.dumps(counts))
    print('Opening page: Our suites. Original marketing links use the unchanged live site. Booking/payment submission is disabled.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--with-review-snapshot', action='store_true', help='Include only sanitized, anonymous eligible public reviews so client review sections work on static hosting.')
    args = parser.parse_args()
    try:
        build(args.with_review_snapshot)
    except (AssertionError, ValueError, OSError, KeyError, TypeError) as error:
        raise SystemExit('Build stopped: snapshot or asset validation failed. No private configuration or review payload displayed.')
