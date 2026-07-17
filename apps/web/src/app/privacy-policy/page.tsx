import type { Metadata } from "next";

import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import styles from "../shipping/page.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy | Tiger Ping Pong",
  description: "How Tiger Ping Pong collects, uses, and protects customer information."
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="support" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="privacy-title">
          <p className={styles.eyebrow}>Privacy policy</p>
          <h1 className={styles.title} id="privacy-title">
            How Tiger Ping Pong handles your information.
          </h1>
          <p className={styles.intro}>
            Tiger Ping Pong is committed to protecting your privacy. This policy explains the
            information we collect, how we use it, and the choices available to you when you use our
            website or contact us.
          </p>
        </section>

        <section className={styles.ruleGrid} aria-label="Privacy policy details">
          <article>
            <span>Information we collect</span>
            <strong>Personal and technical information may be collected.</strong>
            <p>
              Personal information may include your name, email address, phone number, shipping
              address, order details, and information you provide to support. Technical information
              may include your IP address, browser type, and pages requested.
            </p>
          </article>
          <article>
            <span>How we use information</span>
            <strong>
              Information supports orders, service, communication, and site operation.
            </strong>
            <p>
              We use information to provide products and services, process and fulfill orders,
              answer questions, communicate about purchases, prevent misuse, and maintain and
              improve the storefront.
            </p>
          </article>
          <article>
            <span>Cart and payment handling</span>
            <strong>Cart items stay in your browser; payments use hosted Stripe Checkout.</strong>
            <p>
              Tiger Ping Pong receives the payment and order status needed to confirm and support an
              order, but does not build or host a custom card-entry form and does not receive your
              full card number from Stripe Checkout.
            </p>
          </article>
          <article>
            <span>Service providers</span>
            <strong>Trusted providers support hosting, payments, data, and product media.</strong>
            <p>
              Information may be processed by providers that help operate the storefront, payments,
              order records, and media delivery. We do not sell personal information or share it
              with third parties for their own marketing purposes.
            </p>
          </article>
          <article>
            <span>Retention</span>
            <strong>Records are retained only as reasonably needed.</strong>
            <p>
              Order and support records may be kept for fulfillment, customer service, security,
              accounting, legal, and dispute-resolution needs.
            </p>
          </article>
          <article>
            <span>Security</span>
            <strong>We use appropriate safeguards and restricted staff systems.</strong>
            <p>
              We take reasonable measures to protect information from unauthorized access,
              alteration, or disclosure. No method of internet transmission or electronic storage
              can be guaranteed to be completely secure.
            </p>
          </article>
          <article>
            <span>Your choices</span>
            <strong>Contact us about access, correction, or deletion.</strong>
            <p>
              Email info@tigerpingpong.com with a privacy request. Some records may need to be
              retained where required for legitimate business, accounting, security, or legal
              purposes.
            </p>
          </article>
          <article>
            <span>Policy changes</span>
            <strong>This policy may be updated as the storefront changes.</strong>
            <p>
              Updates become effective when posted on this page. Continued use of the website after
              an update means the revised policy applies to that use.
            </p>
          </article>
        </section>

        <section className={styles.supportBand} aria-labelledby="privacy-contact-title">
          <div>
            <p className={styles.eyebrow}>Privacy contact</p>
            <h2 id="privacy-contact-title">Questions or requests?</h2>
            <p>Contact Tiger Ping Pong at info@tigerpingpong.com.</p>
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
