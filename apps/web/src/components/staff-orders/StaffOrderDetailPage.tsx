import Link from "next/link";

import {
  getInternalOrder,
  type InternalOrderDetail,
  type InternalShippingAddress
} from "../../lib/internal-orders-api";

import styles from "./staff-orders.module.css";

interface StaffOrderDetailPageProps {
  backHref: "/admin/orders" | "/internal/orders";
  eyebrow: string;
  publicReference: string;
  saveShipmentRecord: (formData: FormData) => Promise<void>;
  searchParams?: {
    shipmentError?: string | string[];
    shipmentSaved?: string | string[];
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

function getSearchParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function renderFallback(
  publicReference: string,
  error: boolean,
  eyebrow: string,
  backHref: StaffOrderDetailPageProps["backHref"]
) {
  return (
    <main className={styles.page}>
      <section className={styles.header} aria-labelledby="staff-order-fallback-title">
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title} id="staff-order-fallback-title">
          Order unavailable
        </h1>
        <p className={styles.intro}>
          {error
            ? "The internal orders API could not be reached for this protected staff view."
            : "No order was found for that public reference."}
        </p>
      </section>

      <section className={styles.panel} aria-label="Order fallback">
        <div className={styles.actions}>
          <Link className={styles.link} href={backHref}>
            Back to orders
          </Link>
          <span className={styles.mono}>{publicReference}</span>
        </div>
      </section>
    </main>
  );
}

export default async function StaffOrderDetailPage({
  backHref,
  eyebrow,
  publicReference,
  saveShipmentRecord,
  searchParams
}: StaffOrderDetailPageProps) {
  const resource = await loadOrder(publicReference);
  const order = resource.order;
  const shipmentSaved = getSearchParam(searchParams?.shipmentSaved) === "1";
  const shipmentError = getSearchParam(searchParams?.shipmentError) === "1";

  if (!order) {
    return renderFallback(publicReference, resource.error, eyebrow, backHref);
  }

  return (
    <main className={styles.page}>
      <section className={styles.header} aria-labelledby="staff-order-title">
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title} id="staff-order-title">
          Order {order.publicReference}
        </h1>
        <p className={styles.intro}>
          This protected staff page can save shipment details. It does not mutate payment, refund,
          checkout, or customer data.
        </p>
        <div className={styles.actions}>
          <Link className={styles.link} href={backHref}>
            Back to orders
          </Link>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="staff-order-summary-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="staff-order-summary-title">Summary</h2>
            <p>Backend order status and Stripe references.</p>
          </div>
          <span className={styles.badge}>Protected</span>
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

      <section className={styles.panel} aria-labelledby="staff-order-shipment-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="staff-order-shipment-title">Shipment record</h2>
            <p>Manual staff tracking details only. This does not send customer email.</p>
          </div>
          <span className={styles.badge}>Manual</span>
        </div>

        {shipmentSaved ? <p className={styles.successText}>Shipment details saved.</p> : null}
        {shipmentError ? (
          <p className={styles.errorText}>Shipment details could not be saved.</p>
        ) : null}

        <form className={styles.formGrid} action={saveShipmentRecord}>
          <input type="hidden" name="publicReference" value={order.publicReference} />
          <label className={styles.field}>
            <span>Carrier</span>
            <input
              name="carrier"
              required
              maxLength={500}
              defaultValue={order.shipment.carrier ?? ""}
              autoComplete="off"
            />
          </label>
          <label className={styles.field}>
            <span>Tracking number</span>
            <input
              name="trackingNumber"
              required
              maxLength={500}
              defaultValue={order.shipment.trackingNumber ?? ""}
              autoComplete="off"
            />
          </label>
          <label className={styles.fieldFull}>
            <span>Tracking URL</span>
            <input
              name="trackingUrl"
              type="url"
              required
              maxLength={1000}
              defaultValue={order.shipment.trackingUrl ?? ""}
              autoComplete="off"
            />
          </label>
          <label className={styles.field}>
            <span>Shipped date</span>
            <input
              name="shippedDate"
              type="date"
              required
              defaultValue={formatDateInputValue(order.shipment.shippedAt)}
            />
          </label>
          <label className={styles.fieldFull}>
            <span>Internal note</span>
            <textarea
              name="internalNote"
              required
              maxLength={2000}
              rows={4}
              defaultValue={order.shipment.internalNote ?? ""}
            />
          </label>
          <div className={styles.formActions}>
            <button className={styles.button} type="submit">
              Save shipment details
            </button>
          </div>
        </form>
      </section>

      <section className={styles.panel} aria-labelledby="staff-order-contact-title">
        <div className={styles.section}>
          <h2 id="staff-order-contact-title">Customer and shipping</h2>
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

      <section className={styles.panel} aria-labelledby="staff-order-totals-title">
        <div className={styles.section}>
          <h2 id="staff-order-totals-title">Totals</h2>
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

      <section className={styles.panel} aria-labelledby="staff-order-items-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="staff-order-items-title">Item snapshots</h2>
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

      <section className={styles.panel} aria-labelledby="staff-order-stripe-title">
        <div className={styles.section}>
          <h2 id="staff-order-stripe-title">Stripe references</h2>
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
