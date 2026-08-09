#!/usr/bin/env bash
# Bare-metal Ubuntu 22.04/24.04 setup for nodejs-menu-api-v1 (no Docker).
#
# Usage (from the repo, or after cloning):
#   sudo bash scripts/vps-setup.sh
#
# Optional environment variables:
#   REPO_URL       Git clone URL (if set, clones into APP_DIR)
#   APP_DIR        Install path (default: /opt/menu-api, or repo root when script lives in-repo)
#   DB_USER        Postgres role (default: menu_app)
#   DB_NAME        Database name (default: menu_db)
#   DB_PASSWORD    Role password (default: generated once and stored in config.env)
#   JWT_SECRET     Required for new config.env (generated if unset)
#   PUBLIC_BASE_URL Absolute origin for upload URLs (e.g. http://YOUR_IP:8000). Auto-detected if unset.
#   FORCE_CONFIG=1 Overwrite existing config.env
#   SKIP_NODE=1    Skip Node.js install
#   SKIP_PG=1      Skip PostgreSQL install / DB bootstrap
#   SEED=1         Run scripts/run-seed-vps.sh after a healthy start
#   PORT           API port (default: 8000)
#
# Re-deploy later:
#   cd "$APP_DIR" && git pull && npm ci && npm run build && systemctl restart menu-api
#   # or: SKIP_PG=1 SKIP_NODE=1 sudo -E bash scripts/vps-setup.sh

set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/vps-setup.sh" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

APP_DIR="${APP_DIR:-}"
REPO_URL="${REPO_URL:-}"
DB_USER="${DB_USER:-menu_app}"
DB_NAME="${DB_NAME:-menu_db}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
PORT="${PORT:-8000}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-}"
SERVICE_USER="${SERVICE_USER:-menuapi}"
SERVICE_NAME="menu-api"
NODE_MAJOR=22

log() { printf '==> %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

require_ubuntu() {
  if [[ ! -f /etc/os-release ]]; then
    die "Unsupported OS (expected Ubuntu 22.04/24.04)"
  fi
  # shellcheck disable=SC1091
  . /etc/os-release
  [[ "${ID:-}" == "ubuntu" ]] || die "This script targets Ubuntu (found ID=${ID:-unknown})"
  case "${VERSION_ID:-}" in
    22.04|24.04) ;;
    *)
      log "Warning: untested Ubuntu ${VERSION_ID:-unknown}; continuing"
      ;;
  esac
}

urlencode() {
  # Percent-encode for DATABASE_URL password (python3 is installed below).
  python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$1"
}

rand_secret() {
  openssl rand -base64 32 | tr -d '\n'
}

