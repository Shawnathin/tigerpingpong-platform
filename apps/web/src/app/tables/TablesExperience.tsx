import Image from "next/image";

import { getProducts } from "../../lib/catalog-api";
import { sortProductsForBrowsing } from "../../lib/product-browsing";
import { tigerStory, type TigerStoryImage } from "../../lib/tiger-story";
import type { CatalogProductSummary } from "../../types/catalog";
import { getCategoryPageConfig } from "../category-pages";

import { OutdoorInsideEducation, TableProductStage } from "./TableProductStage";

import styles from "./page.module.css";

interface ProductResource {
  data: CatalogProductSummary[] | null;
  error: string | null;
}

const tables = tigerStory.tables;

async function loadProducts(): Promise<ProductResource> {
  try {
    return {
      data: await getProducts(),
      error: null
    };
  } catch {
    return {
      data: null,
      error: "Live catalog data is temporarily unavailable."
    };
  }
}

function DecisionOption({
  body,
  heading,
  href,
  image
}: {
  body: string;
  heading: string;
  href: string;
  image: TigerStoryImage;
}) {
  return (
    <a className={styles.decisionOption} data-kind={heading.toLowerCase()} href={href}>
      <div aria-hidden="true" className={styles.decisionMedia}>
        <Image
          alt=""
          fill
          loading="lazy"
          sizes="(max-width: 899px) 100vw, 38vw"
          src={image.finalUrl}
        />
      </div>
      <div className={styles.decisionCopy}>
        <h3>{heading}</h3>
        <p>{body}</p>
        <span>Explore {heading.toLowerCase()}</span>
      </div>
    </a>
  );
}

export async function TablesExperience() {
  const productResource = await loadProducts();
  const tableConfig = getCategoryPageConfig("tables");
  const products = sortProductsForBrowsing(
    (productResource.data ?? []).filter(tableConfig.productFilter),
    tableConfig.productOrder
  );

  return (
    <div className={styles.tablesExperience}>
      <section aria-labelledby="tables-hero-title" className={styles.hero}>
        <Image
          alt={tables.hero.image.altText}
          className={styles.heroImage}
          fill
          priority
          sizes="(max-width: 1490px) 100vw, 1440px"
          src={tables.hero.image.finalUrl}
        />
        <div aria-hidden="true" className={styles.heroOverlay} />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{tables.hero.eyebrow}</p>
          <h1 id="tables-hero-title">{tables.hero.heading}</h1>
          <p className={styles.heroBody}>{tables.hero.body}</p>
          <a className={styles.heroAction} href={tables.hero.action.href}>
            {tables.hero.action.label}
          </a>
        </div>
      </section>

      <section
        aria-labelledby="tables-chooser-title"
        className={styles.chooser}
        id={tables.chooser.anchor}
      >
        <div className={styles.chooserHeading}>
          <p className={styles.eyebrow}>Start here</p>
          <h2 id="tables-chooser-title">{tables.chooser.heading}</h2>
        </div>
        <div className={styles.chooserOptions}>
          {tables.chooser.options.map((option) => (
            <DecisionOption
              body={option.body}
              heading={option.heading}
              href={option.href}
              image={option.image}
              key={option.heading}
            />
          ))}
        </div>
        <div className={styles.chooserMeta}>
          <a href={tables.chooser.compare.href}>{tables.chooser.compare.label}</a>
        </div>
      </section>

      <aside aria-label="Table shipping" className={styles.shippingRibbon}>
        <strong>{tables.shipping.heading}</strong>
        <span>{tables.shipping.body}</span>
      </aside>

      {productResource.error ? (
        <div className={styles.error} role="status">
          <strong>Catalog connection issue</strong>
          <span>{productResource.error}</span>
        </div>
      ) : null}

      {productResource.data && products.length > 0 ? (
        <section aria-label="Tiger PingPong tables" className={styles.products}>
          {products.map((product, index) => (
            <div className={styles.productSequence} key={product.key}>
              <TableProductStage index={index} product={product} />
              {index === 2 ? <OutdoorInsideEducation education={tables.education} /> : null}
            </div>
          ))}
        </section>
      ) : (
        <section className={styles.empty}>
          <h2>This page is being prepared.</h2>
          <p>Contact Tiger PingPong for current availability or help finding the right table.</p>
          <a href="/contact">Contact Tiger PingPong</a>
        </section>
      )}
    </div>
  );
}
