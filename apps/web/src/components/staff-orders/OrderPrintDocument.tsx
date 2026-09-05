import type { InternalOrderDetail } from "../../lib/internal-orders-api";
import { getOrderPrintTotal } from "./order-print-total";
import { getShipmentDate } from "./shipment-date";
import styles from "./order-print.module.css";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(cents / 100);
}

function date(value: string | null) {
  if (!value || Number.isNaN(Date.parse(value))) return "Not recorded";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeZone: "America/Vancouver"
  }).format(new Date(value));
}

export default function OrderPrintDocument({ order }: { order: InternalOrderDetail }) {
  const address = order.shippingAddress;
  const addressLines = address
    ? [
        address.line1,
        address.line2,
        [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
        address.country
      ].filter(Boolean)
    : [];
  const total = getOrderPrintTotal(order);
  const tax = order.stripeAmountTaxCents ?? order.taxAmountCents;
  const trackingUrl =
    order.shipment.trackingUrl && /^https?:\/\//i.test(order.shipment.trackingUrl)
      ? order.shipment.trackingUrl
      : null;
  return (
    <article className={styles.document} aria-label="Printable order summary">
      <header className={styles.heading}>
        <div>
          <div className={styles.brand}>Tiger PingPong</div>
          <p>Order summary</p>
        </div>
        <div className={styles.reference}>
          <h1>{order.publicReference}</h1>
          <p>{date(order.createdAt)}</p>
          <strong>{order.status.replaceAll("_", " ")}</strong>
        </div>
      </header>
      <section className={styles.addresses}>
        <div>
          <h2>Customer</h2>
          <p>{order.customerName || "Not recorded"}</p>
          {order.customerEmail && <p>{order.customerEmail}</p>}
          {order.customerPhone && <p>{order.customerPhone}</p>}
        </div>
        <div>
          <h2>Ship to</h2>
          <p>{order.shippingName || order.customerName || "Not recorded"}</p>
          {addressLines.length ? (
            addressLines.map((line, index) => <p key={index}>{line}</p>)
          ) : (
            <p>Address not recorded</p>
          )}
          {order.shippingPhone && <p>{order.shippingPhone}</p>}
        </div>
      </section>
      <table className={styles.items}>
        <caption>Order items · {order.currency.toUpperCase()}</caption>
        <thead>
          <tr>
            <th scope="col">
              Item<span className={styles.tableReference}>{order.publicReference}</span>
            </th>
            <th scope="col">Qty</th>
            <th scope="col">Unit price</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={index}>
              <td>
                <strong>{item.name}</strong>
                {item.sku && <span className={styles.sku}>SKU {item.sku}</span>}
              </td>
              <td>{item.quantity}</td>
              <td>{money(item.unitPriceCents, item.currency)}</td>
              <td>{money(item.lineTotalCents, item.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className={styles.totals} aria-label="Order totals">
        {order.discountCents > 0 && (
          <>
            <div>
              <span>Items before savings</span>
              <span>{money(order.listSubtotalCents, order.currency)}</span>
            </div>
            <div>
              <span>Savings</span>
              <span>-{money(order.discountCents, order.currency)}</span>
            </div>
          </>
        )}
        <div>
          <span>Subtotal</span>
          <span>{money(order.subtotalCents, order.currency)}</span>
        </div>
        <div>
          <span>Shipping</span>
          <span>{money(order.shippingCents, order.currency)}</span>
        </div>
        {total.hasFinalTotal && (
          <div>
            <span>Tax</span>
            <span>{tax === null ? "Not recorded" : money(tax, order.currency)}</span>
          </div>
        )}
        <div className={styles.total}>
          <strong>{total.label}</strong>
          <strong>
            {money(total.cents, order.currency)} {order.currency.toUpperCase()}
          </strong>
        </div>
      </section>
      <section className={styles.shipment}>
        <h2>Shipment</h2>
        {order.shipment.shippedAt ? (
          <>
            <p>
              {order.shipment.carrier || "Carrier not recorded"} · Shipped{" "}
              {getShipmentDate(order.shipment.shippedAt)}
            </p>
            {order.shipment.trackingNumber && <p>Tracking: {order.shipment.trackingNumber}</p>}
            {!order.shipment.trackingNumber && <p>Waiting for tracking</p>}
            {trackingUrl && (
              <p className={styles.tracking}>
                <a href={trackingUrl}>{trackingUrl}</a>
              </p>
            )}
          </>
        ) : (
          <p>Waiting for tracking</p>
        )}
      </section>
      <footer className={styles.footer}>Tiger PingPong · {order.publicReference}</footer>
    </article>
  );
}
