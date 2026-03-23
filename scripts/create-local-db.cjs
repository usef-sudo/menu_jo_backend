/**
 * Connects to the maintenance DB "postgres" and creates DB_NAME if missing.
 * Uses DATABASE_URL from config.env (same folder as package.json).
 */
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", "config.env") });

async function main() {
  const name = process.env.DB_NAME;
  const raw = process.env.DATABASE_URL;
  if (!name || !raw) {
    console.error("Missing DB_NAME or DATABASE_URL in config.env");
    process.exit(1);
  }

  const u = new URL(raw);
  const current = u.pathname.replace(/^\//, "");
  if (current !== name) {
    console.warn(
      `DB_NAME (${name}) does not match DATABASE_URL path (${current}); using DB_NAME.`,
    );
  }
  u.pathname = "/postgres";

  const client = new Client({ connectionString: u.href });
  await client.connect();

  const { rows } = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [name],
  );
  if (rows.length > 0) {
    console.log(`Database "${name}" already exists.`);
  } else {
    await client.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`);
    console.log(`Created database "${name}".`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
