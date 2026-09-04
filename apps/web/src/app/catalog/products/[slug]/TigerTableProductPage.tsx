import {
  buildResponsiveCloudinarySrcSet,
  buildResponsiveCloudinaryUrl
} from "../../../../lib/product-media";
import {
  buildTigerTableComparisonRows,
  getTigerTableProductDisplayLabel,
  resolveTigerTableComparisonColumns
} from "../../../../lib/tiger-table-comparison";
import {
  getApprovedSectionContent,
  type TigerTableFeatureMoment,
  type TigerTablePageDefinition,
  type TigerTableResourceLink,
  type TigerTableSpecGroup
} from "../../../../lib/tiger-table-pages";
import { getTigerTableGalleryMedia } from "../../../../lib/tiger-story";
import type { CatalogProductDetail } from "../../../../types/catalog";

import { ProductFeatureCarousel, type ProductFeatureMoment } from "./ProductFeatureCarousel";
import styles from "./TigerTableProductPage.module.css";

interface TigerTableProductPageProps {
  comparisonProducts: CatalogProductDetail[];
  definition: TigerTablePageDefinition;
  product: CatalogProductDetail;
}

export function TigerTableProductPage({
  comparisonProducts,
  definition,
  product
}: TigerTableProductPageProps) {
  const trustFacts = (getApprovedSectionContent(definition.trustFacts) ?? []).slice(0, 3);
  const story = getApprovedSectionContent(definition.story);
  const storyMediaDefinition = getApprovedSectionContent(definition.storyMedia);
  const featureDefinitions = getApprovedSectionContent(definition.featureMoments) ?? [];
  const specs = getApprovedSectionContent(definition.specs);
  const galleryMedia = getTigerTableGalleryMedia(definition.slug);
  const storyMedia = storyMediaDefinition
    ? galleryMedia.find((media) => media.mediaKey === storyMediaDefinition.mediaKey)
    : undefined;
  const featureMoments = resolveFeatureMoments(featureDefinitions, galleryMedia);
  const comparisonColumns = resolveTigerTableComparisonColumns(
    product,
    definition,
    comparisonProducts
  );
  const comparisonRows =
    comparisonColumns.length === 3 ? buildTigerTableComparisonRows(comparisonColumns) : [];
  const resourceLinks = resolveResourceLinks(definition);

  return (
    <div className={styles.page} data-table-page-system="universal-v1">
      {trustFacts.length > 0 ? (
        <section className={`${styles.content} ${styles.trustSection}`} aria-label="Product facts">
          <ul className={styles.trustStrip} data-fact-count={trustFacts.length}>
            {trustFacts.map((fact) => (
              <li className={styles.trustFact} key={fact.id}>
                <strong>{fact.heading}</strong>
                {fact.detail ? <span>{fact.detail}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {story && storyMediaDefinition && storyMedia ? (
        <section
          className={`${styles.content} ${styles.storySection}`}
          aria-labelledby="table-story-title"
        >
          <div className={styles.storyStage}>
            <img
              alt={storyMediaDefinition.altText || storyMedia.altText}
              decoding="async"
              loading="lazy"
              sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1320px) calc(100vw - 40px), 1240px"
              src={buildResponsiveCloudinaryUrl(storyMedia.src, 1600)}
              srcSet={buildResponsiveCloudinarySrcSet(storyMedia.src)}
            />
            <div className={styles.storyScrim} aria-hidden="true" />
            <div className={styles.storyCopy}>
              <p className={styles.eyebrow}>{story.eyebrow}</p>
              <h2 id="table-story-title">{story.heading}</h2>
              <p>{story.body}</p>
            </div>
          </div>
        </section>
      ) : null}

      {featureMoments.length > 0 ? (
        <section
          className={`${styles.content} ${styles.featureSection}`}
          aria-labelledby="table-feature-title"
        >
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>A closer look</p>
            <h2 id="table-feature-title">Details that matter.</h2>
          </div>
          <div className={styles.featureShell}>
            <ProductFeatureCarousel
              ariaLabel={`${getTigerTableProductDisplayLabel(product)} details`}
              layout="uniform"
              moments={featureMoments}
            />
          </div>
        </section>
      ) : null}

      {comparisonColumns.length === 3 ? (
        <section
          className={`${styles.content} ${styles.comparisonSection}`}
          aria-labelledby="table-comparison-title"
        >
          <div className={styles.comparisonHeading}>
            <div>
              <p className={styles.eyebrow}>Compare</p>
              <h2 id="table-comparison-title">Find your table.</h2>
            </div>
            <a href="/tables/">
              View all tables <span aria-hidden="true">›</span>
            </a>
          </div>
          <div className={styles.comparisonViewport}>
            <div className={styles.comparisonGrid}>
              {comparisonColumns.map((column, columnIndex) => (
                <article
                  className={`${styles.comparisonCard} ${
                    columnIndex === 0 ? styles.currentComparisonCard : ""
                  }`.trim()}
                  data-current-table={columnIndex === 0 ? "true" : undefined}
                  key={column.product.slug}
                >
                  <header>
                    {columnIndex === 0 ? (
                      <p className={styles.currentLabel}>You’re viewing</p>
                    ) : null}
                    <h3>
                      {columnIndex === 0 ? (
                        column.label
                      ) : (
                        <a href={`/catalog/products/${column.product.slug}`}>{column.label}</a>
                      )}
                    </h3>
                  </header>
                  {columnIndex === 0 ? (
                    <img
                      alt={column.image.altText}
                      decoding="async"
                      loading="lazy"
                      src={buildResponsiveCloudinaryUrl(column.image.src, 800)}
                      srcSet={buildResponsiveCloudinarySrcSet(column.image.src, [480, 800])}
                    />
                  ) : (
                    <a
                      aria-label={`View ${column.label}`}
                      className={styles.comparisonImageLink}
                      href={`/catalog/products/${column.product.slug}`}
                    >
                      <img
                        alt={column.image.altText}
                        decoding="async"
                        loading="lazy"
                        src={buildResponsiveCloudinaryUrl(column.image.src, 800)}
                        srcSet={buildResponsiveCloudinarySrcSet(column.image.src, [480, 800])}
                      />
                    </a>
                  )}
                  {comparisonRows.length > 0 ? (
                    <dl className={styles.comparisonFacts}>
                      {comparisonRows.map((row) => (
                        <div key={row.id}>
                          <dt>{row.label}</dt>
                          <dd>{row.values[columnIndex]}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {specs || resourceLinks.length > 0 ? (
        <div className={styles.specResourcesBand}>
          {specs ? (
            <section
              className={`${styles.content} ${styles.specSection}`}
              aria-labelledby="table-specs-title"
            >
              <div className={styles.specShell}>
                <div className={styles.sectionHeading}>
                  <p className={styles.eyebrow}>Specifications</p>
                  <h2 id="table-specs-title">Specs and dimensions.</h2>
                </div>
                <div className={styles.desktopSpecs}>
                  <SpecificationGroups groups={specs.groups} />
                </div>
                <details className={styles.mobileSpecs}>
                  <summary>
                    <span>
                      <span className={styles.eyebrow}>Specifications</span>
                      <strong>View specs and dimensions</strong>
                    </span>
                    <span aria-hidden="true" className={styles.disclosureIcon} />
                  </summary>
                  <div className={styles.mobileSpecsBody}>
                    <SpecificationGroups groups={specs.groups} />
                  </div>
                </details>

                {resourceLinks.length > 0 ? (
                  <section
                    className={styles.resourcesSection}
                    data-product-slug={definition.slug}
                    data-testid="table-support-resources"
                    aria-labelledby="table-resources-title"
                  >
                    <div>
                      <p className={styles.eyebrow}>Resources and help</p>
                      <h2 id="table-resources-title">The practical stuff.</h2>
                    </div>
                    <nav aria-label={`${getTigerTableProductDisplayLabel(product)} resources`}>
                      {resourceLinks.map((resource) => (
                        <a
                          download={resource.kind === "manual" ? true : undefined}
                          href={resource.href}
                          key={resource.id}
                          rel={isExternalUrl(resource.href) ? "noopener noreferrer" : undefined}
                          target={isExternalUrl(resource.href) ? "_blank" : undefined}
                        >
                          {resource.label}
                          <span aria-hidden="true">›</span>
                        </a>
                      ))}
                    </nav>
                  </section>
                ) : null}
              </div>
            </section>
          ) : resourceLinks.length > 0 ? (
            <section
              className={`${styles.content} ${styles.resourcesSection} ${styles.standaloneResources}`}
              data-product-slug={definition.slug}
              data-testid="table-support-resources"
              aria-labelledby="table-resources-title"
            >
              <div>
                <p className={styles.eyebrow}>Resources and help</p>
                <h2 id="table-resources-title">The practical stuff.</h2>
              </div>
              <nav aria-label={`${getTigerTableProductDisplayLabel(product)} resources`}>
                {resourceLinks.map((resource) => (
                  <a
                    download={resource.kind === "manual" ? true : undefined}
                    href={resource.href}
                    key={resource.id}
                    rel={isExternalUrl(resource.href) ? "noopener noreferrer" : undefined}
                    target={isExternalUrl(resource.href) ? "_blank" : undefined}
                  >
                    {resource.label}
                    <span aria-hidden="true">›</span>
                  </a>
                ))}
              </nav>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SpecificationGroups({ groups }: { groups: readonly TigerTableSpecGroup[] }) {
  return (
    <div className={styles.specGroups}>
      {groups.map((group) => (
        <section className={styles.specGroup} key={group.id}>
          <h3>{group.heading}</h3>
          <dl>
            {group.items.map((item) => (
              <div key={item.id}>
                <dt>{item.label}</dt>
                <dd>
                  <span>{item.value}</span>
                  {item.note ? <small>{item.note}</small> : null}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

function resolveFeatureMoments(
  features: readonly TigerTableFeatureMoment[],
  galleryMedia: ReturnType<typeof getTigerTableGalleryMedia>
): ProductFeatureMoment[] {
  if (features.length === 0) {
    return [];
  }

  const mediaByKey = new Map(galleryMedia.map((media) => [media.mediaKey, media] as const));
  const resolvedMoments: ProductFeatureMoment[] = [];

  for (const feature of features) {
    const media = mediaByKey.get(feature.mediaKey);

    if (!media) {
      return [];
    }

    resolvedMoments.push({
      description: [
        feature.explanation.whatItIs,
        feature.explanation.whyItMatters,
        feature.explanation.limitation
      ]
        .filter((sentence): sentence is string => Boolean(sentence))
        .join(" "),
      kicker: feature.kicker,
      title: feature.title,
      visual: {
        alt: media.altText,
        src: buildResponsiveCloudinaryUrl(media.src, 1200)
      }
    });
  }

  return resolvedMoments;
}

function resolveResourceLinks(definition: TigerTablePageDefinition): TigerTableResourceLink[] {
  const reviewedResourceBlock = getApprovedSectionContent(definition.resources);

  if (!reviewedResourceBlock) {
    return [];
  }

  const reviewedResources = reviewedResourceBlock.links;
  const links: TigerTableResourceLink[] = [...reviewedResources];

  links.push(
    {
      href: "/replacement-parts/",
      id: "replacement-parts",
      kind: "support",
      label: "Replacement parts"
    },
    {
      href: "/contact",
      id: "contact-support",
      kind: "support",
      label: "Contact support"
    }
  );

  return Array.from(new Map(links.map((link) => [link.href, link] as const)).values());
}

function isExternalUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
