export type HealthStatus = "ok" | "unreachable";
export type ApiServiceName = "tigerpingpong-api";

export interface ApiHealthResponse {
  status: HealthStatus;
  service: ApiServiceName;
  timestamp: string;
}

export function createApiHealthResponse(): ApiHealthResponse {
  return {
    status: "ok",
    service: "tigerpingpong-api",
    timestamp: new Date().toISOString()
  };
}
