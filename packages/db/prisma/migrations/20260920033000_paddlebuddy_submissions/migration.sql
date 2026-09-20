CREATE TYPE "paddle_buddy_intent" AS ENUM (
  'follow_project',
  'early_testing',
  'question_support',
  'bug_problem',
  'feature_idea',
  'other'
);

CREATE TYPE "paddle_buddy_robot_access" AS ENUM (
  'yes',
  'no',
  'not_yet',
  'unanswered'
);

CREATE TABLE "paddle_buddy_submissions" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "intent" "paddle_buddy_intent" NOT NULL,
  "message" TEXT,
  "wants_updates" BOOLEAN NOT NULL DEFAULT false,
  "early_testing" BOOLEAN NOT NULL DEFAULT false,
  "has_3050xl" "paddle_buddy_robot_access" NOT NULL DEFAULT 'unanswered',
  "primary_device" TEXT,
  "playing_level" TEXT,
  "source_page" TEXT NOT NULL,
  "notification_status" TEXT NOT NULL DEFAULT 'not_required',
  "notification_attempted_at" TIMESTAMP(3),
  "notification_sent_at" TIMESTAMP(3),
  "notification_provider_message_id" TEXT,
  "notification_last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "paddle_buddy_submissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "paddle_buddy_submissions_created_at_idx" ON "paddle_buddy_submissions"("created_at");
CREATE INDEX "paddle_buddy_submissions_email_idx" ON "paddle_buddy_submissions"("email");
CREATE INDEX "paddle_buddy_submissions_intent_created_at_idx" ON "paddle_buddy_submissions"("intent", "created_at");

-- Submission details are server-only. No anon/authenticated policies are created.
ALTER TABLE public.paddle_buddy_submissions ENABLE ROW LEVEL SECURITY;
