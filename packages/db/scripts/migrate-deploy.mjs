import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { capSupabaseSessionPoolConnections } from "../dist/index.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to deploy Prisma migrations.");
}

const packageDirectory = fileURLToPath(new URL("..", import.meta.url));
const migrationDatabaseUrl = capSupabaseSessionPoolConnections(databaseUrl, "1");
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const migration = spawnSync(
  pnpmCommand,
  ["exec", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
  {
    cwd: packageDirectory,
    env: {
      ...process.env,
      DATABASE_URL: migrationDatabaseUrl
    },
    stdio: "inherit"
  }
);

if (migration.error) {
  throw migration.error;
}

process.exitCode = migration.status ?? 1;
