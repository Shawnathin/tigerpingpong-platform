import Image from "next/image";

import { getProducts } from "../../lib/catalog-api";
import { sortProductsForBrowsing } from "../../lib/product-browsing";
import {
  tigerStory,
  tigerTableCategoryStories,
  type TigerTableCategoryKind
} from "../../lib/tiger-story";
import type { CatalogProductSummary } from "../../types/catalog";
import { getCategoryPageConfig } from "../category-pages";

import categoryStyles from "./table-category.module.css";
import styles from "./page.module.css";
import { OutdoorInsideEducation, TableProductStage } from "./TableProductStage";

interface ProductResource {
  data: CatalogProductSummary[] | null;
  error: string | null;
}

const categoryLinks: Array<{
  href: string;
  kind: TigerTableCategoryKind | "all";
  label: string;
}> = [
  { href: "/tables/", kind: "all", label: "All tables" },
  { href: "/tables/indoor-tables/", kind: "indoor", label: "Indoor" },
  { href: "/tables/outdoor-tables/", kind: "outdoor", label: "Outdoor" }
];

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

function CategoryHero({ kind }: { kind: TigerTableCategoryKind }) {
  const hero = tigerTableCategoryStories[kind].hero;

  return (
    <section
      aria-labelledby={`${kind}-tables-hero-title`}
      className={categoryStyles.hero}
      data-kind={kind}
      data-layout={hero.layout}
    >
      <div className={categoryStyles.heroCopy}>
        <p className={categoryStyles.eyebrow}>{hero.eyebrow}</p>
        <h1 id={`${kind}-tables-hero-title`}>{hero.heading}</h1>
        <p className={categoryStyles.heroBody}>{hero.body}</p>
        <a className={categoryStyles.heroLink} href={hero.link.href}>
          {hero.link.label}
        </a>
      </div>
      <figure className={categoryStyles.heroMedia}>
        <Image
          alt={hero.image.altText}
          className={categoryStyles.heroImage}
          fill
          priority
          sizes={
            kind === "indoor"
              ? "(max-width: 899px) 100vw, 760px"
              : "(max-width: 1490px) 100vw, 1440px"
          }
          src={hero.image.finalUrl}
        />
        <div aria-hidden="true" className={categoryStyles.heroOverlay} />
        <figcaption>{hero.caption}</figcaption>
      </figure>
    </section>
  );
}

function CategorySwitch({ kind }: { kind: TigerTableCategoryKind }) {
  return (
    <nav aria-label="Table categories" className={categoryStyles.categorySwitch}>
      {categoryLinks.map((link) => {
        const isActive = link.kind === kind;

        return (
          <a
            aria-current={isActive ? "page" : undefined}
            data-active={isActive ? "true" : undefined}
            href={link.href}
            key={link.kind}
          >
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}

function IndoorGuide() {
  const guide = tigerTableCategoryStories.indoor.guide;

  if (!guide) {
    return null;
  }

  return (
    <section
      aria-labelledby="indoor-guide-title"
      className={categoryStyles.indoorGuide}
      id={guide.anchor}
    >
      <p className={categoryStyles.eyebrow}>{guide.eyebrow}</p>
      <h2 id="indoor-guide-title">{guide.heading}</h2>
      <p>{guide.body}</p>
    </section>
  );
}

export async function TableCategoryExperience({ kind }: { kind: TigerTableCategoryKind }) {
  const productResource = await loadProducts();
  const story = tigerTableCategoryStories[kind];
  const categoryConfig = getCategoryPageConfig(`${kind}-tables`);
  const products = sortProductsForBrowsing(
    (productResource.data ?? []).filter(categoryConfig.productFilter),
    categoryConfig.productOrder
  );

  return (
    <div className={categoryStyles.categoryExperience} data-kind={kind}>
      <CategoryHero kind={kind} />
      <CategorySwitch kind={kind} />

      <aside
        aria-label="Table shipping"
        className={`${styles.shippingRibbon} ${categoryStyles.shippingRibbon}`}
      >
        <strong>{tigerStory.tables.shipping.heading}</strong>
        <span>{tigerStory.tables.shipping.body}</span>
      </aside>

      {productResource.error ? (
        <div className={styles.error} role="status">
          <strong>Catalog connection issue</strong>
          <span>{productResource.error}</span>
        </div>
      ) : null}

      {productResource.data && products.length > 0 ? (
        <section
          aria-label={`${story.hero.eyebrow} models`}
          className={styles.products}
          id="models"
        >
          {products.map((product, index) => (
            <div className={styles.productSequence} key={product.key}>
              <TableProductStage index={index} product={product} />
              {kind === "indoor" && index === 0 ? <IndoorGuide /> : null}
              {kind === "outdoor" && product.slug === "tiger-portland-outdoor-table" ? (
                <OutdoorInsideEducation education={tigerStory.tables.education} />
              ) : null}
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
