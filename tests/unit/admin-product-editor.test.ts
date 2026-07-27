import { describe, expect, it, vi } from "vitest";

import { AdminService } from "../../apps/api/src/admin/admin.service";

const updatedAt = new Date("2026-07-16T12:00:00.000Z");

function createProduct() {
  return {
    id: "product-1",
    key: "product-one",
    slug: "product-one",
    name: "Product One",
    sku: "SKU-1",
    productKind: "ball",
    status: "active",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    purchaseMode: "online_checkout",
    priceCents: 800,
    currency: "CAD",
    shippingReviewRequired: false,
    sourceUrl: null,
    legacyPath: null,
    shortDescription: null,
    description: null,
    sourceReviewStatus: "needs_review",
    importReviewStatus: "needs_review",
    notes: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt,
    family: {
      id: "family-1",
      key: "family-one",
      name: "Family One",
      slug: "family-one",
      isActive: true,
      isPublic: true,
      brand: { key: "tiger", name: "Tiger", slug: "tiger" }
    },
    primaryCategory: {
      id: "category-1",
      key: "balls",
      name: "Balls",
      slug: "balls",
      isActive: true,
      v1CheckoutScope: true,
      v1PublicNavigation: true
    },
    media: [{
      mediaKey: "media-1",
      role: "primary",
      cloudinarySecureUrl: "https://res.cloudinary.com/example/image/upload/product.png",
      sourceUrl: null,
      isPrimary: true,
      isPublic: true,
      isActive: true,
      reviewStatus: "approved"
    }],
    variants: [{
      id: "variant-1",
      key: "variant-one",
      sku: "SKU-1-A",
      name: "One pack",
      priceCents: 800,
      currency: "CAD",
      purchaseModeOverride: null,
      isActive: true,
      sourceUrl: null,
      optionValues: []
    }],
    _count: { media: 1, variants: 1 }
  };
}

function updateInput(overrides: Record<string, unknown> = {}) {
  return {
    availableForSale: true,
    expectedUpdatedAt: updatedAt.toISOString(),
    name: "Updated Product",
    priceCents: 900,
    variants: [{ id: "variant-1", isActive: true, priceCents: 900 }],
    ...overrides
  };
}

