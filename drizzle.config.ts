import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

export default defineConfig({
  dbCredentials: { url: process.env.DATABASE_URL! },
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./db/schema",
});
