import type { Metadata } from "next";

import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import styles from "../shipping/page.module.css";

export const metadata: Metadata = {
  title: "Returns Policy | Tiger Ping Pong",
  description: "Tiger Ping Pong return, delivery-damage, and product-support requirements."
};

export default function ReturnsPolicyPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="support" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="returns-title">
          <p className={styles.eyebrow}>Returns policy</p>
          <h1 className={styles.title} id="returns-title">
            Inspect your order and contact us before returning it.
          </h1>
          <p className={styles.intro}>
            Contact Tiger Ping Pong if you receive an incorrect or damaged product. Call
            1-888-552-5259 Monday to Friday, 9 a.m. to 5 p.m. Pacific, or email
            info@tigerpingpong.com.
          </p>
        </section>

        <section className={styles.ruleGrid} aria-label="Returns policy details">
          <article>
            <span>Contact us</span>
            <strong>Provide your purchase information and details about the product.</strong>
            <p>
              Include the order reference, product name, a description of the issue, and clear
              photos of any damage or incorrect product.
            </p>
          </article>
          <article>
            <span>Inspect on delivery</span>
            <strong>Check the product before accepting the delivery.</strong>
            <p>
              Products ship in new condition. Note visible damage or defects on the carrier’s
              delivery documentation when the product arrives.
            </p>
          </article>
          <article>
            <span>Damage deadline</span>
            <strong>Notify Tiger Ping Pong within five days of receiving the product.</strong>
            <p>
              Shipping damage should be reported immediately. A carrier damage claim may be affected
              or rejected when visible damage was not recorded at the time of delivery.
            </p>
          </article>
          <article>
            <span>Return instructions</span>
            <strong>Wait for Tiger Ping Pong to confirm the return process.</strong>
            <p>
              Do not send a product back before support confirms the return address, carrier method,
              packaging requirements, and any other instructions for the product.
            </p>
          </article>
          <article>
            <span>Product condition</span>
            <strong>Returned goods must arrive properly packaged and in good condition.</strong>
            <p>
              The customer is responsible for packaging a return. Tiger Ping Pong cannot be held
              responsible for goods returned in poor condition because of inadequate packaging.
            </p>
          </article>
          <article>
            <span>Table returns</span>
            <strong>Return shipping charges may apply to returned tables.</strong>
            <p>
              Table freight, pickup, disassembly, or repackaging is not included unless Tiger Ping
              Pong confirms it for the return. Support will explain the next step before anything is
              shipped back.
            </p>
          </article>
        </section>

        <section className={styles.supportBand} aria-labelledby="returns-contact-title">
          <div>
            <p className={styles.eyebrow}>Return or damage support</p>
            <h2 id="returns-contact-title">Have your order details and photos ready.</h2>
            <p>Call 1-888-552-5259 or email info@tigerpingpong.com.</p>
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
