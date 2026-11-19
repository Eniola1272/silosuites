#!/usr/bin/env python3
"""Serve the design preview only, bound to this computer's loopback interface."""
import argparse
import json
import time
from datetime import datetime
from urllib.parse import urlsplit, parse_qs
from hostaway_discover import read_private
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PUBLIC = Path(__file__).resolve().parents[1] / "prototype"


class PreviewHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if urlsplit(self.path).path == '/api/property-reviews':
            params = parse_qs(urlsplit(self.path).query)
            values = params.get('property', [])
            if len(values) != 1 or values[0] not in ['silo-1', 'silo-2', 'silo-3', 'silo-4', 'dairy']:
                self.send_error(400)
                return
            try:
                result = read_private('hostaway-public-reviews.json')[values[0]]
                if time.time() - datetime.fromisoformat(result['checked_at_utc']).timestamp() > 7 * 86400:
                    raise ValueError('Expired review preview cache')
                body = json.dumps(result).encode()
            except (OSError, ValueError, KeyError, TypeError):
                self.send_error(503, 'Reviews are unavailable. Refresh the private local review cache.')
                return
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def translate_path(self, path):
        candidate = Path(super().translate_path(path)).resolve()
        if PUBLIC != candidate and PUBLIC not in candidate.parents:
            return str(PUBLIC / "__not_found__")
        return str(candidate)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Robots-Tag", "noindex, nofollow")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def list_directory(self, path):
        self.send_error(404)
        return None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4173)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(PreviewHandler, directory=str(PUBLIC)))
    print(f"Silo Suites preview: http://127.0.0.1:{args.port}", flush=True)
    print("Only prototype/ is public. Stop with Ctrl+C.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
