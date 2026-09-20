import { describe, expect, it, vi } from "vitest";

import {
  PaddleBuddyService,
  validatePaddleBuddySubmission
} from "../../apps/api/src/paddlebuddy/paddlebuddy.service";

const followProject = {
  company: "",
  earlyTesting: false,
  email: "PLAYER@EXAMPLE.COM ",
  has3050xl: null,
  intent: "follow_project",
  message: "",
  playingLevel: "",
  primaryDevice: "",
  wantsUpdates: true
};

describe("Paddle Buddy public submissions", () => {
  it("normalizes a valid follow-project submission and keeps explicit update consent", () => {
    expect(validatePaddleBuddySubmission(followProject)).toMatchObject({
      email: "player@example.com",
      has3050xl: "unanswered",
      intent: "follow_project",
      wantsUpdates: true
    });
  });

  it("preserves the distinct not-yet robot-access response", () => {
    expect(
      validatePaddleBuddySubmission({ ...followProject, has3050xl: "not_yet" })
    ).toMatchObject({ has3050xl: "not_yet" });
  });

  it("requires a message for support-style intents but not project follows", () => {
    expect(() =>
      validatePaddleBuddySubmission({ ...followProject, intent: "bug_problem" })
    ).toThrow("Please include a message.");
    expect(() =>
      validatePaddleBuddySubmission({ ...followProject, intent: "question_support" })
    ).toThrow("Please include a message.");
  });

  it("rejects invalid emails, oversized text, and populated honeypots", () => {
    expect(() => validatePaddleBuddySubmission({ ...followProject, email: "nope" })).toThrow(
      "Enter a valid email address."
    );
    expect(() =>
      validatePaddleBuddySubmission({ ...followProject, message: "x".repeat(4001) })
    ).toThrow("Message is too long.");
    expect(() =>
      validatePaddleBuddySubmission({ ...followProject, company: "Not actually a person" })
    ).toThrow("Invalid submission.");
  });

  it("stores a support contact without changing its explicit update consent", async () => {
    const create = vi.fn().mockResolvedValue({ id: "submission-1" });
    const update = vi.fn().mockResolvedValue({});
    const service = new PaddleBuddyService() as unknown as {
      createSubmission(body: unknown): Promise<unknown>;
      getPrisma: () => unknown;
    };
    service.getPrisma = () => ({ paddleBuddySubmission: { create, update } });
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("EMAIL_FROM", "Tiger <info@example.com>");
    vi.stubEnv("PADDLE_BUDDY_NOTIFICATION_EMAIL", "staff@example.com");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ id: "resend-1" }), ok: true })
    );

    await expect(
      service.createSubmission({
        ...followProject,
        intent: "question_support",
        message: "My connection keeps dropping.",
        wantsUpdates: false
      })
    ).resolves.toEqual({ accepted: true });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ wantsUpdates: false }) })
    );
    expect(fetch).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" })
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ notificationStatus: "sent" }) })
    );
  });

  it("does not claim acceptance when durable storage fails", async () => {
    const service = new PaddleBuddyService() as unknown as {
      createSubmission(body: unknown): Promise<unknown>;
      getPrisma: () => unknown;
    };
    service.getPrisma = () => ({
      paddleBuddySubmission: { create: vi.fn().mockRejectedValue(new Error("db offline")) }
    });
    await expect(service.createSubmission(followProject)).rejects.toThrow("db offline");
  });

  it("rate limits repeated public submissions from one client", async () => {
    const create = vi.fn().mockResolvedValue({ id: "submission-rate-limit" });
    const service = new PaddleBuddyService() as unknown as {
      createSubmission(body: unknown, clientKey?: string): Promise<unknown>;
      getPrisma: () => unknown;
    };
    service.getPrisma = () => ({ paddleBuddySubmission: { create } });

    for (let attempt = 0; attempt < 6; attempt += 1) {
      await expect(service.createSubmission(followProject, "203.0.113.9")).resolves.toEqual({
        accepted: true
      });
    }
    await expect(service.createSubmission(followProject, "203.0.113.9")).rejects.toThrow(
      "Please wait before sending another Paddle Buddy message."
    );
    expect(create).toHaveBeenCalledTimes(6);
  });
});
