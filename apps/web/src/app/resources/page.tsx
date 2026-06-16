import type { Metadata } from "next";

import {
  formatResourceDate,
  RESOURCE_ARTICLES,
  type ResourceArticle
} from "../../lib/resource-articles";
import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Ping Pong Resources | Tiger PingPong",
  description:
    "Helpful guides for choosing a ping pong table, planning your room, learning the rules, and comparing indoor and outdoor table tennis tables."
};

const featuredArticle = RESOURCE_ARTICLES[0];

function getPrimaryCta(article: ResourceArticle) {
  return article.ctas.find((cta) => cta.variant === "primary") ?? article.ctas[0];
}

export default function ResourcesPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="resources" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="resources-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Resources</p>
            <h1 className={styles.title} id="resources-title">
              Ping Pong Resources
            </h1>
            <p className={styles.intro}>
              Helpful guides for choosing the right ping pong table, planning your room, learning
              the rules, and deciding whether an indoor or outdoor table is best for your space.
            </p>
          </div>

          <aside className={styles.heroPanel} aria-label="Resource topics">
            <p className={styles.eyebrow}>Start here</p>
            <strong>Buying, room planning, indoor vs outdoor choice, and rules basics.</strong>
            <p>Short, practical guides for the questions customers ask before the next rally.</p>
          </aside>
        </section>

        <section className={styles.featuredGuide} aria-labelledby="featured-resource-title">
          <div className={styles.featuredCopy}>
            <p className={styles.eyebrow}>Featured guide</p>
            <h2 id="featured-resource-title">{featuredArticle.title}</h2>
            <p>{featuredArticle.excerpt}</p>
            <div className={styles.cardActions}>
              {featuredArticle.ctas.map((cta) => (
                <a
                  className={
                    cta.variant === "primary" ? styles.primaryAction : styles.secondaryAction
                  }
                  href={cta.href}
                  key={cta.href}
                >
                  {cta.label}
                </a>
              ))}
            </div>
          </div>
          <aside className={styles.featuredAside} aria-label="Featured guide details">
            <p className={styles.tag}>{featuredArticle.category}</p>
            <strong>{formatResourceDate(featuredArticle.publishedDate)}</strong>
            <p>{featuredArticle.subtitle}</p>
          </aside>
        </section>

        <section className={styles.section} aria-labelledby="resource-guides-title">
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Guides</p>
            <h2 id="resource-guides-title">Choose, plan, compare, and play.</h2>
          </div>
          <div className={styles.cardGrid}>
            {RESOURCE_ARTICLES.map((article) => {
              const primaryCta = getPrimaryCta(article);

              return (
                <article className={styles.card} key={article.slug}>
                  <p className={styles.tag}>{article.category}</p>
                  <h3>{article.title}</h3>
                  <p className={styles.meta}>
                    {article.postedBy} - {formatResourceDate(article.publishedDate)}
                  </p>
                  <p>{article.excerpt}</p>
                  <div className={styles.cardActions}>
                    <a className={styles.primaryAction} href={primaryCta.href}>
                      {primaryCta.label}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.footerCta} aria-labelledby="resources-help-title">
          <div>
            <p className={styles.eyebrow}>Need help choosing a table?</p>
            <h2 id="resources-help-title">Start with the table lineup or ask Tiger PingPong.</h2>
            <p>
              Use the guides to narrow the decision, then compare current tables or contact us for
              help matching a table to your space.
            </p>
          </div>
          <div className={styles.footerActions}>
            <a className={styles.primaryAction} href="/tables/">
              Shop tables
            </a>
            <a className={styles.secondaryAction} href="/contact">
              Contact
            </a>
          </div>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
