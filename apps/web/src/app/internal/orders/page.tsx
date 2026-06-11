import type { Metadata } from "next";
import Link from "next/link";

import {
  getInternalOrders,
  type InternalOrderListItem,
  type InternalOrdersListResponse
} from "../../../lib/internal-orders-api";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Internal Orders | Tiger Ping Pong Platform",
  description: "Protected read-only internal paid order review."
};

interface InternalOrdersPageProps {
  searchParams?: {
    limit?: string | string[];
    status?: string | string[];
  };
}

interface OrdersResource {
  data: InternalOrdersListResponse | null;
  error: boolean;
}

async function loadOrders(status: string, limit: number): Promise<OrdersResource> {
  try {
    return {
      data: await getInternalOrders({
        limit,
        status
      }),
      error: false
    };
  } catch {
    return {
      data: null,
      error: true
    };
  }
}

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getLimit(value: string | undefined): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 50;
  }

  return Math.min(parsed, 100);
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-CA", {
    currency,
    style: "currency"
  }).format(cents / 100);
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatNullable(value: string | null): string {
  return value?.trim() || "Not set";
}

function formatStatus(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getCustomerLabel(order: InternalOrderListItem): string {
  return order.customerName || order.customerEmail || "Not set";
}

export default async function InternalOrdersPage({ searchParams }: InternalOrdersPageProps) {
  const status = getSearchParam(searchParams?.status)?.trim() || "paid";
  const limit = getLimit(getSearchParam(searchParams?.limit));
  const resource = await loadOrders(status, limit);
  const orders = resource.data?.orders ?? [];

  return (
    <main className={styles.page}>
      <section className={styles.header} aria-labelledby="internal-orders-title">
        <p className={styles.eyebrow}>Tiger Ping Pong internal</p>
        <h1 className={styles.title} id="internal-orders-title">
          Paid order review
        </h1>
        <p className={styles.intro}>
          Protected read-only staff view for reviewing backend-confirmed Stripe orders.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="internal-orders-list-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="internal-orders-list-title">Orders</h2>
            <p>
              Showing {resource.data?.status ?? status} orders, newest paid orders first. Limit{" "}
              {resource.data?.limit ?? limit}.
            </p>
          </div>
          <span
            className={resource.error ? [styles.badge, styles.warning].join(" ") : styles.badge}
          >
            {resource.error ? "API unavailable" : "Read-only"}
          </span>
        </div>

        {resource.error ? (
          <p className={styles.emptyText}>
            Internal orders could not be loaded. Confirm the API service is reachable and the
            server-side internal token is configured.
          </p>
        ) : orders.length === 0 ? (
          <p className={styles.emptyText}>No matching orders were found.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Paid</th>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>PaymentIntent</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.publicReference}>
                    <td>{formatDateTime(order.paidAt)}</td>
                    <td>
                      <Link
                        className={styles.link}
                        href={`/internal/orders/${order.publicReference}`}
                      >
                        {order.publicReference}
                      </Link>
                      <div className={styles.muted}>{formatDateTime(order.createdAt)}</div>
                    </td>
                    <td>
                      <div>{getCustomerLabel(order)}</div>
                      <div className={styles.muted}>{formatNullable(order.customerEmail)}</div>
                    </td>
                    <td>{formatMoney(order.totalCents, order.currency)}</td>
                    <td>{formatStatus(order.status)}</td>
                    <td>{order.itemCount}</td>
                    <td className={styles.mono}>{formatNullable(order.stripePaymentIntentId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
