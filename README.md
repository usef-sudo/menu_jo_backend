# NodeJS Menu API

A robust REST API for managing restaurant menus, branches, and orders, built with Node.js, Express, and PostgreSQL.

## Features

- **Multi-tenant Architecture**: Support for Restaurants, Branches, and Users.
- **Menu Management**: Manage Categories, Offers, and Menu Images.
- **Authentication**: JWT-based authentication for secure access.
- **File Uploads**: S3 integration for uploading menu images.
- **Documentation**: Comprehensive Swagger (OpenAPI) documentation.
- **Performance**: Response compression and rate limiting enabled.

## Prerequisites

- **Node.js** (v16+)
- **PostgreSQL** (v13+)
- **AWS S3 Bucket** (for image uploads)

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
   Edit `config.env` and fill in your database credentials and AWS S3 details.

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

Structured JSON logs are emitted for `info` / `warn` via `src/config/logger.ts` when `NODE_ENV=production`. Combine with your log aggregator and alert on 5xx / high latency.

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
