import {
  tigerAquaProductStory,
  type TigerAquaProductMedia,
  type TigerStoryImage
} from "../../../../lib/tiger-story";

import styles from "./AquaProductExperience.module.css";

type AquaImage = TigerAquaProductMedia | TigerStoryImage;

function getImageSrc(image: AquaImage): string {
  return "finalUrl" in image ? image.finalUrl : image.src;
}

function AquaImage({
  className,
  image,
  loading = "lazy"
}: {
  className?: string;
  image: AquaImage;
  loading?: "eager" | "lazy";
}) {
  return (
    <img
      alt={image.altText}
      className={className}
      decoding="async"
      loading={loading}
      src={getImageSrc(image)}
    />
  );
}

export function AquaProductExperience() {
  const story = tigerAquaProductStory;

  return (
    <div className={styles.experience} data-aqua-story>
      <section className={styles.proofStrip} aria-label="Why Aqua works for real life">
        {story.proof.map((item, index) => (
          <article key={item.heading}>
            <span aria-hidden="true">0{index + 1}</span>
            <div>
              <h2>{item.heading}</h2>
              <p>{item.body}</p>
            </div>
          </article>
        ))}
        <img
          alt=""
          aria-hidden="true"
          className={styles.proofHalftone}
          src={story.accents.halftone.finalUrl}
        />
      </section>

      <section className={styles.whySection} id={story.why.anchor} aria-labelledby="why-aqua-title">
        <div className={styles.sectionCopy}>
          <p className={styles.eyebrow}>{story.why.eyebrow}</p>
          <h2 id="why-aqua-title">{story.why.heading}</h2>
          <p>{story.why.body}</p>
          <strong className={styles.pullLine}>{story.why.pullLine}</strong>
        </div>
        <figure className={styles.whyMedia}>
          <AquaImage image={story.why.image} />
          <img
            alt=""
            aria-hidden="true"
            className={styles.aquaWordmark}
            src={story.accents.wordmark.finalUrl}
          />
        </figure>
      </section>

      <section
        className={styles.designSection}
        id={story.design.anchor}
        aria-labelledby="aqua-design-title"
      >
        <div className={styles.designCopy}>
          <p className={styles.eyebrow}>{story.design.eyebrow}</p>
          <h2 id="aqua-design-title">{story.design.heading}</h2>
          <p>{story.design.body}</p>
        </div>

        <div className={styles.designMedia}>
          <figure className={styles.packagingPhoto}>
            <AquaImage image={story.design.packagingImage} />
            <figcaption>{story.design.caption}</figcaption>
          </figure>
        </div>
      </section>

      <section className={styles.closingBand} aria-labelledby="aqua-closing-title">
        <img
          alt=""
          aria-hidden="true"
          className={styles.closingHalftone}
          src={story.accents.halftone.finalUrl}
        />
        <div>
          <h2 id="aqua-closing-title">{story.closing.heading}</h2>
          <p>{story.closing.body}</p>
          <strong>{story.closing.signature}</strong>
        </div>
        <nav aria-label="Aqua purchase actions">
          {story.closing.actions.map((action, index) => (
            <a
              className={index === 0 ? styles.primaryAction : styles.secondaryAction}
              href={action.href}
              key={action.href}
            >
              {action.label}
            </a>
          ))}
        </nav>
      </section>
    </div>
  );
}
