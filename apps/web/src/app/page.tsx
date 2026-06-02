import type { ApiHealthResponse } from "@tigerpingpong/shared";

import styles from "./page.module.css";

type HealthState = ApiHealthResponse & { error?: string };

export const dynamic = "force-dynamic";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function loadApiHealth(): Promise<HealthState> {
  try {
    const response = await fetch(`${apiBaseUrl}/health`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        status: "unreachable",
        service: "tigerpingpong-api",
        timestamp: new Date().toISOString(),
        error: `API returned HTTP ${response.status}`
      };
    }

    return response.json() as Promise<ApiHealthResponse>;
  } catch (error) {
    return {
      status: "unreachable",
      service: "tigerpingpong-api",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "API health check failed"
    };
  }
}

export default async function Home() {
  const health = await loadApiHealth();

  return (
    <main className={styles.page}>
      <section className={styles.shell} aria-labelledby="home-title">
        <div>
          <p className={styles.eyebrow}>TigerPingPong.ca</p>
          <h1 className={styles.title} id="home-title">
            Tiger Ping Pong platform foundation is running.
          </h1>
        </div>

        <p className={styles.copy}>
          The Next.js web app is connected to the NestJS API health endpoint. No ecommerce features
          have been added yet.
        </p>

        <div className={styles.statusPanel}>
          <div className={styles.statusHeader}>
            <h2 className={styles.statusTitle}>API health</h2>
            <span className={styles.badge} data-status={health.status}>
              {health.status}
            </span>
          </div>

          <dl className={styles.details}>
            <div className={styles.row}>
              <dt>Service</dt>
              <dd>{health.service}</dd>
            </div>
            <div className={styles.row}>
              <dt>Checked</dt>
              <dd>{health.timestamp}</dd>
            </div>
            <div className={styles.row}>
              <dt>Endpoint</dt>
              <dd>{apiBaseUrl}/health</dd>
            </div>
            {health.error ? (
              <div className={styles.row}>
                <dt>Error</dt>
                <dd>{health.error}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>
    </main>
  );
}
