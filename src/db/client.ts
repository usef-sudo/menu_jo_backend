import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Use environment variables for credentials
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Or construct from DB_USER, DB_PASSWORD, etc.
});

export const db = drizzle(pool, { schema });
