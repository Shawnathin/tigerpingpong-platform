import type { Metadata } from "next";

import {
  getCheckoutSessionStatus,
  type CheckoutSessionPublicStatus,
  type CheckoutSessionStatus
} from "../../../lib/checkout-api";
import { PublicStorefrontFooter } from "../../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../../PublicStorefrontNav";

import { CheckoutCartCleanup } from "./CheckoutCartCleanup";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout Status | Tiger Ping Pong"
};

interface CheckoutSuccessPageProps {
  searchParams?: Promise<{
    session_id?: string | string[];
  }>;
}

interface StatusContent {
  badge: string;
  heading: string;
  intro?: string;
  tone: "paidTone" | "pendingTone" | "problemTone";
}

interface StatusResource {
  error: boolean;
  status: CheckoutSessionStatus | null;
}

type CheckoutSuccessSearchParams = Awaited<CheckoutSuccessPageProps["searchParams"]>;

function getSessionId(searchParams: CheckoutSuccessSearchParams): string | null {
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

function getPaidDisplayTotalCents(status: CheckoutSessionStatus | null): number | null {
  if (!status || status.status !== "paid") {
    return null;
  }

  if (typeof status.stripeAmountTotalCents === "number") {
    return status.stripeAmountTotalCents;
  }

  return typeof status.totalCents === "number" ? status.totalCents : null;
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
      intro: "This page cannot look up an order status.",
      tone: "problemTone"
    };
  }

  if (hasError) {
    return {
      badge: "Status unavailable",
      heading: "Order status is temporarily unavailable",
      intro: "This page cannot confirm payment right now.",
      tone: "problemTone"
    };
  }

  if (!status || !status.found || status.status === "not_found") {
    return {
      badge: "Not found",
      heading: "Order status was not found",
      intro: "Please keep your receipt or reference details.",
      tone: "problemTone"
    };
  }

  switch (status.status) {
    case "paid":
      return {
        badge: "Paid",
        heading: "Payment confirmed",
        intro: "Keep the order reference below for your records.",
        tone: "paidTone"
      };
    case "checkout_pending":
      return {
        badge: "Pending",
        heading: "Payment confirmation is pending",
        tone: "pendingTone"
      };
    case "checkout_failed":
      return {
        badge: "Failed",
        heading: "Checkout did not complete",
        tone: "problemTone"
      };
    case "canceled":
      return {
        badge: "Canceled",
        heading: "Checkout was canceled",
        tone: "problemTone"
      };
    case "expired":
      return {
        badge: "Expired",
        heading: "Checkout session expired",
        tone: "problemTone"
      };
    case "manual_review":
      return {
        badge: "Review needed",
        heading: "Order status needs review",
        intro: "This order status should be reviewed before showing payment confirmation.",
        tone: "problemTone"
      };
  }
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sessionId = getSessionId(resolvedSearchParams);
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
  const paidDisplayTotalCents = getPaidDisplayTotalCents(status);

  return (
    <>
      <PublicStorefrontNav activeItem="tables" />
      <CheckoutCartCleanup status={isPaid ? "paid" : (status?.status ?? null)} />
      <main className={styles.page}>
        <div className={styles.backBar}>
          <a href="/tables/">Back to tables</a>
        </div>

        <section className={styles.header} aria-labelledby="checkout-success-title">
          <p className={styles.eyebrow}>TigerPingPong.ca checkout</p>
          <h1 className={styles.title} id="checkout-success-title">
            {content.heading}
          </h1>
          {content.intro ? <p className={styles.intro}>{content.intro}</p> : null}
        </section>

        <section className={styles.panel} aria-labelledby="checkout-success-status-title">
          <span className={badgeClassName}>{content.badge}</span>
          <h2 id="checkout-success-status-title">Checkout status</h2>
          <dl className={styles.statusList}>
            <div>
              <dt>Order status</dt>
              <dd>{status ? formatStatusLabel(status.status) : content.badge}</dd>
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
            {isPaid && typeof paidDisplayTotalCents === "number" ? (
              <div>
                <dt>Total</dt>
                <dd>{formatMoney(paidDisplayTotalCents, currency)}</dd>
              </div>
            ) : null}
            {isPaid && typeof status?.stripeAmountTaxCents === "number" ? (
              <div>
                <dt>Tax</dt>
                <dd>{formatMoney(status.stripeAmountTaxCents, currency)}</dd>
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
            <a className={styles.primaryAction} href="/tables/">
              Return to tables
            </a>
            <a className={styles.secondaryLink} href="/shipping-returns">
              Review shipping
            </a>
            <a className={styles.secondaryLink} href="/contact">
              Contact support
            </a>
          </div>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
