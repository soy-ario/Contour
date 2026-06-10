import dotenv from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
