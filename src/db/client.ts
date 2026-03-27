/**
 * Re-export the shared Drizzle client and pool from `config/db.ts`.
 * All services must use this (or import `config/db` directly) so RDS TLS and connection
 * settings stay consistent — do not create a second `new Pool({ connectionString })` here.
 */
export { db, pool } from "../config/db";
