import * as dotenv from "dotenv";
import path from "path";

// Load the correct env file
dotenv.config({ path: path.resolve(__dirname, "../../config.env") });

// Ensure required variables exist
function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

export const PORT = getEnv("PORT");
export const NODE_ENV = process.env.NODE_ENV || "development";

/** Comma-separated allowed browser origins. Empty = reflect / permissive (OK for mobile-only APIs). */
export const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** In production, Swagger is off unless ENABLE_SWAGGER=true */
export const ENABLE_SWAGGER =
  process.env.ENABLE_SWAGGER === "true" || NODE_ENV !== "production";
export const DB_USER = getEnv("DB_USER");
export const DB_PASSWORD = getEnv("DB_PASSWORD");
export const DB_HOST = getEnv("DB_HOST");
export const DB_PORT = getEnv("DB_PORT");
export const DB_NAME = getEnv("DB_NAME");
export const DATABASE_URL = getEnv("DATABASE_URL");
export const JWT_SECRET = getEnv("JWT_SECRET");

/** Local upload directory (relative to cwd or absolute). */
export const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

/**
 * Public origin for uploaded file URLs (e.g. https://api.example.com).
 * Empty = path-only URLs like /uploads/...
 */
export const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);