describe("protected product editor", () => {
  it("rejects unknown fields, invalid prices, and duplicate variants", () => {
    const service = new AdminService() as unknown as {
      normalizeProductUpdateInput(value: unknown): unknown;
    };

    expect(() => service.normalizeProductUpdateInput({ ...updateInput(), slug: "changed" })).toThrow(
      "slug is not supported"
    );
    expect(() => service.normalizeProductUpdateInput(updateInput({ priceCents: -1 }))).toThrow(
      "priceCents must be null or an integer"
    );
    expect(() =>
      service.normalizeProductUpdateInput(
        updateInput({
          variants: [
            { id: "variant-1", isActive: true, priceCents: 900 },
            { id: "variant-1", isActive: false, priceCents: 900 }
          ]
        })
      )
    ).toThrow("duplicate ID");
    expect(() =>
      service.normalizeProductUpdateInput(
        updateInput({
          availableForSale: false,
          priceCents: null,
          variants: [{ id: "variant-1", isActive: false, priceCents: null }]
        })
      )
    ).not.toThrow();
  });

  it("atomically archives a product and updates its existing variants", async () => {
    const product = createProduct();
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const updateVariant = vi.fn(async () => ({}));
    const transaction = {
      product: { findUnique: vi.fn(async () => product), updateMany },
      productVariant: { update: updateVariant }
    };
    const service = new AdminService() as unknown as {
      prisma: unknown;
      updateProduct(id: string, input: unknown): Promise<unknown>;
    };
    service.prisma = {
      $transaction: async (callback: (client: typeof transaction) => Promise<void>) => callback(transaction),
      product: { findUnique: vi.fn(async () => product) }
    };

    await service.updateProduct("product-1", updateInput({ availableForSale: false }));

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "archived",
          v1CheckoutScope: false,
          v1PublicNavigation: false
        })
      })
    );
    expect(updateVariant).toHaveBeenCalledWith({
      where: { id: "variant-1" },
      data: { isActive: true, priceCents: 900 }
    });
  });

  it("fails stale and foreign-variant writes before any mutation", async () => {
    const product = createProduct();
    const updateMany = vi.fn();
    const transaction = {
      product: { findUnique: vi.fn(async () => product), updateMany },
      productVariant: { update: vi.fn() }
    };
    const service = new AdminService() as unknown as {
      prisma: unknown;
      updateProduct(id: string, input: unknown): Promise<unknown>;
    };
    service.prisma = {
      $transaction: async (callback: (client: typeof transaction) => Promise<void>) => callback(transaction)
    };

    await expect(
      service.updateProduct(
        "product-1",
        updateInput({ expectedUpdatedAt: "2026-07-16T11:00:00.000Z" })
      )
    ).rejects.toThrow("changed after the editor was opened");
    await expect(
      service.updateProduct(
        "product-1",
        updateInput({ variants: [{ id: "foreign-variant", isActive: true, priceCents: 900 }] })
      )
    ).rejects.toThrow("each existing product variant exactly once");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("refuses to publish a product that has no active checkout variant", async () => {
    const product = { ...createProduct(), status: "archived", v1PublicNavigation: false, v1CheckoutScope: false };
    const transaction = {
      product: { findUnique: vi.fn(async () => product), updateMany: vi.fn() },
      productVariant: { update: vi.fn() }
    };
    const service = new AdminService() as unknown as {
      prisma: unknown;
      updateProduct(id: string, input: unknown): Promise<unknown>;
    };
    service.prisma = {
      $transaction: async (callback: (client: typeof transaction) => Promise<void>) => callback(transaction)
    };

    await expect(
      service.updateProduct(
        "product-1",
        updateInput({ variants: [{ id: "variant-1", isActive: false, priceCents: 900 }] })
      )
    ).rejects.toThrow("active_checkout_variant_required");
  });

  it("refuses to publish an active non-table variant without a price", async () => {
    const product = { ...createProduct(), status: "archived", v1PublicNavigation: false, v1CheckoutScope: false };
    const transaction = {
      product: { findUnique: vi.fn(async () => product), updateMany: vi.fn() },
      productVariant: { update: vi.fn() }
    };
    const service = new AdminService() as unknown as {
      prisma: unknown;
      updateProduct(id: string, input: unknown): Promise<unknown>;
    };
    service.prisma = {
      $transaction: async (callback: (client: typeof transaction) => Promise<void>) => callback(transaction)
    };

    await expect(
      service.updateProduct(
        "product-1",
        updateInput({ variants: [{ id: "variant-1", isActive: true, priceCents: null }] })
      )
    ).rejects.toThrow("active_variant_price_required");
  });

  it("reports approved replacement parts as eligible and deferred ones as unavailable", () => {
    const service = new AdminService() as unknown as {
      getCheckoutEligibility(product: unknown): { eligible: boolean; reasons: string[] };
    };
    const part40 = {
      ...createProduct(),
      key: "tiger-pingpong-replacement-part-40",
      slug: "tiger-pingpong-replacement-part-40",
      name: "Tiger PingPong Part 40",
      productKind: "replacement_part",
      priceCents: 700,
      sku: "8123"
    };
    const approvedStandardNet = {
      ...part40,
      key: "tiger-replacement-net",
      slug: "tiger-replacement-net",
      name: "Tiger PingPong Standard Replacement Net",
      priceCents: 2_000,
      sku: "8367"
    };
    const approvedUpgradeSystem = {
      ...part40,
      key: "tiger-table-net-replacement-set",
      slug: "tiger-table-net-replacement-set",
      name: "Tiger PingPong Expo & Portland Net Upgrade System",
      priceCents: 14_999,
      sku: "15875"
    };
    const deferredWhistlerSystem = {
      ...part40,
      key: "tiger-whistler-net-upgrade-system",
      slug: "tiger-whistler-net-upgrade-system",
      status: "draft",
      v1PublicNavigation: false,
      v1CheckoutScope: false,
      purchaseMode: "deferred_from_v1"
    };

    expect(service.getCheckoutEligibility(part40)).toEqual({ eligible: true, reasons: [] });
    expect(service.getCheckoutEligibility(approvedStandardNet)).toEqual({
      eligible: true,
      reasons: []
    });
    expect(service.getCheckoutEligibility(approvedUpgradeSystem)).toEqual({
      eligible: true,
      reasons: []
    });
    expect(service.getCheckoutEligibility(deferredWhistlerSystem)).toMatchObject({
      eligible: false
    });
    expect(service.getCheckoutEligibility(deferredWhistlerSystem).reasons).toEqual(
      expect.arrayContaining([
        "product_not_active",
        "not_public_navigation",
        "not_checkout_scope",
        "purchase_mode_not_checkoutable"
      ])
    );
    expect(service.getCheckoutEligibility(deferredWhistlerSystem).reasons).not.toContain(
      "replacement_part_deferred"
    );
  });
});
