// src/server.ts
import "./config/env"; // this will load your env variables and validate them
import app from "./app";
import { db } from "./config/db";
import { sql } from "drizzle-orm";

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

async function startServer() {
  await testDbConnection();

  app.listen(PORT, () => {
    console.log(
      `🚀 Server running on port ${PORT} (${process.env.NODE_ENV ?? "development"})`
    );
  });
}

startServer();