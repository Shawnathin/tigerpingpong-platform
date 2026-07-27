import Image from "next/image";
import { headers } from "next/headers";

import { getProducts } from "../../lib/catalog-api";
import { resolveLiveCuratedReplacementParts } from "../../lib/curated-replacement-parts";
import { getPathMetadata } from "../../lib/seo";
import { getV1ShippingMessage } from "../../lib/shipping";
import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import { ReplacementPartPurchase } from "./ReplacementPartPurchase";
import styles from "./page.module.css";
import { replacementPartsContent } from "./replacement-parts-content";

export const metadata = getPathMetadata({
  pathname: "/replacement-parts",
  title: "Replacement Parts & Manuals | Tiger PingPong",
  description:
    "Shop Tiger PingPong Part 40, a standard replacement net, and the Expo & Portland net upgrade system—or find manuals and real help in Vancouver."
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
  const { contact, hero, identification, manuals, part40, replacementNets } =
    replacementPartsContent;
  const liveReplacementParts = await loadLiveReplacementParts();
  const liveReplacementPartsBySlug = new Map(
    liveReplacementParts.map((part) => [part.configuration.slug, part] as const)
  );
  const livePart40 = liveReplacementPartsBySlug.get(part40.slug);

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
          </div>

          <nav
            aria-labelledby="parts-finder-title"
            className={styles.heroFinder}
            data-testid="parts-finder"
          >
            <p className={styles.heroFinderEyebrow}>{hero.finder.eyebrow}</p>
            <h2 id="parts-finder-title">{hero.finder.heading}</h2>
            <div className={styles.heroFinderLinks}>
              {hero.finder.items.map((item, index) => (
                <a aria-label={item.label} href={item.href} key={item.label}>
                  <span className={styles.heroFinderNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.heroFinderLinkCopy}>
                    <strong>{item.label}</strong>
                    <small>{item.body}</small>
                  </span>
                  <span aria-hidden="true" className={styles.heroFinderArrow}>
                    →
                  </span>
                </a>
              ))}
            </div>
          </nav>
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
                anchorId={livePart40.configuration.anchorId}
                confirmationLabel={livePart40.configuration.confirmationLabel}
                product={{
                  categoryName: livePart40.product.category.name,
                  currency: livePart40.product.currency,
                  imageUrl: livePart40.imageUrl,
                  name: livePart40.product.name,
                  productKey: livePart40.product.key,
                  productKind: livePart40.product.productKind,
                  productSlug: livePart40.product.slug,
                  unitPriceCents: livePart40.product.priceCents
                }}
                shippingCopy={getV1ShippingMessage(livePart40.product.priceCents)}
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
          aria-labelledby="replacement-nets-title"
          className={styles.netFinder}
          data-testid="replacement-nets-section"
          id="replacement-nets"
        >
          <header className={styles.netFinderHeader}>
            <p className={styles.orangeEyebrow}>{replacementNets.eyebrow}</p>
            <div>
              <h2 id="replacement-nets-title">{replacementNets.heading}</h2>
            </div>
          </header>

          <div className={styles.netGrid}>
            {replacementNets.items.map(({ configuration, image, supportHref }, index) => {
              const livePart = liveReplacementPartsBySlug.get(configuration.slug);
              const titleId = `${configuration.anchorId}-title`;

              return (
                <article
                  aria-labelledby={titleId}
                  className={styles.netCard}
                  data-testid="replacement-net-card"
                  data-tone={String(index)}
                  id={configuration.anchorId}
                  key={configuration.slug}
                >
                  <div className={styles.netImagePanel}>
                    <span>{configuration.cardLabel}</span>
                    <div className={styles.netImageFrame}>
                      <Image
                        alt={image.altText}
                        className={styles.netImage}
                        fill
                        sizes="(max-width: 820px) calc(100vw - 76px), 540px"
                        src={livePart?.imageUrl ?? image.finalUrl}
                        unoptimized
                      />
                    </div>
                  </div>

                  <div className={styles.netCardCopy}>
                    <p className={styles.netDescriptor}>{configuration.descriptor}</p>
                    <h3 id={titleId}>{configuration.heading}</h3>
                    <p className={styles.netBody}>{configuration.body}</p>

                    <div className={styles.netDetail}>
                      <strong>
                        {configuration.slug === "tiger-replacement-net" ? "Best when" : "Fits"}
                      </strong>
                      <p>{configuration.compatibility}</p>
                    </div>

                    <div className={styles.netIncluded}>
                      <strong>What&apos;s included</strong>
                      <ul>
                        {configuration.included.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      {configuration.notIncluded ? <p>{configuration.notIncluded}</p> : null}
                    </div>

                    {configuration.legacyNote ? (
                      <div className={styles.netLegacyNote}>
                        <strong>Replacing the older system?</strong>
                        <p>{configuration.legacyNote}</p>
                      </div>
                    ) : null}

                    {configuration.humanNote ? (
                      <p className={styles.netHumanNote}>{configuration.humanNote}</p>
                    ) : null}

                    {livePart ? (
                      <ReplacementPartPurchase
                        anchorId={configuration.anchorId}
                        confirmationLabel={configuration.confirmationLabel}
                        product={{
                          categoryName: livePart.product.category.name,
                          currency: livePart.product.currency,
                          imageUrl: livePart.imageUrl,
                          name: livePart.product.name,
                          productKey: livePart.product.key,
                          productKind: livePart.product.productKind,
                          productSlug: livePart.product.slug,
                          unitPriceCents: livePart.product.priceCents
                        }}
                        shippingCopy={getV1ShippingMessage(livePart.product.priceCents)}
                        supportHref={supportHref}
                        supportPrompt={configuration.supportPrompt}
                      />
                    ) : (
                      <a className={styles.netSupportAction} href={supportHref}>
                        {configuration.slug === "tiger-replacement-net"
                          ? "Ask about the replacement net"
                          : "Ask about the upgrade system"}
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <p className={styles.netClarification}>
            Starting with a bare tabletop?{" "}
            <a href="/catalog/products/tiger-net-post-set">
              The Net &amp; Post Set is a different product.
            </a>
          </p>
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