# Prefer PUBLIC_BASE_URL env; otherwise http://<public-ipv4>:PORT for mobile clients.
detect_public_base_url() {
  if [[ -n "${PUBLIC_BASE_URL}" ]]; then
    return
  fi
  local ip=""
  if command -v curl >/dev/null 2>&1; then
    ip="$(curl -4 -fsS --max-time 3 https://ifconfig.me 2>/dev/null || true)"
  fi
  if [[ -z "${ip}" ]] && command -v dig >/dev/null 2>&1; then
    ip="$(dig +short -4 myip.opendns.com @resolver1.opendns.com 2>/dev/null | head -1 || true)"
  fi
  if [[ -z "${ip}" ]]; then
    ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  fi
  if [[ -n "${ip}" && "${ip}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    PUBLIC_BASE_URL="http://${ip}:${PORT}"
    log "PUBLIC_BASE_URL not set — using ${PUBLIC_BASE_URL}"
  else
    log "Warning: could not detect public IP; set PUBLIC_BASE_URL=http://YOUR_IP:${PORT}"
  fi
}

install_base_packages() {
  log "Installing base packages"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y \
    git \
    curl \
    ca-certificates \
    build-essential \
    python3 \
    openssl \
    gnupg \
    lsb-release \
    rsync
}

install_node() {
  if [[ "${SKIP_NODE:-0}" == "1" ]]; then
    log "SKIP_NODE=1 — skipping Node.js install"
    command -v node >/dev/null || die "Node.js not found and SKIP_NODE=1"
    return
  fi

  if command -v node >/dev/null 2>&1; then
    local major
    major="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
    if [[ "${major}" == "${NODE_MAJOR}" ]]; then
      log "Node.js $(node -v) already installed"
      return
    fi
    log "Found Node.js $(node -v); installing Node.js ${NODE_MAJOR}.x"
  else
    log "Installing Node.js ${NODE_MAJOR}.x"
  fi

  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
  node -v
  npm -v
}

install_postgres() {
  if [[ "${SKIP_PG:-0}" == "1" ]]; then
    log "SKIP_PG=1 — skipping PostgreSQL install/bootstrap"
    return
  fi

  log "Installing PostgreSQL"
  export DEBIAN_FRONTEND=noninteractive
  apt-get install -y postgresql postgresql-contrib
  systemctl enable --now postgresql

  if [[ -z "${DB_PASSWORD:-}" ]]; then
    if [[ -f "${APP_DIR}/config.env" ]]; then
      # shellcheck disable=SC1091
      DB_PASSWORD="$(grep -E '^DB_PASSWORD=' "${APP_DIR}/config.env" | head -1 | cut -d= -f2-)"
    fi
  fi
  if [[ -z "${DB_PASSWORD:-}" ]]; then
    DB_PASSWORD="$(rand_secret)"
    log "Generated DB_PASSWORD for role ${DB_USER}"
  fi

  [[ "${DB_USER}" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]] || die "DB_USER must be a simple identifier"
  [[ "${DB_NAME}" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]] || die "DB_NAME must be a simple identifier"

  log "Ensuring Postgres role and database exist"
  # Create/update role with password; create DB owned by that role.
  # Escape single quotes for SQL string literals.
  local sql_pw="${DB_PASSWORD//\'/\'\'}"
  sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${sql_pw}';
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${sql_pw}';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec

GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

  # PostgreSQL 15+ restricts public schema; ensure the app role can migrate.
  sudo -u postgres psql -v ON_ERROR_STOP=1 -d "${DB_NAME}" <<SQL
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER SCHEMA public OWNER TO ${DB_USER};
SQL

  # Ensure TCP localhost can use password auth (Node connects via TCP, not peer).
  local pg_hba
  pg_hba="$(sudo -u postgres psql -tAc 'SHOW hba_file' | tr -d '[:space:]')"
  [[ -n "${pg_hba}" && -f "${pg_hba}" ]] || die "Could not locate pg_hba.conf"

  local marker="# menu-api-vps-setup"
  if ! grep -qF "${marker}" "${pg_hba}"; then
    log "Updating pg_hba.conf for local scram auth (${pg_hba})"
    # Insert before first host/local rules by prepending after comments is fragile;
    # append dedicated lines and reload — first matching rule wins, so put ours early.
    local tmp
    tmp="$(mktemp)"
    {
      echo "${marker}"
      echo "local   all             ${DB_USER}                                scram-sha-256"
      echo "host    all             ${DB_USER}        127.0.0.1/32            scram-sha-256"
      echo "host    all             ${DB_USER}        ::1/128                 scram-sha-256"
      cat "${pg_hba}"
    } >"${tmp}"
    mv "${tmp}" "${pg_hba}"
    chown postgres:postgres "${pg_hba}"
    chmod 640 "${pg_hba}"
    systemctl reload postgresql
  else
    log "pg_hba.conf already contains menu-api rules"
  fi

  # Smoke-test TCP auth as the app user.
  PGPASSWORD="${DB_PASSWORD}" psql -h 127.0.0.1 -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c 'SELECT 1' >/dev/null \
    || die "Postgres TCP login failed for ${DB_USER}@${DB_NAME}"
  log "Postgres ready (${DB_USER}@${DB_NAME})"
}

resolve_app_dir() {
  if [[ -n "${APP_DIR}" ]]; then
    mkdir -p "${APP_DIR}"
    return
  fi
  if [[ -n "${REPO_URL}" ]]; then
    APP_DIR="/opt/menu-api"
    return
  fi
  # Script lives inside the repo → deploy that tree.
  if [[ -f "${REPO_ROOT}/package.json" ]]; then
    APP_DIR="${REPO_ROOT}"
  else
    APP_DIR="/opt/menu-api"
  fi
}

fetch_app() {
  if [[ -n "${REPO_URL}" ]]; then
    if [[ -d "${APP_DIR}/.git" ]]; then
      log "Pulling latest in ${APP_DIR}"
      git -C "${APP_DIR}" pull --ff-only
    elif [[ -d "${APP_DIR}" ]] && [[ -n "$(ls -A "${APP_DIR}" 2>/dev/null || true)" ]]; then
      die "${APP_DIR} exists and is not a git repo; set a different APP_DIR or empty it"
    else
      log "Cloning ${REPO_URL} → ${APP_DIR}"
      mkdir -p "$(dirname "${APP_DIR}")"
      git clone "${REPO_URL}" "${APP_DIR}"
    fi
  else
    [[ -f "${APP_DIR}/package.json" ]] || die "No package.json in ${APP_DIR}; set REPO_URL or APP_DIR"
    log "Using existing app at ${APP_DIR}"
  fi
}

# /root is mode 700 — the service user cannot cd into repos cloned there.
# Relocate to /opt/menu-api (or APP_DIR if already set outside /root).
relocate_if_inaccessible() {
  local target="${SAFE_APP_DIR:-/opt/menu-api}"
  local needs_move=0

  if [[ "${APP_DIR}" == /root || "${APP_DIR}" == /root/* ]]; then
    needs_move=1
    log "App is under /root (not traversable by ${SERVICE_USER}) — relocating to ${target}"
  elif id -u "${SERVICE_USER}" >/dev/null 2>&1; then
    if ! sudo -u "${SERVICE_USER}" test -r "${APP_DIR}/package.json" 2>/dev/null; then
      needs_move=1
      log "${SERVICE_USER} cannot read ${APP_DIR} — relocating to ${target}"
    fi
  fi

  if [[ "${needs_move}" != "1" ]]; then
    return
  fi
  if [[ "${APP_DIR}" == "${target}" ]]; then
    die "Cannot run from ${APP_DIR}: ${SERVICE_USER} has no access. Move the repo outside /root (e.g. /opt/menu-api)."
  fi

  mkdir -p "${target}"
  if [[ -d "${target}/.git" || -f "${target}/package.json" ]]; then
    log "Syncing ${APP_DIR}/ → ${target}/"
  else
    log "Copying ${APP_DIR}/ → ${target}/"
  fi
  rsync -a --delete \
    --exclude node_modules \
    --exclude dist \
    "${APP_DIR}/" "${target}/"
  # Keep server-local secrets if already present at target; otherwise bring config.env along.
  if [[ -f "${APP_DIR}/config.env" && ! -f "${target}/config.env" ]]; then
    cp -a "${APP_DIR}/config.env" "${target}/config.env"
  fi
  APP_DIR="${target}"
  log "APP_DIR is now ${APP_DIR}"
}

ensure_service_user() {
  local home_dir="/var/lib/${SERVICE_USER}"
  mkdir -p "${home_dir}"

  if ! id -u "${SERVICE_USER}" >/dev/null 2>&1; then
    log "Creating system user ${SERVICE_USER}"
    useradd --system --home-dir "${home_dir}" --create-home --shell /usr/sbin/nologin "${SERVICE_USER}"
  else
    # Avoid HOME pointing at /root/... (login shells then fail on .bash_profile).
    usermod -d "${home_dir}" "${SERVICE_USER}" 2>/dev/null || true
  fi
  chown -R "${SERVICE_USER}:${SERVICE_USER}" "${home_dir}"
  chown -R "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}"
}

run_as_service_user() {
  # Non-login shell; HOME is /var/lib/menuapi so npm cache works outside /root.
  sudo -u "${SERVICE_USER}" -- \
    env HOME="/var/lib/${SERVICE_USER}" \
    bash -c "$*"
}

write_config_env() {
  local config_path="${APP_DIR}/config.env"
  if [[ -f "${config_path}" && "${FORCE_CONFIG:-0}" != "1" ]]; then
    log "Keeping existing ${config_path} (set FORCE_CONFIG=1 to overwrite)"
    # Refresh DB_PASSWORD from file if we skipped generation path above.
    if [[ -z "${DB_PASSWORD:-}" ]]; then
      DB_PASSWORD="$(grep -E '^DB_PASSWORD=' "${config_path}" | head -1 | cut -d= -f2-)"
    fi
    return
  fi

  JWT_SECRET="${JWT_SECRET:-$(rand_secret)}"
  DB_PASSWORD="${DB_PASSWORD:-$(rand_secret)}"
  local enc_pass
  enc_pass="$(urlencode "${DB_PASSWORD}")"

  detect_public_base_url

  log "Writing ${config_path}"
  cat >"${config_path}" <<EOF
PORT=${PORT}
NODE_ENV=production

# Comma-separated browser origins for CORS (optional)
# CORS_ORIGINS=https://app.example.com

# ENABLE_SWAGGER=false

DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DATABASE_URL=postgresql://${DB_USER}:${enc_pass}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable

JWT_SECRET=${JWT_SECRET}

UPLOAD_DIR=uploads
# Absolute origin used when building image URLs in API responses (IP or domain OK)
PUBLIC_BASE_URL=${PUBLIC_BASE_URL}
EOF
  chmod 640 "${config_path}"
  chown "${SERVICE_USER}:${SERVICE_USER}" "${config_path}"

  if [[ -z "${PUBLIC_BASE_URL}" ]]; then
    log "Warning: PUBLIC_BASE_URL is empty — API will return path-only URLs (/api/media/...) which mobile apps usually cannot load"
  else
    log "Image URLs will look like: ${PUBLIC_BASE_URL}/api/media/uploads/..."
  fi
}

build_app() {
  log "Installing npm dependencies and building"
  mkdir -p "${APP_DIR}/uploads"
  chown -R "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}"
  run_as_service_user "
    set -euo pipefail
    cd '${APP_DIR}'
    if [[ -f package-lock.json ]]; then
      npm ci
    else
      npm install
    fi
    npm run build
  "
}

install_systemd_unit() {
  local unit_src="${APP_DIR}/deploy/menu-api.service"
  local unit_dst="/etc/systemd/system/${SERVICE_NAME}.service"
  [[ -f "${unit_src}" ]] || die "Missing ${unit_src}"

  local node_bin
  node_bin="$(command -v node)"
  [[ -x "${node_bin}" ]] || die "node binary not found"

  log "Installing systemd unit ${unit_dst}"
  sed \
    -e "s|__APP_DIR__|${APP_DIR}|g" \
    -e "s|/usr/bin/node|${node_bin}|g" \
    -e "s|^User=menuapi|User=${SERVICE_USER}|g" \
    -e "s|^Group=menuapi|Group=${SERVICE_USER}|g" \
    "${unit_src}" >"${unit_dst}"

  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}"
  systemctl restart "${SERVICE_NAME}"
}

wait_for_health() {
  local url="http://127.0.0.1:${PORT}/api/health/ready"
  log "Waiting for ${url}"
  local i
  for i in $(seq 1 30); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      log "Health check OK"
      curl -fsS "${url}" || true
      echo
      return 0
    fi
    sleep 2
  done
  log "Health check failed — recent logs:"
  journalctl -u "${SERVICE_NAME}" -n 80 --no-pager || true
  die "API did not become ready"
}

maybe_seed() {
  if [[ "${SEED:-0}" != "1" ]]; then
    return
  fi
  local seed_script="${APP_DIR}/scripts/run-seed-vps.sh"
  [[ -f "${seed_script}" ]] || die "Missing ${seed_script}"
  log "SEED=1 — running run-seed-vps.sh (clears all app tables)"
  chmod +x "${seed_script}"
  run_as_service_user "CONFIRM_SEED=1 bash '${seed_script}' --yes"
}

main() {
  require_ubuntu
  resolve_app_dir
  install_base_packages
  # APP_DIR must exist before Postgres can read an existing config.env password.
  mkdir -p "${APP_DIR}"
  install_node
  fetch_app
  relocate_if_inaccessible
  ensure_service_user
  install_postgres
  write_config_env
  # Ownership again after clone/config
  chown -R "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}"
  build_app
  install_systemd_unit
  wait_for_health
  maybe_seed

  cat <<EOF

Setup complete.
  App dir:     ${APP_DIR}
  Service:     systemctl status ${SERVICE_NAME}
  Logs:        journalctl -u ${SERVICE_NAME} -f
  Health:      curl -sS http://127.0.0.1:${PORT}/api/health/ready
  Config:      ${APP_DIR}/config.env  (do not commit)

Open firewall port ${PORT} if clients connect from outside the VPS.
EOF
}

main "$@"
