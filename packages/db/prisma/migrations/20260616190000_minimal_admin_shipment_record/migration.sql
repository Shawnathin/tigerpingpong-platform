ALTER TABLE "orders"
  ADD COLUMN "shipment_carrier" TEXT,
  ADD COLUMN "shipment_tracking_number" TEXT,
  ADD COLUMN "shipment_tracking_url" TEXT,
  ADD COLUMN "shipment_shipped_at" TIMESTAMP(3),
  ADD COLUMN "shipment_internal_note" TEXT;
