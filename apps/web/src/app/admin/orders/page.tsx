import type { Metadata } from "next";
import { revalidatePath } from "next/cache";

import {
  getAdminOrders,
  markAdminOrderShipped,
  type AdminOrderListItem,
  type AdminOrdersResponse
} from "../../../lib/admin-api";
import { formatDateTime, formatMoney, formatNullable, formatStatus } from "../admin-format";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Orders | Tiger Ping Pong",
  description: "Protected Tiger Ping Pong admin order list and shipment records."
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

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

async function markOrderShippedAction(publicReference: string, formData: FormData) {
  "use server";

  await markAdminOrderShipped(publicReference, {
    carrier: getFormValue(formData, "carrier"),
    trackingNumber: getFormValue(formData, "trackingNumber"),
    trackingUrl: getFormValue(formData, "trackingUrl"),
    shippedAt: getFormValue(formData, "shippedAt"),
    internalNote: getFormValue(formData, "internalNote")
  });

  revalidatePath("/admin/orders");
}

function formatDateInputValue(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function renderShipmentSummary(order: AdminOrderListItem) {
  const shipment = order.fulfillment;

  if (shipment.status !== "shipped") {
    return <div className={styles.muted}>{formatStatus(shipment.status)}</div>;
  }

  return (
    <div className={styles.shipmentSummary}>
      <strong>{formatStatus(shipment.status)}</strong>
      <span>{formatDateTime(shipment.shippedAt)}</span>
      <span>{formatNullable(shipment.carrier)}</span>
      <span className={styles.mono}>{formatNullable(shipment.trackingNumber)}</span>
      {shipment.trackingUrl ? (
        <a className={styles.link} href={shipment.trackingUrl} rel="noreferrer" target="_blank">
          Tracking link
        </a>
      ) : null}
      {shipment.recordedAt ? (
        <span className={styles.muted}>Recorded {formatDateTime(shipment.recordedAt)}</span>
      ) : null}
    </div>
  );
}

function renderShipmentForm(order: AdminOrderListItem) {
  if (order.orderStatus !== "paid") {
    return <span className={styles.muted}>Available after payment</span>;
  }

  const action = markOrderShippedAction.bind(null, order.orderReference);
  const shipment = order.fulfillment;
  const submitLabel = shipment.status === "shipped" ? "Update shipment" : "Mark shipped";

  return (
    <form action={action} className={styles.shipmentForm}>
      <label>
        <span>Carrier</span>
        <input
          defaultValue={shipment.carrier ?? ""}
          maxLength={80}
          name="carrier"
          required
          type="text"
        />
      </label>
      <label>
        <span>Tracking number</span>
        <input
          defaultValue={shipment.trackingNumber ?? ""}
          maxLength={120}
          name="trackingNumber"
          required
          type="text"
        />
      </label>
      <label>
        <span>Tracking URL</span>
        <input
          defaultValue={shipment.trackingUrl ?? ""}
          maxLength={2048}
          name="trackingUrl"
          type="url"
        />
      </label>
      <label>
        <span>Shipped date</span>
        <input
          defaultValue={formatDateInputValue(shipment.shippedAt)}
          name="shippedAt"
          required
          type="date"
        />
      </label>
      <label>
        <span>Internal note</span>
        <textarea
          defaultValue={shipment.internalNote ?? ""}
          maxLength={1000}
          name="internalNote"
          rows={2}
        />
      </label>
      <button className={styles.actionButton} type="submit">
        {submitLabel}
      </button>
    </form>
  );
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
            <th>Fulfillment</th>
            <th>Shipment record</th>
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
              <td>{renderShipmentSummary(order)}</td>
              <td>{renderShipmentForm(order)}</td>
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
          Protected order visibility and minimal shipment recordkeeping. Shipment updates do not
          change payment, refund, cart, checkout, or Stripe data.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="admin-orders-list-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="admin-orders-list-title">Order list</h2>
            <p>Showing up to 100 newest orders across all backend statuses.</p>
          </div>
          <span className={styles.badge}>Protected shipment updates</span>
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
