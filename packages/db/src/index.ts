export type DatabaseProvider = "supabase-postgres";

export interface DatabaseConfig {
  provider: DatabaseProvider;
  databaseUrl: string;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
}

export const databaseProvider: DatabaseProvider = "supabase-postgres";

export function createDatabaseConfig(env: Record<string, string | undefined>): DatabaseConfig {
  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to configure the database package.");
  }

  return {
    provider: databaseProvider,
    databaseUrl,
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY
  };
}
