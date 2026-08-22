#!/usr/bin/env bash
#
# Cloud Agent start: bring up per-boot runtime services for Trust Atlas.
#
# Idempotent. Starts Postgres, Redis, and the Neon local WebSocket proxy that
# lets the real API talk to the local Postgres. The API and web dev servers
# run as separate `terminals` (see .cursor/environment.json).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CERT="/etc/trustatlas/certs/localhost.pem"
KEY="/etc/trustatlas/certs/localhost-key.pem"
NODE_BIN="$(command -v node)"

echo "==> Postgres"
sudo pg_ctlcluster 16 main start 2>/dev/null || true
for i in $(seq 1 20); do pg_isready -h localhost >/dev/null 2>&1 && break; sleep 1; done

echo "==> Redis"
sudo service redis-server start 2>/dev/null || redis-server --daemonize yes 2>/dev/null || true

echo "==> Neon local WebSocket proxy (:443)"
if ! curl -sk --max-time 3 https://localhost:443/ >/dev/null 2>&1; then
  sudo bash -c "WSPROXY_PORT=443 WSPROXY_CERT='$CERT' WSPROXY_KEY='$KEY' \
    setsid '$NODE_BIN' '$REPO_ROOT/scripts/cloud-agent/neon-wsproxy.mjs' \
    > /tmp/neon-wsproxy.log 2>&1 < /dev/null &"
  sleep 2
fi
echo "$(cat /tmp/neon-wsproxy.log 2>/dev/null | tail -1)"

echo "==> start complete"
