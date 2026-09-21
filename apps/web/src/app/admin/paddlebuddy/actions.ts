"use server";

import { redirect } from "next/navigation";

import {
  type PaddleBuddyFeedbackState,
  updateAdminPaddleBuddySubmission
} from "../../../lib/admin-api";

const FEEDBACK_STATES = new Set<PaddleBuddyFeedbackState>([
  "new",
  "reviewing",
  "considering",
  "planned",
  "shipped"
]);

export async function updatePaddleBuddyFeedbackState(formData: FormData): Promise<void> {
  const submissionId = readRequiredString(formData, "submissionId");
  const feedbackState = readFeedbackState(formData);
  let status = "saved";

  try {
    await updateAdminPaddleBuddySubmission(submissionId, feedbackState);
  } catch {
    status = "error";
  }

  redirect(`/admin/paddlebuddy?status=${status}`);
}

function readRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required.`);
  return value.trim();
}

function readFeedbackState(formData: FormData): PaddleBuddyFeedbackState {
  const value = readRequiredString(formData, "feedbackState") as PaddleBuddyFeedbackState;
  if (!FEEDBACK_STATES.has(value)) throw new Error("feedbackState is invalid.");
  return value;
}
