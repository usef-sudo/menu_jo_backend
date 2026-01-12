import type { Config } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: "./config.env" });

const config: Config = {
  schema: "./src/db/schema/**/*.ts", // your schema files
  out: "./src/db/migrations",        // where migrations will be generated  
  dialect: "postgresql",             // specify your database dialect
  dbCredentials: {
    url: process.env.DATABASE_URL as string, // your Postgres connection
  },
  
};

export default config;
