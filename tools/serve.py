#!/usr/bin/env python3
"""Serve the design preview only, bound to this computer's loopback interface."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PUBLIC = Path(__file__).resolve().parents[1] / "prototype"


class PreviewHandler(SimpleHTTPRequestHandler):
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
