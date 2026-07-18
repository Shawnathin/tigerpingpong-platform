import { getProducts } from "../../lib/catalog-api";
import { getProductMediaFallbacks } from "../../lib/public-storefront-demo";
import {
  tigerGearCategoryStories,
  tigerGearStory,
  type TigerGearCategoryKind,
  type TigerGearCategoryStory
} from "../../lib/tiger-story";
import type { CatalogProductSummary } from "../../types/catalog";

import { GearProductStage, resolveGearProductImage } from "./GearProductStage";
import styles from "./gear-category.module.css";

interface ProductResource {
  data: CatalogProductSummary[] | null;
  error: string | null;
}

interface DecisionShelfStory {
  anchor: string;
  eyebrow: string;
  heading: string;
  items: ReadonlyArray<{
    body: string;
    heading: string;
    href: string;
  }>;
  note?: string;
}

const partsMedia = getProductMediaFallbacks("tiger-portland-outdoor-table")
  .filter((image) => image.role === "detail")
  .slice(0, 2);

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

function getProductsForStory(
  products: CatalogProductSummary[],
  slugs: readonly string[]
): CatalogProductSummary[] {
  const productBySlug = new Map(products.map((product) => [product.slug, product] as const));

  return slugs.flatMap((slug) => {
    const product = productBySlug.get(slug);
    return product ? [product] : [];
  });
}

function HeroMedia({
  kind,
  products
}: {
  kind: TigerGearCategoryKind;
  products: CatalogProductSummary[];
}) {
  const categoryStory: TigerGearCategoryStory = tigerGearCategoryStories[kind];
  const hero = categoryStory.hero;

  if (kind === "parts") {
    return (
      <div className={styles.heroMedia} data-count={String(partsMedia.length)} data-kind={kind}>
        {partsMedia.map((image, index) => (
          <figure key={image.src}>
            <img
              alt={image.alt}
              fetchPriority={index === 0 ? "high" : undefined}
              loading="eager"
              src={image.src}
            />
          </figure>
        ))}
      </div>
    );
  }

  const featuredProducts = getProductsForStory(products, hero.featuredSlugs);
  const images = [
    ...(hero.image ? [{ alt: hero.image.altText, src: hero.image.finalUrl }] : []),
    ...featuredProducts.map((product) => resolveGearProductImage(product))
  ].filter((image, index, entries) => {
    return Boolean(image.src) && entries.findIndex((entry) => entry.src === image.src) === index;
  });

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={styles.heroMedia} data-count={String(images.length)} data-kind={kind}>
      {images.map((image, index) => (
        <figure key={image.src}>
          <img
            alt={image.alt}
            fetchPriority={index === 0 ? "high" : undefined}
            loading="eager"
            src={image.src ?? undefined}
          />
        </figure>
      ))}
    </div>
  );
}

