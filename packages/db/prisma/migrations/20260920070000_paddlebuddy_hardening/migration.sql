CREATE TYPE "paddle_buddy_robot_access" AS ENUM (
  'yes',
  'no',
  'not_yet',
  'unanswered'
);

ALTER TABLE "paddle_buddy_submissions"
  ALTER COLUMN "has_3050xl" DROP DEFAULT,
  ALTER COLUMN "has_3050xl" TYPE "paddle_buddy_robot_access"
  USING (
    CASE
      WHEN "has_3050xl" IS TRUE THEN 'yes'::"paddle_buddy_robot_access"
      WHEN "has_3050xl" IS FALSE THEN 'no'::"paddle_buddy_robot_access"
      ELSE 'unanswered'::"paddle_buddy_robot_access"
    END
  ),
  ALTER COLUMN "has_3050xl" SET DEFAULT 'unanswered',
  ALTER COLUMN "has_3050xl" SET NOT NULL;
