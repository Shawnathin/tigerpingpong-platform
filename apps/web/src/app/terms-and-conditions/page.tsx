import type { Metadata } from "next";

import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import styles from "../shipping/page.module.css";

export const metadata: Metadata = {
  title: "Terms & Conditions | Tiger Ping Pong",
  description: "Terms for using and ordering from the Tiger Ping Pong Canadian storefront."
};

export default function TermsAndConditionsPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="support" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="terms-title">
          <p className={styles.eyebrow}>Terms & conditions — owner review draft</p>
          <h1 className={styles.title} id="terms-title">
            Storefront terms for shopping with Tiger Ping Pong.
          </h1>
          <p className={styles.intro}>
            These terms describe the current Canadian storefront, order review, customer
            responsibilities, and support path.
          </p>
        </section>

        <section className={styles.ruleGrid} aria-label="Storefront terms">
          <article>
            <span>Canada and currency</span>
            <strong>Online orders are for Canadian delivery and priced in CAD.</strong>
            <p>
              Customers must provide accurate contact and Canadian shipping information. Taxes and
              the final amount due are shown in hosted checkout.
            </p>
          </article>
          <article>
            <span>Order and payment</span>
            <strong>A redirect alone does not confirm payment.</strong>
            <p>
              An order is treated as paid only after the backend receives and validates Stripe
              payment confirmation. Tiger Ping Pong may contact the customer if an order requires
              review.
            </p>
          </article>
          <article>
            <span>Pricing and availability</span>
            <strong>
              Catalog information is reviewed, but mistakes or availability changes can occur.
            </strong>
            <p>
              If a material price, option, or availability problem affects an order, support will
              contact the customer before fulfillment and explain the available next step.
            </p>
          </article>
          <article>
            <span>Shipping</span>
            <strong>Current V1 shipping is Canada only.</strong>
            <p>
              Orders over $100 CAD ship free; orders at or below $100 CAD use $15 CAD flat-rate
              shipping. Product-specific delivery timing is not promised unless confirmed directly.
            </p>
          </article>
          <article>
            <span>Products and warranties</span>
            <strong>Product details and warranty coverage vary by item.</strong>
            <p>
              Review the product page and contact support before purchase when dimensions,
              compatibility, warranty, or intended use is important.
            </p>
          </article>
          <article>
            <span>Acceptable use</span>
            <strong>Do not misuse the storefront or staff systems.</strong>
            <p>
              Users must not attempt unauthorized access, interfere with service operation, submit
              false information, or use the site for unlawful activity.
            </p>
          </article>
        </section>

        <section className={styles.supportBand} aria-labelledby="terms-contact-title">
          <div>
            <p className={styles.eyebrow}>Questions</p>
            <h2 id="terms-contact-title">Ask before ordering when something is unclear.</h2>
            <p>This draft must be approved by the business owner before launch.</p>
          </div>
          <a className={styles.primaryAction} href="/contact">
            Contact support
          </a>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