function GearHero({
  kind,
  products
}: {
  kind: TigerGearCategoryKind;
  products: CatalogProductSummary[];
}) {
  const story: TigerGearCategoryStory = tigerGearCategoryStories[kind];

  return (
    <section
      aria-labelledby={`${kind}-gear-title`}
      className={styles.hero}
      data-kind={kind}
      data-tone={story.hero.tone}
      id={story.anchor}
    >
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>{story.hero.eyebrow}</p>
        <h1 id={`${kind}-gear-title`}>{story.hero.heading}</h1>
        <p className={styles.heroBody}>{story.hero.body}</p>
        {kind === "parts" ? (
          <div className={styles.heroActions}>
            {tigerGearStory.parts.actions.map((action) => (
              <a href={action.href} key={action.href}>
                {action.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
      <HeroMedia kind={kind} products={products} />
    </section>
  );
}

function GearSwitch({ kind }: { kind: TigerGearCategoryKind }) {
  return (
    <nav aria-label="Gear categories" className={styles.categorySwitch}>
      <div className={styles.categoryLinks}>
        {tigerGearStory.navigation.map((link) => {
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
      </div>
      <a
        aria-current={kind === "parts" ? "page" : undefined}
        className={styles.partsLink}
        data-active={kind === "parts" ? "true" : undefined}
        href={tigerGearStory.partsLink.href}
      >
        {tigerGearStory.partsLink.label}
      </a>
    </nav>
  );
}

function ShippingBand() {
  return (
    <aside aria-label="Accessory shipping" className={styles.shippingBand}>
      <strong>{tigerGearStory.shipping.heading}</strong>
      <span>{tigerGearStory.shipping.body}</span>
    </aside>
  );
}

function DecisionShelf({ story }: { story: DecisionShelfStory }) {
  return (
    <section
      aria-labelledby={`${story.anchor}-title`}
      className={styles.decisionShelf}
      id={story.anchor}
    >
      <div className={styles.decisionHeading}>
        <p className={styles.eyebrow}>{story.eyebrow}</p>
        <h2 id={`${story.anchor}-title`}>{story.heading}</h2>
        {story.note ? <p className={styles.decisionNote}>{story.note}</p> : null}
      </div>
      <div className={styles.decisionOptions}>
        {story.items.map((item, index) => (
          <a data-tone={String(index)} href={item.href} key={item.heading}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{item.heading}</h3>
            <p>{item.body}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function EssentialsShelf({ products }: { products: CatalogProductSummary[] }) {
  const productBySlug = new Map(products.map((product) => [product.slug, product] as const));
  const shelfImages = new Map<string, { alt: string; src: string | null }>();
  const cover = productBySlug.get("tiger-table-cover-black-polyester");
  const net = productBySlug.get("tiger-net-post-set");

  if (cover) shelfImages.set("/accessories/covers/", resolveGearProductImage(cover));
  if (net) shelfImages.set("/accessories/nets/", resolveGearProductImage(net));
  if (partsMedia[0]) {
    shelfImages.set("/replacement-parts/", {
      alt: partsMedia[0].alt,
      src: partsMedia[0].src
    });
  }

  const story = tigerGearStory.essentials;

  return (
    <section aria-labelledby="essentials-title" className={styles.essentials} id={story.anchor}>
      <div className={styles.essentialsHeading}>
        <p className={styles.eyebrow}>{story.eyebrow}</p>
        <h2 id="essentials-title">{story.heading}</h2>
      </div>
      <div className={styles.essentialsLinks}>
        {story.items.map((item) => {
          const image = shelfImages.get(item.href);

          return (
            <a href={item.href} key={item.href}>
              <div>
                <h3>{item.heading}</h3>
                <p>{item.body}</p>
                <span>Explore</span>
              </div>
              {image?.src ? <img alt={image.alt} loading="lazy" src={image.src} /> : null}
            </a>
          );
        })}
      </div>
    </section>
  );
}

function SupportPanel() {
  return (
    <section aria-labelledby="parts-support-title" className={styles.supportPanel} id="parts">
      <div>
        <p className={styles.eyebrow}>Replacement parts</p>
        <h2 id="parts-support-title">Find the odd little bit.</h2>
        <p>
          A wheel, a bracket, or the piece nobody knows the name of—send us a photo and we’ll help
          figure it out.
        </p>
      </div>
      <a href="/replacement-parts/">Get part help</a>
    </section>
  );
}

function RallyGear({ products }: { products: CatalogProductSummary[] }) {
  const paddles = products.filter((product) => product.productKind === "paddle");
  const balls = products.filter((product) => product.productKind === "ball");

  return (
    <section aria-labelledby="rally-gear-title" className={styles.rallyGear}>
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>{tigerGearStory.rallyGear.eyebrow}</p>
        <h2 id="rally-gear-title">{tigerGearStory.rallyGear.heading}</h2>
        <p>{tigerGearStory.rallyGear.body}</p>
      </div>
      <div aria-label="Paddles" className={styles.compactProductGrid} id="paddles">
        {paddles.map((product, index) => (
          <GearProductStage
            headingLevel={3}
            index={index}
            key={product.key}
            layout="compact"
            product={product}
          />
        ))}
      </div>
      <div aria-label="PingPong balls" className={styles.compactProductGrid} id="balls">
        {balls.map((product, index) => (
          <GearProductStage
            headingLevel={3}
            index={index}
            key={product.key}
            layout="compact"
            product={product}
          />
        ))}
      </div>
    </section>
  );
}

function AllAccessories({ products }: { products: CatalogProductSummary[] }) {
  const essentialSlugs = ["tiger-table-cover-black-polyester", "tiger-net-post-set"];
  const essentials = getProductsForStory(products, essentialSlugs);
  const rallyProducts = getProductsForStory(
    products,
    tigerGearCategoryStories.all.productSlugs.filter((slug) => !essentialSlugs.includes(slug))
  );

  return (
    <>
      <EssentialsShelf products={products} />
      <section aria-label="Essential accessories" className={styles.featureProducts}>
        {essentials.map((product, index) => (
          <div id={product.productKind === "cover" ? "covers" : "nets"} key={product.key}>
            <GearProductStage index={index} product={product} />
          </div>
        ))}
      </section>
      <SupportPanel />
      <RallyGear products={rallyProducts} />
    </>
  );
}

function ProductSequence({
  anchor,
  products
}: {
  anchor: string;
  products: CatalogProductSummary[];
}) {
  return (
    <section aria-label={`${anchor} products`} className={styles.featureProducts} id={anchor}>
      {products.map((product, index) => (
        <GearProductStage index={index} key={product.key} product={product} />
      ))}
    </section>
  );
}

function BallProducts({ products }: { products: CatalogProductSummary[] }) {
  const sixPacks = products.filter((product) => product.slug.includes("balls-6-"));
  const largePack = products.find((product) => product.slug === "tiger-premium-balls-140");

  return (
    <section aria-label="PingPong ball products" className={styles.ballProducts} id="balls">
      <section aria-labelledby="six-pack-title" className={styles.sixPack} id="six-pack">
        <div className={styles.sixPackHeading}>
          <p className={styles.eyebrow}>A few more balls</p>
          <h2 id="six-pack-title">Six. Two colours.</h2>
          <p>White or orange? Pick your favourite and get back to the rally.</p>
        </div>
        <div className={styles.pairedProducts}>
          {sixPacks.map((product, index) => (
            <GearProductStage
              headingLevel={3}
              index={index}
              key={product.key}
              layout="compact"
              product={product}
            />
          ))}
        </div>
      </section>
      {largePack ? <GearProductStage index={2} product={largePack} /> : null}
    </section>
  );
}

function GuidancePanel({
  anchor,
  story,
  tone
}: {
  anchor: string;
  story: {
    action: { href: string; label: string };
    body: string;
    eyebrow: string;
    heading: string;
  };
  tone: "amber" | "ink";
}) {
  return (
    <section
      aria-labelledby={`${anchor}-title`}
      className={styles.guidance}
      data-tone={tone}
      id={anchor}
    >
      <p className={styles.eyebrow}>{story.eyebrow}</p>
      <h2 id={`${anchor}-title`}>{story.heading}</h2>
      <p>{story.body}</p>
      <a href={story.action.href}>{story.action.label}</a>
    </section>
  );
}

function PartsGuide() {
  const story = tigerGearStory.parts;

  return (
    <section aria-labelledby="parts-title" className={styles.partsGuide} id="parts">
      <div className={styles.partsGuideCopy}>
        <p className={styles.eyebrow}>{story.eyebrow}</p>
        <h2 id="parts-title">{story.heading}</h2>
        <p>{story.body}</p>
        <ol>
          {story.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ol>
        <a href={story.contactAction.href}>{story.contactAction.label}</a>
      </div>
      <div className={styles.partsGuideMedia}>
        {partsMedia.map((image) => (
          <img alt={image.alt} key={image.src} loading="lazy" src={image.src} />
        ))}
      </div>
    </section>
  );
}

function EmptyProducts() {
  return (
    <section className={styles.empty}>
      <h2>We’re finding the gear.</h2>
      <p>The live catalog is taking a breather. Call us and we’ll help you sort it out.</p>
      <a href="tel:+18885525259">Call Tiger</a>
    </section>
  );
}

export async function GearCategoryExperience({ kind }: { kind: TigerGearCategoryKind }) {
  const productResource = kind === "parts" ? { data: [], error: null } : await loadProducts();
  const story = tigerGearCategoryStories[kind];
  const products = getProductsForStory(productResource.data ?? [], story.productSlugs);

  return (
    <div className={styles.gearExperience} data-kind={kind}>
      <GearHero kind={kind} products={productResource.data ?? []} />
      <GearSwitch kind={kind} />
      <ShippingBand />

      {productResource.error ? (
        <div className={styles.error} role="status">
          <strong>Catalog connection issue</strong>
          <span>{productResource.error}</span>
        </div>
      ) : null}

      {kind === "all" && products.length > 0 ? <AllAccessories products={products} /> : null}

      {kind === "paddles" && products.length > 0 ? (
        <>
          <DecisionShelf story={tigerGearStory.paddleChooser} />
          <ProductSequence anchor="paddles" products={products} />
        </>
      ) : null}

      {kind === "balls" && products.length > 0 ? (
        <>
          <DecisionShelf story={tigerGearStory.ballChooser} />
          <BallProducts products={products} />
        </>
      ) : null}

      {kind === "covers" && products.length > 0 ? (
        <>
          <ProductSequence anchor="covers" products={products} />
          <GuidancePanel anchor="cover-fit" story={tigerGearStory.coverFit} tone="amber" />
        </>
      ) : null}

      {kind === "nets" && products.length > 0 ? (
        <>
          <ProductSequence anchor="nets" products={products} />
          <GuidancePanel anchor="net-fit" story={tigerGearStory.netFit} tone="ink" />
        </>
      ) : null}

      {kind === "parts" ? <PartsGuide /> : null}

      {kind !== "parts" && productResource.data && products.length === 0 ? <EmptyProducts /> : null}
    </div>
  );
}
