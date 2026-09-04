// Run with Node --env-file=.env. Defaults to read-only; --apply is the controlled activation.
import { PrismaClient, createDatabaseConfig } from "../../packages/db/dist/index.js";

const slug = "tiger-whistler-indoor-table";
const prisma = new PrismaClient({
  datasources: { db: { url: createDatabaseConfig(process.env).databaseUrl } }
});

try {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      productKind: true,
      status: true,
      v1PublicNavigation: true,
      v1CheckoutScope: true,
      purchaseMode: true,
      updatedAt: true
    }
  });
  if (
    !product ||
    product.productKind !== "table" ||
    !["archived", "active"].includes(product.status) ||
    !["online_checkout", "online_checkout_candidate"].includes(product.purchaseMode)
  ) {
    throw new Error("Whistler record does not match the reviewed activation target.");
  }
  const after = { status: "active", v1PublicNavigation: true, v1CheckoutScope: false };
  console.log(
    JSON.stringify({
      mode: process.argv.includes("--apply") ? "apply" : "dry-run",
      before: product,
      after
    })
  );
  if (process.argv.includes("--apply")) {
    const result = await prisma.product.updateMany({
      where: { id: product.id, slug, updatedAt: product.updatedAt },
      data: after
    });
    if (result.count !== 1)
      throw new Error("Whistler changed since it was read; activation stopped.");
    console.log(
      "Whistler is public with checkout disabled. Verify the live page and checkout rejection."
    );
  }
} catch {
  console.error("Whistler activation failed. No credentials or database errors are printed.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
