import type { Metadata } from "next";

import { getAdminAuditLog, type AdminAuditLogResponse } from "../../../lib/admin-api";
import { formatStatus } from "../admin-format";
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
        <p className={styles.eyebrow}>Protected admin</p>
        <h1 className={styles.title} id="admin-audit-log-title">
          Audit Log
        </h1>
        <p className={styles.intro}>
          Read-only audit-log readiness state. No admin mutation or audit writing exists in this
          UI.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="admin-audit-log-status-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="admin-audit-log-status-title">Audit log status</h2>
            <p>Status returned by the protected admin audit-log endpoint.</p>
          </div>
          <span className={styles.badge}>
            {auditLog ? formatStatus(auditLog.status) : "Unavailable"}
          </span>
        </div>

        {auditLog ? (
          <div className={styles.statusLine}>
            <p className={styles.statusText}>
              {auditLog.status === "not_configured"
                ? "Audit log is not configured yet."
                : auditLog.message}
            </p>
          </div>
        ) : (
          <div className={styles.alert}>
            <p>
              Admin audit log status could not be loaded. Confirm the API service and server-side
              admin token are configured.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
