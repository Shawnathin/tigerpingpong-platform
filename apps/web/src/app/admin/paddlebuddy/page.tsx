import type { Metadata } from "next";

import {
  getAdminPaddleBuddySubmissions,
  type AdminPaddleBuddySubmission,
  type AdminPaddleBuddySubmissionsResponse,
  type PaddleBuddyFeedbackState
} from "../../../lib/admin-api";
import { formatDateTime, formatNullable, formatStatus } from "../admin-format";
import styles from "../admin.module.css";
import { updatePaddleBuddyFeedbackState } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paddle Buddy | Tiger Ping Pong Admin",
  description: "Protected Paddle Buddy feedback and beta-candidate queue."
};

const FEEDBACK_STATES: PaddleBuddyFeedbackState[] = [
  "new",
  "reviewing",
  "considering",
  "planned",
  "shipped"
];

interface PaddleBuddyResource {
  data: AdminPaddleBuddySubmissionsResponse | null;
}

async function loadSubmissions(): Promise<PaddleBuddyResource> {
  try {
    return { data: await getAdminPaddleBuddySubmissions() };
  } catch {
    return { data: null };
  }
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function renderSubmissionsTable(submissions: AdminPaddleBuddySubmission[]) {
  if (submissions.length === 0) {
    return <p className={styles.emptyText}>No Paddle Buddy submissions yet.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Received</th>
            <th>Contact</th>
            <th>Intent / message</th>
            <th>Tester fit</th>
            <th>Updates</th>
            <th>Feedback state</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.id}>
              <td>{formatDateTime(submission.createdAt)}</td>
              <td>{submission.email}</td>
              <td>
                <strong>{formatStatus(submission.intent)}</strong>
                {submission.message ? (
                  <div className={styles.messagePreview}>{submission.message}</div>
                ) : null}
              </td>
              <td>
                <div>3050XL: {formatStatus(submission.has3050xl)}</div>
                <div>Early test: {yesNo(submission.earlyTesting)}</div>
                <div>Device: {formatNullable(submission.primaryDevice)}</div>
                <div>Level: {formatNullable(submission.playingLevel)}</div>
              </td>
              <td>{yesNo(submission.wantsUpdates)}</td>
              <td>
                <form action={updatePaddleBuddyFeedbackState} className={styles.inlineForm}>
                  <input name="submissionId" type="hidden" value={submission.id} />
                  <select
                    aria-label={`Feedback state for ${submission.email}`}
                    defaultValue={submission.feedbackState}
                    name="feedbackState"
                  >
                    {FEEDBACK_STATES.map((state) => (
                      <option key={state} value={state}>
                        {formatStatus(state)}
                      </option>
                    ))}
                  </select>
                  <button className={styles.secondaryButton} type="submit">
                    Save
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PaddleBuddyAdminPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ status }, resource] = await Promise.all([searchParams, loadSubmissions()]);
  const submissions = resource.data;

  return (
    <div className={styles.pageStack}>
      <section className={styles.pageHeader} aria-labelledby="admin-paddlebuddy-title">
        <p className={styles.eyebrow}>Community rollout</p>
        <h1 className={styles.title} id="admin-paddlebuddy-title">
          Paddle Buddy queue
        </h1>
        <p className={styles.intro}>
          Intake stays in Tiger admin. Update consent is separate from support and tester interest.
        </p>
      </section>

      {status === "saved" ? (
        <div className={styles.success}>
          <p>Feedback state saved.</p>
        </div>
      ) : null}
      {status === "error" ? (
        <div className={styles.alert}>
          <p>Could not save that state. Try again.</p>
        </div>
      ) : null}

      {!submissions ? (
        <section className={styles.alert}>
          <p>Paddle Buddy submissions could not be loaded. Try again.</p>
        </section>
      ) : (
        <>
          <section className={styles.metricGrid} aria-label="Paddle Buddy intake digest">
            <div className={styles.metricCard}>
              <span>Submissions</span>
              <strong>{submissions.count}</strong>
            </div>
            <div className={styles.metricCard}>
              <span>Updates opt-in</span>
              <strong>{submissions.digest.updateOptInCount}</strong>
            </div>
            <div className={styles.metricCard}>
              <span>Early testing</span>
              <strong>{submissions.digest.earlyTestingCount}</strong>
            </div>
            <div className={styles.metricCard}>
              <span>3050XL access</span>
              <strong>{submissions.digest.robotAccessCount}</strong>
            </div>
          </section>
          <section className={styles.panel} aria-labelledby="admin-paddlebuddy-list-title">
            <div className={styles.panelHeader}>
              <div>
                <h2 id="admin-paddlebuddy-list-title">Feedback and tester candidates</h2>
                <p>Use states as operating labels, not public product promises.</p>
              </div>
            </div>
            {renderSubmissionsTable(submissions.items)}
          </section>
        </>
      )}
    </div>
  );
}
