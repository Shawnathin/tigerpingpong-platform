import type { Metadata } from "next";

import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Checkout Status | Tiger Ping Pong Platform",
  description: "V1 Stripe checkout redirect status page for Tiger Ping Pong."
};

interface CheckoutSuccessPageProps {
  searchParams?: {
    session_id?: string | string[];
  };
}

function getSessionId(searchParams: CheckoutSuccessPageProps["searchParams"]): string | null {
  const sessionId = searchParams?.session_id;

  if (Array.isArray(sessionId)) {
    return sessionId[0] ?? null;
  }

  return sessionId ?? null;
}

export default function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const sessionId = getSessionId(searchParams);

  return (
    <main className={styles.page}>
      <div className={styles.backBar}>
        <a href="/catalog">Back to catalog</a>
      </div>

      <section className={styles.header} aria-labelledby="checkout-success-title">
        <p className={styles.eyebrow}>TigerPingPong.ca checkout</p>
        <h1 className={styles.title} id="checkout-success-title">
          Checkout redirect received
        </h1>
        <p className={styles.intro}>
          Thanks - your Stripe checkout was completed or redirected successfully. Final payment
          confirmation will be connected in the next checkout phase.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="checkout-success-status-title">
        <h2 id="checkout-success-status-title">V1 checkout status placeholder</h2>
        <p>
          This page is ready for future Stripe Checkout Session redirects. It does not verify
          payment status, fulfillment status, or order details yet.
        </p>

        <dl className={styles.statusList}>
          <div>
            <dt>Redirect result</dt>
            <dd>Stripe checkout returned to Tiger Ping Pong.</dd>
          </div>
          <div>
            <dt>Final status</dt>
            <dd>Not checked on this page until backend status and webhook work is connected.</dd>
          </div>
        </dl>

        {sessionId ? (
          <p className={styles.reference}>
            <span>Stripe session reference</span>
            <code>{sessionId}</code>
          </p>
        ) : null}

        <div className={styles.actions}>
          <a className={styles.primaryAction} href="/catalog">
            Return to catalog
          </a>
          <a className={styles.secondaryLink} href="/shipping">
            Review shipping
          </a>
        </div>
      </section>
    </main>
  );
}
