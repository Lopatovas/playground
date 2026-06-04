#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.quicktunnel.yml"

echo "Starting stack + Cloudflare quick tunnel..."
$COMPOSE up -d --build

echo "Waiting for trycloudflare.com URL..."
for _ in $(seq 1 30); do
  url=$($COMPOSE logs cloudflared 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1 || true)
  if [ -n "$url" ]; then
    echo ""
    echo "Share this throwaway link (ephemeral — do not use for real data):"
    echo "  $url"
    echo ""
    echo "API health: ${url}/health"
    echo "Stop: $COMPOSE down"
    exit 0
  fi
  sleep 1
done

echo "Tunnel URL not found yet. Check logs:"
echo "  $COMPOSE logs -f cloudflared"
exit 1
