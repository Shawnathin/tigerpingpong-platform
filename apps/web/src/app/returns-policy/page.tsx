import type { Metadata } from "next";

import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import styles from "../shipping/page.module.css";

export const metadata: Metadata = {
  title: "Returns Policy | Tiger Ping Pong",
  description: "How to request return, damage, or order support from Tiger Ping Pong."
};

export default function ReturnsPolicyPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="support" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="returns-title">
          <p className={styles.eyebrow}>Returns policy — owner review draft</p>
          <h1 className={styles.title} id="returns-title">
            Contact us before sending an item back.
          </h1>
          <p className={styles.intro}>
            Tiger Ping Pong must review the product, order, condition, and reason for the request
            before confirming return instructions.
          </p>
        </section>

        <section className={styles.ruleGrid} aria-label="Returns policy details">
          <article>
            <span>Start a request</span>
            <strong>Contact support with the order reference and product details.</strong>
            <p>
              Explain the issue and include clear photos when an item arrived damaged, incomplete,
              or different from what was ordered.
            </p>
          </article>
          <article>
            <span>Wait for instructions</span>
            <strong>Do not ship a product back until support confirms the next step.</strong>
            <p>
              A return address, carrier method, packaging requirement, or other instruction may be
              needed for the specific product.
            </p>
          </article>
          <article>
            <span>Eligibility</span>
            <strong>Eligibility depends on the order and product circumstances.</strong>
            <p>
              This draft does not promise a return window, automatic approval, or a particular
              refund outcome. The business owner must approve final eligibility rules before launch.
            </p>
          </article>
          <article>
            <span>Damage or delivery issue</span>
            <strong>Report visible damage promptly and preserve packaging.</strong>
            <p>
              Support may request photos, carrier information, packaging, serial details, or other
              evidence needed to assess the issue.
            </p>
          </article>
          <article>
            <span>Shipping responsibility</span>
            <strong>Return-shipping responsibility must be confirmed by support.</strong>
            <p>
              Do not assume that return freight, pickup, disassembly, or repackaging is included
              unless Tiger Ping Pong confirms it for the request.
            </p>
          </article>
          <article>
            <span>Refund method</span>
            <strong>Any approved refund is confirmed after review.</strong>
            <p>
              Timing and method depend on the approved resolution and payment processing. No refund
              is confirmed solely because a request or shipment was submitted.
            </p>
          </article>
        </section>

        <section className={styles.supportBand} aria-labelledby="returns-contact-title">
          <div>
            <p className={styles.eyebrow}>Return or damage support</p>
            <h2 id="returns-contact-title">Have your order reference ready.</h2>
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
