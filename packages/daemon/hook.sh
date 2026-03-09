#!/usr/bin/env bash
set -euo pipefail

SOCKET_PATH="/tmp/clearclaw.sock"
PAYLOAD="${1:-}"

if [ -z "$PAYLOAD" ]; then
  echo "no payload provided" >&2
  exit 1
fi

if [ ! -S "$SOCKET_PATH" ]; then
  echo "socket not found at $SOCKET_PATH" >&2
  exit 1
fi

printf '%s\n' "$PAYLOAD" | nc -U "$SOCKET_PATH"
