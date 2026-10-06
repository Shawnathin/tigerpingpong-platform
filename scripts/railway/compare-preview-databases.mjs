import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "../../packages/db/dist/index.js";
import { assertPreviewEnvironment } from "./preview-environment.mjs";

const sourceUrl = process.env.DATABASE_URL;
const restoredUrl = process.env.TIGER_PREVIEW_RESTORE_DATABASE_URL;
assertPreviewEnvironment(process.env, "seed");
assertPreviewEnvironment({ ...process.env, DATABASE_URL: restoredUrl }, "seed");
assert.notEqual(sourceUrl, restoredUrl, "Use a separate synthetic restore database.");
async function inventory(url) {
  const db = new PrismaClient({ datasources: { db: { url } } });
  try {
    const marker = await db.platformMetadata.findUnique({ where: { key: "preview_dataset" } });
    assert.equal(marker?.value, "synthetic-v1");
    const tables =
      await db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
    const result = [];
    for (const { tablename } of tables) {
      assert.match(tablename, /^[a-z_]+$/);
      const rows = await db.$queryRawUnsafe(
        `SELECT count(*)::int AS rows, md5(string_agg(to_jsonb(t)::text, chr(10) ORDER BY to_jsonb(t)::text)) AS digest FROM public."${tablename}" t`
      );
      result.push({ table: tablename, ...rows[0] });
    }
    return result;
  } finally {
    await db.$disconnect();
  }
}
const source = await inventory(sourceUrl);
const restored = await inventory(restoredUrl);
assert.deepEqual(restored, source);
await mkdir("exports/railway-preview", { recursive: true });
await writeFile(
  "exports/railway-preview/synthetic-restore-results.json",
  JSON.stringify({ status: "passed", tables: source }, null, 2) + "\n"
);
console.log(
  `Synthetic logical restore verified: ${source.length} tables, row counts and content hashes match.`
);
