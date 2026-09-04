CREATE TABLE "order_email_deliveries" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "recipient_email" TEXT,
  "provider_message_id" TEXT,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "last_attempt_at" TIMESTAMP(3),
  "next_attempt_at" TIMESTAMP(3),
  "sent_at" TIMESTAMP(3),
  "last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "order_email_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "order_email_deliveries_order_id_kind_key"
  ON "order_email_deliveries"("order_id", "kind");

CREATE INDEX "order_email_deliveries_status_next_attempt_at_idx"
  ON "order_email_deliveries"("status", "next_attempt_at");

CREATE INDEX "order_email_deliveries_sent_at_idx"
  ON "order_email_deliveries"("sent_at");

ALTER TABLE "order_email_deliveries"
  ADD CONSTRAINT "order_email_deliveries_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Customer email addresses and provider delivery state are server-only.
-- No anon/authenticated policies are created.
ALTER TABLE public.order_email_deliveries ENABLE ROW LEVEL SECURITY;
