import { PrismaClient } from "../../packages/db/dist/index.js";
import { assertPreviewEnvironment } from "./preview-environment.mjs";

assertPreviewEnvironment(process.env, "seed");
const db = new PrismaClient();
try {
  const marker = await db.platformMetadata.findUnique({ where: { key: "preview_dataset" } });
  if (marker?.value === "synthetic-v1") {
    console.log("Existing synthetic preview dataset preserved.");
  } else {
    // Refuse every populated application table, including tables outside our fixture.
    const tables =
      await db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'`;
    for (const { tablename } of tables) {
      if (!/^[a-z_]+$/.test(tablename)) throw new Error("Unexpected application table.");
      const rows = await db.$queryRawUnsafe(
        `SELECT EXISTS(SELECT 1 FROM public."${tablename}") AS populated`
      );
      if (rows[0].populated) throw new Error("Seed refused: preview database is not empty.");
    }
    await db.$transaction(async (tx) => {
      const brand = await tx.brand.create({
        data: { key: "preview-brand", name: "Synthetic review fixtures", slug: "preview-brand" }
      });
      const category = await tx.category.create({
        data: {
          key: "preview-paddles",
          name: "Paddles",
          slug: "paddles",
          v1PublicNavigation: true,
          v1CheckoutScope: true
        }
      });
      const family = await tx.productFamily.create({
        data: {
          key: "preview-family",
          name: "Synthetic fixture family",
          slug: "preview-family",
          brandId: brand.id,
          primaryCategoryId: category.id,
          isPublic: true
        }
      });
      await tx.product.create({
        data: {
          key: "preview-fixture-paddle",
          name: "Synthetic preview paddle — not for sale",
          slug: "preview-fixture-paddle",
          brandId: brand.id,
          familyId: family.id,
          primaryCategoryId: category.id,
          productKind: "paddle",
          status: "active",
          purchaseMode: "online_checkout",
          priceCents: 2500,
          v1PublicNavigation: true,
          v1CheckoutScope: true,
          shortDescription: "Synthetic review data only. Checkout and submissions are disabled.",
          sourceReviewStatus: "approved_for_schema_planning",
          importReviewStatus: "approved_for_schema_planning",
          variants: {
            create: {
              key: "preview-fixture-paddle-single",
              name: "Synthetic single",
              priceCents: 2500
            }
          }
        }
      });
      await tx.order.create({
        data: {
          id: "preview-synthetic-order",
          publicReference: "PREVIEW-ONLY-001",
          status: "checkout_pending",
          customerEmail: "synthetic@example.invalid",
          customerName: "Synthetic reviewer",
          subtotalCents: 2500,
          shippingCents: 1500,
          totalCents: 4000,
          items: {
            create: {
              productKey: "preview-fixture-paddle",
              productSlug: "preview-fixture-paddle",
              name: "Synthetic preview paddle",
              quantity: 1,
              unitPriceCents: 2500,
              lineTotalCents: 2500
            }
          }
        }
      });
      await tx.platformMetadata.create({ data: { key: "preview_dataset", value: "synthetic-v1" } });
    });
    console.log("Synthetic preview fixture created. No production data or provider IDs.");
  }
} finally {
  await db.$disconnect();
}
