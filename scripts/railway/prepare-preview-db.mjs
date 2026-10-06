import { spawnSync } from "node:child_process";
import { PrismaClient } from "../../packages/db/dist/index.js";
import { assertPreviewEnvironment } from "./preview-environment.mjs";

assertPreviewEnvironment(process.env, "seed");
const db = new PrismaClient();
try {
  const tables =
    await db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'`;
  const hasMetadata = tables.some(({ tablename }) => tablename === "platform_metadata");
  const marker = hasMetadata
    ? await db.platformMetadata.findUnique({ where: { key: "preview_dataset" } })
    : null;
  if (marker?.value !== "synthetic-v1") {
    for (const { tablename } of tables) {
      if (!/^[a-z_]+$/.test(tablename))
        throw new Error("Unexpected table before preview migration.");
      const rows = await db.$queryRawUnsafe(
        `SELECT EXISTS(SELECT 1 FROM public."${tablename}") AS populated`
      );
      if (rows[0].populated)
        throw new Error("Preview migration refused: database contains non-fixture data.");
    }
  }
} finally {
  await db.$disconnect();
}
const result = spawnSync("pnpm", ["--filter", "@tigerpingpong/db", "prisma:migrate:deploy"], {
  stdio: "inherit",
  env: process.env
});
if (result.status !== 0) process.exit(result.status ?? 1);
await import("./seed-preview.mjs");
