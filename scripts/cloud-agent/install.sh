#!/usr/bin/env bash
#
# Cloud Agent install: idempotent environment bootstrap for Trust Atlas.
#
# Prepares everything a fresh checkout needs to run the full stack locally:
#   - system packages (Postgres 16, Redis, psql client, python-is-python3)
#   - Node deps for api/ and web/, Python deps for etl/, ws for the dev proxy
#   - a self-signed localhost TLS cert for the Neon local WebSocket proxy
#   - local Postgres role/db, cleartext-password auth on loopback, migrations,
#     demo seed, and a best-effort load of real CPI + OECD data
#
# Safe to run repeatedly. Runtime services are (re)started by start.sh.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CERT_DIR="/etc/trustatlas/certs"
CERT="${CERT_DIR}/localhost.pem"
KEY="${CERT_DIR}/localhost-key.pem"
export PATH="$HOME/.local/bin:$PATH"

echo "==> [1/8] System packages"
sudo apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  postgresql postgresql-client redis-server python-is-python3 openssl

echo "==> [2/8] Start Postgres (needed for migrations/seed)"
sudo pg_ctlcluster 16 main start 2>/dev/null || true
for i in $(seq 1 20); do pg_isready -h localhost >/dev/null 2>&1 && break; sleep 1; done

echo "==> [3/8] Postgres role + database + loopback auth"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'trust') THEN
    CREATE ROLE trust LOGIN PASSWORD 'trust' SUPERUSER;
  END IF;
END $$;
SQL
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='trust'" | grep -q 1 \
  || sudo -u postgres createdb -O trust trust
# The Neon serverless driver's default pipelineConnect='password' needs
# cleartext password auth on loopback (scram is the Ubuntu default).
HBA="$(sudo -u postgres psql -tAc 'SHOW hba_file')"
sudo sed -i -E \
  -e 's|^(host\s+all\s+all\s+127\.0\.0\.1/32\s+)(scram-sha-256\|md5)|\1password|' \
  -e 's|^(host\s+all\s+all\s+::1/128\s+)(scram-sha-256\|md5)|\1password|' \
  "$HBA"
sudo pg_ctlcluster 16 main reload || true

echo "==> [4/8] Self-signed localhost cert for the Neon local proxy"
if [ ! -f "$CERT" ] || [ ! -f "$KEY" ]; then
  sudo mkdir -p "$CERT_DIR"
  sudo openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout "$KEY" -out "$CERT" -days 3650 \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" >/dev/null 2>&1
  sudo chmod 644 "$CERT" "$KEY"
fi

echo "==> [5/8] .env (created once, safe local-only defaults)"
if [ ! -f "$REPO_ROOT/.env" ]; then
  cat > "$REPO_ROOT/.env" <<'ENV'
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=trust
POSTGRES_USER=trust
POSTGRES_PASSWORD=trust
POSTGRES_URL=postgres://trust:trust@localhost:5432/trust
# Neon serverless driver -> local wsproxy -> local Postgres
DATABASE_URL=postgres://trust:trust@localhost:5432/trust
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=dev
S3_SECRET_KEY=devpass
S3_BUCKET=trust-artifacts
NODE_ENV=development
API_PORT=3001
WEB_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001
FEATURE_USE_NEXT_API=false
ENV
fi

echo "==> [6/8] Dependencies (api, web, etl, dev proxy)"
( cd "$REPO_ROOT/api" && npm ci )
( cd "$REPO_ROOT/web" && npm ci )
( cd "$REPO_ROOT/scripts/cloud-agent" && npm install --no-audit --no-fund )
( cd "$REPO_ROOT/etl" && pip install -e ".[dev]" --break-system-packages -q )

echo "==> [7/8] Migrations + demo seed"
for f in $(ls "$REPO_ROOT"/db/migrations/*.sql | sort); do
  PGPASSWORD=trust psql -h localhost -U trust -d trust -q -f "$f" >/dev/null
done
( cd "$REPO_ROOT/scripts" && POSTGRES_HOST=localhost POSTGRES_PORT=5432 \
  POSTGRES_DB=trust POSTGRES_USER=trust POSTGRES_PASSWORD=trust python3 dev_seed.py )

echo "==> [8/8] Best-effort real data (CPI governance + OECD institutional)"
set -a; . "$REPO_ROOT/.env"; set +a
( cd "$REPO_ROOT/etl"
  for y in 2022 2023; do timeout 120 python jobs/cpi.py --year "$y" || true; done
  for y in 2021 2022 2023 2024; do timeout 120 python jobs/oecd.py --year "$y" || true; done
)

echo "==> install complete"
