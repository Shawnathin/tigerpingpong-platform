import type { Metadata } from "next";

import {
  getAdminOrders,
  type AdminOrderListItem,
  type AdminOrdersResponse
} from "../../../lib/admin-api";
import { formatDateTime, formatMoney, formatNullable, formatStatus } from "../admin-format";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Orders | Tiger Ping Pong",
  description: "Protected read-only Tiger Ping Pong admin order list."
};

interface OrdersResource {
  data: AdminOrdersResponse | null;
}

async function loadOrders(): Promise<OrdersResource> {
  try {
    return {
      data: await getAdminOrders({
        limit: 100
      })
    };
  } catch {
    return {
      data: null
    };
  }
}

function shortenReference(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (value.length <= 22) {
    return value;
  }

  return `${value.slice(0, 12)}...${value.slice(-6)}`;
}

function getPaymentReferenceSummary(order: AdminOrderListItem): string {
  const references = [
    {
      label: "Session",
      value: shortenReference(order.stripe.checkoutSessionId)
    },
    {
      label: "Intent",
      value: shortenReference(order.stripe.paymentIntentId)
    },
    {
      label: "Customer",
      value: shortenReference(order.stripe.customerId)
    }
  ].filter((reference) => reference.value);

  if (references.length === 0) {
    return "Not set";
  }

  return references.map((reference) => `${reference.label}: ${reference.value}`).join(" / ");
}

function renderOrdersTable(orders: AdminOrderListItem[]) {
  if (orders.length === 0) {
    return <p className={styles.emptyText}>No admin orders were returned.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order reference</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Payment / order status</th>
            <th>Items</th>
            <th>Paid date</th>
            <th>Created date</th>
            <th>Stripe summary</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td className={styles.mono}>{order.orderReference}</td>
              <td>
                <div>{formatNullable(order.customer.name)}</div>
                <div className={styles.muted}>{formatNullable(order.customer.email)}</div>
              </td>
              <td>{formatMoney(order.totalCents, order.currency)}</td>
              <td>
                <div>{formatStatus(order.paymentStatus)}</div>
                <div className={styles.muted}>{formatStatus(order.orderStatus)}</div>
              </td>
              <td>{order.itemCount}</td>
              <td>{formatDateTime(order.paidAt)}</td>
              <td>{formatDateTime(order.createdAt)}</td>
              <td className={styles.mono}>{getPaymentReferenceSummary(order)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminOrdersPage() {
  const resource = await loadOrders();
  const orders = resource.data?.items ?? [];

  return (
    <div className={styles.pageStack}>
      <section className={styles.pageHeader} aria-labelledby="admin-orders-title">
        <p className={styles.eyebrow}>Protected admin</p>
        <h1 className={styles.title} id="admin-orders-title">
          Orders
        </h1>
        <p className={styles.intro}>
          Read-only order visibility from the protected admin API. This page does not change
          payment, refund, fulfillment, cart, or checkout data.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="admin-orders-list-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="admin-orders-list-title">Order list</h2>
            <p>Showing up to 100 newest orders across all backend statuses.</p>
          </div>
          <span className={styles.badge}>Read-only</span>
        </div>

        {resource.data ? (
          renderOrdersTable(orders)
        ) : (
          <div className={styles.alert}>
            <p>
              Admin orders could not be loaded. Confirm the API service and server-side admin token
              are configured.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
