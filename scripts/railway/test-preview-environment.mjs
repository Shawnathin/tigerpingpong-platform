import assert from "node:assert/strict";
import { assertPreviewEnvironment } from "./preview-environment.mjs";

const env = {
  TIGER_PREVIEW_MODE: "true",
  TIGER_PREVIEW_DATABASE_HOST: "127.0.0.1",
  CORS_ORIGIN: "http://127.0.0.1:4187",
  DATABASE_URL: "postgresql://fixture@127.0.0.1:55487/tiger_preview?connection_limit=2"
};
assertPreviewEnvironment(env, "api");
assert.throws(() =>
  assertPreviewEnvironment({ ...env, CORS_ORIGIN: "https://tigerpingpong.ca" }, "api")
);
assert.throws(() => assertPreviewEnvironment({ ...env, TIGER_PREVIEW_MODE: "false" }, "api"));
for (const name of [
  "RESEND_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CLOUDINARY_API_SECRET"
]) {
  assert.throws(() => assertPreviewEnvironment({ ...env, [name]: "example-nonempty" }, "api"));
}
assert.throws(() =>
  assertPreviewEnvironment(
    { ...env, DATABASE_URL: "postgresql://fixture@db.example.supabase.co/postgres" },
    "api"
  )
);
assert.throws(() =>
  assertPreviewEnvironment(
    {
      ...env,
      DATABASE_URL: "postgresql://fixture@another.railway.internal/railway?connection_limit=2"
    },
    "api"
  )
);
assert.throws(() =>
  assertPreviewEnvironment(
    { ...env, DATABASE_URL: "postgresql://fixture@127.0.0.1/tiger_preview" },
    "api"
  )
);
assert.throws(() =>
  assertPreviewEnvironment(
    {
      ...env,
      NEXT_PUBLIC_API_BASE_URL: "https://tigerpingpong-platform.onrender.com",
      NEXT_PUBLIC_SITE_URL: "https://tigerpingpong.ca"
    },
    "web"
  )
);
assertPreviewEnvironment(
  {
    ...env,
    NEXT_PUBLIC_API_BASE_URL: "https://api-review.up.railway.app",
    NEXT_PUBLIC_SITE_URL: "https://web-review.up.railway.app"
  },
  "web"
);
console.log("Preview environment fail-closed checks passed.");
