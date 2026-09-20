"use client";

import { FormEvent, type UIEvent, useEffect, useRef, useState } from "react";

import { createPaddleBuddySubmission, type PaddleBuddyIntent } from "../../lib/paddlebuddy-api";
import styles from "./page.module.css";

const galleryItems = [
  {
    alt: "Paddle Buddy's current connect screen",
    label: "Connect",
    src: "/paddlebuddy/paddlebuddy-home-connect.png"
  },
  {
    alt: "Paddle Buddy's drill session screen",
    label: "Run a drill",
    src: "/paddlebuddy/paddlebuddy-drill.png"
  },
  {
    alt: "Paddle Buddy's drill catalogue screen",
    label: "Browse drills",
    src: "/paddlebuddy/paddlebuddy-secondary.png"
  }
] as const;

const faqs = [
  {
    answer: "Not publicly. We’re still developing and testing it.",
    question: "Is Paddle Buddy available yet?"
  },
  {
    answer: "The current project is being developed around the Robo-Pong 3050XL.",
    question: "What robot is it being developed for?"
  },
  {
    answer:
      "We’ll invite small groups of testers as the build is ready for broader use. Use the Paddle Buddy form if you want to hear about testing opportunities.",
    question: "Can I test it?"
  },
  {
    answer: "Pricing and release details will be shared when they’re ready.",
    question: "What will it cost?"
  },
  {
    answer:
      "No. Paddle Buddy is an independent Tiger PingPong side project and is not affiliated with or endorsed by Newgy.",
    question: "Is Paddle Buddy made by Newgy?"
  },
  {
    answer:
      "Use the Paddle Buddy email/contact route on this page. Phone support is reserved for Tiger PingPong product enquiries.",
    question: "How do I get support?"
  }
] as const;

