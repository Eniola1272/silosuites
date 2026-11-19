#!/usr/bin/env python3
"""Read-only review availability probe. Never saves review text, guest data or private feedback."""
import json
import time
from collections import Counter
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, build_opener
from hostaway_discover import BASE, NoRedirect, read_private, request_json, save_private

PROPERTIES = [('silo-1', '143824'), ('silo-2', '143823'), ('silo-3', '143826'), ('silo-4', '143825'), ('dairy', '603415')]


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
    summary = []
    for slug, listing_id in PROPERTIES:
        # Bracketed listing/status filters are required by the documented API.
        query = urlencode({'listingMapIds[]': listing_id, 'type': 'guest-to-host', 'statuses[]': 'published', 'limit': 100, 'offset': 0, 'sortBy': 'submittedAt', 'sortOrder': 'desc'})
        req = Request(BASE + '/reviews?' + query, headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/json'}, method='GET')
        with build_opener(NoRedirect()).open(req, timeout=25) as response:
            raw = response.read(8 * 1024 * 1024 + 1)
        if len(raw) > 8 * 1024 * 1024:
            raise ValueError('Oversized response')
        data = json.loads(raw)
        rows = data.get('result')
        if data.get('status') != 'success' or not isinstance(rows, list):
            raise ValueError('Unexpected review response')
        if any(str(r.get('listingMapId')) != listing_id or r.get('type') != 'guest-to-host' or r.get('status') != 'published' for r in rows):
            raise ValueError('Provider did not enforce the review filters')
        # Only counts leave memory. Never log or persist the full provider payload.
        summary.append({'property': slug, 'published_count': data.get('count'), 'sample_size': len(rows), 'sample_with_public_text': sum(bool(str(r.get('publicReview') or '').strip()) for r in rows), 'sample_with_rating': sum(r.get('rating') is not None for r in rows), 'sample_channels': dict(Counter(str(r.get('channelId')) for r in rows)), 'review_field_names': sorted(set(k for r in rows for k in r)), 'visibility_flags': {k: dict(Counter(str(r.get(k)) for r in rows)) for k in sorted(set(k for r in rows for k in r if any(term in k.lower() for term in ['hidden', 'visible', 'visibility'])))}, 'rating_range_by_channel': {c: [min(float(r['rating']) for r in rows if str(r.get('channelId')) == c and r.get('rating') is not None), max(float(r['rating']) for r in rows if str(r.get('channelId')) == c and r.get('rating') is not None)] for c in sorted(set(str(r.get('channelId')) for r in rows if r.get('rating') is not None))}})
    report = {'checked_at_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'scope': 'Published guest-to-host review counts; up to 100 sampled per property; no text or guest data saved; no publishing or other mutations.', 'properties': summary}
    save_private('hostaway-review-counts.json', report)
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    try:
        main()
    except HTTPError as error:
        raise SystemExit('Hostaway returned HTTP ' + str(error.code) + '; response details suppressed.')
    except (URLError, OSError, ValueError, TypeError, KeyError):
        raise SystemExit('Review probe could not complete securely. No credentials or provider payload displayed.')
