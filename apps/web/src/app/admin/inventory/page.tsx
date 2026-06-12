import type { Metadata } from "next";

import { getAdminInventory, type AdminInventoryResponse } from "../../../lib/admin-api";
import { formatStatus } from "../admin-format";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Inventory | Tiger Ping Pong",
  description: "Protected read-only Tiger Ping Pong inventory status."
};

interface InventoryResource {
  data: AdminInventoryResponse | null;
}

async function loadInventory(): Promise<InventoryResource> {
  try {
    return {
      data: await getAdminInventory()
    };
  } catch {
    return {
      data: null
    };
  }
}

export default async function AdminInventoryPage() {
  const resource = await loadInventory();
  const inventory = resource.data;

  return (
    <div className={styles.pageStack}>
      <section className={styles.pageHeader} aria-labelledby="admin-inventory-title">
        <p className={styles.eyebrow}>Protected admin</p>
        <h1 className={styles.title} id="admin-inventory-title">
          Inventory
        </h1>
        <p className={styles.intro}>
          Read-only inventory readiness state. Inventory editing is intentionally not included.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="admin-inventory-status-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="admin-inventory-status-title">Inventory status</h2>
            <p>Status returned by the protected admin inventory endpoint.</p>
          </div>
          <span className={styles.badge}>
            {inventory ? formatStatus(inventory.status) : "Unavailable"}
          </span>
        </div>

        {inventory ? (
          <div className={styles.statusLine}>
            <p className={styles.statusText}>
              {inventory.status === "not_configured"
                ? "Inventory editing is not configured yet."
                : inventory.message}
            </p>
          </div>
        ) : (
          <div className={styles.alert}>
            <p>
              Admin inventory status could not be loaded. Confirm the API service and server-side
              admin token are configured.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
