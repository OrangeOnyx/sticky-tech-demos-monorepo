"""Mint a LiveKit room token and serve the HTML client.

Windows / Unix:

    uv run python client/token_server.py
    uv run python client/token_server.py --host 127.0.0.1 --port 8765
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from dotenv import load_dotenv
from livekit import api

APP_ROOT = Path(__file__).resolve().parent.parent
CLIENT_DIR = Path(__file__).resolve().parent
INDEX_HTML = CLIENT_DIR / "index.html"

load_dotenv(APP_ROOT / ".env")
load_dotenv(APP_ROOT / ".env.local")

if str(APP_ROOT) not in sys.path:
    sys.path.insert(0, str(APP_ROOT))

from vesper.config import DEFAULT_AGENT_NAME, DEFAULT_ROOM, Settings  # noqa: E402


def mint_token(settings: Settings, identity: str) -> str:
    grants = api.VideoGrants(
        room_join=True,
        room=settings.room,
        can_publish=True,
        can_subscribe=True,
        can_publish_data=True,
    )
    token = (
        api.AccessToken(settings.livekit_api_key, settings.livekit_api_secret)
        .with_identity(identity)
        .with_name(identity)
        .with_grants(grants)
    )
    # Dispatch the named Vesper worker into this room (one agent_name only).
    room_config = api.RoomConfiguration(
        agents=[api.RoomAgentDispatch(agent_name=settings.agent_name)]
    )
    token = token.with_room_config(room_config)
    return token.to_jwt()


class Handler(BaseHTTPRequestHandler):
    server_version = "VesperToken/0.1"

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        sys.stderr.write(f"{self.address_string()} - {format % args}\n")

    def _send(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path in {"/", "/index.html"}:
            self._send(200, INDEX_HTML.read_bytes(), "text/html; charset=utf-8")
            return
        if parsed.path == "/health":
            self._send(200, b'{"ok":true}\n', "application/json")
            return
        if parsed.path == "/token":
            settings = Settings.from_env()
            missing = [
                name
                for name, value in (
                    ("LIVEKIT_URL", settings.livekit_url),
                    ("LIVEKIT_API_KEY", settings.livekit_api_key),
                    ("LIVEKIT_API_SECRET", settings.livekit_api_secret),
                )
                if not value
            ]
            if missing:
                payload = json.dumps(
                    {"error": f"Missing {', '.join(missing)} in .env"}
                ).encode()
                self._send(500, payload, "application/json")
                return
            query = parse_qs(parsed.query)
            identity = (query.get("identity") or ["vesper-user"])[0][:64]
            body = json.dumps(
                {
                    "url": settings.livekit_url,
                    "token": mint_token(settings, identity),
                    "room": settings.room,
                    "agentName": settings.agent_name,
                }
            ).encode()
            self._send(200, body, "application/json")
            return
        self._send(404, b"not found\n", "text/plain; charset=utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Serve the Vesper HTML client and mint tokens")
    parser.add_argument("--host", default=os.getenv("VESPER_CLIENT_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.getenv("VESPER_CLIENT_PORT", "8765")))
    args = parser.parse_args()

    settings = Settings.from_env()
    print(f"Vesper client  http://{args.host}:{args.port}/")
    print(f"Agent name     {settings.agent_name or DEFAULT_AGENT_NAME}")
    print(f"Room           {settings.room or DEFAULT_ROOM}")
    print("Start the worker separately:  python agent.py dev")
    print("One worker only — a second `dev` process is a second Vesper.")
    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
