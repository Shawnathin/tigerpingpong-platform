ALTER TABLE "orders"
  ADD COLUMN "shipment_notification_sent_at" TIMESTAMP(3),
  ADD COLUMN "shipment_notification_status" TEXT,
  ADD COLUMN "shipment_notification_last_error" TEXT;
