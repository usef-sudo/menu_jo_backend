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
export const DB_USER = getEnv("DB_USER");
export const DB_PASSWORD = getEnv("DB_PASSWORD");
export const DB_HOST = getEnv("DB_HOST");
export const DB_PORT = getEnv("DB_PORT");
export const DB_NAME = getEnv("DB_NAME");
export const DATABASE_URL = getEnv("DATABASE_URL");
export const JWT_SECRET = getEnv("JWT_SECRET");
export const AWS_S3_BUCKET_NAME = getEnv("AWS_S3_BUCKET_NAME");


