import { BadRequestException, Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { createDatabaseConfig, PrismaClient } from "@tigerpingpong/db";

import { getOrderEmailConfig, getPaddleBuddyNotificationRecipient } from "../config";

const INTENTS = [
  "follow_project",
  "early_testing",
  "question_support",
  "bug_problem",
  "feature_idea",
  "other"
] as const;
type PaddleBuddyIntent = (typeof INTENTS)[number];
const MESSAGE_REQUIRED_INTENTS = new Set<PaddleBuddyIntent>([
  "question_support",
  "bug_problem",
  "feature_idea",
  "other"
]);
const MAX_MESSAGE_LENGTH = 4000;
const MAX_PLAYING_LEVEL_LENGTH = 160;
const MAX_HONEYPOT_LENGTH = 200;
const SOURCE_PAGE = "/paddlebuddy";

interface SubmissionInput {
  email: string;
  earlyTesting: boolean;
  has3050xl: boolean | null;
  intent: PaddleBuddyIntent;
  message: string | null;
  playingLevel: string | null;
  primaryDevice: "iphone" | "ipad" | "both" | null;
  wantsUpdates: boolean;
}

@Injectable()
export class PaddleBuddyService implements OnModuleDestroy {
  private readonly logger = new Logger(PaddleBuddyService.name);
  private prisma: PrismaClient | null = null;

  async onModuleDestroy(): Promise<void> {
    await this.prisma?.$disconnect();
  }

  async createSubmission(body: unknown): Promise<{ accepted: true }> {
    const input = validatePaddleBuddySubmission(body);
    const submission = await this.getPrisma().paddleBuddySubmission.create({
      data: { ...input, sourcePage: SOURCE_PAGE }
    });

    if (this.requiresStaffNotification(input)) {
      await this.notifyStaff(submission.id, input).catch(() => {
        this.logger.warn("Paddle Buddy notification could not be sent after durable storage.");
      });
    }

    return { accepted: true };
  }

  private requiresStaffNotification(input: SubmissionInput): boolean {
    return MESSAGE_REQUIRED_INTENTS.has(input.intent) || Boolean(input.message);
  }

  private async notifyStaff(submissionId: string, input: SubmissionInput): Promise<void> {
    const now = new Date();
    const recipient = getPaddleBuddyNotificationRecipient();
    if (!recipient) {
      await this.updateNotificationFailure(
        submissionId,
        now,
        "Paddle Buddy notification email is not configured."
      );
      return;
    }

    try {
      const config = getOrderEmailConfig();
      const response = await fetch("https://api.resend.com/emails", {
        body: JSON.stringify({
          from: config.from,
          html: renderStaffNotificationHtml(input),
          reply_to: input.email,
          subject: `Paddle Buddy: ${formatIntent(input.intent)}`,
          text: renderStaffNotificationText(input),
          to: [recipient]
        }),
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `tiger/paddlebuddy/${submissionId}`
        },
        method: "POST",
        signal: AbortSignal.timeout(12_000)
      });
      if (!response.ok) throw new Error(`Resend returned HTTP ${response.status}.`);
      const result = (await response.json()) as { id?: unknown };
      if (typeof result.id !== "string" || !result.id.trim())
        throw new Error("Resend returned an invalid response.");
      await this.getPrisma().paddleBuddySubmission.update({
        where: { id: submissionId },
        data: {
          notificationAttemptedAt: now,
          notificationLastError: null,
          notificationProviderMessageId: result.id.trim(),
          notificationSentAt: new Date(),
          notificationStatus: "sent"
        }
      });
    } catch (error) {
      await this.updateNotificationFailure(submissionId, now, sanitizeNotificationError(error));
    }
  }

  private updateNotificationFailure(
    submissionId: string,
    attemptedAt: Date,
    error: string
  ): Promise<unknown> {
    return this.getPrisma().paddleBuddySubmission.update({
      where: { id: submissionId },
      data: {
        notificationAttemptedAt: attemptedAt,
        notificationLastError: error,
        notificationStatus: "failed"
      }
    });
  }

  private getPrisma(): PrismaClient {
    if (!this.prisma) {
      const config = createDatabaseConfig(process.env);
      this.prisma = new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });
    }
    return this.prisma;
  }
}

