export interface OrderEmailTemplateItem {
  lineTotalCents: number;
  name: string;
  quantity: number;
}

export interface OrderEmailTemplateOrder {
  currency: string;
  customerEmail: string | null;
  customerName: string | null;
  items: OrderEmailTemplateItem[];
  paidAt: Date | null;
  publicReference: string;
  shipmentCarrier: string | null;
  shipmentShippedAt: Date | null;
  shipmentTrackingNumber: string | null;
  shipmentTrackingUrl: string | null;
  shippingName: string | null;
  stripeAmountTotalCents: number | null;
  totalCents: number;
}

export interface RenderedOrderEmail {
  html: string;
  subject: string;
  text: string;
}

export const TIGER_EMAIL_THEME = {
  blue: "#74c8f2",
  ink: "#171b2e",
  mist: "#edf9fc",
  muted: "#5d6678",
  navy: "#102947",
  orange: "#f28a2e",
  orangeDeep: "#e86f18",
  teal: "#51d2bf",
  warm: "#fffaf5"
} as const;

const TIGER_CONTACT_EMAIL = "info@tigerpingpong.com";
const TIGER_CONTACT_PHONE_DISPLAY = "1-888-552-5259";
const TIGER_CONTACT_PHONE_HREF = "tel:+18885525259";

export interface TigerEmailLayoutInput {
  eyebrow: string;
  headline: string;
  intro: string;
  main: string;
  preheader: string;
  reference: string;
  surface: "customer" | "staff";
}

export function renderOrderReceivedEmail(order: OrderEmailTemplateOrder): RenderedOrderEmail {
  const reference = order.publicReference;
  const hasStripeTotal = order.stripeAmountTotalCents !== null;
  const displayedTotal = formatMoney(
    order.stripeAmountTotalCents ?? order.totalCents,
    order.currency
  );
  const greeting = createGreeting(order);
  const subject = `We’ve got your Tiger PingPong order ${reference}`;
  const detailRows = [
    renderDetailRow("Order reference", reference),
    renderDetailRow(hasStripeTotal ? "Total paid" : "Order total before tax", displayedTotal)
  ].join("");
  const html = renderTigerEmailLayout({
    eyebrow: "Payment confirmed",
    headline: "We’ve got your order.",
    intro: `${greeting} Your payment is confirmed. We’ll review the details and get everything ready. We’ll send another email with tracking once it ships.`,
    main: `${renderItems(order)}${renderDetailsTable(detailRows)}`,
    preheader: `Payment confirmed for Tiger PingPong order ${reference}.`,
    reference,
    surface: "customer"
  });
  const text = [
    "Payment confirmed",
    "",
    "We’ve got your order.",
    "",
    `${greeting} Your payment is confirmed. We’ll review the details and get everything ready. We’ll send another email with tracking once it ships.`,
    "",
    renderItemsText(order),
    `Order reference: ${reference}`,
    `${hasStripeTotal ? "Total paid" : "Order total before tax"}: ${displayedTotal}`,
    "",
    renderCustomerSupportText()
  ].join("\n");

  return { html, subject, text };
}

export function renderShipmentEmail(order: OrderEmailTemplateOrder): RenderedOrderEmail {
  const reference = order.publicReference;
  const carrier = order.shipmentCarrier?.trim() ?? "your carrier";
  const trackingNumber = order.shipmentTrackingNumber?.trim() ?? "";
  const trackingUrl = order.shipmentTrackingUrl?.trim() ?? "";
  const shippedDate = formatDate(order.shipmentShippedAt);
  const greeting = createGreeting(order);
  const subject = `Your Tiger PingPong order is on the way — ${reference}`;
  const detailRows = [
    renderDetailRow("Carrier", carrier),
    renderDetailRow("Tracking number", trackingNumber),
    renderDetailRow("Shipped", shippedDate),
    renderDetailRow("Order reference", reference)
  ].join("");
  const html = renderTigerEmailLayout({
    eyebrow: "Shipment update",
    headline: "Your order is on the way.",
    intro: `${greeting} Your order has shipped with ${carrier}. Use the link below for the latest tracking details from the carrier.`,
    main: `${renderAction("Track your order", trackingUrl)}${renderDetailsTable(detailRows, false)}`,
    preheader: `Tracking is ready for Tiger PingPong order ${reference}.`,
    reference,
    surface: "customer"
  });
  const text = [
    "Shipment update",
    "",
    "Your order is on the way.",
    "",
    `${greeting} Your order has shipped with ${carrier}. Use the link below for the latest tracking details from the carrier.`,
    "",
    `Track your order: ${trackingUrl}`,
    `Carrier: ${carrier}`,
    `Tracking number: ${trackingNumber}`,
    `Shipped: ${shippedDate}`,
    `Order reference: ${reference}`,
    "",
    renderCustomerSupportText()
  ].join("\n");

  return { html, subject, text };
}

