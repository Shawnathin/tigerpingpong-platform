import type { Metadata } from "next";

import {
  formatResourceDate,
  RESOURCE_ARTICLES,
  type ResourceArticle
} from "../../lib/resource-articles";
import { getPathMetadata } from "../../lib/seo";
import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import styles from "./page.module.css";

export const metadata: Metadata = getPathMetadata({
  pathname: "/resources",
  title: "Ping Pong Resources | Tiger Ping Pong",
  description:
    "Read Tiger Ping Pong guides for choosing a table, planning room size, learning rules, and comparing indoor and outdoor table tennis tables."
});

const featuredArticle = RESOURCE_ARTICLES[0];

function getArticleHref(article: ResourceArticle) {
  return `/resources/${article.slug}`;
}

function getArticleCtaLabel(article: ResourceArticle) {
  if (article.category === "Buying Guide") {
    return "Read the Buyer's Guide";
  }

  if (article.category === "Rules") {
    return "Learn the Rules";
  }

  if (article.category === "Room Planning") {
    return "Check Room Size";
  }

  return "Compare Indoor vs Outdoor";
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
          </div>
        </section>

        <section className={styles.featuredGuide} aria-labelledby="featured-resource-title">
          <div className={styles.featuredCopy}>
            <p className={styles.eyebrow}>Featured guide</p>
            <h2 id="featured-resource-title">{featuredArticle.title}</h2>
            <p>{featuredArticle.excerpt}</p>
            <div className={styles.cardActions}>
              <a className={styles.primaryAction} href={getArticleHref(featuredArticle)}>
                Read the Buyer's Guide
              </a>
              <a className={styles.secondaryAction} href="/tables/">
                Shop tables
              </a>
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
            <h2 id="resource-guides-title">Guides</h2>
          </div>
          <div className={styles.cardGrid}>
            {RESOURCE_ARTICLES.map((article) => {
              return (
                <article className={styles.card} key={article.slug}>
                  <p className={styles.tag}>{article.category}</p>
                  <h3>{article.title}</h3>
                  <p className={styles.meta}>
                    {article.postedBy} - {formatResourceDate(article.publishedDate)}
                  </p>
                  <p>{article.excerpt}</p>
                  <div className={styles.cardActions}>
                    <a className={styles.primaryAction} href={getArticleHref(article)}>
                      {getArticleCtaLabel(article)}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
