const forbidden = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
];

function assertPreviewOrigin(value, name) {
  const url = new URL(value ?? "");
  if (
    !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)) &&
    !(url.protocol === "https:" && url.hostname.endsWith(".up.railway.app"))
  ) {
    throw new Error(`${name} must use a local or generated Railway preview origin.`);
  }
}

export function assertPreviewEnvironment(env, surface) {
  if (env.TIGER_PREVIEW_MODE !== "true") throw new Error("TIGER_PREVIEW_MODE=true is required.");
  for (const name of forbidden) {
    if (env[name]?.trim()) throw new Error(`${name} must be absent from this preview.`);
  }
  if (surface === "api" || surface === "seed") {
    const url = new URL(env.DATABASE_URL ?? "");
    if (!["postgres:", "postgresql:"].includes(url.protocol))
      throw new Error("Postgres is required.");
    const host = url.hostname;
    if (
      host !== env.TIGER_PREVIEW_DATABASE_HOST ||
      !(["localhost", "127.0.0.1"].includes(host) || host.endsWith(".railway.internal"))
    ) {
      throw new Error("Database must match the approved preview-only local/private Railway host.");
    }
    if (surface === "api" && !url.searchParams.get("connection_limit")) {
      throw new Error("Explicit preview database connection_limit is required.");
    }
  }
  if (surface === "api") {
    if (!env.CORS_ORIGIN?.trim()) throw new Error("Preview CORS_ORIGIN is required.");
    for (const origin of env.CORS_ORIGIN.split(","))
      assertPreviewOrigin(origin.trim(), "CORS_ORIGIN");
  }
  if (surface === "web") {
    for (const name of ["NEXT_PUBLIC_API_BASE_URL", "NEXT_PUBLIC_SITE_URL"]) {
      assertPreviewOrigin(env[name], name);
    }
  }
}
