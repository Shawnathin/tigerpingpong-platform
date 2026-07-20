import Image from "next/image";

import { getPathMetadata } from "../../lib/seo";
import { tigerStory, type TigerStoryImage } from "../../lib/tiger-story";
import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import styles from "./page.module.css";

export const metadata = getPathMetadata({
  pathname: "/about",
  title: "About Tiger PingPong | Raised on the West Coast",
  description:
    "From questionable first tables and Vancouver game nights to German-made gear shipped across Canada: meet Tiger PingPong."
});

function StoryFigure({
  className,
  image,
  sizes
}: {
  className: string;
  image: TigerStoryImage;
  sizes: string;
}) {
  return (
    <figure className={`${styles.storyFigure} ${className}`}>
      <div className={styles.storyImageFrame}>
        <Image
          alt={image.altText}
          className={styles.storyImage}
          fill
          sizes={sizes}
          src={image.finalUrl}
          unoptimized={image.displayMaxWidth !== undefined}
        />
      </div>
      <figcaption>{image.caption}</figcaption>
    </figure>
  );
}

export default function AboutPage() {
  const { hero, earlyDays, origin, vancouver, outdoor, manufacturing, names, roadshow, closing } =
    tigerStory;

  return (
    <>
      <PublicStorefrontNav activeItem="support" />
      <main className={styles.page}>
        <section
          className={styles.hero}
          id={hero.anchor}
          aria-labelledby="about-title"
          data-testid="about-current-hero"
        >
          <Image
            alt={hero.image.altText}
            className={styles.heroImage}
            fill
            priority
            sizes="(max-width: 820px) 100vw, 1440px"
            src={hero.image.finalUrl}
          />
          <div className={styles.heroScrim} aria-hidden="true" />
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>{hero.eyebrow}</p>
            <h1 id="about-title">{hero.heading}</h1>
            <p className={styles.heroBody}>{hero.body}</p>
          </div>
          <p className={styles.heroCaption}>{hero.image.caption}</p>
          <a className={styles.heroBridge} href={`#${earlyDays.anchor}`}>
            <span>{hero.bridge}</span>
            <span className={styles.bridgeBall} aria-hidden="true" />
          </a>
        </section>

        <section
          className={`${styles.earlyDays} ${styles.storySection}`}
          id={earlyDays.anchor}
          aria-labelledby="early-days-title"
        >
          <div className={styles.earlyDaysGrid}>
            <header className={styles.chapterCopy}>
              <p className={styles.eyebrow}>{earlyDays.eyebrow}</p>
              <h2 id="early-days-title">{earlyDays.heading}</h2>
              <p>{earlyDays.body}</p>
            </header>
            <div className={styles.earlyDaysGallery}>
              <StoryFigure
                className={`${styles.earlyTable} ${styles.reveal}`}
                image={earlyDays.images[0]}
                sizes="(max-width: 900px) 94vw, 42vw"
              />
              <StoryFigure
                className={`${styles.earlyNightlife} ${styles.reveal}`}
                image={earlyDays.images[1]}
                sizes="(max-width: 900px) 94vw, 30vw"
              />
            </div>
          </div>
        </section>

        <section
          className={`${styles.origin} ${styles.storySection}`}
          id={origin.anchor}
          aria-labelledby="origin-title"
        >
          <div className={styles.originGrid}>
            <header className={`${styles.chapterCopy} ${styles.stickyCopy}`}>
              <p className={styles.eyebrow}>{origin.eyebrow}</p>
              <h2 id="origin-title">{origin.heading}</h2>
              <p>{origin.body}</p>
            </header>
            <div className={styles.originGallery}>
              <StoryFigure
                className={`${styles.originPrimary} ${styles.reveal}`}
                image={origin.images[0]}
                sizes="(max-width: 900px) 94vw, 62vw"
              />
              <StoryFigure
                className={`${styles.originSecondary} ${styles.reveal}`}
                image={origin.images[1]}
                sizes="(max-width: 900px) 72vw, 34vw"
              />
            </div>
          </div>
        </section>

        <section
          className={`${styles.vancouver} ${styles.storySection}`}
          id={vancouver.anchor}
          aria-labelledby="vancouver-title"
        >
          <header className={styles.vancouverHeader}>
            <p className={styles.eyebrow}>{vancouver.eyebrow}</p>
            <h2 id="vancouver-title">{vancouver.heading}</h2>
            <p>{vancouver.body}</p>
          </header>
          <div className={styles.vancouverPhotoField}>
            <StoryFigure
              className={`${styles.foodCartPhoto} ${styles.reveal}`}
              image={vancouver.images[0]}
              sizes="(max-width: 900px) 94vw, 58vw"
            />
            <StoryFigure
              className={`${styles.connectionPhoto} ${styles.reveal}`}
              image={vancouver.images[1]}
              sizes="(max-width: 900px) 78vw, 34vw"
            />
            <StoryFigure
              className={`${styles.ubcPhoto} ${styles.reveal}`}
              image={vancouver.images[2]}
              sizes="(max-width: 900px) 88vw, 42vw"
            />
            <StoryFigure
              className={`${styles.whistlerPhoto} ${styles.reveal}`}
              image={vancouver.images[3]}
              sizes="(max-width: 900px) 88vw, 44vw"
            />
          </div>
          <blockquote>{vancouver.pullLine}</blockquote>
        </section>

        <section className={`${styles.outdoor} ${styles.reveal}`} aria-labelledby="outdoor-title">
          <div className={styles.outdoorBalls} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className={styles.outdoorCopy}>
            <p className={styles.outdoorEyebrow}>{outdoor.eyebrow}</p>
            <h2 id="outdoor-title">{outdoor.heading}</h2>
            <p>{outdoor.body}</p>
          </div>
        </section>

        <section
          className={`${styles.manufacturing} ${styles.storySection}`}
          id={manufacturing.anchor}
          aria-labelledby="manufacturing-title"
        >
          <div className={styles.manufacturingGrid}>
            <header className={`${styles.chapterCopy} ${styles.stickyCopy}`}>
              <p className={styles.darkEyebrow}>{manufacturing.eyebrow}</p>
              <h2 id="manufacturing-title">{manufacturing.heading}</h2>
              <p>{manufacturing.body}</p>
              <strong>{manufacturing.closingLine}</strong>
            </header>
            <div className={styles.manufacturingGallery}>
              <StoryFigure
                className={`${styles.prototypePhoto} ${styles.reveal}`}
                image={manufacturing.images[0]}
                sizes="(max-width: 900px) 88vw, 36vw"
              />
              <StoryFigure
                className={`${styles.factoryPhoto} ${styles.reveal}`}
                image={manufacturing.images[1]}
                sizes="(max-width: 900px) 94vw, 54vw"
              />
            </div>
          </div>
        </section>

        <section
          className={`${styles.names} ${styles.storySection}`}
          id={names.anchor}
          aria-labelledby="names-title"
        >
          <header className={styles.namesHeader}>
            <p className={styles.eyebrow}>{names.eyebrow}</p>
            <h2 id="names-title">{names.heading}</h2>
            <p>{names.intro}</p>
          </header>
          <div className={styles.nameScenes}>
            {names.stories.map((story, index) => (
              <article
                className={`${styles.nameScene} ${styles.reveal}`}
                data-name={story.id}
                key={story.id}
              >
                <div className={styles.nameTitle}>
                  <span aria-hidden="true">0{index + 1}</span>
                  <h3>{story.name}</h3>
                </div>
                <div className={styles.nameCopy}>
                  <p>{story.body}</p>
                  <a href={story.href}>{story.cta}</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className={`${styles.roadshow} ${styles.storySection}`}
          id={roadshow.anchor}
          aria-labelledby="roadshow-title"
        >
          <header className={styles.roadshowHeader}>
            <p className={styles.eyebrow}>{roadshow.eyebrow}</p>
            <h2 id="roadshow-title">{roadshow.heading}</h2>
            <p>{roadshow.body}</p>
          </header>
          <div className={styles.roadTrack}>
            <div className={styles.roadLine} aria-hidden="true" />
            {roadshow.images.map((image, index) => (
              <div className={`${styles.roadStop} ${styles.reveal}`} key={image.assetId}>
                <span className={styles.roadBall} aria-hidden="true">
                  {index + 1}
                </span>
                <StoryFigure
                  className={styles.roadFigure}
                  image={image}
                  sizes="(max-width: 900px) 84vw, 30vw"
                />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <div className={styles.closingCopy}>
            <p className={styles.eyebrow}>Still us</p>
            <h2 id="closing-title">{closing.heading}</h2>
            <p>{closing.body}</p>
            <strong>{closing.signature}</strong>
          </div>
          <div className={styles.closingActions} aria-label="About page next steps">
            {closing.actions.map((action, index) => (
              <a
                className={index === 0 ? styles.primaryAction : styles.secondaryAction}
                href={action.href}
                key={action.href}
              >
                {action.label}
              </a>
            ))}
          </div>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
