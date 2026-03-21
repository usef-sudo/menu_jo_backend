# Database operations runbook

## Migrations

- Schema changes are managed with **Drizzle** (`drizzle-kit`). Generate and apply migrations per your team process before deploying API changes that depend on new columns or tables.
- **Before production deploy:** run pending migrations against staging, then production, during a maintenance window if the change is large or locking.

## Backups

- Enable **automated backups** on your PostgreSQL host (managed providers: use built-in PITR / daily snapshots).
- **Retention:** keep at least 7 daily backups; align with your compliance requirements.
- **Test restores** quarterly: restore to a scratch instance and verify `SELECT 1` and critical queries.

## Restore (outline)

1. Stop API instances or put them in maintenance mode (avoid writes during restore).
2. Restore DB from backup to the target instance (provider-specific CLI or console).
3. Verify `/api/health/ready` returns `200` with `{ "status": "ready" }`.
4. Resume traffic.

## Health checks

- **Liveness:** `GET /api/health/live` — process up.
- **Readiness:** `GET /api/health/ready` — database `SELECT 1` succeeds; returns `503` if DB is down.

Point orchestrators (e.g. Kubernetes) at `/api/health/ready` for readiness probes.
