import type { Metadata } from "next";
import Link from "next/link";

import {
  getAdminDashboardSummary,
  type AdminDashboardSummary,
  type AdminOrderListItem,
  type AdminSectionStatus
} from "../../lib/admin-api";
import { formatCount, formatDateTime, formatMoney, formatStatus } from "./admin-format";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard | Tiger Ping Pong",
  description: "Protected Tiger Ping Pong admin dashboard summary."
};

interface DashboardResource {
  data: AdminDashboardSummary | null;
}

async function loadDashboard(): Promise<DashboardResource> {
  try {
    return {
      data: await getAdminDashboardSummary()
    };
  } catch {
    return {
      data: null
    };
  }
}

function getBadgeClass(status: AdminSectionStatus): string {
  if (status === "ok" || status === "tracked") {
    return [styles.badge, styles.badgeOk].join(" ");
  }

  if (status === "not_configured" || status === "no_events") {
    return [styles.badge, styles.badgeMuted].join(" ");
  }

  return [styles.badge, styles.badgeWarning].join(" ");
}

function getStatusText(status: AdminSectionStatus, configuredText: string): string {
  if (status === "not_configured") {
    return "Not configured yet";
  }

  if (status === "ok") {
    return configuredText;
  }

  return formatStatus(status);
}

function getRecentOrders(summary: AdminDashboardSummary): AdminOrderListItem[] {
  return summary.orders.recent.slice(0, 5);
}

function formatSavings(cents: number, currency: string): string {
  return cents > 0 ? `−${formatMoney(cents, currency)}` : formatMoney(0, currency);
}

function renderRecentOrders(summary: AdminDashboardSummary) {
  const orders = getRecentOrders(summary);

  if (orders.length === 0) {
    return <p className={styles.emptyText}>No recent orders were returned by the admin API.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Customer</th>
            <th>Regular subtotal</th>
            <th>Savings</th>
            <th>Total</th>
            <th>Status</th>
            <th>Paid</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <Link className={styles.link} href="/admin/orders">
                  {order.orderReference}
                </Link>
              </td>
              <td>
                <div>{order.customer.name || order.customer.email || "Not set"}</div>
                <div className={styles.muted}>{order.customer.email || "Not set"}</div>
              </td>
              <td>{formatMoney(order.listSubtotalCents, order.currency)}</td>
              <td>{formatSavings(order.discountCents, order.currency)}</td>
              <td>{formatMoney(order.totalCents, order.currency)}</td>
              <td>{formatStatus(order.orderStatus)}</td>
              <td>{formatDateTime(order.paidAt)}</td>
              <td>{formatDateTime(order.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderProductWarnings(summary: AdminDashboardSummary) {
  const warnings = summary.products.warnings;
  const rows = [
    {
      count: warnings.missingCheckoutPriceCount,
      label: "Missing checkout price"
    },
    {
      count: warnings.missingPublicImageCount,
      label: "Missing public image"
    }
  ].filter((item) => item.count > 0);

  if (rows.length === 0) {
    return <p className={styles.emptyText}>No product warnings from the admin summary.</p>;
  }

  return (
    <ul className={styles.warningList}>
      {rows.map((item) => (
        <li key={item.label}>
          {item.label}: {formatCount(item.count)}
        </li>
      ))}
    </ul>
  );
}

export default async function AdminDashboardPage() {
  const resource = await loadDashboard();
  const summary = resource.data;

  return (
    <div className={styles.pageStack}>
      <section className={styles.pageHeader} aria-labelledby="admin-dashboard-title">
        <p className={styles.eyebrow}>Protected admin</p>
        <h1 className={styles.title} id="admin-dashboard-title">
          Dashboard
        </h1>
        <p className={styles.intro}>
          A lightweight read-only staff view for orders, products, customers, and operational
          readiness.
        </p>
      </section>

      {!summary ? (
        <section className={styles.alert} aria-label="Admin dashboard unavailable">
          <p>
            Admin dashboard data could not be loaded. Confirm the server-side admin token and API
            service are configured.
          </p>
        </section>
      ) : (
        <>
          <section className={styles.metricGrid} aria-label="Admin dashboard metrics">
            <div className={styles.metricCard}>
              <span>Paid orders</span>
              <strong>{formatCount(summary.orders.paidCount)}</strong>
              <small>{getStatusText(summary.orders.status, "Orders available")}</small>
            </div>
            <div className={styles.metricCard}>
              <span>Pending checkout</span>
              <strong>{formatCount(summary.orders.pendingCheckoutCount)}</strong>
              <small>Checkout or order count awaiting payment</small>
            </div>
            <div className={styles.metricCard}>
              <span>Products</span>
              <strong>{formatCount(summary.products.totalCount)}</strong>
              <small>{formatCount(summary.products.activeCount)} active</small>
            </div>
            <div className={styles.metricCard}>
              <span>Checkout scope</span>
              <strong>{formatCount(summary.products.checkoutScopeCount)}</strong>
              <small>{formatCount(summary.products.variantCount)} variants</small>
            </div>
          </section>

          <section className={styles.panel} aria-labelledby="admin-recent-orders-title">
            <div className={styles.panelHeader}>
              <div>
                <h2 id="admin-recent-orders-title">Recent orders</h2>
                <p>Newest backend order records returned by the protected admin API.</p>
              </div>
              <span className={getBadgeClass(summary.orders.status)}>
                {formatStatus(summary.orders.status)}
              </span>
            </div>
            {renderRecentOrders(summary)}
          </section>

          <section className={styles.statusGrid} aria-label="Admin readiness status">
            <div className={styles.statusPanel}>
              <h2>
                Products
                <span className={getBadgeClass(summary.products.status)}>
                  {formatStatus(summary.products.status)}
                </span>
              </h2>
              {renderProductWarnings(summary)}
            </div>

            <div className={styles.statusPanel}>
              <h2>
                Webhook and payment
                <span className={getBadgeClass(summary.payments.status)}>
                  {formatStatus(summary.payments.status)}
                </span>
              </h2>
              <p className={styles.statusText}>
                {summary.payments.webhookEventsTracked
                  ? `${formatCount(
                      summary.payments.totalWebhookEventsCount
                    )} webhook events tracked, ${formatCount(
                      summary.payments.unprocessedWebhookEventsCount
                    )} unprocessed.`
                  : "No webhook events are tracked yet."}
              </p>
            </div>

            <div className={styles.statusPanel}>
              <h2>
                Inventory
                <span className={getBadgeClass(summary.inventory.status)}>
                  {formatStatus(summary.inventory.status)}
                </span>
              </h2>
              <p className={styles.statusText}>
                {summary.inventory.status === "not_configured"
                  ? "Not configured yet"
                  : summary.inventory.message}
              </p>
            </div>

            <div className={styles.statusPanel}>
              <h2>
                Audit log
                <span className={getBadgeClass(summary.auditLog?.status ?? "not_configured")}>
                  {formatStatus(summary.auditLog?.status ?? "not_configured")}
                </span>
              </h2>
              <p className={styles.statusText}>
                {(summary.auditLog?.status ?? "not_configured") === "not_configured"
                  ? "Not configured yet"
                  : (summary.auditLog?.message ?? "Audit log status is unavailable.")}
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