export function renderStaffNewOrderEmail(order: OrderEmailTemplateOrder): RenderedOrderEmail {
  const reference = order.publicReference;
  const hasStripeTotal = order.stripeAmountTotalCents !== null;
  const displayedTotal = formatMoney(
    order.stripeAmountTotalCents ?? order.totalCents,
    order.currency
  );
  const customerName = order.customerName?.trim() || order.shippingName?.trim() || "Not set";
  const customerEmail = order.customerEmail?.trim() || "Not set";
  const paidAt = formatDateTime(order.paidAt);
  const subject = `New paid order ${reference} — ${displayedTotal}`;
  const detailRows = [
    renderDetailRow("Order reference", reference),
    renderDetailRow("Customer", customerName),
    renderDetailRow("Customer email", customerEmail),
    renderDetailRow(hasStripeTotal ? "Total paid" : "Order total before tax", displayedTotal),
    renderDetailRow("Paid", paidAt)
  ].join("");
  const html = renderTigerEmailLayout({
    eyebrow: "Staff order alert",
    headline: "A new paid order is ready.",
    intro: "Stripe payment is confirmed and the order is ready for staff review and fulfilment.",
    main: `${renderItems(order, "Order items")}${renderDetailsTable(detailRows)}`,
    preheader: `New paid Tiger PingPong order ${reference} for ${displayedTotal}.`,
    reference,
    surface: "staff"
  });
  const text = [
    "Staff order alert",
    "",
    "A new paid order is ready.",
    "",
    "Stripe payment is confirmed and the order is ready for staff review and fulfilment.",
    "",
    renderItemsText(order, "Order items"),
    `Order reference: ${reference}`,
    `Customer: ${customerName}`,
    `Customer email: ${customerEmail}`,
    `${hasStripeTotal ? "Total paid" : "Order total before tax"}: ${displayedTotal}`,
    `Paid: ${paidAt}`,
    "",
    "Open the protected Tiger PingPong admin to review the complete order."
  ].join("\n");

  return { html, subject, text };
}

