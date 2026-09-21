CREATE TYPE "paddle_buddy_feedback_state" AS ENUM (
  'new',
  'reviewing',
  'considering',
  'planned',
  'shipped'
);

ALTER TABLE "paddle_buddy_submissions"
  ADD COLUMN "feedback_state" "paddle_buddy_feedback_state" NOT NULL DEFAULT 'new';

CREATE INDEX "paddle_buddy_submissions_feedback_state_created_at_idx"
  ON "paddle_buddy_submissions"("feedback_state", "created_at");
