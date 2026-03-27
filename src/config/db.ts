// src/config/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "../db/schema";

import { DATABASE_URL } from "./env";

const isRds = DATABASE_URL.includes(".rds.amazonaws.com");

/**
 * `sslmode=require` in the connection string makes `node-pg` verify the server cert; on ECS we
 * still see SELF_SIGNED_CERT_IN_CHAIN unless the RDS CA bundle is installed. Strip `sslmode`
 * from the URL and pass explicit `ssl` so `rejectUnauthorized: false` is honored.
 */
function connectionStringForPool(): string {
  if (!isRds) return DATABASE_URL;
  return DATABASE_URL
    .replace(/\?sslmode=[^&]*&/, "?")
    .replace(/\?sslmode=[^&]*$/, "")
    .replace(/&sslmode=[^&]*/, "");
}

function pgSslConfig():
  | undefined
  | false
  | { rejectUnauthorized: boolean } {
  if (!isRds) return undefined;
  const strict = process.env.PG_SSL_REJECT_UNAUTHORIZED === "true";
  return { rejectUnauthorized: strict };
}

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: connectionStringForPool(),
  ssl: pgSslConfig(),
});

pool.on("error", (err) => {
  console.error("Unexpected PG pool error", err);
  process.exit(1);
});


// Drizzle client
export const db = drizzle(pool, { schema });

/** For health checks and raw queries */
export { pool };
