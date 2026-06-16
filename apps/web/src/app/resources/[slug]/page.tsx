import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  formatResourceDate,
  getResourceArticle,
  RESOURCE_ARTICLES
} from "../../../lib/resource-articles";
import { PublicStorefrontFooter } from "../../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../../PublicStorefrontNav";
import styles from "../page.module.css";

interface ResourceArticlePageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return RESOURCE_ARTICLES.map((article) => ({
    slug: article.slug
  }));
}

export function generateMetadata({ params }: ResourceArticlePageProps): Metadata {
  const article = getResourceArticle(params.slug);

  if (!article) {
    return {
      title: "Resource | Tiger PingPong",
      description: "Tiger PingPong resource guide."
    };
  }

  return {
    title: article.metaTitle,
    description: article.metaDescription
  };
}

export default function ResourceArticlePage({ params }: ResourceArticlePageProps) {
  const article = getResourceArticle(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <>
      <PublicStorefrontNav activeItem="resources" />
      <main className={`${styles.page} ${styles.articlePage}`}>
        <section className={styles.articleHero} aria-labelledby="resource-article-title">
          <p className={styles.eyebrow}>{article.category}</p>
          <h1 id="resource-article-title">{article.title}</h1>
          {article.subtitle ? <p>{article.subtitle}</p> : null}
          <p className={styles.meta}>
            {article.postedBy} - {formatResourceDate(article.publishedDate)}
          </p>
          <div className={styles.articleActions}>
            {article.ctas
              .filter((cta) => cta.href !== `/resources/${article.slug}`)
              .map((cta) => (
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
        </section>

        <section className={styles.articleBody} aria-label={`${article.title} guide summary`}>
          <article className={styles.articleMain}>
            <p className={styles.eyebrow}>Guide foundation</p>
            <h2>What this guide covers</h2>
            <p>{article.excerpt}</p>
            <ul>
              {article.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
            <p>
              This preserved resource URL is ready for the full article migration. The current page
              keeps the sourced topic, date, summary, and next-step links in place without carrying
              over stale claims or old storefront links.
            </p>
          </article>

          <aside className={styles.articlePanel} aria-labelledby="related-links-title">
            <span>Related links</span>
            <strong id="related-links-title">Keep browsing</strong>
            <ul>
              {article.relatedLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
