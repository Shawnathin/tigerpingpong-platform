-- AlterEnum
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;

CREATE TYPE "order_status_new" AS ENUM ('checkout_pending', 'checkout_failed', 'paid', 'canceled', 'expired', 'refunded');

ALTER TABLE "orders"
  ALTER COLUMN "status" TYPE "order_status_new"
  USING (
    CASE "status"::text
      WHEN 'draft' THEN 'checkout_pending'
      WHEN 'pending_payment' THEN 'checkout_pending'
      WHEN 'paid' THEN 'paid'
      WHEN 'processing' THEN 'paid'
      WHEN 'shipped' THEN 'paid'
      WHEN 'delivered' THEN 'paid'
      WHEN 'cancelled' THEN 'canceled'
      WHEN 'refunded' THEN 'refunded'
      ELSE 'checkout_pending'
    END
  )::"order_status_new";

DROP TYPE "order_status";
ALTER TYPE "order_status_new" RENAME TO "order_status";

ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'checkout_pending';

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_fkey";

-- AlterTable
ALTER TABLE "orders"
  ADD COLUMN "public_reference" TEXT NOT NULL DEFAULT ('order_' || substr(md5(random()::text || clock_timestamp()::text), 1, 24)),
  ADD COLUMN "shipping_rule" TEXT NOT NULL DEFAULT 'canada_free_over_100_flat_15',
  ADD COLUMN "checkout_source" TEXT NOT NULL DEFAULT 'stripe_checkout',
  ADD COLUMN "customer_phone" TEXT,
  ADD COLUMN "shipping_name" TEXT,
  ADD COLUMN "shipping_phone" TEXT,
  ADD COLUMN "shipping_address_json" JSONB,
  ADD COLUMN "stripe_checkout_session_id" TEXT,
  ADD COLUMN "stripe_payment_intent_id" TEXT,
  ADD COLUMN "stripe_customer_id" TEXT,
  ADD COLUMN "paid_at" TIMESTAMP(3),
  DROP COLUMN "tax_cents",
  DROP COLUMN "external_payment_reference",
  DROP COLUMN "contains_table_freight_item",
  DROP COLUMN "shipping_review_required",
  DROP COLUMN "freight_acknowledged_at",
  DROP COLUMN "damage_policy_acknowledged_at";

ALTER TABLE "orders" ALTER COLUMN "public_reference" DROP DEFAULT;

-- AlterTable
ALTER TABLE "order_items"
  RENAME COLUMN "sku_snapshot" TO "sku";

ALTER TABLE "order_items"
  RENAME COLUMN "name_snapshot" TO "name";

ALTER TABLE "order_items"
  RENAME COLUMN "total_price_cents" TO "line_total_cents";

ALTER TABLE "order_items"
  ADD COLUMN "product_key" TEXT NOT NULL DEFAULT 'legacy_product',
  ADD COLUMN "product_slug" TEXT NOT NULL DEFAULT 'legacy-product',
  ADD COLUMN "variant_key" TEXT,
  ADD COLUMN "image_url" TEXT,
  ADD COLUMN "currency" CHAR(3) NOT NULL DEFAULT 'CAD',
  ALTER COLUMN "product_id" DROP NOT NULL;

ALTER TABLE "order_items" ALTER COLUMN "product_key" DROP DEFAULT;
ALTER TABLE "order_items" ALTER COLUMN "product_slug" DROP DEFAULT;

-- CreateTable
CREATE TABLE "stripe_webhook_events" (
    "id" TEXT NOT NULL,
    "stripe_event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_public_reference_key" ON "orders"("public_reference");

-- CreateIndex
CREATE UNIQUE INDEX "orders_stripe_checkout_session_id_key" ON "orders"("stripe_checkout_session_id");

-- CreateIndex
CREATE INDEX "orders_stripe_payment_intent_id_idx" ON "orders"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "orders_stripe_customer_id_idx" ON "orders"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "orders_paid_at_idx" ON "orders"("paid_at");

-- CreateIndex
CREATE INDEX "order_items_product_key_idx" ON "order_items"("product_key");

-- CreateIndex
CREATE INDEX "order_items_product_slug_idx" ON "order_items"("product_slug");

-- CreateIndex
CREATE INDEX "order_items_sku_idx" ON "order_items"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_webhook_events_stripe_event_id_key" ON "stripe_webhook_events"("stripe_event_id");

-- CreateIndex
CREATE INDEX "stripe_webhook_events_type_idx" ON "stripe_webhook_events"("type");

-- CreateIndex
CREATE INDEX "stripe_webhook_events_processed_at_idx" ON "stripe_webhook_events"("processed_at");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
