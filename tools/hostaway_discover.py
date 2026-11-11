#!/usr/bin/env python3
"""Read-only Hostaway connection check. Never requests reservations, guests, or messages."""
import json
import os
from pathlib import Path
import stat
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener

PRIVATE = Path(__file__).resolve().parents[1] / ".secrets"
BASE = "https://api.hostaway.com/v1"


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None  # Do not forward an API credential to any redirected destination.


def read_private(name):
    path = PRIVATE / name
    if PRIVATE.is_symlink() or path.is_symlink():
        raise ValueError("Private files must not be symbolic links.")
    if stat.S_IMODE(PRIVATE.stat().st_mode) & 0o077 or stat.S_IMODE(path.stat().st_mode) & 0o077:
        raise ValueError("Private folder/files are readable by other users. Re-run configuration.")
    return json.loads(path.read_text())


def save_private(name, value):
    fd, temporary = tempfile.mkstemp(prefix=".discovery-", dir=PRIVATE)
    try:
        with os.fdopen(fd, "w") as stream:
            os.fchmod(stream.fileno(), 0o600)
            json.dump(value, stream, indent=2)
            stream.write("\n")
        os.replace(temporary, PRIVATE / name)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def request_json(path, token=None, auth=None):
    # This helper has exactly two permitted operations: authenticate, then read listings.
    if auth is not None and path != "/accessTokens":
        raise ValueError("Unsupported operation.")
    if auth is None and not path.startswith("/listings?"):
        raise ValueError("Unsupported read endpoint.")
    headers = {"Accept": "application/json"}
    data = None
    if auth is not None:
        data = urlencode(auth).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    if token:
        headers["Authorization"] = "Bearer " + token
    req = Request(BASE + path, data=data, headers=headers, method="POST" if auth is not None else "GET")
    with build_opener(NoRedirect()).open(req, timeout=25) as response:
        raw = response.read(8 * 1024 * 1024 + 1)
        if len(raw) > 8 * 1024 * 1024:
            raise ValueError("Unexpectedly large API response.")
        result = json.loads(raw)
    if not isinstance(result, dict) or result.get("status") == "fail":
        raise ValueError("Hostaway did not return a successful response.")
    return result


def main():
    try:
        credentials = read_private("hostaway.json")
    except FileNotFoundError:
        raise SystemExit("Run python3 tools/configure_hostaway.py first. Do not paste credentials into chat.")
    account_id = str(credentials.get("account_id", ""))
    if not account_id.isascii() or not account_id.isdigit() or not credentials.get("client_secret"):
        raise ValueError("Private configuration is incomplete.")
    try:
        cached = read_private("hostaway-token.json")
    except FileNotFoundError:
        cached = {}
    token = cached.get("access_token")
    if not token or cached.get("account_id") != account_id or float(cached.get("expires_at", 0)) <= time.time() + 60:
        result = request_json("/accessTokens", auth={"grant_type": "client_credentials", "client_id": account_id, "client_secret": credentials["client_secret"], "scope": "general"})
        token = result.get("access_token")
        if not isinstance(token, str) or not token:
            raise ValueError("No access token was returned. Verify the Hostaway Account ID and API key.")
        save_private("hostaway-token.json", {"account_id": account_id, "access_token": token, "expires_at": time.time() + float(result.get("expires_in", 3600))})
        time.sleep(1)
    listings = []
    for page in range(20):
        result = request_json("/listings?" + urlencode({"limit": 100, "offset": page * 100}), token=token)
        batch = result.get("result")
        if not isinstance(batch, list):
            raise ValueError("Unexpected listings response. Check the current API documentation.")
        for listing in batch:
            if not isinstance(listing, dict):
                raise ValueError("Unexpected listing record.")
            # Explicit allowlist: no full listing payload, owner details, or private access instructions.
            row = {field: listing.get(field) for field in ("name", "personCapacity", "bedroomsNumber", "bathroomsNumber", "bedsNumber", "currencyCode")}
            row["id"] = str(listing.get("id", ""))
            row["image_count"] = len(listing.get("listingImages") or [])
            row["fee_settings_present"] = bool(listing.get("listingFeeSetting"))
            listings.append(row)
        if len(batch) < 100:
            break
    else:
        raise ValueError("Listing pagination limit reached; no incomplete report was saved.")
    save_private("hostaway-discovery.json", {"checked_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "scope": "Authentication and listing metadata only; no checkout capabilities verified", "listings": listings})
    print(f"Connection succeeded. Retrieved metadata for {len(listings)} listings.")
    print("Sanitised report saved privately to .secrets/hostaway-discovery.json.")
    print("No reservations, guest records, messages, payments, inventory, or webhooks were changed.")
    print("Add-ons, group relationships, and payment capabilities still require separate verification.")


if __name__ == "__main__":
    try:
        main()
    except HTTPError as error:
        raise SystemExit(f"Hostaway returned HTTP {error.code}. Response details are suppressed to protect credentials. Verify account access or retry later.")
    except URLError:
        raise SystemExit("Could not connect securely to Hostaway. Check network access and try again.")
    except (ValueError, TypeError, KeyError, OSError):
        raise SystemExit("Discovery stopped: private configuration or the API response could not be validated. No response payload was printed. Reconfigure or review the helper locally.")
    except KeyboardInterrupt:
        raise SystemExit("\nDiscovery cancelled.")
