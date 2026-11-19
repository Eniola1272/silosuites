#!/usr/bin/env python3
"""Cache anonymized, display-eligible public reviews privately for the local HTML review."""
import json
import re
import time
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, build_opener
from hostaway_discover import BASE, NoRedirect, read_private, save_private, request_json
from hostaway_reviews_probe import PROPERTIES
SOURCES = {'2002': 'Vrbo', '2005': 'Booking.com', '2000': 'Direct booking', '2013': 'Direct booking', '2017': 'Direct booking'}


def normalize(row, listing_id):
    if str(row.get('listingMapId')) != listing_id or row.get('type') != 'guest-to-host' or row.get('status') != 'published':
        return None
    source = SOURCES.get(str(row.get('channelId')))
    if not source or row.get('bookingEngineVisibility') not in (1, '1') or row.get('isHidden') not in (0, '0') or row.get('isCancelled') not in (0, '0'):
        return None
    text = row.get('publicReview')
    rating = row.get('rating')
    if not isinstance(text, str) or len(text.encode()) > 20000 or isinstance(rating, bool):
        return None
    try:
        rating = float(rating)
    except (ValueError, TypeError):
        return None
    if not 0 <= rating <= 10:
        return None
    text = re.sub(r'<(script|style)\b[^>]*>.*?</\1\s*>', '', text, flags=re.I | re.S)
    text = re.sub(r'<[^>]*>', '', text).strip()
    if not text:
        return None
    date = re.match(r'^(\d{4}-(?:0[1-9]|1[0-2]))(?:-|$)', str(row.get('submittedAt', '')))
    return {'text': text, 'rating': rating, 'scale': 10, 'source': source, 'month': date[1] if date else ''}


def main():
    credentials = read_private('hostaway.json')
    try:
        cached = read_private('hostaway-token.json')
    except FileNotFoundError:
        cached = {}
    token = cached.get('access_token')
    if not token or cached.get('account_id') != str(credentials['account_id']) or cached.get('expires_at', 0) < time.time() + 60:
        auth = request_json('/accessTokens', auth={'grant_type': 'client_credentials', 'client_id': credentials['account_id'], 'client_secret': credentials['client_secret'], 'scope': 'general'})
        token = auth['access_token']
        save_private('hostaway-token.json', {'account_id': str(credentials['account_id']), 'access_token': token, 'expires_at': time.time() + auth['expires_in']})
        time.sleep(1)
    report = {}
    for slug, listing_id in PROPERTIES:
        reviews, seen = [], set()
        for page in range(10):
            query = urlencode({'listingMapIds[]': listing_id, 'type': 'guest-to-host', 'statuses[]': 'published', 'limit': 100, 'offset': page * 100, 'sortBy': 'submittedAt', 'sortOrder': 'desc'})
            req = Request(BASE + '/reviews?' + query, headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/json'}, method='GET')
            with build_opener(NoRedirect()).open(req, timeout=25) as response:
                raw = response.read(8 * 1024 * 1024 + 1)
            if len(raw) > 8 * 1024 * 1024:
                raise ValueError('Oversized response')
            data = json.loads(raw)
            rows = data.get('result')
            if data.get('status') != 'success' or not isinstance(rows, list) or len(rows) > 100:
                raise ValueError('Unexpected response')
            for row in rows:
                if str(row.get('listingMapId')) != listing_id or row.get('type') != 'guest-to-host' or row.get('status') != 'published':
                    raise ValueError('Review filters were not enforced')
                review = normalize(row, listing_id)
                if review:
                    review_id = str(row.get('id', ''))
                    if not re.fullmatch(r'[0-9]{1,32}', review_id) or review_id in seen:
                        raise ValueError('Invalid or duplicate review')
                    seen.add(review_id)
                    reviews.append(review)
            if len(rows) < 100:
                break
        else:
            raise ValueError('Review pagination limit reached')
        count = len(reviews)
        report[slug] = {'property': slug, 'reviews': reviews, 'count': count, 'average': round(sum(r['rating'] for r in reviews) / count, 2) if count else None, 'scale': 10, 'checked_at_utc': datetime.now(timezone.utc).isoformat()}
    save_private('hostaway-public-reviews.json', report)
    print(json.dumps({'cached_eligible_counts': {slug: r['count'] for slug, r in report.items()}, 'scope': 'Read-only; anonymized visible public reviews cached privately. No names, private feedback, reservation IDs or credentials exported.'}))


if __name__ == '__main__':
    try:
        main()
    except HTTPError as error:
        raise SystemExit('Hostaway returned HTTP ' + str(error.code) + '; response details suppressed.')
    except (URLError, OSError, ValueError, TypeError, KeyError):
        raise SystemExit('Review cache could not be refreshed securely. No provider payload or credentials displayed.')
