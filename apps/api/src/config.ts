export interface ApiConfig {
  corsOrigins: string[];
  port: number;
}

function readCsv(value: string | undefined, fallback: string[]): string[] {
  if (!value) {
    return fallback;
  }

  const values = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return values.length > 0 ? values : fallback;
}

function readPort(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    corsOrigins: readCsv(env.CORS_ORIGIN, ["http://localhost:3000"]),
    port: readPort(env.PORT, 3001)
  };
}
