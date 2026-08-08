import type { Metadata } from "next";

import { getPathMetadata } from "../../../lib/seo";
import { PublicStorefrontFooter } from "../../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../../PublicStorefrontNav";
import styles from "./page.module.css";

export const metadata: Metadata = getPathMetadata({
  title: "PaddleBuddy Privacy Policy | Tiger PingPong",
  description: "How information is handled when you use the PaddleBuddy mobile application.",
  pathname: "/paddlebuddy/privacy-policy"
});

export default function PaddleBuddyPrivacyPolicyPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="support" />
      <main className={styles.page}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>PaddleBuddy</p>
          <h1>PaddleBuddy Privacy Policy</h1>
          <p className={styles.effectiveDate}>Effective date: August 8, 2026</p>
          <p className={styles.intro}>
            Tiger PingPong (&quot;Tiger PingPong,&quot; &quot;we,&quot; &quot;us,&quot; or
            &quot;our&quot;) provides the PaddleBuddy mobile application. This Privacy Policy
            explains how information is handled when you use PaddleBuddy.
          </p>
          <p className={styles.intro}>
            PaddleBuddy is an independent application for controlling a compatible Robo-Pong 3050XL
            table-tennis robot and organizing recreational practice. PaddleBuddy is not affiliated
            with or endorsed by Newgy Industries, Inc.
          </p>
        </header>

        <article className={styles.policy} aria-label="PaddleBuddy privacy policy details">
          <section>
            <h2>Privacy at a glance</h2>
            <ul className={styles.summaryList}>
              <li>PaddleBuddy does not require an account.</li>
              <li>PaddleBuddy does not contain advertising.</li>
              <li>PaddleBuddy does not track you across apps or websites.</li>
              <li>PaddleBuddy does not use third-party analytics or advertising SDKs.</li>
              <li>
                PaddleBuddy does not automatically send your practice records, goals, feedback, or
                robot diagnostics to Tiger PingPong.
              </li>
              <li>
                App information is stored locally on your device unless you deliberately export and
                share it.
              </li>
            </ul>
          </section>

          <section>
            <h2>Information stored on your device</h2>
            <p>
              PaddleBuddy stores information locally so the app can provide its features. Depending
              on how you use the app, this may include:
            </p>
            <ul>
              <li>
                practice goals, focus areas, coaching preferences, schedules, and check-in notes;
              </li>
              <li>
                selected rallies, custom drills, practice-session templates, favourites, and
                training plans;
              </li>
              <li>
                practice history, including session dates, durations, drills, planned balls, sent
                balls, confirmed balls, and completion status;
              </li>
              <li>
                feedback you choose to enter, such as perceived effort, practice quality, energy,
                soreness, tightness, pain, or readiness choices;
              </li>
              <li>
                warm-up choices, Coach suggestions, and progress through optional learning or goal
                journeys;
              </li>
              <li>table-setup observations and robot calibration or configuration values;</li>
              <li>
                identifiers and descriptive information for a compatible robot, such as a locally
                remembered Bluetooth identifier or display name, firmware or interface information,
                connection state, and setup profile;
              </li>
              <li>
                technical records used to operate and troubleshoot the robot, including command
                timing, Bluetooth send/receive information, response status, reliability
                information, and bounded diagnostic transcripts; and
              </li>
              <li>app preferences and feature-state information.</li>
            </ul>
            <p>
              This information is used only to provide app features on your device, such as
              reconnecting to your robot, restoring your setup, showing practice history, generating
              optional Coach suggestions from choices you make, and diagnosing connection or run
              problems.
            </p>
            <p>
              PaddleBuddy does not use the information you enter to measure your technique or
              athletic performance, and it does not provide medical or health advice.
            </p>
          </section>

          <section>
            <h2>Bluetooth</h2>
            <p>
              PaddleBuddy requests Bluetooth access to discover, connect to, and communicate with a
              compatible Robo-Pong 3050XL robot. Bluetooth information is used for robot control,
              connection readiness, safety, recovery, setup, and diagnostics.
            </p>
            <p>
              PaddleBuddy does not use Bluetooth to determine your location, track your movements,
              or identify nearby people. The app does not automatically transmit Bluetooth
              information to Tiger PingPong.
            </p>
            <p>
              You can manage PaddleBuddy&apos;s Bluetooth permission in the iOS Settings app. If
              Bluetooth permission is disabled, robot connection and control features will not work.
            </p>
          </section>

          <section>
            <h2>Diagnostic exports and information you choose to share</h2>
            <p>
              PaddleBuddy can prepare a diagnostic file when you report a problem or choose to
              export diagnostics. Depending on your app usage, that file may contain practice
              records, goals and Coach choices, feedback, custom drills, robot setup information,
              firmware or interface information, command events, connection state, and Bluetooth
              send/receive transcripts.
            </p>
            <p>
              The diagnostic file remains on your device until you choose a destination using the
              iOS share sheet. PaddleBuddy does not automatically upload it. The recipient and
              service you select may process the file under their own privacy terms.
            </p>
            <p>
              Tiger PingPong receives a diagnostic file only if you choose to send it to us. If you
              do, we use it to respond to your request, investigate app or robot-connection
              behaviour, improve reliability, and protect the safety and integrity of the app.
              Please review a diagnostic file before sharing it and do not add personal information
              that is not needed for support.
            </p>
          </section>

          <section>
            <h2>Information Tiger PingPong receives</h2>
            <p>
              Tiger PingPong does not automatically collect information from PaddleBuddy. We may
              receive information when you voluntarily contact us, submit TestFlight feedback, or
              send a diagnostic file. This may include:
            </p>
            <ul>
              <li>your name, email address, and the content of your support message;</li>
              <li>screenshots, feedback, or other material you choose to provide;</li>
              <li>
                device, operating-system, app-version, crash, or usage information made available
                through Apple&apos;s TestFlight or App Store services; and
              </li>
              <li>the contents of a diagnostic file you deliberately share with us.</li>
            </ul>
            <p>
              We use this information only to provide support, administer beta testing, investigate
              problems, improve PaddleBuddy, maintain security and reliability, and comply with
              legal obligations.
            </p>
          </section>

          <section>
            <h2>TestFlight and Apple services</h2>
            <p>
              If you use a TestFlight version of PaddleBuddy, Apple operates the TestFlight service.
              Apple may process tester identifiers, contact information, usage information, crash
              information, diagnostics, and feedback under Apple&apos;s own terms and privacy
              policies. Tiger PingPong may receive information Apple makes available to developers
              for beta administration, support, and troubleshooting.
            </p>
            <p>
              Apple also processes information necessary to provide iOS, the App Store, Bluetooth
              permissions, crash reporting, and related platform services. Apple&apos;s handling of
              that information is governed by Apple&apos;s privacy policies, not this policy.
            </p>
          </section>

          <section>
            <h2>Sharing and service providers</h2>
            <p>
              We do not sell or rent information received through PaddleBuddy. We do not use it for
              third-party advertising or cross-app tracking.
            </p>
            <p>
              Information you send to us may be processed by providers that support our email,
              website hosting, file storage, and technical support. We provide these services only
              with information reasonably necessary for them to perform work for us, and we require
              appropriate protection of the information.
            </p>
            <p>
              We may disclose information if reasonably necessary to comply with law, respond to
              valid legal process, protect rights or safety, investigate fraud or security issues,
              or complete a business transaction subject to appropriate safeguards.
            </p>
          </section>

          <section>
            <h2>Retention</h2>
            <p>
              Information stored by PaddleBuddy remains on your device until you delete it, delete
              particular content using controls available in the app, or delete the app.
            </p>
            <p>
              Support communications and diagnostic files you choose to send to Tiger PingPong are
              retained only as long as reasonably necessary to respond to you, investigate and
              resolve the issue, maintain security and reliability records, and satisfy applicable
              legal obligations. When they are no longer needed, we delete or de-identify them where
              reasonably practicable.
            </p>
          </section>

          <section>
            <h2>Deleting information</h2>
            <p>
              You can delete individual custom drills and practice-session templates using the
              applicable controls in PaddleBuddy. To remove all PaddleBuddy information stored on an
              iPhone, delete PaddleBuddy from the device. Using Apple&apos;s{" "}
              <strong>Offload App</strong> option may retain app documents and data, so use{" "}
              <strong>Delete App</strong> when you intend to remove all local PaddleBuddy data.
            </p>
            <p>
              Deleting PaddleBuddy does not delete a diagnostic file that you previously copied to
              another location or shared with another recipient. You must delete those copies from
              their destination separately.
            </p>
            <p>
              To request access to, correction of, or deletion of information that you previously
              sent to Tiger PingPong, contact us using the information below. We may need to retain
              limited information where required for security, legal, accounting, or
              dispute-resolution purposes.
            </p>
          </section>

          <section>
            <h2>Security</h2>
            <p>
              PaddleBuddy relies on iOS protections for information stored in the app&apos;s
              container. We use reasonable administrative and technical safeguards for information
              you choose to send to us. No storage or transmission method can be guaranteed to be
              completely secure.
            </p>
          </section>

          <section>
            <h2>Children&apos;s privacy</h2>
            <p>
              PaddleBuddy does not require an account and does not automatically collect personal
              information from users, including children. The app is not designed to solicit
              personal information from children. If you believe a child has sent personal
              information to Tiger PingPong, contact us so we can review and delete it where
              appropriate.
            </p>
          </section>

          <section>
            <h2>International processing</h2>
            <p>
              Tiger PingPong is based in British Columbia, Canada. Information you choose to send to
              us may be processed in Canada and in other locations where our service providers
              operate, subject to applicable safeguards and legal requirements.
            </p>
          </section>

          <section>
            <h2>Your privacy rights</h2>
            <p>
              Depending on where you live, you may have rights to request access to, correction of,
              or deletion of personal information we hold about you, or to object to or restrict
              certain processing. You may submit a request using the contact information below. We
              may take reasonable steps to verify the request.
            </p>
          </section>

          <section>
            <h2>Website privacy</h2>
            <p>
              This policy applies to the PaddleBuddy app. If you visit{" "}
              <a href="https://tigerpingpong.ca">tigerpingpong.ca</a>, including a webpage that
              hosts this policy, the separate Tiger PingPong{" "}
              <a href="/privacy-policy">website privacy policy</a> applies to information processed
              through the website.
            </p>
          </section>

          <section>
            <h2>Changes to this policy</h2>
            <p>
              We may update this policy when PaddleBuddy&apos;s features or privacy practices
              change. We will post the revised policy with a new effective date. Material changes
              will be communicated in the app or through another appropriate channel when required.
            </p>
          </section>

          <section className={styles.contactSection}>
            <h2>Contact us</h2>
            <p>For privacy questions or requests, contact:</p>
            <address>
              <strong>Tiger PingPong</strong>
              <br />
              1644 S.E. Marine Drive
              <br />
              Vancouver, British Columbia, Canada
              <br />
              Email: <a href="mailto:info@tigerpingpong.com">info@tigerpingpong.com</a>
              <br />
              Phone: <a href="tel:+18885525259">1-888-552-5259</a>
              <br />
              Website: <a href="https://tigerpingpong.ca/contact">tigerpingpong.ca/contact</a>
            </address>
          </section>
        </article>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