export function renderTigerEmailLayout(input: TigerEmailLayoutInput): string {
  const footer = input.surface === "staff" ? renderStaffFooter() : renderCustomerSupportFooter();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(input.headline)}</title>
  <style>
    @media only screen and (max-width: 640px) {
      .tiger-shell { padding: 18px 10px !important; }
      .tiger-hero, .tiger-body { padding-left: 24px !important; padding-right: 24px !important; }
      .tiger-heading { font-size: 34px !important; }
      .tiger-detail-label, .tiger-detail-value { display: block !important; width: 100% !important; text-align: left !important; }
      .tiger-detail-value { padding-top: 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${TIGER_EMAIL_THEME.mist};color:${TIGER_EMAIL_THEME.ink};font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background-color:${TIGER_EMAIL_THEME.mist};background-image:linear-gradient(135deg,${TIGER_EMAIL_THEME.warm},${TIGER_EMAIL_THEME.mist})">
    <tr>
      <td class="tiger-shell" align="center" style="padding:34px 14px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;border-collapse:separate;border-spacing:0;border:1px solid #dce8ef;border-radius:32px;background-color:#ffffff;box-shadow:0 22px 70px rgba(27,36,65,.14);overflow:hidden">
          <tr>
            <td class="tiger-hero" style="padding:30px 38px 36px;background-color:${TIGER_EMAIL_THEME.navy};background-image:radial-gradient(circle at 92% 10%,rgba(116,200,242,.22),transparent 34%)">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
                <tr>
                  <td style="color:#ffffff;font-size:20px;font-weight:900;letter-spacing:-.03em">Tiger <span style="font-weight:750">PingPong.</span></td>
                  <td align="right" style="color:${TIGER_EMAIL_THEME.blue};font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">Vancouver, BC</td>
                </tr>
              </table>
              <div style="height:4px;width:58px;margin-top:26px;border-radius:999px;background-color:${TIGER_EMAIL_THEME.orange}"></div>
              <div style="margin-top:18px;color:#ffb16b;font-size:12px;font-weight:850;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(input.eyebrow)}</div>
              <h1 class="tiger-heading" style="margin:8px 0 0;color:#ffffff;font-size:42px;font-weight:900;line-height:1.04;letter-spacing:-.045em">${escapeHtml(input.headline)}</h1>
            </td>
          </tr>
          <tr>
            <td class="tiger-body" style="padding:34px 38px 38px;background-color:#ffffff">
              <p style="margin:0;color:#394258;font-size:17px;line-height:1.65">${escapeHtml(input.intro)}</p>
              <div style="margin-top:28px">${input.main}</div>
              ${footer}
              <p style="margin:22px 0 0;color:#8992a2;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.5">${escapeHtml(input.reference)}</p>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;color:${TIGER_EMAIL_THEME.muted};font-size:12px;line-height:1.5">Raised on the West Coast. Helping across Canada.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderCustomerSupportFooter(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:32px;border-collapse:separate;border-spacing:0;border-radius:22px;background-color:#f4fbfe;overflow:hidden">
    <tr>
      <td style="border-left:5px solid ${TIGER_EMAIL_THEME.orange};padding:22px 24px">
        <p style="margin:0;color:${TIGER_EMAIL_THEME.ink};font-size:18px;font-weight:850;line-height:1.35">Need a hand? We’ve got you.</p>
        <p style="margin:7px 0 0;color:${TIGER_EMAIL_THEME.muted};font-size:14px;line-height:1.6">Reply to this email, email <a href="mailto:${TIGER_CONTACT_EMAIL}" style="color:${TIGER_EMAIL_THEME.navy};font-weight:800">${TIGER_CONTACT_EMAIL}</a>, or call <a href="${TIGER_CONTACT_PHONE_HREF}" style="color:${TIGER_EMAIL_THEME.navy};font-weight:800">${TIGER_CONTACT_PHONE_DISPLAY}</a>.</p>
        <p style="margin:12px 0 0;color:${TIGER_EMAIL_THEME.ink};font-size:13px;font-weight:850">Good gear. Real help. No runaround.</p>
      </td>
    </tr>
  </table>`;
}

function renderStaffFooter(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:32px;border-collapse:separate;border-spacing:0;border-radius:22px;background-color:#f4fbfe;overflow:hidden">
    <tr>
      <td style="border-left:5px solid ${TIGER_EMAIL_THEME.teal};padding:22px 24px;color:${TIGER_EMAIL_THEME.muted};font-size:14px;line-height:1.6"><strong style="color:${TIGER_EMAIL_THEME.ink}">Staff notification.</strong><br>Open the protected Tiger PingPong admin to review the complete order.</td>
    </tr>
  </table>`;
}

function renderCustomerSupportText(): string {
  return [
    "Need a hand? We’ve got you.",
    `Reply to this email, email ${TIGER_CONTACT_EMAIL}, or call ${TIGER_CONTACT_PHONE_DISPLAY}.`,
    "Good gear. Real help. No runaround."
  ].join("\n");
}

function renderItems(order: OrderEmailTemplateOrder, heading = "Your order"): string {
  const rows = order.items
    .map(
      (item) =>
        `<tr><td style="border-bottom:1px solid #e7eef2;padding:14px 0;color:${TIGER_EMAIL_THEME.ink};font-size:15px"><strong>${escapeHtml(item.name)}</strong><br><span style="color:${TIGER_EMAIL_THEME.muted}">Qty ${item.quantity}</span></td><td align="right" style="border-bottom:1px solid #e7eef2;padding:14px 0;color:${TIGER_EMAIL_THEME.ink};font-size:15px;font-weight:750">${escapeHtml(formatMoney(item.lineTotalCents, order.currency))}</td></tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse"><tr><td colspan="2" style="padding-bottom:4px;color:${TIGER_EMAIL_THEME.muted};font-size:12px;font-weight:850;letter-spacing:.1em;text-transform:uppercase">${escapeHtml(heading)}</td></tr>${rows}</table>`;
}

function renderItemsText(order: OrderEmailTemplateOrder, heading = "Your order"): string {
  const lines = order.items.map(
    (item) =>
      `- ${item.name} × ${item.quantity}: ${formatMoney(item.lineTotalCents, order.currency)}`
  );

  return [heading, ...lines, ""].join("\n");
}

function renderDetailsTable(rows: string, withMargin = true): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;${withMargin ? "margin-top:24px;" : ""}border-collapse:collapse">${rows}</table>`;
}

function renderDetailRow(label: string, value: string): string {
  return `<tr><td class="tiger-detail-label" width="44%" style="border-bottom:1px solid #e7eef2;padding:12px 0;color:${TIGER_EMAIL_THEME.muted};font-size:14px">${escapeHtml(label)}</td><td class="tiger-detail-value" width="56%" align="right" style="border-bottom:1px solid #e7eef2;padding:12px 0;color:${TIGER_EMAIL_THEME.ink};font-size:14px;font-weight:750">${escapeHtml(value)}</td></tr>`;
}

function renderAction(label: string, href: string): string {
  return `<div style="margin:28px 0"><a href="${escapeHtml(href)}" style="display:inline-block;border-radius:999px;padding:15px 24px;color:#ffffff;background-color:${TIGER_EMAIL_THEME.orangeDeep};font-size:16px;font-weight:850;line-height:20px;text-decoration:none">${escapeHtml(label)}</a></div>`;
}

function createGreeting(order: OrderEmailTemplateOrder): string {
  const name = order.customerName?.trim() || order.shippingName?.trim();
  return name ? `Hi ${name}.` : "Hi there.";
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-CA", {
    currency: currency.trim().toUpperCase(),
    style: "currency"
  }).format(cents / 100);
}

function formatDate(value: Date | null): string {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
    timeZone: "UTC"
  }).format(value);
}

function formatDateTime(value: Date | null): string {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Vancouver"
  }).format(value);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
