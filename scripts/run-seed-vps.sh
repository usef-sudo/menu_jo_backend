#!/usr/bin/env bash
# Run demo seed against the local Postgres DB on a bare-metal VPS (no Docker / no ECS).
#
# Counterpart to scripts/run-seed-ecs.sh for Ubuntu VPS deploys.
# Does NOT call AWS ECS — runs node dist/scripts/seed.js in this repo.
#
# WARNING: src/scripts/seed.ts CLEARS all application tables before inserting demo data.
#
# Prerequisites:
#   - App already built (dist/scripts/seed.js exists), or this script will run npm run build
#   - config.env at repo root with a valid DATABASE_URL (same as the API)
#
# Usage (from repo root or any cwd):
#   ./scripts/run-seed-vps.sh
#   CONFIRM_SEED=1 ./scripts/run-seed-vps.sh          # skip interactive prompt
#   ./scripts/run-seed-vps.sh --yes
#
# If the API runs as systemd user menuapi:
#   sudo -u menuapi -H bash /opt/menu-api/scripts/run-seed-vps.sh --yes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SEED_JS="${APP_DIR}/dist/scripts/seed.js"
YES=0

for arg in "$@"; do
  case "${arg}" in
    --yes|-y) YES=1 ;;
    -h|--help)
      sed -n '1,25p' "$0"
      exit 0
      ;;
  esac
done

if [[ "${CONFIRM_SEED:-0}" == "1" ]]; then
  YES=1
fi

cd "${APP_DIR}"

if [[ ! -f "${APP_DIR}/config.env" ]]; then
  echo "ERROR: missing ${APP_DIR}/config.env" >&2
  echo "Copy config.env.example or run scripts/vps-setup.sh first." >&2
  exit 1
fi

if [[ ! -f "${SEED_JS}" ]]; then
  echo "==> dist/scripts/seed.js not found — building"
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
  npm run build
fi

[[ -f "${SEED_JS}" ]] || {
  echo "ERROR: ${SEED_JS} still missing after build" >&2
  exit 1
}

command -v node >/dev/null || {
  echo "ERROR: node not found on PATH" >&2
  exit 1
}

echo "WARNING: This will CLEAR all application tables, then insert demo data."
echo "  App dir: ${APP_DIR}"
echo "  Command: node dist/scripts/seed.js"
if [[ "${YES}" != "1" ]]; then
  if [[ ! -t 0 ]]; then
    echo "ERROR: non-interactive shell — re-run with --yes or CONFIRM_SEED=1" >&2
    exit 1
  fi
  read -r -p "Type 'yes' to continue: " answer
  [[ "${answer}" == "yes" ]] || {
    echo "Aborted."
    exit 1
  }
fi

echo "==> Seeding..."
exec node "${SEED_JS}"
