import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  formatResourceDate,
  getResourceArticle,
  RESOURCE_ARTICLES,
  type ResourceArticle
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
    description: article.metaDescription,
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      type: "article",
      publishedTime: `${article.publishedDate}T00:00:00.000Z`,
      modifiedTime: `${article.updatedDate}T00:00:00.000Z`
    }
  };
}

function getArticleJsonLd(article: ResourceArticle) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    author: {
      "@type": "Organization",
      name: "Tiger PingPong"
    },
    dateModified: article.updatedDate,
    datePublished: article.publishedDate,
    description: article.metaDescription,
    headline: article.metaTitle,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://tigerpingpong.ca/resources/${article.slug}`
    },
    publisher: {
      "@type": "Organization",
      name: "Tiger PingPong"
    }
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getArticleJsonLd(article)) }}
      />
      <main className={`${styles.page} ${styles.articlePage}`}>
        <section className={styles.articleHero} aria-labelledby="resource-article-title">
          <p className={styles.eyebrow}>{article.category}</p>
          <h1 id="resource-article-title">{article.title}</h1>
          {article.subtitle ? <p>{article.subtitle}</p> : null}
          <p className={styles.meta}>
            {article.postedBy} - Originally published {formatResourceDate(article.publishedDate)}.
            Updated {formatResourceDate(article.updatedDate)}.
          </p>
          <div className={styles.articleActions}>
            {article.ctas.map((cta) => (
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

        <section className={styles.articleBody} aria-label={`${article.title} guide`}>
          <article className={styles.articleMain}>
            <section className={styles.articleIntro} aria-labelledby="article-overview-title">
              <p className={styles.eyebrow}>Guide overview</p>
              <h2 id="article-overview-title">What this guide covers</h2>
              <p>{article.excerpt}</p>
              <ul>
                {article.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </section>

            {article.sections.map((section) => (
              <section className={styles.articleSection} key={section.heading}>
                <h2>{section.heading}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                {section.callout ? (
                  <aside className={styles.callout}>
                    <strong>{section.callout.title}</strong>
                    {section.callout.body ? <p>{section.callout.body}</p> : null}
                    {section.callout.items ? (
                      <ul>
                        {section.callout.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </aside>
                ) : null}

                {section.bullets ? (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}

                {section.table ? (
                  <div className={styles.tableWrap}>
                    <table>
                      <thead>
                        <tr>
                          {section.table.columns.map((column) => (
                            <th key={column} scope="col">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row) => (
                          <tr key={row.join("-")}>
                            {row.map((cell) => (
                              <td key={cell}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {section.links ? (
                  <div className={styles.inlineLinks}>
                    {section.links.map((link) => (
                      <a href={link.href} key={link.href}>
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}
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
