import type { Metadata } from "next";
import Link from "next/link";

import { getAdminInventory, type AdminInventoryResponse } from "../../../lib/admin-api";
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
        <h1 className={styles.title} id="admin-inventory-title">
          Inventory
        </h1>
      </section>

      <section className={styles.panel} aria-labelledby="admin-inventory-status-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="admin-inventory-status-title" className={styles.srOnly}>
              Stock
            </h2>
          </div>
        </div>

        {inventory ? (
          <div className={styles.statusLine}>
            <p className={styles.statusText}>
              {inventory.status === "not_configured"
                ? "Stock quantities aren’t tracked."
                : inventory.message}
            </p>
            <Link className={styles.primaryButton} href="/admin/products">
              Manage stock
            </Link>
          </div>
        ) : (
          <div className={styles.alert}>
            <p>Inventory status could not be loaded. Try again.</p>
          </div>
        )}
      </section>
    </div>
  );
}
