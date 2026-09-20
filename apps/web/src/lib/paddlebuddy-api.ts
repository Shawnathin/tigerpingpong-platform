import { getCheckoutApiBaseUrl } from "./checkout-api";

export type PaddleBuddyIntent =
  | "follow_project"
  | "early_testing"
  | "question_support"
  | "bug_problem"
  | "feature_idea"
  | "other";

export interface PaddleBuddySubmissionInput {
  company: string;
  earlyTesting: boolean;
  email: string;
  has3050xl: "yes" | "no" | "not_yet" | "unanswered";
  intent: PaddleBuddyIntent;
  message: string;
  playingLevel: string;
  primaryDevice: "iphone" | "ipad" | "both" | "";
  wantsUpdates: boolean;
}

export class PaddleBuddyApiError extends Error {}

export async function createPaddleBuddySubmission(
  input: PaddleBuddySubmissionInput
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${getCheckoutApiBaseUrl()}/paddlebuddy/submissions`, {
      body: JSON.stringify(input),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });
  } catch {
    throw new PaddleBuddyApiError("We couldn’t send that just now. Please try again.");
  }
  if (response.ok) return;
  const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
  throw new PaddleBuddyApiError(
    typeof body?.message === "string"
      ? body.message
      : "We couldn’t send that just now. Please try again."
  );
}
