#!/usr/bin/env python3
"""Save Hostaway credentials privately. Never accepts secrets as CLI arguments."""
import getpass
import json
import os
import sys
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parents[1]
PRIVATE = ROOT / ".secrets"


def main():
    if not sys.stdin.isatty():
        raise SystemExit("Run this helper in an interactive terminal so credential input can stay hidden.")
    print("Hostaway local configuration. Input is hidden; nothing is sent to Hostaway.")
    print("Use the Account ID required by Hostaway's API, not an API-key row ID.")
    account_id = getpass.getpass("Hostaway Account ID (hidden): ").strip()
    secret = getpass.getpass("Hostaway API secret key (hidden): ").strip()
    if not account_id or not account_id.isascii() or not account_id.isdigit() or not secret:
        raise SystemExit("Not saved: a numeric Account ID and nonempty API key are required.")
    PRIVATE.mkdir(mode=0o700, exist_ok=True)
    if PRIVATE.is_symlink():
        raise SystemExit("Not saved: the private folder must not be a symbolic link.")
    os.chmod(PRIVATE, 0o700)
    fd, temp_name = tempfile.mkstemp(prefix=".hostaway-", dir=PRIVATE)
    try:
        with os.fdopen(fd, "w") as stream:
            os.fchmod(stream.fileno(), 0o600)
            json.dump({"account_id": account_id, "client_secret": secret}, stream)
            stream.write("\n")
        os.replace(temp_name, PRIVATE / "hostaway.json")
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)
    print("Saved privately in .secrets/hostaway.json. Do not share or upload this file.")
    print("The prototype server only serves prototype/ and cannot serve this folder.")


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        raise SystemExit("\nCancelled. No credentials saved.")
