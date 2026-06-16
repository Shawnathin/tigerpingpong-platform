import type { Metadata } from "next";
import Link from "next/link";

import {
  getInternalOrder,
  type InternalOrderDetail,
  type InternalShippingAddress
} from "../../../../lib/internal-orders-api";

import styles from "../page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Internal Order Detail | Tiger Ping Pong Platform",
  description: "Protected read-only internal order detail."
};

interface InternalOrderDetailPageProps {
  params: {
    publicReference: string;
  };
}

interface OrderResource {
  error: boolean;
  order: InternalOrderDetail | null;
}

async function loadOrder(publicReference: string): Promise<OrderResource> {
  try {
    return {
      error: false,
      order: await getInternalOrder(publicReference)
    };
  } catch {
    return {
      error: true,
      order: null
    };
  }
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-CA", {
    currency,
    style: "currency"
  }).format(cents / 100);
}

function formatNullableMoney(cents: number | null | undefined, currency: string): string {
  return typeof cents === "number" ? formatMoney(cents, currency) : "Not set";
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

function formatNullable(value: string | null | undefined): string {
  return value?.trim() || "Not set";
}

function formatStatus(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAddress(address: InternalShippingAddress | null): string {
  if (!address) {
    return "Not set";
  }

  const cityLine = [address.city, address.state, address.postalCode].filter(Boolean).join(", ");
  const lines = [address.line1, address.line2, cityLine, address.country].filter(Boolean);

  return lines.length > 0 ? lines.join("\n") : "Not set";
}

function renderFallback(publicReference: string, error: boolean) {
  return (
    <main className={styles.page}>
      <section className={styles.header} aria-labelledby="internal-order-fallback-title">
        <p className={styles.eyebrow}>Tiger Ping Pong internal</p>
        <h1 className={styles.title} id="internal-order-fallback-title">
          Order unavailable
        </h1>
        <p className={styles.intro}>
          {error
            ? "The internal orders API could not be reached for this protected read-only view."
            : "No order was found for that public reference."}
        </p>
      </section>

      <section className={styles.panel} aria-label="Order fallback">
        <div className={styles.actions}>
          <Link className={styles.link} href="/internal/orders">
            Back to internal orders
          </Link>
          <span className={styles.mono}>{publicReference}</span>
        </div>
      </section>
    </main>
  );
}

export default async function InternalOrderDetailPage({ params }: InternalOrderDetailPageProps) {
  const resource = await loadOrder(params.publicReference);
  const order = resource.order;

  if (!order) {
    return renderFallback(params.publicReference, resource.error);
  }

  return (
    <main className={styles.page}>
      <section className={styles.header} aria-labelledby="internal-order-title">
        <p className={styles.eyebrow}>Tiger Ping Pong internal</p>
        <h1 className={styles.title} id="internal-order-title">
          Order {order.publicReference}
        </h1>
        <p className={styles.intro}>
          This protected staff page is read-only. It does not mutate payment, fulfillment, refund,
          or customer data.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="internal-order-summary-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="internal-order-summary-title">Summary</h2>
            <p>Backend order status and Stripe references.</p>
          </div>
          <span className={styles.badge}>Read-only</span>
        </div>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span>Status</span>
            <strong>{formatStatus(order.status)}</strong>
          </div>
          <div className={styles.summaryCard}>
            <span>Paid</span>
            <strong>{formatDateTime(order.paidAt)}</strong>
          </div>
          <div className={styles.summaryCard}>
            <span>App total</span>
            <strong>{formatMoney(order.totalCents, order.currency)}</strong>
          </div>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="internal-order-contact-title">
        <div className={styles.section}>
          <h2 id="internal-order-contact-title">Customer and shipping</h2>
          <dl className={styles.definitionList}>
            <div>
              <dt>Customer name</dt>
              <dd>{formatNullable(order.customerName)}</dd>
            </div>
            <div>
              <dt>Customer email</dt>
              <dd>{formatNullable(order.customerEmail)}</dd>
            </div>
            <div>
              <dt>Customer phone</dt>
              <dd>{formatNullable(order.customerPhone)}</dd>
            </div>
            <div>
              <dt>Shipping name</dt>
              <dd>{formatNullable(order.shippingName)}</dd>
            </div>
            <div>
              <dt>Shipping phone</dt>
              <dd>{formatNullable(order.shippingPhone)}</dd>
            </div>
            <div>
              <dt>Shipping address</dt>
              <dd style={{ whiteSpace: "pre-line" }}>{formatAddress(order.shippingAddress)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="internal-order-totals-title">
        <div className={styles.section}>
          <h2 id="internal-order-totals-title">Totals</h2>
          <dl className={styles.definitionList}>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(order.subtotalCents, order.currency)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{formatMoney(order.shippingCents, order.currency)}</dd>
            </div>
            <div>
              <dt>App total before tax</dt>
              <dd>{formatMoney(order.totalCents, order.currency)}</dd>
            </div>
            <div>
              <dt>Stripe tax</dt>
              <dd>{formatNullableMoney(order.stripeAmountTaxCents, order.currency)}</dd>
            </div>
            <div>
              <dt>Stripe charged total</dt>
              <dd>{formatNullableMoney(order.stripeAmountTotalCents, order.currency)}</dd>
            </div>
            <div>
              <dt>Currency</dt>
              <dd>{order.currency}</dd>
            </div>
            <div>
              <dt>Shipping rule</dt>
              <dd className={styles.mono}>{order.shippingRule}</dd>
            </div>
            <div>
              <dt>Checkout source</dt>
              <dd className={styles.mono}>{order.checkoutSource}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="internal-order-items-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="internal-order-items-title">Item snapshots</h2>
            <p>Rows reflect the order item snapshots stored at checkout time.</p>
          </div>
          <span className={styles.badge}>{order.items.length} items</span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Product slug</th>
                <th>Variant</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={`${item.productSlug}-${item.variantKey ?? "base"}`}>
                  <td>{item.name}</td>
                  <td className={styles.mono}>{formatNullable(item.sku)}</td>
                  <td className={styles.mono}>{item.productSlug}</td>
                  <td className={styles.mono}>{formatNullable(item.variantKey)}</td>
                  <td>{formatMoney(item.unitPriceCents, item.currency)}</td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.lineTotalCents, item.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="internal-order-stripe-title">
        <div className={styles.section}>
          <h2 id="internal-order-stripe-title">Stripe references</h2>
          <dl className={styles.definitionList}>
            <div>
              <dt>Checkout Session ID</dt>
              <dd className={styles.mono}>{formatNullable(order.stripeCheckoutSessionId)}</dd>
            </div>
            <div>
              <dt>PaymentIntent ID</dt>
              <dd className={styles.mono}>{formatNullable(order.stripePaymentIntentId)}</dd>
            </div>
            <div>
              <dt>Customer ID</dt>
              <dd className={styles.mono}>{formatNullable(order.stripeCustomerId)}</dd>
            </div>
            <div>
              <dt>Automatic tax status</dt>
              <dd className={styles.mono}>{formatNullable(order.stripeAutomaticTaxStatus)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDateTime(order.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatDateTime(order.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
