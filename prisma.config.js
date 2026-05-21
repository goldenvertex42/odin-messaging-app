import 'dotenv/config';
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "db/prisma/schema.prisma",
  migrations: {
    path: "db/prisma/migrations",
    seed: "node db/prisma/seed.js",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
