import Link from "next/link";

import {
  getInternalOrders,
  type InternalOrderListItem,
  type InternalOrdersListResponse
} from "../../lib/internal-orders-api";

import styles from "./staff-orders.module.css";

interface StaffOrdersListPageProps {
  detailBasePath: "/admin/orders" | "/internal/orders";
  intro: string;
  searchParams?: {
    limit?: string | string[];
    status?: string | string[];
  };
  title: string;
  eyebrow: string;
  adminOrdersHref?: string;
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

function formatSavings(cents: number, currency: string): string {
  return cents > 0 ? `−${formatMoney(cents, currency)}` : formatMoney(0, currency);
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

export default async function StaffOrdersListPage({
  adminOrdersHref,
  detailBasePath,
  intro,
  searchParams,
  title
}: StaffOrdersListPageProps) {
  const status = getSearchParam(searchParams?.status)?.trim() || "paid";
  const limit = getLimit(getSearchParam(searchParams?.limit));
  const resource = await loadOrders(status, limit);
  const orders = resource.data?.orders ?? [];

  return (
    <main className={styles.page}>
      <section className={styles.header} aria-labelledby="staff-orders-title">
        <h1 className={styles.title} id="staff-orders-title">
          {title}
        </h1>
        {intro ? <p className={styles.intro}>{intro}</p> : null}
        {adminOrdersHref ? (
          <div className={styles.actions}>
            <Link className={styles.link} href={adminOrdersHref}>
              Open admin orders
            </Link>
          </div>
        ) : null}
      </section>

      <section className={styles.panel} aria-labelledby="staff-orders-list-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="staff-orders-list-title">Orders</h2>
            <p>
              Showing {resource.data?.status ?? status} orders, newest paid orders first. Limit{" "}
              {resource.data?.limit ?? limit}.
            </p>
          </div>
          <span
            className={resource.error ? [styles.badge, styles.warning].join(" ") : styles.badge}
          >
            {resource.error ? "Unavailable" : `${orders.length} orders`}
          </span>
        </div>

        {resource.error ? (
          <p className={styles.emptyText}>Orders could not be loaded. Try again.</p>
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
                  <th>Regular subtotal</th>
                  <th>Savings</th>
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
                        href={`${detailBasePath}/${order.publicReference}`}
                      >
                        {order.publicReference}
                      </Link>
                      <div className={styles.muted}>{formatDateTime(order.createdAt)}</div>
                    </td>
                    <td>
                      <div>{getCustomerLabel(order)}</div>
                      <div className={styles.muted}>{formatNullable(order.customerEmail)}</div>
                    </td>
                    <td>{formatMoney(order.listSubtotalCents, order.currency)}</td>
                    <td>{formatSavings(order.discountCents, order.currency)}</td>
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