export function validatePaddleBuddySubmission(body: unknown): SubmissionInput {
  if (!isRecord(body)) throw new BadRequestException("Submission must be an object.");
  const honeypot = readOptionalString(body, "company");
  if (honeypot && honeypot.length > MAX_HONEYPOT_LENGTH)
    throw new BadRequestException("Invalid submission.");
  if (honeypot) throw new BadRequestException("Invalid submission.");
  const email = readRequiredString(body, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    throw new BadRequestException("Enter a valid email address.");
  const intent = readRequiredString(body, "intent") as PaddleBuddyIntent;
  if (!INTENTS.includes(intent)) throw new BadRequestException("Choose what brings you here.");
  const message = readOptionalString(body, "message");
  if (message && message.length > MAX_MESSAGE_LENGTH)
    throw new BadRequestException("Message is too long.");
  if (MESSAGE_REQUIRED_INTENTS.has(intent) && !message)
    throw new BadRequestException("Please include a message.");
  const playingLevel = readOptionalString(body, "playingLevel");
  if (playingLevel && playingLevel.length > MAX_PLAYING_LEVEL_LENGTH)
    throw new BadRequestException("Playing level is too long.");
  const primaryDevice = readOptionalString(body, "primaryDevice");
  if (primaryDevice && !["iphone", "ipad", "both"].includes(primaryDevice))
    throw new BadRequestException("Choose a valid device.");
  return {
    email,
    earlyTesting: readBoolean(body, "earlyTesting"),
    has3050xl: readNullableBoolean(body, "has3050xl"),
    intent,
    message: message || null,
    playingLevel: playingLevel || null,
    primaryDevice: (primaryDevice as SubmissionInput["primaryDevice"]) || null,
    wantsUpdates: readBoolean(body, "wantsUpdates")
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function readRequiredString(value: Record<string, unknown>, key: string): string {
  const result = readOptionalString(value, key);
  if (!result) throw new BadRequestException(`${key} is required.`);
  return result;
}
function readOptionalString(value: Record<string, unknown>, key: string): string | null {
  const result = value[key];
  if (result === undefined || result === null) return null;
  if (typeof result !== "string") throw new BadRequestException(`Invalid ${key}.`);
  return result.trim();
}
function readBoolean(value: Record<string, unknown>, key: string): boolean {
  if (typeof value[key] !== "boolean") throw new BadRequestException(`Invalid ${key}.`);
  return value[key] as boolean;
}
function readNullableBoolean(value: Record<string, unknown>, key: string): boolean | null {
  if (value[key] === null || value[key] === undefined) return null;
  return readBoolean(value, key);
}
function formatIntent(intent: PaddleBuddyIntent): string {
  return intent.replace(/_/g, " ");
}
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"]/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character] as string
  );
}
function renderStaffNotificationText(input: SubmissionInput): string {
  return [
    `Email: ${input.email}`,
    `Intent: ${formatIntent(input.intent)}`,
    `Updates: ${input.wantsUpdates ? "yes" : "no"}`,
    `Early testing: ${input.earlyTesting ? "yes" : "no"}`,
    `3050XL access: ${input.has3050xl === null ? "not provided" : input.has3050xl ? "yes" : "no"}`,
    `Primary device: ${input.primaryDevice ?? "not provided"}`,
    `Playing level: ${input.playingLevel ?? "not provided"}`,
    "",
    input.message ?? "No message provided."
  ].join("\n");
}
function renderStaffNotificationHtml(input: SubmissionInput): string {
  return `<pre style="font:14px/1.5 Arial,sans-serif;white-space:pre-wrap">${escapeHtml(renderStaffNotificationText(input))}</pre>`;
}
function sanitizeNotificationError(error: unknown): string {
  if (
    error instanceof Error &&
    /^(Resend returned HTTP \d+\.|Resend returned an invalid response\.)$/.test(error.message)
  )
    return error.message;
  return "Paddle Buddy notification request failed.";
}
