import type { Metadata } from "next";

import {
  getCheckoutSessionStatus,
  type CheckoutSessionPublicStatus,
  type CheckoutSessionStatus
} from "../../../lib/checkout-api";
import { PublicStorefrontNav } from "../../PublicStorefrontNav";

import styles from "../page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout Status | Tiger Ping Pong",
  description: "Tiger Ping Pong checkout redirect status page."
};

interface CheckoutSuccessPageProps {
  searchParams?: {
    session_id?: string | string[];
  };
}

interface StatusContent {
  badge: string;
  heading: string;
  intro: string;
  paymentTruth: string;
  tone: "paidTone" | "pendingTone" | "problemTone";
}

interface StatusResource {
  error: boolean;
  status: CheckoutSessionStatus | null;
}

function getSessionId(searchParams: CheckoutSuccessPageProps["searchParams"]): string | null {
  const sessionId = searchParams?.session_id;
  const value = Array.isArray(sessionId) ? (sessionId[0] ?? null) : (sessionId ?? null);
  const normalized = value?.trim();

  return normalized || null;
}

async function loadCheckoutStatus(sessionId: string): Promise<StatusResource> {
  try {
    return {
      error: false,
      status: await getCheckoutSessionStatus(sessionId)
    };
  } catch {
    return {
      error: true,
      status: null
    };
  }
}

