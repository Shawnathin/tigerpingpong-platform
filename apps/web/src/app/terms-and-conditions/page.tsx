import type { Metadata } from "next";

import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import { getPathMetadata } from "../../lib/seo";
import styles from "../shipping/page.module.css";

export const metadata: Metadata = getPathMetadata({
  title: "Terms & Conditions | Tiger Ping Pong",
  description: "Terms for using TigerPingPong.ca and ordering from Tiger Ping Pong.",
  pathname: "/terms-and-conditions"
});

export default function TermsAndConditionsPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="support" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="terms-title">
          <p className={styles.eyebrow}>Terms & conditions</p>
          <h1 className={styles.title} id="terms-title">
            Terms for using and ordering from TigerPingPong.ca.
          </h1>
          <p className={styles.intro}>
            By accessing or using this website, you agree to these terms. If you do not agree,
            please do not use the website.
          </p>
        </section>

        <section className={styles.ruleGrid} aria-label="Storefront terms">
          <article>
            <span>1. Use of the website</span>
            <strong>Use TigerPingPong.ca only for lawful purposes.</strong>
            <p>
              You must not violate applicable laws, send unauthorized advertising, interfere with
              the site, submit false information, or attempt unauthorized access to the website,
              servers, or staff systems.
            </p>
          </article>
          <article>
            <span>2. Product information and availability</span>
            <strong>
              We work to keep product details, prices, images, and availability accurate.
            </strong>
            <p>
              Prices may change without notice. Supplier updates, colour variations, or product
              revisions may affect images or details. Tiger Ping Pong may correct an error or
              inaccuracy and will contact you if a material issue affects an order.
            </p>
          </article>
          <article>
            <span>3. Orders and payments</span>
            <strong>Orders require accurate information and remain subject to acceptance.</strong>
            <p>
              All prices are in Canadian dollars unless stated otherwise. Tiger Ping Pong may refuse
              or cancel an order if payment authorization fails, an item is unavailable, or a
              material pricing or product error occurs. Available payment methods appear at
              checkout, where Stripe calculates and displays applicable taxes before payment.
            </p>
          </article>
          <article>
            <span>Payment confirmation</span>
            <strong>A checkout redirect alone does not confirm payment.</strong>
            <p>
              An order is treated as paid only after Tiger Ping Pong receives and validates Stripe
              payment confirmation. We may contact you if an order requires review before
              fulfillment.
            </p>
          </article>
          <article>
            <span>4. Shipping and delivery</span>
            <strong>Online orders ship within Canada under the posted shipping rules.</strong>
            <p>
              Orders over $100 CAD ship free; orders at or below $100 CAD use $15 CAD flat-rate
              shipping. Customers must provide correct delivery information. Delivery timing varies
              by destination, carrier, and item availability, and extra charges may apply for a
              missed delivery or re-delivery.
            </p>
          </article>
          <article>
            <span>5. Returns and delivery damage</span>
            <strong>Contact Tiger Ping Pong before returning a product.</strong>
            <p>
              Inspect products on delivery, note visible damage on the carrier documentation, and
              notify us within five days of receiving a damaged or incorrect product. Returned goods
              must be properly packaged and in good condition. See the Returns Policy and Shipping &
              Returns pages for details.
            </p>
          </article>
          <article>
            <span>6. Warranties and repairs</span>
            <strong>Warranty terms vary by product and manufacturer.</strong>
            <p>
              Review the product information or contact support for coverage details. Labour for
              repairs or installation is not covered by a product warranty unless stated otherwise.
            </p>
          </article>
          <article>
            <span>7. Limitation of liability</span>
            <strong>Liability is limited to the extent permitted by applicable law.</strong>
            <p>
              Tiger Ping Pong is not responsible for indirect, incidental, or consequential losses
              arising from use of the website or products, or for damage caused by misuse, neglect,
              or unauthorized repair attempts.
            </p>
          </article>
          <article>
            <span>8. Intellectual property</span>
            <strong>Website content belongs to Tiger Ping Pong or its suppliers.</strong>
            <p>
              Text, images, logos, and product information are protected by applicable copyright and
              trademark laws and may not be copied, reproduced, or distributed without prior written
              permission.
            </p>
          </article>
          <article>
            <span>9. Privacy</span>
            <strong>Our Privacy Policy explains how information is handled.</strong>
            <p>
              Review the Privacy Policy for details about information collection, use, service
              providers, safeguards, and privacy requests.
            </p>
          </article>
          <article>
            <span>10. Changes to these terms</span>
            <strong>We may update these terms by posting a revised version.</strong>
            <p>
              Changes take effect when posted. Continued use of the website after an update means
              the revised terms apply to that use.
            </p>
          </article>
        </section>

        <section className={styles.supportBand} aria-labelledby="terms-contact-title">
          <div>
            <p className={styles.eyebrow}>11. Contact information</p>
            <h2 id="terms-contact-title">Questions about these terms?</h2>
            <p>
              Tiger Ping Pong · 1-888-552-5259 · info@tigerpingpong.com · 1644 S.E. Marine Drive,
              Vancouver, BC, Canada
            </p>
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
