export type DatabaseProvider = "supabase-postgres";

export interface DatabaseConfig {
  provider: DatabaseProvider;
  databaseUrl: string;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
}

export const databaseProvider: DatabaseProvider = "supabase-postgres";

export { Prisma, PrismaClient } from "@prisma/client";

export function createDatabaseConfig(env: Record<string, string | undefined>): DatabaseConfig {
  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to configure the database package.");
  }

  return {
    provider: databaseProvider,
    databaseUrl: capSupabaseSessionPoolConnections(databaseUrl),
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY
  };
}

export function capSupabaseSessionPoolConnections(
  databaseUrl: string,
  connectionLimit = "2"
): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    return databaseUrl;
  }

  const isSupabaseSessionPool =
    parsedUrl.hostname.toLowerCase().endsWith(".pooler.supabase.com") &&
    (parsedUrl.port === "" || parsedUrl.port === "5432");

  if (!isSupabaseSessionPool || parsedUrl.searchParams.has("connection_limit")) {
    return databaseUrl;
  }

  // The API currently has several intentionally isolated Prisma clients. Keeping
  // each client below the Supabase session pool's 15-client ceiling prevents a
  // late-loaded admin client from being rejected after storefront traffic starts.
  parsedUrl.searchParams.set("connection_limit", connectionLimit);

  return parsedUrl.toString();
}
