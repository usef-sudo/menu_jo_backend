// src/server.ts
import path from "path";

import "./config/env"; // this will load your env variables and validate them
import app from "./app";
import { db } from "./config/db";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const PORT = Number(process.env.PORT) || 8000;

async function testDbConnection() {
  try {
    await db.execute(sql`SELECT 1`);
    console.log("Database connected successfully ✅");
  } catch (error) {
    console.error("Database connection failed ❌", error);
    process.exit(1);
  }
}

/** Apply SQL migrations (Drizzle). Safe to run every startup; skips already-applied files. */
async function runMigrations() {
  if (process.env.RUN_DB_MIGRATIONS === "false") {
    console.log("Skipping DB migrations (RUN_DB_MIGRATIONS=false)");
    return;
  }
  const migrationsFolder = path.join(__dirname, "db", "migrations");
  console.log("Running DB migrations from", migrationsFolder);
  try {
    await migrate(db, { migrationsFolder });
    console.log("DB migrations applied ✅");
  } catch (error) {
    console.error("DB migrations failed ❌", error);
    process.exit(1);
  }
}

async function startServer() {
  await testDbConnection();
  await runMigrations();

  app.listen(PORT, () => {
    console.log(
      `🚀 Server running on port ${PORT} (${process.env.NODE_ENV ?? "development"})`
    );
  });
}

startServer();