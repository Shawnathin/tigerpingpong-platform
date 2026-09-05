import type { Metadata } from "next";

import { getAdminAuditLog, type AdminAuditLogResponse } from "../../../lib/admin-api";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Audit Log | Tiger Ping Pong",
  description: "Protected read-only Tiger Ping Pong audit log status."
};

interface AuditLogResource {
  data: AdminAuditLogResponse | null;
}

async function loadAuditLog(): Promise<AuditLogResource> {
  try {
    return {
      data: await getAdminAuditLog()
    };
  } catch {
    return {
      data: null
    };
  }
}

export default async function AdminAuditLogPage() {
  const resource = await loadAuditLog();
  const auditLog = resource.data;

  return (
    <div className={styles.pageStack}>
      <section className={styles.pageHeader} aria-labelledby="admin-audit-log-title">
        <h1 className={styles.title} id="admin-audit-log-title">
          Audit Log
        </h1>
      </section>

      <section className={styles.panel} aria-labelledby="admin-audit-log-status-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="admin-audit-log-status-title" className={styles.srOnly}>
              Change history
            </h2>
          </div>
        </div>

        {auditLog ? (
          <div className={styles.statusLine}>
            <p className={styles.statusText}>
              {auditLog.status === "not_configured"
                ? "Change history isn’t available yet."
                : auditLog.message}
            </p>
          </div>
        ) : (
          <div className={styles.alert}>
            <p>Audit log status could not be loaded. Try again.</p>
          </div>
        )}
      </section>
    </div>
  );
}
