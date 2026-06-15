-- Add minimal V1 order fulfillment recordkeeping.
-- Shipment state is intentionally separate from orders.status, which remains payment/order truth.

CREATE TYPE "fulfillment_status" AS ENUM ('not_shipped', 'shipped');

ALTER TABLE "orders"
  ADD COLUMN "fulfillment_status" "fulfillment_status" NOT NULL DEFAULT 'not_shipped',
  ADD COLUMN "shipment_carrier" VARCHAR(80),
  ADD COLUMN "shipment_tracking_number" VARCHAR(120),
  ADD COLUMN "shipment_tracking_url" VARCHAR(2048),
  ADD COLUMN "shipped_at" TIMESTAMP(3),
  ADD COLUMN "shipment_internal_note" VARCHAR(1000),
  ADD COLUMN "shipment_recorded_at" TIMESTAMP(3),
  ADD COLUMN "shipment_recorded_by" VARCHAR(120);

CREATE INDEX "orders_fulfillment_status_idx" ON "orders"("fulfillment_status");
CREATE INDEX "orders_shipped_at_idx" ON "orders"("shipped_at");
