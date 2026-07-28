import { describe, expect, it } from "vitest";

import { capSupabaseSessionPoolConnections, createDatabaseConfig } from "../../packages/db/src";

describe("database configuration", () => {
  it("requires DATABASE_URL", () => {
    expect(() => createDatabaseConfig({})).toThrow(
      "DATABASE_URL is required to configure the database package."
    );
  });

  it("caps Supabase session-pool connections when no override is configured", () => {
    const config = createDatabaseConfig({
      DATABASE_URL:
        "postgresql://postgres.example:password@aws-1-us-west-2.pooler.supabase.com:5432/postgres"
    });

    expect(new URL(config.databaseUrl).searchParams.get("connection_limit")).toBe("2");
  });

  it("preserves an explicit Supabase connection limit", () => {
    const databaseUrl =
      "postgresql://postgres.example:password@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=1";

    expect(createDatabaseConfig({ DATABASE_URL: databaseUrl }).databaseUrl).toBe(databaseUrl);
  });

  it("supports a one-connection cap for migration processes", () => {
    const databaseUrl =
      "postgresql://postgres.example:password@aws-1-us-west-2.pooler.supabase.com:5432/postgres";

    expect(
      new URL(capSupabaseSessionPoolConnections(databaseUrl, "1")).searchParams.get(
        "connection_limit"
      )
    ).toBe("1");
  });

  it("does not rewrite non-session-pool database URLs", () => {
    const transactionPoolUrl =
      "postgresql://postgres.example:password@aws-1-us-west-2.pooler.supabase.com:6543/postgres";
    const localUrl = "postgresql://postgres:postgres@localhost:5432/tigerpingpong";
    const invalidUrl = "not-a-database-url";

    expect(createDatabaseConfig({ DATABASE_URL: transactionPoolUrl }).databaseUrl).toBe(
      transactionPoolUrl
    );
    expect(createDatabaseConfig({ DATABASE_URL: localUrl }).databaseUrl).toBe(localUrl);
    expect(createDatabaseConfig({ DATABASE_URL: invalidUrl }).databaseUrl).toBe(invalidUrl);
  });
});