function formatStatusLabel(status: CheckoutSessionPublicStatus): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-CA", {
    currency,
    style: "currency"
  }).format(cents / 100);
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function getStatusContent(
  status: CheckoutSessionStatus | null,
  hasSessionId: boolean,
  hasError: boolean
): StatusContent {
  if (!hasSessionId) {
    return {
      badge: "Session reference missing",
      heading: "Checkout status needs a session reference",
      intro:
        "No Stripe session reference was included in this link, so this page cannot look up an order status.",
      paymentTruth: "No payment confirmation happens from this page.",
      tone: "problemTone"
    };
  }

  if (hasError) {
    return {
      badge: "Status unavailable",
      heading: "Order status is temporarily unavailable",
      intro:
        "The backend status check could not be completed. Your Stripe redirect was received, but this page cannot confirm payment right now.",
      paymentTruth: "Payment is not treated as confirmed by this page.",
      tone: "problemTone"
    };
  }

  if (!status || !status.found || status.status === "not_found") {
    return {
      badge: "Not found",
      heading: "Order status was not found",
      intro:
        "The backend did not find an order for this Stripe session reference. Please keep your Stripe receipt or reference details.",
      paymentTruth: "Payment is not treated as confirmed without a matching backend order.",
      tone: "problemTone"
    };
  }

  switch (status.status) {
    case "paid":
      return {
        badge: "Paid",
        heading: "Payment confirmed",
        intro: "The backend order status is paid. Keep the order reference below for your records.",
        paymentTruth: "Confirmed from backend order state.",
        tone: "paidTone"
      };
    case "checkout_pending":
      return {
        badge: "Pending",
        heading: "Payment confirmation is pending",
        intro:
          "Stripe returned you to Tiger Ping Pong, but the backend order is not marked paid yet. This can happen while webhook confirmation is still arriving.",
        paymentTruth: "Not confirmed as paid yet.",
        tone: "pendingTone"
      };
    case "checkout_failed":
      return {
        badge: "Failed",
        heading: "Checkout did not complete",
        intro:
          "The backend order status shows this checkout did not start or complete successfully.",
        paymentTruth: "Not confirmed as paid.",
        tone: "problemTone"
      };
    case "canceled":
      return {
        badge: "Canceled",
        heading: "Checkout was canceled",
        intro: "The backend order status shows this checkout was canceled.",
        paymentTruth: "Not confirmed as paid.",
        tone: "problemTone"
      };
    case "expired":
      return {
        badge: "Expired",
        heading: "Checkout session expired",
        intro: "The backend order status shows this checkout session expired.",
        paymentTruth: "Not confirmed as paid.",
        tone: "problemTone"
      };
    case "manual_review":
      return {
        badge: "Review needed",
        heading: "Order status needs review",
        intro:
          "The backend returned an order status that should be reviewed before showing payment confirmation.",
        paymentTruth: "Not confirmed as paid by this page.",
        tone: "problemTone"
      };
  }
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const sessionId = getSessionId(searchParams);
  const statusResource = sessionId
    ? await loadCheckoutStatus(sessionId)
    : {
        error: false,
        status: null
      };
  const status = statusResource.status;
  const content = getStatusContent(status, Boolean(sessionId), statusResource.error);
  const badgeClassName = [styles.statusBadge, styles[content.tone]].join(" ");
  const isPaid = status?.found && status.status === "paid";
  const currency = status?.currency ?? "cad";
  const publicReference = status?.found ? status.publicReference : null;

  return (
    <>
      <PublicStorefrontNav activeItem="catalog" />
      <main className={styles.page}>
        <div className={styles.backBar}>
          <a href="/catalog">Back to catalog</a>
        </div>

        <section className={styles.header} aria-labelledby="checkout-success-title">
          <p className={styles.eyebrow}>TigerPingPong.ca checkout</p>
          <h1 className={styles.title} id="checkout-success-title">
            {content.heading}
          </h1>
          <p className={styles.intro}>{content.intro}</p>
        </section>

        <section className={styles.panel} aria-labelledby="checkout-success-status-title">
          <span className={badgeClassName}>{content.badge}</span>
          <h2 id="checkout-success-status-title">Checkout status</h2>
          <p>
            This page reads the current Tiger Ping Pong order status. A Stripe success redirect is
            only a redirect; it does not update payment state.
          </p>

          <dl className={styles.statusList}>
            <div>
              <dt>Redirect result</dt>
              <dd>
                {sessionId
                  ? "Stripe checkout returned a session reference."
                  : "No session reference was included."}
              </dd>
            </div>
            <div>
              <dt>Order status</dt>
              <dd>{status ? formatStatusLabel(status.status) : content.badge}</dd>
            </div>
            <div>
              <dt>Payment truth</dt>
              <dd>{content.paymentTruth}</dd>
            </div>
            {status?.message ? (
              <div>
                <dt>Status note</dt>
                <dd>{status.message}</dd>
              </div>
            ) : null}
            {status?.found && status.publicReference ? (
              <div>
                <dt>Order reference</dt>
                <dd>{status.publicReference}</dd>
              </div>
            ) : null}
            {isPaid && typeof status.totalCents === "number" ? (
              <div>
                <dt>Total</dt>
                <dd>{formatMoney(status.totalCents, currency)}</dd>
              </div>
            ) : null}
            {isPaid && status.paidAt ? (
              <div>
                <dt>Paid at</dt>
                <dd>{formatDateTime(status.paidAt)}</dd>
              </div>
            ) : null}
            {isPaid && status.customerEmail ? (
              <div>
                <dt>Email</dt>
                <dd>{status.customerEmail}</dd>
              </div>
            ) : null}
          </dl>

          {sessionId ? (
            <p className={styles.reference}>
              <span>Stripe session reference</span>
              <code>{sessionId}</code>
            </p>
          ) : null}

          <p className={styles.supportNote}>
            Need help with this order? <a href="/contact">Contact support</a>
            {publicReference
              ? ` and include order reference ${publicReference}, your checkout email, and the product name if relevant.`
              : " and include your order reference if available, checkout email, and product name if relevant."}
          </p>

          <div className={styles.actions}>
            <a className={styles.primaryAction} href="/catalog">
              Return to catalog
            </a>
            <a className={styles.secondaryLink} href="/shipping">
              Review shipping
            </a>
            <a className={styles.secondaryLink} href="/contact">
              Contact support
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
