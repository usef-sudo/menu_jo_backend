// src/config/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "../db/schema";

import { DATABASE_URL } from "./env";

// Create PostgreSQL pool (local / same-host Postgres; no AWS RDS SSL hacks)
const pool = new Pool({
  connectionString: DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Unexpected PG pool error", err);
  process.exit(1);
});

// Drizzle client
export const db = drizzle(pool, { schema });

/** For health checks and raw queries */
export { pool };
