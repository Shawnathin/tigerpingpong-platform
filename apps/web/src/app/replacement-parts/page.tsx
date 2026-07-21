import Image from "next/image";
import { headers } from "next/headers";

import { getProducts } from "../../lib/catalog-api";
import { resolveLiveCuratedReplacementParts } from "../../lib/curated-replacement-parts";
import { getPathMetadata } from "../../lib/seo";
import { V1_FLAT_RATE_SHIPPING_COPY } from "../../lib/shipping";
import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import { ReplacementPartPurchase } from "./ReplacementPartPurchase";
import styles from "./page.module.css";
import { replacementPartsContent } from "./replacement-parts-content";

export const metadata = getPathMetadata({
  pathname: "/replacement-parts",
  title: "Replacement Parts & Manuals | Tiger PingPong",
  description:
    "Find Tiger PingPong Part 40, download table manuals, watch setup videos, or send our Vancouver team a photo for replacement-part help."
});

async function loadLiveReplacementParts() {
  try {
    const requestHeaders = await headers();
    const testCatalogMode =
      process.env.NODE_ENV === "production"
        ? null
        : requestHeaders.get("x-tiger-test-catalog-mode");

    if (testCatalogMode === "unavailable") {
      throw new Error("Test-only replacement-parts catalog failure.");
    }

    return resolveLiveCuratedReplacementParts(await getProducts());
  } catch {
    return [];
  }
}

export default async function ReplacementPartsPage() {
  const { contact, hero, identification, manuals, part40 } = replacementPartsContent;
  const liveReplacementParts = await loadLiveReplacementParts();
  const livePart40 = liveReplacementParts.find((part) => part.configuration.slug === part40.slug);

  return (
    <>
      <PublicStorefrontNav activeItem="accessories" />
      <main className={styles.page}>
        <section
          aria-labelledby="replacement-parts-title"
          className={styles.hero}
          data-testid="replacement-parts-hero"
        >
          <div className={styles.heroCopy}>
            <p className={styles.lightEyebrow}>{hero.eyebrow}</p>
            <h1 id="replacement-parts-title">{hero.heading}</h1>
            <p className={styles.heroBody}>{hero.body}</p>
            <div className={styles.heroActions} aria-label="Replacement-parts starting points">
              <a className={styles.primaryAction} href="#part-40">
                Find Part 40
              </a>
              <a className={styles.ghostAction} href={contact.generalPartsEmailHref}>
                Send us a photo
              </a>
            </div>
          </div>

          <figure className={styles.heroFigure}>
            <span className={styles.partBadge}>Most-requested fix</span>
            <div className={styles.heroImageFrame}>
              <Image
                alt={hero.image.altText}
                className={styles.heroImage}
                fill
                priority
                sizes="(max-width: 899px) calc(100vw - 80px), 520px"
                src={hero.image.finalUrl}
                unoptimized
              />
            </div>
            <figcaption>
              <strong>Part 40</strong>
              <span>The little clip that keeps a big repair small.</span>
            </figcaption>
          </figure>
        </section>

        <section
          aria-labelledby="part-40-title"
          className={styles.partFeature}
          data-testid="part-40-feature"
          id="part-40"
        >
          <div className={styles.partCopy}>
            <p className={styles.darkEyebrow}>{part40.eyebrow}</p>
            <h2 id="part-40-title">{part40.heading}</h2>
            <p className={styles.partBody}>{part40.body}</p>
            <p className={styles.fitNote}>
              <strong>Good to know</strong>
              <span>{part40.compatibility}</span>
              <a href={contact.part40EmailHref}>{part40.supportPrompt}</a>
            </p>
            {livePart40 ? (
              <ReplacementPartPurchase
                product={{
                  categoryName: livePart40.product.category.name,
                  currency: livePart40.product.currency,
                  imageUrl: livePart40.imageUrl,
                  name: livePart40.product.name,
                  productKind: livePart40.product.productKind,
                  productSlug: livePart40.product.slug,
                  unitPriceCents: livePart40.product.priceCents
                }}
                shippingCopy={V1_FLAT_RATE_SHIPPING_COPY}
                supportHref={contact.part40EmailHref}
                supportPrompt={part40.supportPrompt}
              />
            ) : (
              <a className={styles.darkAction} href={contact.part40EmailHref}>
                Ask about Part 40
              </a>
            )}
          </div>
          <blockquote className={styles.partQuote}>
            <span aria-hidden="true">40</span>
            <p>{part40.punchline}</p>
          </blockquote>
        </section>

        <section
          aria-labelledby="part-identification-title"
          className={styles.identification}
          data-testid="part-identification"
        >
          <header className={styles.identificationHeader}>
            <p className={styles.orangeEyebrow}>{identification.eyebrow}</p>
            <div>
              <h2 id="part-identification-title">{identification.heading}</h2>
              <p>{identification.body}</p>
            </div>
          </header>
          <ol className={styles.identificationSteps}>
            {identification.items.map((item, index) => (
              <li key={item.heading}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{item.heading}</h3>
                  <p>{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="manuals-title"
          className={styles.manuals}
          data-testid="manuals-section"
          id="manuals"
        >
          <header className={styles.manualsHeader}>
            <p className={styles.lightEyebrow}>Manuals & setup</p>
            <h2 id="manuals-title">Find your table. Skip the guesswork.</h2>
            <p>
              Download the assembly guide, watch the setup video where one exists, and send us a
              photo if the diagram is not speaking your language.
            </p>
          </header>

          <div className={styles.manualGrid}>
            {manuals.map((manual, index) => (
              <article
                className={styles.manualCard}
                data-testid="manual-card"
                data-tone={String(index % 3)}
                key={manual.assetId}
              >
                <div className={styles.manualNumber}>{String(index + 1).padStart(2, "0")}</div>
                <div className={styles.manualCopy}>
                  <p>Table manual</p>
                  <h3>{manual.title}</h3>
                  <span>{manual.revision}</span>
                </div>
                <div className={styles.manualActions}>
                  <a
                    aria-label={`Download ${manual.title} manual PDF`}
                    className={styles.manualPrimaryAction}
                    download
                    href={manual.downloadUrl}
                  >
                    Download manual (PDF)
                  </a>
                  {manual.videoUrl ? (
                    <a
                      aria-label={`Watch ${manual.title} setup video on YouTube`}
                      className={styles.manualSecondaryAction}
                      href={manual.videoUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Watch setup video
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="parts-help-title"
          className={styles.help}
          data-testid="parts-help"
        >
          <div>
            <p className={styles.orangeEyebrow}>Good gear. Real help. No runaround.</p>
            <h2 id="parts-help-title">Need a hand?</h2>
            <p>
              Call or email us. You&apos;ll get a real person in Vancouver, and we&apos;ll get it
              sorted.
            </p>
          </div>
          <div className={styles.helpActions} aria-label="Contact Tiger PingPong">
            <a className={styles.primaryAction} href={contact.phoneHref}>
              Call {contact.phoneDisplay}
            </a>
            <a className={styles.lightAction} href={contact.generalPartsEmailHref}>
              Email {contact.email}
            </a>
          </div>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