export function PaddleBuddyExperience() {
  const connectionVideoRef = useRef<HTMLVideoElement>(null);
  const galleryItemRefs = useRef<Array<HTMLElement | null>>([]);
  const roadmapBallRef = useRef<HTMLSpanElement>(null);
  const roadmapPanelRef = useRef<HTMLDivElement>(null);
  const [activeGallerySlide, setActiveGallerySlide] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<PaddleBuddyIntent>("follow_project");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      const video = connectionVideoRef.current;
      if (!video) return;
      if (preference.matches) {
        video.pause();
      } else {
        void video.play().catch(() => undefined);
      }
    };
    updateMotion();
    preference.addEventListener("change", updateMotion);
    return () => preference.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    const panel = roadmapPanelRef.current;
    const ball = roadmapBallRef.current;
    if (!panel || !ball) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileLayout = window.matchMedia("(max-width: 620px)");
    let hasPlayed = false;

    const getStops = () => {
      const stopNames = mobileLayout.matches
        ? ["working", "focus", "building", "early"]
        : ["working", "focus", "building"];
      const panelBounds = panel.getBoundingClientRect();

      return stopNames.flatMap((stopName) => {
        const anchor = panel.querySelector<HTMLElement>(`[data-roadmap-stop="${stopName}"]`);
        if (!anchor) return [];
        const bounds = anchor.getBoundingClientRect();
        return [
          {
            x: Math.min(bounds.right - panelBounds.left - 30, panelBounds.width - 30),
            y: bounds.top - panelBounds.top + Math.min(bounds.height * 0.42, 54)
          }
        ];
      });
    };

    const placeAtFinalStop = () => {
      const finalStop = getStops().at(-1);
      if (!finalStop) return;
      ball.style.opacity = "1";
      ball.style.transform = `translate(${finalStop.x}px, ${finalStop.y}px)`;
    };

    const playRoadmap = async () => {
      if (hasPlayed) return;
      hasPlayed = true;
      const stops = getStops();
      if (!stops.length) return;
      if (reducedMotion.matches) {
        placeAtFinalStop();
        return;
      }

      let previous = { x: stops[0].x - 66, y: stops[0].y - 38 };
      ball.style.opacity = "1";
      ball.style.transform = `translate(${previous.x}px, ${previous.y}px)`;
      for (const stop of stops) {
        const peak = { x: stop.x, y: stop.y - 24 };
        try {
          await ball
            .animate(
              [
                { transform: `translate(${previous.x}px, ${previous.y}px)` },
                { offset: 0.62, transform: `translate(${peak.x}px, ${peak.y}px)` },
                { transform: `translate(${stop.x}px, ${stop.y}px)` }
              ],
              { duration: 390, easing: "cubic-bezier(.22,.8,.25,1)", fill: "forwards" }
            )
            .finished;
        } catch {
          return;
        }
        previous = stop;
      }
      ball.style.transform = `translate(${previous.x}px, ${previous.y}px)`;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        void playRoadmap();
        observer.disconnect();
      },
      { threshold: 0.35 }
    );
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  function handleGalleryScroll(event: UIEvent<HTMLDivElement>) {
    const gallery = event.currentTarget;
    const firstItem = galleryItemRefs.current[0];
    if (!firstItem) return;
    const gap = Number.parseFloat(window.getComputedStyle(gallery).gap) || 0;
    const nextSlide = Math.round(gallery.scrollLeft / (firstItem.clientWidth + gap));
    setActiveGallerySlide(Math.min(Math.max(nextSlide, 0), galleryItems.length - 1));
  }

  function scrollToGallerySlide(index: number) {
    galleryItemRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }

  async function handleSubmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = String(form.get("message") ?? "").trim();
    if (["question_support", "bug_problem", "feature_idea", "other"].includes(intent) && !message) {
      setError("Please include a message so we know how to help.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createPaddleBuddySubmission({
        company: String(form.get("company") ?? ""),
        earlyTesting: form.get("earlyTesting") === "on",
        email: String(form.get("email") ?? ""),
        has3050xl: (
          String(form.get("has3050xl") ?? "") || "unanswered"
        ) as "yes" | "no" | "not_yet" | "unanswered",
        intent,
        message,
        playingLevel: String(form.get("playingLevel") ?? ""),
        primaryDevice: String(form.get("primaryDevice") ?? "") as "iphone" | "ipad" | "both" | "",
        wantsUpdates: form.get("wantsUpdates") === "on"
      });
      setSubmitted(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.experience}>
      <section className={styles.hero} aria-labelledby="paddlebuddy-title">
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <h1 id="paddlebuddy-title">
            <span>Codename:</span>
            Paddle Buddy.
          </h1>
          <p className={styles.heroBody}>
            We’re building an independent app for the Robo-Pong 3050XL, with a simpler way to
            connect, run drills and get on with playing.
          </p>
          <div className={styles.heroActions} aria-label="Paddle Buddy actions">
            <a className={styles.primaryAction} href="#development-list">
              Join the development list
            </a>
            <a className={styles.secondaryAction} href="#development-status">
              See what’s working <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className={styles.heroPhoneArea} aria-label="Paddle Buddy app preview">
          <div className={styles.phone}>
            <img
              alt="Paddle Buddy home and connect screen in the iPhone simulator"
              className={styles.phoneCapture}
              src="/paddlebuddy/paddlebuddy-home-connect.png"
            />
          </div>
          <div className={styles.orbit} aria-hidden="true">
            <span className={styles.ball} />
          </div>
        </div>
      </section>

      <section className={styles.connection} aria-labelledby="connection-title">
        <div className={styles.connectionCopy}>
          <h2 id="connection-title">Less setup. More PingPong.</h2>
          <p>
            One tap to start connecting. Your drills close by. Less getting in the way of practice.
          </p>
          <p className={styles.disclosure}>Development build preview.</p>
        </div>
        <div className={styles.connectionMedia} aria-label="Paddle Buddy connection capture">
          <video
            aria-label="Paddle Buddy connection interaction in the current app simulator"
            autoPlay
            className={styles.connectionVideo}
            loop
            muted
            playsInline
            poster="/paddlebuddy/paddlebuddy-connected-still.png"
            ref={connectionVideoRef}
          >
            <source src="/paddlebuddy/paddlebuddy-connect-loop.webm" type="video/webm" />
            <source src="/paddlebuddy/paddlebuddy-connect-loop.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      <section className={styles.story} aria-labelledby="story-title">
        <div>
          <h2 id="story-title">The name was supposed to be temporary.</h2>
        </div>
        <div className={styles.storyCopy}>
          <p>
            We needed something to call the project, so Paddle Buddy became the codename. It was
            supposed to be temporary.
          </p>
          <p>
            Then it ended up in some documentation, and people started asking about it. Now people
            actually call us and say “Paddle Buddy” like that was always the plan. We still think
            that’s pretty funny.
          </p>
          <strong>At this point, the codename may be winning.</strong>
          <a className={styles.storyPrompt} href="#development-list">
            Got a better idea? Send it our way.
          </a>
        </div>
      </section>

      <section className={styles.status} id="development-status" aria-labelledby="status-title">
        <header className={styles.statusHeader}>
          <p className={styles.sectionKicker}>Public development board</p>
          <h2 id="status-title">Here’s where we’re at.</h2>
          <p>
            The current development build connects to the robot and runs drills. We’re refining that
            experience before bringing more people in.
          </p>
        </header>
        <div className={styles.statusPanel} ref={roadmapPanelRef}>
          <span
            aria-hidden="true"
            className={styles.roadmapBall}
            data-roadmap-ball
            ref={roadmapBallRef}
          />
          <section className={styles.statusNow} aria-labelledby="status-now-title">
            <p className={styles.statusPhase}>Now</p>
            <div className={styles.statusNowContent}>
              <article data-roadmap-stop="working">
                <p className={styles.statusMeta}>Working in development</p>
                <h3 id="status-now-title">Robot connection and drills</h3>
                <p>Current connection and drills are working in the development build.</p>
              </article>
              <article data-roadmap-stop="focus">
                <p className={styles.statusMeta}>Current focus</p>
                <h3>Enhancing reliability and drill experience</h3>
                <p>We’re refining reliability and the experience of getting into and running drills.</p>
              </article>
            </div>
          </section>
          <div className={styles.statusFuture}>
            <section aria-labelledby="status-building-title" data-roadmap-stop="building">
              <p className={styles.statusPhase}>Building</p>
              <p className={styles.statusMeta}>Active development</p>
              <h3 id="status-building-title">Warm-up system</h3>
              <p>A more guided way to start a practice session.</p>
            </section>
            <section aria-labelledby="status-early-title" data-roadmap-stop="early">
              <p className={styles.statusPhase}>Early</p>
              <p className={styles.statusMeta}>Very early development</p>
              <h3 id="status-early-title">Smart Progression</h3>
              <p>
                An adaptive layer being explored to help shape future practice suggestions over
                time.
              </p>
            </section>
          </div>
        </div>
        <p className={styles.statusDisclaimer}>
          No release dates here — just what’s working and what we’re building.
        </p>
      </section>

      <section className={styles.gallery} aria-labelledby="gallery-title">
        <header>
          <p className={styles.sectionKicker}>Current app</p>
          <h2 id="gallery-title">Okay, here’s the actual thing.</h2>
          <p>Real screens from the current development build.</p>
        </header>
        <div className={styles.galleryGrid} data-current-app-gallery onScroll={handleGalleryScroll}>
          {galleryItems.map((item, index) => (
            <figure
              className={styles.galleryItem}
              key={item.label}
              ref={(element) => {
                galleryItemRefs.current[index] = element;
              }}
            >
              <img alt={item.alt} className={styles.galleryCapture} src={item.src} />
              <figcaption>{item.label}</figcaption>
            </figure>
          ))}
        </div>
        <div
          aria-label="Current app screens"
          className={styles.galleryPagination}
          data-current-app-pagination
        >
          {galleryItems.map((item, index) => (
            <button
              aria-current={activeGallerySlide === index ? "true" : undefined}
              aria-label={`Show ${item.label}`}
              className={activeGallerySlide === index ? styles.galleryPaginationActive : undefined}
              key={item.label}
              onClick={() => scrollToGallerySlide(index)}
              type="button"
            />
          ))}
        </div>
      </section>

      <section className={styles.signup} id="development-list" aria-labelledby="signup-title">
        <div className={styles.signupIntro}>
          <p className={styles.sectionKicker}>Paddle Buddy contact</p>
          <h2 id="signup-title">Let’s get connected.</h2>
          <p>
            Follow the project, ask a question, report a problem or tell us what would make your
            next practice better.
          </p>
          <p>App questions stay here. Tiger’s phone line is for Tiger product enquiries.</p>
        </div>
        <form className={styles.signupForm} onSubmit={handleSubmission}>
          {submitted ? (
            <div className={styles.localSuccess} role="status">
              <strong>Thanks. Your Paddle Buddy note is in.</strong>
              <span>{"We’ll use your update preference exactly as you chose it."}</span>
            </div>
          ) : (
            <>
              <label className={styles.honeypot} aria-hidden="true">
                <span>Company</span>
                <input autoComplete="off" name="company" tabIndex={-1} type="text" />
              </label>
              <label>
                <span>
                  Email address <em>Required</em>
                </span>
                <input autoComplete="email" name="email" required type="email" />
              </label>
              <label>
                <span>
                  What brings you here? <em>Required</em>
                </span>
                <select
                  value={intent}
                  onChange={(event) => setIntent(event.target.value as PaddleBuddyIntent)}
                >
                  <option value="follow_project">Follow the project</option>
                  <option value="early_testing">Early testing</option>
                  <option value="question_support">Question / support</option>
                  <option value="bug_problem">Bug / problem</option>
                  <option value="feature_idea">Feature idea</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                <span>
                  Message{" "}
                  {["question_support", "bug_problem", "feature_idea", "other"].includes(intent) ? (
                    <em>Required</em>
                  ) : (
                    <em>Optional</em>
                  )}
                </span>
                <textarea name="message" placeholder="What would you like us to know?" rows={4} />
              </label>
              <label className={styles.checkboxLabel}>
                <input name="wantsUpdates" type="checkbox" />
                <span>Send me Paddle Buddy development, beta and launch updates.</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input name="earlyTesting" type="checkbox" />
                <span>I’m interested in testing early builds.</span>
              </label>
              <details className={styles.moreDetails}>
                <summary>
                  Tell us a little more <span aria-hidden="true">+</span>
                </summary>
                <div>
                  <label>
                    <span>Do you currently have access to a Robo-Pong 3050XL?</span>
                    <select defaultValue="" name="has3050xl">
                      <option disabled value="">
                        Choose one
                      </option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="not_yet">Not yet</option>
                    </select>
                  </label>
                  <label>
                    <span>Would you primarily use iPhone or iPad?</span>
                    <select defaultValue="" name="primaryDevice">
                      <option disabled value="">
                        Choose one
                      </option>
                      <option value="iphone">iPhone</option>
                      <option value="ipad">iPad</option>
                      <option value="both">Both</option>
                    </select>
                  </label>
                  <label>
                    <span>Playing experience / level</span>
                    <input name="playingLevel" placeholder="Optional" type="text" />
                  </label>
                </div>
              </details>
              {error ? (
                <p className={styles.formError} role="alert">
                  {error}
                </p>
              ) : null}
              <button className={styles.primaryAction} disabled={submitting} type="submit">
                {submitting ? "Sending…" : "Send to Paddle Buddy"}
              </button>
              <p className={styles.formFinePrint}>
                Updates are opt-in. Sending a question does not subscribe you to project emails.{" "}
                <a href="/privacy-policy">Tiger PingPong privacy policy</a>
              </p>
            </>
          )}
        </form>
      </section>

      <section className={styles.faq} aria-labelledby="faq-title">
        <header>
          <p className={styles.sectionKicker}>A few useful answers</p>
          <h2 id="faq-title">Before you ask.</h2>
        </header>
        <div className={styles.faqList}>
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>
                {faq.question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
        <p className={styles.privacyLink}>
          Looking for the app’s data details? Read the existing{" "}
          <a href="/paddlebuddy/privacy-policy">Paddle Buddy privacy policy</a>.
        </p>
      </section>
    </div>
  );
}
