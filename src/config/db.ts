// src/config/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "../db/schema"; 

import { DATABASE_URL } from "./env";

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Unexpected PG pool error", err);
  process.exit(1);
});


// Drizzle client
export const db = drizzle(pool, { schema });
