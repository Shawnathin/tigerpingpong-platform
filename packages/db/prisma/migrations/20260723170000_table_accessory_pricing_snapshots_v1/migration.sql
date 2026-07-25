ALTER TABLE "orders"
ADD COLUMN "list_subtotal_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "discount_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "pricing_rule_version" TEXT;

UPDATE "orders"
SET
  "list_subtotal_cents" = "subtotal_cents",
  "discount_cents" = 0;

ALTER TABLE "order_items"
ADD COLUMN "list_unit_price_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "discount_unit_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "promotion_key" TEXT;

UPDATE "order_items"
SET
  "list_unit_price_cents" = "unit_price_cents",
  "discount_unit_cents" = 0;
