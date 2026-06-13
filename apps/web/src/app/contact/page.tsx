import type { Metadata } from "next";

import { PublicStorefrontNav } from "../PublicStorefrontNav";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact | Tiger Ping Pong",
  description:
    "Contact Tiger Ping Pong for product, shipping, order, checkout, and setup questions."
};

const SUPPORT_PHONE = "1-888-552-5259";
const SUPPORT_EMAIL = "info@tigerpingpong.com";
const PORTLAND_IMAGE =
  "https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/112/774/Portland_Outdoor_Black_-_Grey_Top__73629.1685479931.jpg?c=1";

const SUPPORT_TOPICS = [
  {
    body: "Ask about tables, paddles, balls, accessories, product fit, or availability.",
    label: "Product questions"
  },
  {
    body: "Confirm Canada-wide shipping rules, delivery details, or table shipping expectations.",
    label: "Shipping questions"
  },
  {
    body: "Get help with checkout questions, payment status, or an existing order reference.",
    label: "Order/payment questions"
  },
  {
    body: "Talk through school or club needs, replacement parts, or setup help.",
    label: "Setup help"
  }
];

const ORDER_GUIDANCE = [
  "Include your order reference if available.",
  "Include your checkout email.",
  "Include the product name if relevant."
];

export default function ContactPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="contact" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="contact-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Contact Tiger Ping Pong</p>
            <h1 className={styles.title} id="contact-title">
              Help for orders, shipping, products, and setup.
            </h1>
            <p className={styles.intro}>
              Tiger Ping Pong supports customers from Vancouver, BC with Canada-wide product and
              storefront help.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="tel:+18885525259">
                Call {SUPPORT_PHONE}
              </a>
              <a className={styles.secondaryAction} href={`mailto:${SUPPORT_EMAIL}`}>
                Email us
              </a>
            </div>
          </div>

          <div className={styles.heroVisual} aria-label="Tiger Ping Pong table support">
            <span className={styles.visualBadge}>
              <small>Vancouver, BC</small>
              <strong>Canada-wide support</strong>
              <em>Product, shipping, order, and setup help</em>
            </span>
            <img src={PORTLAND_IMAGE} alt="Portland Outdoor table in grey" />
          </div>
        </section>

        <section className={styles.contactGrid} aria-label="Contact options">
          <article>
            <span>Call</span>
            <a href="tel:+18885525259">{SUPPORT_PHONE}</a>
            <p>Product help, availability, order questions, and setup help.</p>
          </article>
          <article>
            <span>Email</span>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            <p>Send order references, product names, checkout questions, or shipping details.</p>
          </article>
          <article>
            <span>Location</span>
            <strong>Vancouver, BC</strong>
            <p>Serving homes, clubs, schools, and parks across Canada.</p>
          </article>
        </section>

        <section className={styles.section} aria-labelledby="support-topics-title">
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Support topics</p>
            <h2 id="support-topics-title">What we can help with.</h2>
          </div>
          <div className={styles.topicGrid}>
            {SUPPORT_TOPICS.map((topic) => (
              <article key={topic.label}>
                <span>{topic.label}</span>
                <p>{topic.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.guidanceBand} aria-labelledby="order-help-title">
          <div>
            <p className={styles.eyebrow}>Order questions</p>
            <h2 id="order-help-title">A few details help us find the right order faster.</h2>
            <p>
              For checkout, payment, shipping, or order questions, include the details below when
              you call or email.
            </p>
          </div>
          <ul>
            {ORDER_GUIDANCE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
