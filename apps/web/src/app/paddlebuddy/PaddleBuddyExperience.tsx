"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { createPaddleBuddySubmission, type PaddleBuddyIntent } from "../../lib/paddlebuddy-api";
import styles from "./page.module.css";

const galleryItems = [
  {
    label: "REAL CAPTURE — HOME / CONNECT SCREEN",
    src: "/paddlebuddy/paddlebuddy-home-connect.png",
    type: "phone"
  },
  {
    label: "REAL CAPTURE — DRILL SESSION",
    src: "/paddlebuddy/paddlebuddy-drill.png",
    type: "wide"
  },
  {
    label: "REAL CAPTURE — DRILL CATALOGUE",
    src: "/paddlebuddy/paddlebuddy-secondary.png",
    type: "video"
  },
  { label: "PLACEHOLDER — IPAD VIEW", type: "tablet" }
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
        has3050xl:
          form.get("has3050xl") === "yes" ? true : form.get("has3050xl") === "no" ? false : null,
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
          <p className={styles.heroPunchline}>We assumed we’d come up with a better name.</p>
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

        <div className={styles.heroPhoneArea} aria-label="Paddle Buddy app preview placeholder">
          <span className={`${styles.annotation} ${styles.projectAnnotation}`}>
            Project PB / 01
          </span>
          <span className={`${styles.annotation} ${styles.interfaceAnnotation}`}>
            Interface preview
          </span>
          <span className={`${styles.annotation} ${styles.nameAnnotation}`}>Name: provisional</span>
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
          <div className={styles.connectionMediaCaption}>
            <strong>Current Paddle Buddy connection loop</strong>
            <span>Real app simulator capture · no physical robot shown</span>
          </div>
        </div>
      </section>

      <section className={styles.story} aria-labelledby="story-title">
        <div>
          <p className={styles.sectionKicker}>A note on the working title</p>
          <h2 id="story-title">The name was supposed to be temporary.</h2>
        </div>
        <div className={styles.storyCopy}>
          <p>
            We needed something to call the project, so Paddle Buddy became the codename. It was
            supposed to be temporary.
          </p>
          <p>
            Then it ended up in the privacy policy. Then people started asking about it. Now people
            actually call us and say “Paddle Buddy” like that was always the plan.
          </p>
          <p>We still find that pretty funny.</p>
          <strong>At this point, the codename may be winning.</strong>
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
        <div className={styles.statusPanel}>
          <section className={styles.statusNow} aria-labelledby="status-now-title">
            <p className={styles.statusPhase}>Now</p>
            <div className={styles.statusNowContent}>
              <article>
                <p className={styles.statusMeta}>Working in development</p>
                <h3 id="status-now-title">Robot connection and drills</h3>
                <p>Current connection and drills are working in the development build.</p>
              </article>
              <article>
                <p className={styles.statusMeta}>Current focus</p>
                <h3>Enhancing reliability and drill experience</h3>
                <p>We’re refining reliability and the experience of getting into and running drills.</p>
              </article>
            </div>
          </section>
          <div className={styles.statusFuture}>
            <section aria-labelledby="status-building-title">
              <p className={styles.statusPhase}>Building</p>
              <p className={styles.statusMeta}>Active development</p>
              <h3 id="status-building-title">Warm-up system</h3>
              <p>A more guided way to start a practice session.</p>
            </section>
            <section aria-labelledby="status-early-title">
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
          <p className={styles.sectionKicker}>Future capture bay</p>
          <h2 id="gallery-title">A place for the real thing.</h2>
          <p>The structure is ready. The app captures are the next layer.</p>
        </header>
        <div className={styles.galleryGrid}>
          {galleryItems.map((item) => (
            <figure className={styles.galleryItem} data-type={item.type} key={item.label}>
              {"src" in item ? (
                <img alt="" className={styles.galleryCapture} src={item.src} />
              ) : (
                <div className={styles.galleryGhost} aria-hidden="true">
                  <span />
                </div>
              )}
              <figcaption>{item.label}</figcaption>
            </figure>
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
