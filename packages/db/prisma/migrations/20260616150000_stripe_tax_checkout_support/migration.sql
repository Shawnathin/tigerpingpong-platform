-- AlterTable
ALTER TABLE "orders"
  ADD COLUMN "tax_amount_cents" INTEGER,
  ADD COLUMN "stripe_amount_total_cents" INTEGER,
  ADD COLUMN "stripe_amount_tax_cents" INTEGER,
  ADD COLUMN "stripe_automatic_tax_status" TEXT;
