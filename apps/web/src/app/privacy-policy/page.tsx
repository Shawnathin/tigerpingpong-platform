import type { Metadata } from "next";

import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import styles from "../shipping/page.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy | Tiger Ping Pong",
  description: "How Tiger Ping Pong handles storefront, order, and support information."
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="support" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="privacy-title">
          <p className={styles.eyebrow}>Privacy policy — owner review draft</p>
          <h1 className={styles.title} id="privacy-title">
            How storefront and order information is handled.
          </h1>
          <p className={styles.intro}>
            Tiger Ping Pong uses customer information to operate the Canadian storefront, process
            orders, provide support, prevent misuse, and meet applicable business obligations.
          </p>
        </section>

        <section className={styles.ruleGrid} aria-label="Privacy policy details">
          <article>
            <span>Information used</span>
            <strong>Cart, checkout, order, shipping, and support details.</strong>
            <p>
              Cart items are stored in your browser. Checkout and order records may include contact,
              shipping, product, payment-status, and support information.
            </p>
          </article>
          <article>
            <span>Payment handling</span>
            <strong>Payment details are entered on hosted Stripe Checkout.</strong>
            <p>
              Tiger Ping Pong receives payment and order status information needed to confirm and
              support the order, but does not build or host a custom card-entry form.
            </p>
          </article>
          <article>
            <span>Service providers</span>
            <strong>Specialized providers support hosting, payments, data, and media.</strong>
            <p>
              Information may be processed by providers used for storefront hosting, Stripe
              payments, order data storage, and product-media delivery, subject to their roles and
              safeguards.
            </p>
          </article>
          <article>
            <span>Retention</span>
            <strong>Records are kept only as reasonably needed.</strong>
            <p>
              Order and support records may be retained for fulfillment, customer service, security,
              accounting, legal, and dispute-resolution needs.
            </p>
          </article>
          <article>
            <span>Security</span>
            <strong>Administrative and order surfaces are restricted.</strong>
            <p>
              No online service can guarantee absolute security. Tiger Ping Pong uses access
              controls and service safeguards appropriate to the storefront.
            </p>
          </article>
          <article>
            <span>Your request</span>
            <strong>Contact us about your information.</strong>
            <p>
              Email info@tigerpingpong.com to ask about access, correction, or deletion. Some
              records may need to be retained where required for legitimate business or legal
              purposes.
            </p>
          </article>
        </section>

        <section className={styles.supportBand} aria-labelledby="privacy-contact-title">
          <div>
            <p className={styles.eyebrow}>Privacy contact</p>
            <h2 id="privacy-contact-title">Questions or requests?</h2>
            <p>This draft must be approved by the business owner before launch.</p>
          </div>
          <a className={styles.primaryAction} href="mailto:info@tigerpingpong.com">
            Email Tiger Ping Pong
          </a>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
