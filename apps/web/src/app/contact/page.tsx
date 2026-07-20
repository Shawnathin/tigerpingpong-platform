import Image from "next/image";

import { getPathMetadata } from "../../lib/seo";
import { tigerStory } from "../../lib/tiger-story";
import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import styles from "./page.module.css";

export const metadata = getPathMetadata({
  pathname: "/contact",
  title: "Contact Tiger PingPong | Real Help from Vancouver",
  description:
    "Questions about products, orders, shipping, setup, or replacement parts? Call or email a real person at Tiger PingPong in Vancouver."
});

export default function ContactPage() {
  const { contact } = tigerStory;

  return (
    <>
      <PublicStorefrontNav activeItem="contact" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="contact-title" data-testid="contact-hero">
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>{contact.hero.eyebrow}</p>
            <h1 id="contact-title">{contact.hero.heading}</h1>
            <p className={styles.heroBody}>{contact.hero.body}</p>
            <div className={styles.heroActions} aria-label="Contact Tiger PingPong">
              <a
                className={styles.primaryAction}
                data-testid="contact-hero-call"
                href={contact.phone.href}
              >
                {contact.hero.primaryAction}
              </a>
              <a
                className={styles.secondaryAction}
                data-testid="contact-hero-email"
                href={contact.email.href}
              >
                {contact.hero.secondaryAction}
              </a>
            </div>
          </div>

          <figure className={styles.heroFigure}>
            <div className={styles.heroImageFrame}>
              <Image
                alt={contact.hero.image.altText}
                className={styles.heroImage}
                fill
                priority
                sizes="(max-width: 899px) calc(100vw - 40px), 620px"
                src={contact.hero.image.finalUrl}
                unoptimized
              />
            </div>
            <figcaption>{contact.hero.image.caption}</figcaption>
          </figure>
        </section>

        <section
          className={styles.topics}
          aria-labelledby="contact-topics-title"
          data-testid="contact-topics"
        >
          <header className={styles.topicsHeader}>
            <p className={styles.orangeEyebrow}>{contact.topics.eyebrow}</p>
            <h2 id="contact-topics-title">{contact.topics.heading}</h2>
          </header>
          <div className={styles.topicRows}>
            {contact.topics.items.map((topic, index) => (
              <article key={topic.heading}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h3>{topic.heading}</h3>
                <p>{topic.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className={styles.orderHelp}
          aria-labelledby="order-help-title"
          data-testid="contact-order-help"
        >
          <div className={styles.orderCopy}>
            <p className={styles.darkEyebrow}>{contact.orderHelp.eyebrow}</p>
            <h2 id="order-help-title">{contact.orderHelp.heading}</h2>
            <p>{contact.orderHelp.body}</p>
            <a className={styles.orderAction} href={contact.email.href}>
              {contact.orderHelp.action}
            </a>
          </div>
          <ol className={styles.orderDetails}>
            {contact.orderHelp.details.map((detail) => (
              <li key={detail}>
                <span>{detail}</span>
              </li>
            ))}
          </ol>
        </section>

        <section
          className={styles.closing}
          aria-labelledby="contact-closing-title"
          data-testid="contact-closing"
        >
          <div className={styles.closingCopy}>
            <p className={styles.closingSignature}>{contact.closing.signature}</p>
            <h2 id="contact-closing-title">{contact.closing.heading}</h2>
            <p>{contact.closing.body}</p>
          </div>
          <div className={styles.closingActions} aria-label="Contact Tiger">
            <a className={styles.primaryAction} href={contact.phone.href}>
              {contact.closing.primaryAction}
            </a>
            <a className={styles.closingSecondaryAction} href={contact.email.href}>
              {contact.closing.secondaryAction}
            </a>
          </div>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
