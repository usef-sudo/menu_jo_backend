# NodeJS Menu API

A robust REST API for managing restaurant menus, branches, and orders, built with Node.js, Express, and PostgreSQL.

## Features

- **Multi-tenant Architecture**: Support for Restaurants, Branches, and Users.
- **Menu Management**: Manage Categories, Offers, and Menu Images.
- **Authentication**: JWT-based authentication for secure access.
- **File Uploads**: Local disk storage served at `/uploads/...`.
- **Documentation**: Comprehensive Swagger (OpenAPI) documentation.
- **Performance**: Response compression and rate limiting enabled.

## Prerequisites

- **Node.js** (v22; see `engines` in `package.json`)
- **PostgreSQL** (v13+)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd nodejs-menu-api-v1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy the example config file:
   ```bash
   cp config.env.example config.env
   ```
   Edit `config.env` and fill in your database credentials. Set `PUBLIC_BASE_URL` to your API origin (IP is fine), e.g. `http://203.0.113.10:8000`, so uploaded image URLs in responses are absolute and loadable by mobile clients.

## Running the Application

### Development Mode
Runs the server with hot-reloading:
```bash
npm run dev
```

### Production Mode
Builds and starts the server:
```bash
npm run build
npm start
```

The server will start at `http://localhost:8000`.

## API Documentation

Swagger UI is at **[http://localhost:8000/api/docs](http://localhost:8000/api/docs)** in non-production, or when `ENABLE_SWAGGER=true`. In `NODE_ENV=production` it is **disabled** unless you set `ENABLE_SWAGGER=true`.

## Health checks (production)

- `GET /api/health/live` — liveness (process up).
- `GET /api/health/ready` — readiness (PostgreSQL reachable); returns `503` if the DB is down.

## Production environment

See `config.env.example` for:

- `CORS_ORIGINS` — comma-separated browser origins (optional; empty = permissive with a warning in production logs).
- `ENABLE_SWAGGER` — set `true` only if you intentionally expose docs in production.
- `UPLOAD_DIR` / `PUBLIC_BASE_URL` — local uploads directory and public origin for image URLs (`…/api/media/…`).

Structured JSON logs are emitted for `info` / `warn` via `src/config/logger.ts` when `NODE_ENV=production`. Combine with your log aggregator and alert on 5xx / high latency.

## VPS deploy (bare metal, no Docker)

For Ubuntu **22.04 / 24.04**, use the setup script. It installs Git, Node.js 22, PostgreSQL, creates the DB role, writes `config.env`, builds the API, and runs it under systemd.

```bash
# On the VPS, from a clone of this repo (or set REPO_URL to clone for you):
sudo bash scripts/vps-setup.sh

# Or clone into /opt/menu-api:
sudo REPO_URL=https://github.com/YOUR_ORG/nodejs-menu-api-v1.git bash scripts/vps-setup.sh
```

Useful environment variables when running the script:

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | JWT signing key (generated if unset) |
| `PUBLIC_BASE_URL` | Absolute origin for upload URLs (e.g. `http://203.0.113.10:8000`). Auto-detected from public IP if unset |
| `FORCE_CONFIG=1` | Overwrite existing `config.env` |
| `SKIP_NODE=1` / `SKIP_PG=1` | Skip Node or Postgres install on re-runs |
| `SEED=1` | Run `scripts/run-seed-vps.sh` after a healthy start (clears all tables) |

After install:

```bash
curl -sS http://127.0.0.1:8000/api/health/ready
systemctl status menu-api
journalctl -u menu-api -f
```

Re-deploy:

```bash
cd /opt/menu-api   # or your APP_DIR
git pull
npm ci && npm run build
sudo systemctl restart menu-api
```

Do not commit `config.env`. Open firewall port **8000** (or put a reverse proxy in front) for external clients.

### Seeding demo data on the VPS

`scripts/run-seed-ecs.sh` targets AWS ECS/Fargate and will not work on a bare-metal VPS. Use:

```bash
# Interactive confirm
./scripts/run-seed-vps.sh

# Non-interactive (e.g. after vps-setup, or cron)
CONFIRM_SEED=1 ./scripts/run-seed-vps.sh --yes

# As the systemd service user
sudo -u menuapi -H bash /opt/menu-api/scripts/run-seed-vps.sh --yes
```

**Warning:** the seed script clears all application tables before inserting demo data.

## Database operations

See **[docs/RUNBOOK_DB.md](docs/RUNBOOK_DB.md)** for migrations, backups, and restore outline.

## Project Structure

- `src/app.ts`: Application entry point and middleware setup.
- `src/modules/`: Feature-based modules (Controllers, Services, Routes).
- `src/db/`: Database configuration and Drizzle ORM schemas.
- `src/config/`: Environment configuration.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.
