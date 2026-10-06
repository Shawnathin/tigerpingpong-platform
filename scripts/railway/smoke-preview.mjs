import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { assertPreviewEnvironment } from "./preview-environment.mjs";

const web = process.env.NEXT_PUBLIC_SITE_URL;
const api = process.env.NEXT_PUBLIC_API_BASE_URL;
assertPreviewEnvironment(process.env, "web");
const report = [];
async function request(name, origin, path, expected, options) {
  const response = await fetch(new URL(path, origin), {
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
    ...options
  });
  assert.equal(
    response.headers.get("x-tiger-preview"),
    "synthetic-read-only",
    `${name}: preview marker`
  );
  assert.ok(expected.includes(response.status), `${name}: HTTP ${response.status}`);
  report.push({ name, path, status: response.status });
  return response;
}
// These markers must be present before any negative mutation test is attempted.
await request("API preview identity", api, "/health", [200]);
const home = await request("Web preview identity", web, "/", [200]);
assert.ok(home.headers.get("x-robots-tag")?.includes("noindex"));
for (const path of [
  "/catalog",
  "/catalog/products/preview-fixture-paddle",
  "/cart",
  "/paddlebuddy",
  "/privacy-policy"
]) {
  await request("Public route", web, path, [200]);
}
await request("Protected staff UI", web, "/admin", [401]);
await request("Protected internal UI", web, "/internal/orders", [401]);
await request("Protected staff API", api, "/api/admin/products", [401, 403]);
await request("Protected order API", api, "/internal/orders", [401, 403]);
const product = await request(
  "Synthetic product",
  api,
  "/catalog/products/preview-fixture-paddle",
  [200]
);
assert.ok((await product.text()).includes("Synthetic preview paddle"));
const cors = await request("Preview CORS", api, "/checkout/sessions", [204], {
  method: "OPTIONS",
  headers: { Origin: web, "Access-Control-Request-Method": "POST" }
});
assert.equal(cors.headers.get("access-control-allow-origin"), new URL(web).origin);
for (const path of [
  "/checkout/sessions",
  "/webhooks/stripe",
  "/paddlebuddy/submissions",
  "/internal/orders/PREVIEW-ONLY-001/emails/order_received/retry"
]) {
  await request("Blocked side effect", api, path, [409], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}"
  });
}
await request("Blocked admin mutation", api, "/api/admin/products/preview", [409], {
  method: "PATCH"
});
await request("Blocked web mutation", web, "/paddlebuddy", [409], { method: "POST" });
await mkdir("exports/railway-preview", { recursive: true });
await writeFile(
  "exports/railway-preview/smoke-results.json",
  JSON.stringify(report, null, 2) + "\n"
);
console.log(`Preview smoke: ${report.length} checks passed; no accepted mutations.`);
