import {
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  ServiceUnavailableException
} from "@nestjs/common";
import { createDatabaseConfig, Prisma, PrismaClient } from "@tigerpingpong/db";
import {
  AQUA_FOUR_PACK_VARIANT_KEY,
  AQUA_PADDLE_PRODUCT_KEY,
  AQUA_TWO_PACK_VARIANT_KEY,
  calculateViceBundleRegularPrice,
  PLAZA_OUTDOOR_TABLE_PRODUCT_KEY,
  PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY,
  TABLE_ACCESSORIES_DISCOUNT_PERCENT,
  TABLE_ACCESSORIES_PRICING_RULE_VERSION,
  TABLE_ACCESSORY_ELIGIBLE_TABLE_PRODUCT_KEYS,
  TABLE_COVER_PRODUCT_KEY,
  VICE_BUNDLE_PUBLIC_LABEL,
  VICE_BUNDLE_VARIANT_KEY,
  VICE_PADDLE_PRODUCT_KEY,
  VICE_SINGLE_VARIANT_KEY,
  type ComponentDerivedCatalogPrice
} from "@tigerpingpong/shared";

interface CatalogRequestOptions {
  includeInternal: boolean;
  includeReplacementParts?: boolean;
}

interface CategoryNode {
  children: CategoryNode[];
  description: string | null;
  id: string;
  key: string;
  parentId: string | null;
  slug: string;
  name: string;
  sortOrder: number;
  v1CheckoutScope: boolean;
  v1PublicNavigation: boolean;
}

interface CategoryRecord extends Omit<CategoryNode, "children"> {
  legacyPath: string | null;
  sourceUrl: string | null;
}

interface SummaryRecord {
  key: string;
  slug: string;
  name: string;
}

interface FamilyRecord extends SummaryRecord {
  id: string;
  description: string | null;
  sortOrder: number;
  isPublic: boolean;
  isActive: boolean;
  sourceEvidence: string | null;
  brand: SummaryRecord;
  primaryCategory: SummaryRecord & {
    v1CheckoutScope: boolean;
    v1PublicNavigation: boolean;
  };
}

interface ProductSummaryRecord extends SummaryRecord {
  productKind: string;
  purchaseMode: string;
  priceCents: number | null;
  currency: string;
  v1PublicNavigation: boolean;
  v1CheckoutScope: boolean;
  shippingReviewRequired: boolean;
}

type MediaRecord = Prisma.ProductMediaGetPayload<{ select: typeof mediaSelect }>;

interface ProductListRecord extends ProductSummaryRecord {
  family: SummaryRecord;
  primaryCategory: SummaryRecord;
  legacyPath?: string | null;
  media: MediaRecord[];
  sku?: string | null;
  sourceUrl?: string | null;
}

interface VariantOptionRecord {
  productOptionValue: {
    value: string;
    label: string | null;
    sortOrder: number;
    option: {
      name: string;
      displayName: string | null;
      sortOrder: number;
    };
  };
}

interface VariantRecord {
  key: string;
  sku: string | null;
  name: string | null;
  priceCents: number | null;
  currency: string;
  purchaseModeOverride: string | null;
  isActive: boolean;
  sourceUrl: string | null;
  optionValues: VariantOptionRecord[];
}

interface ContentSectionRecord {
  sectionType: string;
  eyebrow: string | null;
  heading: string | null;
  body: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface SpecRecord {
  name: string;
  value: string;
  unit: string | null;
  comparisonKey: string | null;
  sortOrder: number;
  isHighlighted: boolean;
  isComparisonAttribute: boolean;
}

interface SpecGroupRecord {
  name: string;
  sortOrder: number;
  specs: SpecRecord[];
}

interface RelationshipRecord {
  relationshipType: string;
  sortOrder: number;
  isPublic: boolean;
}

interface OutgoingRelationshipRecord extends RelationshipRecord {
  targetProduct: ProductSummaryRecord;
}

interface IncomingRelationshipRecord extends RelationshipRecord {
  sourceProduct: ProductSummaryRecord;
}

interface ProductDetailRecord extends ProductListRecord {
  description: string | null;
  shortDescription: string | null;
  sourceReviewStatus: string;
  importReviewStatus: string;
  sku: string | null;
  sourceUrl: string | null;
  legacyPath: string | null;
  variants: VariantRecord[];
  contentSections: ContentSectionRecord[];
  specGroups: SpecGroupRecord[];
  sourceRelationships: OutgoingRelationshipRecord[];
  targetRelationships: IncomingRelationshipRecord[];
}

interface ComponentDerivedVariantPricing extends ComponentDerivedCatalogPrice {
  name: string;
  variantKey: string;
}

interface ProductPriceRecord {
  currency: string;
  priceCents: number | null;
}

type TableAccessoryOfferProductRecord = Prisma.ProductGetPayload<{
  select: typeof tableAccessoryOfferProductSelect;
}>;

type TableAccessoryOfferVariantRecord = TableAccessoryOfferProductRecord["variants"][number];

const CHECKOUT_PURCHASE_MODES = new Set(["online_checkout", "online_checkout_candidate"]);
const NON_CHECKOUT_VARIANT_PURCHASE_MODES = new Set(["deferred_from_v1", "disabled"]);
const TABLE_ACCESSORY_OFFER_PRODUCT_KEYS = [
  AQUA_PADDLE_PRODUCT_KEY,
  VICE_PADDLE_PRODUCT_KEY,
  TABLE_COVER_PRODUCT_KEY,
  PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY
] as const;
const TABLE_ACCESSORY_PLAY_SET_VARIANT_KEYS = [
  AQUA_TWO_PACK_VARIANT_KEY,
  AQUA_FOUR_PACK_VARIANT_KEY
] as const;

const categorySelect = {
  id: true,
  key: true,
  parentId: true,
  name: true,
  slug: true,
  description: true,
  sortOrder: true,
  v1PublicNavigation: true,
  v1CheckoutScope: true,
  sourceUrl: true,
  legacyPath: true
} satisfies Prisma.CategorySelect;

const familySelect = {
  id: true,
  key: true,
  name: true,
  slug: true,
  description: true,
  sortOrder: true,
  isPublic: true,
  isActive: true,
  sourceEvidence: true,
  brand: {
    select: {
      key: true,
      name: true,
      slug: true
    }
  },
  primaryCategory: {
    select: {
      key: true,
      name: true,
      slug: true,
      v1PublicNavigation: true,
      v1CheckoutScope: true
    }
  }
} satisfies Prisma.ProductFamilySelect;

const mediaSelect = {
  mediaKey: true,
  role: true,
  cloudinarySecureUrl: true,
  cloudinaryPublicId: true,
  sourceUrl: true,
  sourceProvider: true,
  altText: true,
  title: true,
  caption: true,
  sortOrder: true,
  isPrimary: true,
  isPublic: true,
  reviewStatus: true,
  variant: {
    select: {
      key: true
    }
  }
} satisfies Prisma.ProductMediaSelect;

const productSummarySelect = {
  key: true,
  slug: true,
  name: true,
  productKind: true,
  purchaseMode: true,
  priceCents: true,
  currency: true,
  v1PublicNavigation: true,
  v1CheckoutScope: true,
  shippingReviewRequired: true
} satisfies Prisma.ProductSelect;

const tableAccessoryOfferProductSelect = {
  key: true,
  slug: true,
  name: true,
  sku: true,
  productKind: true,
  status: true,
  v1PublicNavigation: true,
  v1CheckoutScope: true,
  purchaseMode: true,
  priceCents: true,
  currency: true,
  family: {
    select: {
      isActive: true,
      isPublic: true
    }
  },
  primaryCategory: {
    select: {
      isActive: true,
      v1PublicNavigation: true,
      v1CheckoutScope: true
    }
  },
  media: {
    where: {
      isActive: true,
      isPublic: true
    },
    orderBy: [
      {
        isPrimary: "desc"
      },
      {
        sortOrder: "asc"
      }
    ],
    select: {
      cloudinarySecureUrl: true,
      altText: true,
      variant: {
        select: {
          key: true
        }
      }
    }
  },
  variants: {
    where: {
      isActive: true
    },
    orderBy: [
      {
        name: "asc"
      },
      {
        key: "asc"
      }
    ],
    select: {
      key: true,
      sku: true,
      name: true,
      priceCents: true,
      currency: true,
      purchaseModeOverride: true,
      isActive: true,
      optionValues: {
        select: {
          productOptionValue: {
            select: {
              value: true,
              label: true,
              sortOrder: true,
              option: {
                select: {
                  name: true,
                  sortOrder: true
                }
              }
            }
          }
        }
      }
    }
  }
} satisfies Prisma.ProductSelect;

@Injectable()
export class CatalogService implements OnModuleDestroy {
  private prisma: PrismaClient | null = null;

  async onModuleDestroy(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }

  async getHealth(): Promise<unknown> {
    try {
      const prisma = this.getPrisma();
      const [brands, categories, productFamilies, products, variants, media] = await Promise.all([
        prisma.brand.count(),
        prisma.category.count(),
        prisma.productFamily.count(),
        prisma.product.count(),
        prisma.productVariant.count(),
        prisma.productMedia.count()
      ]);

      return {
        status: "ok",
        service: "tigerpingpong-catalog-api",
        timestamp: new Date().toISOString(),
        counts: {
          brands,
          categories,
          productFamilies,
          products,
          variants,
          media
        }
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: "unreachable",
        service: "tigerpingpong-catalog-api",
        message: this.getDatabaseErrorMessage(error)
      });
    }
  }

  async getCategories(options: CatalogRequestOptions): Promise<unknown> {
    const categories: CategoryRecord[] = await this.getPrisma().category.findMany({
      where: {
        isActive: true,
        v1PublicNavigation: true
      },
      orderBy: [
        {
          sortOrder: "asc"
        },
        {
          name: "asc"
        }
      ],
      select: categorySelect
    });

    const byId = new Map<string, CategoryNode>(
      categories.map((category: CategoryRecord) => [
        category.id,
        {
          id: category.id,
          key: category.key,
          slug: category.slug,
          name: category.name,
          description: category.description,
          sortOrder: category.sortOrder,
          v1PublicNavigation: category.v1PublicNavigation,
          v1CheckoutScope: category.v1CheckoutScope,
          parentId: category.parentId,
          children: []
        }
      ])
    );
    const roots: CategoryNode[] = [];

    for (const category of categories) {
      const node = byId.get(category.id);

      if (!node) {
        continue;
      }

      const parentNode = category.parentId ? byId.get(category.parentId) : null;

      if (parentNode) {
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return {
      categories: roots.map((category: CategoryNode) =>
        this.serializeCategoryNode(category, options.includeInternal)
      )
    };
  }

  async getProductFamilies(options: CatalogRequestOptions): Promise<unknown> {
    const productFamilies: FamilyRecord[] = await this.getPrisma().productFamily.findMany({
      where: {
        isActive: true,
        isPublic: true,
        primaryCategory: {
          v1PublicNavigation: true
        }
      },
      orderBy: [
        {
          sortOrder: "asc"
        },
        {
          name: "asc"
        }
      ],
      select: familySelect
    });

    return {
      productFamilies: productFamilies.map((family: FamilyRecord) =>
        this.serializeFamily(family, options.includeInternal)
      )
    };
  }

  async getFamilyBySlug(slug: string, options: CatalogRequestOptions): Promise<unknown> {
    const family = await this.getPrisma().productFamily.findFirst({
      where: {
        slug,
        ...(options.includeInternal
          ? {}
          : {
              isActive: true,
              isPublic: true,
              primaryCategory: {
                v1PublicNavigation: true
              }
            })
      },
      select: {
        ...familySelect,
        products: {
          where: this.getPublicProductWhere(options),
          orderBy: [
            {
              name: "asc"
            }
          ],
          select: {
            ...productSummarySelect,
            family: {
              select: {
                key: true,
                slug: true,
                name: true
              }
            },
            primaryCategory: {
              select: {
                key: true,
                slug: true,
                name: true
              }
            },
            media: {
              where: this.getMediaWhere(options.includeInternal),
              orderBy: [
                {
                  isPrimary: "desc"
                },
                {
                  sortOrder: "asc"
                }
              ],
              take: 1,
              select: mediaSelect
            }
          }
        }
      }
    });

    if (!family) {
      throw new NotFoundException(`Product family not found: ${slug}`);
    }

    return {
      productFamily: {
        ...this.serializeFamily(family, options.includeInternal),
        products: family.products.map((product: ProductListRecord) =>
          this.serializeProductListItem(product, options.includeInternal)
        )
      }
    };
  }

  async getProducts(options: CatalogRequestOptions): Promise<unknown> {
    const products: ProductListRecord[] = await this.getPrisma().product.findMany({
      where: this.getPublicProductWhere(options),
      orderBy: [
        {
          name: "asc"
        }
      ],
      select: {
        ...productSummarySelect,
        sku: true,
        sourceUrl: true,
        legacyPath: true,
        family: {
          select: {
            key: true,
            slug: true,
            name: true
          }
        },
        primaryCategory: {
          select: {
            key: true,
            slug: true,
            name: true
          }
        },
        media: {
          where: this.getMediaWhere(options.includeInternal),
          orderBy: [
            {
              isPrimary: "desc"
            },
            {
              sortOrder: "asc"
            }
          ],
          take: 1,
          select: mediaSelect
        }
      }
    });

    return {
      products: products.map((product: ProductListRecord) =>
        this.serializeProductListItem(product, options.includeInternal)
      )
    };
  }

  async getProductBySlug(slug: string, options: CatalogRequestOptions): Promise<unknown> {
    const product: ProductDetailRecord | null = await this.getPrisma().product.findFirst({
      where: {
        slug,
        ...this.getPublicProductWhere(options)
      },
      select: {
        ...productSummarySelect,
        sku: true,
        sourceUrl: true,
        legacyPath: true,
        shortDescription: true,
        description: true,
        sourceReviewStatus: true,
        importReviewStatus: true,
        family: {
          select: {
            key: true,
            slug: true,
            name: true
          }
        },
        primaryCategory: {
          select: {
            key: true,
            slug: true,
            name: true
          }
        },
        variants: {
          where: options.includeInternal
            ? {}
            : {
                isActive: true
              },
          orderBy: [
            {
              name: "asc"
            },
            {
              key: "asc"
            }
          ],
          select: {
            key: true,
            sku: true,
            name: true,
            priceCents: true,
            currency: true,
            purchaseModeOverride: true,
            isActive: true,
            sourceUrl: true,
            optionValues: {
              select: {
                productOptionValue: {
                  select: {
                    value: true,
                    label: true,
                    sortOrder: true,
                    option: {
                      select: {
                        name: true,
                        displayName: true,
                        sortOrder: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        media: {
          where: this.getMediaWhere(options.includeInternal),
          orderBy: [
            {
              isPrimary: "desc"
            },
            {
              sortOrder: "asc"
            }
          ],
          select: mediaSelect
        },
        contentSections: {
          where: options.includeInternal
            ? {}
            : {
                isActive: true
              },
          orderBy: {
            sortOrder: "asc"
          },
          select: {
            sectionType: true,
            eyebrow: true,
            heading: true,
            body: true,
            sortOrder: true,
            isActive: true
          }
        },
        specGroups: {
          orderBy: {
            sortOrder: "asc"
          },
          select: {
            name: true,
            sortOrder: true,
            specs: {
              orderBy: {
                sortOrder: "asc"
              },
              select: {
                name: true,
                value: true,
                unit: true,
                comparisonKey: true,
                sortOrder: true,
                isHighlighted: true,
                isComparisonAttribute: true
              }
            }
          }
        },
        sourceRelationships: {
          where: this.getOutgoingRelationshipWhere(options.includeInternal),
          orderBy: {
            sortOrder: "asc"
          },
          select: {
            relationshipType: true,
            sortOrder: true,
            isPublic: true,
            targetProduct: {
              select: productSummarySelect
            }
          }
        },
        targetRelationships: {
          where: this.getIncomingRelationshipWhere(options.includeInternal),
          orderBy: {
            sortOrder: "asc"
          },
          select: {
            relationshipType: true,
            sortOrder: true,
            isPublic: true,
            sourceProduct: {
              select: productSummarySelect
            }
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundException(`Product not found: ${slug}`);
    }

    const componentDerivedVariantPricing = await this.getViceBundleComponentDerivedPricing(product);

    return {
      product: this.serializeProductDetail(
        product,
        options.includeInternal,
        componentDerivedVariantPricing
      )
    };
  }

  async getTableAccessoryOffer(tableSlug: string): Promise<unknown> {
    const prisma = this.getPrisma();
    const [table, offerProducts] = await Promise.all([
      prisma.product.findFirst({
        where: {
          slug: tableSlug,
          key: {
            in: [...TABLE_ACCESSORY_ELIGIBLE_TABLE_PRODUCT_KEYS]
          },
          productKind: "table"
        },
        select: tableAccessoryOfferProductSelect
      }),
      prisma.product.findMany({
        where: {
          key: {
            in: [...TABLE_ACCESSORY_OFFER_PRODUCT_KEYS]
          }
        },
        select: tableAccessoryOfferProductSelect
      })
    ]);

    if (
      !table ||
      !this.isTableAccessoryEligibleTable(table) ||
      !this.isCheckoutableOfferProduct(table)
    ) {
      throw new NotFoundException(`Table accessory offer not found: ${tableSlug}`);
    }

    const productsByKey = new Map(offerProducts.map((product) => [product.key, product]));
    const selectableItems = [
      ...this.getAquaOfferItems(productsByKey.get(AQUA_PADDLE_PRODUCT_KEY)),
      ...this.getViceOfferItems(
        productsByKey.get(VICE_PADDLE_PRODUCT_KEY),
        productsByKey.get(PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY)
      )
    ];
    const coverIsCompatible = table.key !== PLAZA_OUTDOOR_TABLE_PRODUCT_KEY;
    const cover = productsByKey.get(TABLE_COVER_PRODUCT_KEY);

    if (coverIsCompatible) {
      const coverItem = this.getCoverOfferItem(cover);

      if (coverItem) {
        selectableItems.push(coverItem);
      }
    }

    return {
      offer: {
        tableSlug: table.slug,
        tableProductKey: table.key,
        discountPercent: TABLE_ACCESSORIES_DISCOUNT_PERCENT,
        pricingRuleVersion: TABLE_ACCESSORIES_PRICING_RULE_VERSION,
        selectableItems,
        coverCompatibility: {
          isCompatible: coverIsCompatible,
          reason: coverIsCompatible ? null : "not_compatible_with_plaza"
        }
      }
    };
  }

  private getPrisma(): PrismaClient {
    if (!this.prisma) {
      const config = createDatabaseConfig(process.env);

      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: config.databaseUrl
          }
        }
      });
    }

    return this.prisma;
  }

  private getPublicProductWhere(options: CatalogRequestOptions): Prisma.ProductWhereInput {
    if (options.includeReplacementParts) {
      return {
        status: {
          not: "archived"
        }
      };
    }

    return {
      status: "active",
      v1PublicNavigation: true,
      purchaseMode: {
        not: "deferred_from_v1"
      }
    };
  }

  private getMediaWhere(includeInternal: boolean): Prisma.ProductMediaWhereInput {
    return {
      isActive: true,
      ...(includeInternal
        ? {}
        : {
            isPublic: true
          })
    };
  }

  private getOutgoingRelationshipWhere(
    includeInternal: boolean
  ): Prisma.ProductRelationshipWhereInput {
    return {
      isActive: true,
      ...(includeInternal
        ? {}
        : {
            isPublic: true,
            targetProduct: this.getPublicProductWhere({
              includeInternal: false,
              includeReplacementParts: false
            })
          })
    };
  }

  private getIncomingRelationshipWhere(
    includeInternal: boolean
  ): Prisma.ProductRelationshipWhereInput {
    return {
      isActive: true,
      ...(includeInternal
        ? {}
        : {
            isPublic: true,
            sourceProduct: this.getPublicProductWhere({
              includeInternal: false,
              includeReplacementParts: false
            })
          })
    };
  }

  private serializeCategoryNode(node: CategoryNode, includeInternal: boolean): unknown {
    return {
      id: node.id,
      key: node.key,
      slug: node.slug,
      name: node.name,
      description: node.description,
      sortOrder: node.sortOrder,
      v1PublicNavigation: node.v1PublicNavigation,
      v1CheckoutScope: node.v1CheckoutScope,
      ...(includeInternal
        ? {
            parentId: node.parentId
          }
        : {}),
      children: node.children.map((child) => this.serializeCategoryNode(child, includeInternal))
    };
  }

  private serializeFamily(family: FamilyRecord, includeInternal: boolean) {
    return {
      id: family.id,
      key: family.key,
      slug: family.slug,
      name: family.name,
      description: family.description,
      sortOrder: family.sortOrder,
      isPublic: family.isPublic,
      isActive: family.isActive,
      brand: family.brand,
      primaryCategory: family.primaryCategory,
      ...(includeInternal
        ? {
            sourceEvidence: family.sourceEvidence
          }
        : {})
    };
  }

  private serializeProductListItem(product: ProductListRecord, includeInternal: boolean) {
    const primaryMedia = product.media[0] ?? null;

    return {
      key: product.key,
      slug: product.slug,
      name: product.name,
      productKind: product.productKind,
      purchaseMode: product.purchaseMode,
      priceCents: product.priceCents,
      currency: product.currency,
      v1PublicNavigation: product.v1PublicNavigation,
      v1CheckoutScope: product.v1CheckoutScope,
      shippingReviewRequired: product.shippingReviewRequired,
      family: product.family,
      category: product.primaryCategory,
      primaryMedia: primaryMedia ? this.serializeMedia(primaryMedia, includeInternal) : null,
      ...(includeInternal
        ? {
            sku: product.sku,
            sourceUrl: product.sourceUrl,
            legacyPath: product.legacyPath
          }
        : {})
    };
  }

  private serializeProductDetail(
    product: ProductDetailRecord,
    includeInternal: boolean,
    componentDerivedVariantPricing: ComponentDerivedVariantPricing | null = null
  ) {
    return {
      key: product.key,
      slug: product.slug,
      name: product.name,
      productKind: product.productKind,
      purchaseMode: product.purchaseMode,
      priceCents: product.priceCents,
      currency: product.currency,
      v1PublicNavigation: product.v1PublicNavigation,
      v1CheckoutScope: product.v1CheckoutScope,
      shippingReviewRequired: product.shippingReviewRequired,
      shortDescription: product.shortDescription,
      description: product.description,
      family: product.family,
      category: product.primaryCategory,
      variants: product.variants.map((variant) => {
        const isComponentDerivedVariant = variant.key === VICE_BUNDLE_VARIANT_KEY;
        const derivedPricing =
          componentDerivedVariantPricing?.variantKey === variant.key
            ? componentDerivedVariantPricing
            : null;

        return {
          key: variant.key,
          sku: includeInternal ? variant.sku : undefined,
          name: derivedPricing?.name ?? variant.name,
          priceCents: isComponentDerivedVariant
            ? (derivedPricing?.priceCents ?? null)
            : variant.priceCents,
          currency: derivedPricing?.currency ?? variant.currency,
          ...(derivedPricing
            ? {
                pricingSource: derivedPricing.pricingSource
              }
            : {}),
          purchaseModeOverride: variant.purchaseModeOverride,
          isActive: variant.isActive,
          options: variant.optionValues
            .map(({ productOptionValue }) => ({
              name: productOptionValue.option.name,
              displayName: productOptionValue.option.displayName,
              value: productOptionValue.value,
              label: productOptionValue.label,
              sortOrder: productOptionValue.sortOrder,
              optionSortOrder: productOptionValue.option.sortOrder
            }))
            .sort((left, right) => left.optionSortOrder - right.optionSortOrder),
          ...(includeInternal
            ? {
                sourceUrl: variant.sourceUrl
              }
            : {})
        };
      }),
      media: product.media.map((media) => this.serializeMedia(media, includeInternal)),
      contentSections: product.contentSections.map((section) => ({
        sectionType: section.sectionType,
        eyebrow: section.eyebrow,
        heading: section.heading,
        body: section.body,
        sortOrder: section.sortOrder,
        ...(includeInternal
          ? {
              isActive: section.isActive
            }
          : {})
      })),
      specGroups: product.specGroups,
      relationships: {
        outgoing: product.sourceRelationships.map((relationship) => ({
          relationshipType: relationship.relationshipType,
          sortOrder: relationship.sortOrder,
          isPublic: relationship.isPublic,
          product: relationship.targetProduct
        })),
        incoming: product.targetRelationships.map((relationship) => ({
          relationshipType: relationship.relationshipType,
          sortOrder: relationship.sortOrder,
          isPublic: relationship.isPublic,
          product: relationship.sourceProduct
        }))
      },
      ...(includeInternal
        ? {
            sku: product.sku,
            sourceUrl: product.sourceUrl,
            legacyPath: product.legacyPath,
            sourceReviewStatus: product.sourceReviewStatus,
            importReviewStatus: product.importReviewStatus
          }
        : {})
    };
  }

  private async getViceBundleComponentDerivedPricing(
    product: ProductDetailRecord
  ): Promise<ComponentDerivedVariantPricing | null> {
    if (product.key !== VICE_PADDLE_PRODUCT_KEY) {
      return null;
    }

    const bundleVariant = product.variants.find(
      (variant) =>
        variant.key === VICE_BUNDLE_VARIANT_KEY && variant.isActive && Boolean(variant.sku?.trim())
    );

    if (!bundleVariant) {
      return null;
    }

    const singleVariant = product.variants.find(
      (variant) => variant.key === VICE_SINGLE_VARIANT_KEY && variant.isActive
    );
    const whiteBalls: ProductPriceRecord | null = await this.getPrisma().product.findFirst({
      where: {
        key: PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY,
        status: "active",
        v1PublicNavigation: true,
        v1CheckoutScope: true,
        purchaseMode: {
          in: ["online_checkout", "online_checkout_candidate"]
        },
        currency: "CAD",
        family: {
          is: {
            isActive: true,
            isPublic: true
          }
        },
        primaryCategory: {
          is: {
            isActive: true,
            v1PublicNavigation: true,
            v1CheckoutScope: true
          }
        }
      },
      select: {
        priceCents: true,
        currency: true
      }
    });

    const componentDerivedPrice = calculateViceBundleRegularPrice({
      viceSingle: singleVariant
        ? {
            priceCents: singleVariant.priceCents,
            currency: singleVariant.currency
          }
        : null,
      legacyViceBase: {
        priceCents: product.priceCents,
        currency: product.currency
      },
      whiteBallsSixPack: whiteBalls
    });

    if (!componentDerivedPrice) {
      return null;
    }

    return {
      variantKey: VICE_BUNDLE_VARIANT_KEY,
      name: VICE_BUNDLE_PUBLIC_LABEL,
      ...componentDerivedPrice
    };
  }

  private getAquaOfferItems(product: TableAccessoryOfferProductRecord | undefined) {
    if (!product || !this.isCheckoutableOfferProduct(product)) {
      return [];
    }

    return TABLE_ACCESSORY_PLAY_SET_VARIANT_KEYS.flatMap((variantKey) => {
      const variant = product.variants.find((candidate) => candidate.key === variantKey);

      if (!variant || !this.isCheckoutableOfferVariant(variant)) {
        return [];
      }

      const selectedOptions = this.serializeOfferSelectedOptions(variant);

      if (selectedOptions.length === 0 || !this.isValidOfferPrice(variant.priceCents)) {
        return [];
      }

      return [
        this.serializeTableAccessoryOfferItem({
          product,
          variant,
          role: "play_set",
          priceCents: variant.priceCents,
          currency: variant.currency,
          pricingSource: "catalog_variant",
          selectedOptions
        })
      ];
    });
  }

  private getViceOfferItems(
    product: TableAccessoryOfferProductRecord | undefined,
    whiteBalls: TableAccessoryOfferProductRecord | undefined
  ) {
    if (
      !product ||
      !whiteBalls ||
      !this.isCheckoutableOfferProduct(product) ||
      !this.isCheckoutableOfferProduct(whiteBalls)
    ) {
      return [];
    }

    const bundleVariant = product.variants.find(
      (variant) => variant.key === VICE_BUNDLE_VARIANT_KEY
    );
    const singleVariant = product.variants.find(
      (variant) => variant.key === VICE_SINGLE_VARIANT_KEY
    );

    if (
      !bundleVariant ||
      !singleVariant ||
      !bundleVariant.sku?.trim() ||
      !this.isCheckoutableOfferVariant(bundleVariant) ||
      !this.isCheckoutableOfferVariant(singleVariant)
    ) {
      return [];
    }

    const selectedOptions = this.serializeOfferSelectedOptions(bundleVariant);
    const derivedPrice = calculateViceBundleRegularPrice({
      viceSingle: {
        priceCents: singleVariant.priceCents,
        currency: singleVariant.currency
      },
      legacyViceBase: {
        priceCents: product.priceCents,
        currency: product.currency
      },
      whiteBallsSixPack: {
        priceCents: whiteBalls.priceCents,
        currency: whiteBalls.currency
      }
    });

    if (
      selectedOptions.length === 0 ||
      !derivedPrice ||
      derivedPrice.currency.trim().toLowerCase() !== "cad"
    ) {
      return [];
    }

    return [
      this.serializeTableAccessoryOfferItem({
        product,
        variant: bundleVariant,
        role: "play_set",
        priceCents: derivedPrice.priceCents,
        currency: derivedPrice.currency,
        pricingSource: derivedPrice.pricingSource,
        selectedOptions
      })
    ];
  }

  private getCoverOfferItem(product: TableAccessoryOfferProductRecord | undefined) {
    if (
      !product ||
      !this.isCheckoutableOfferProduct(product) ||
      !this.isValidOfferPrice(product.priceCents)
    ) {
      return null;
    }

    return this.serializeTableAccessoryOfferItem({
      product,
      variant: null,
      role: "cover",
      priceCents: product.priceCents,
      currency: product.currency,
      pricingSource: "catalog_product",
      selectedOptions: []
    });
  }

  private serializeTableAccessoryOfferItem(input: {
    currency: string;
    priceCents: number;
    pricingSource: "catalog_product" | "catalog_variant" | "component_derived";
    product: TableAccessoryOfferProductRecord;
    role: "cover" | "play_set";
    selectedOptions: Array<{ label: string; name: string; value: string }>;
    variant: TableAccessoryOfferVariantRecord | null;
  }) {
    const image = this.getTableAccessoryOfferImage(input.product, input.variant?.key ?? null);

    return {
      role: input.role,
      productKey: input.product.key,
      productSlug: input.product.slug,
      productName: input.product.name,
      variantKey: input.variant?.key ?? null,
      selectedOptions: input.selectedOptions,
      priceCents: input.priceCents,
      currency: input.currency,
      pricingSource: input.pricingSource,
      image
    };
  }

  private serializeOfferSelectedOptions(variant: TableAccessoryOfferVariantRecord) {
    return variant.optionValues
      .map(({ productOptionValue }) => ({
        name: productOptionValue.option.name,
        value: productOptionValue.value,
        label: productOptionValue.label?.trim() || productOptionValue.value,
        optionSortOrder: productOptionValue.option.sortOrder,
        valueSortOrder: productOptionValue.sortOrder
      }))
      .sort(
        (left, right) =>
          left.optionSortOrder - right.optionSortOrder || left.valueSortOrder - right.valueSortOrder
      )
      .map(({ name, value, label }) => ({
        name,
        value,
        label
      }));
  }

  private getTableAccessoryOfferImage(
    product: TableAccessoryOfferProductRecord,
    variantKey: string | null
  ) {
    const variantMedia = variantKey
      ? product.media.find(
          (media) => media.variant?.key === variantKey && media.cloudinarySecureUrl
        )
      : null;
    const productMedia =
      product.media.find((candidate) => !candidate.variant && candidate.cloudinarySecureUrl) ??
      null;
    const media =
      variantMedia ??
      productMedia ??
      (variantKey
        ? null
        : (product.media.find((candidate) => candidate.cloudinarySecureUrl) ?? null));

    return {
      url: media?.cloudinarySecureUrl ?? null,
      alt: media?.altText?.trim() || product.name
    };
  }

  private isTableAccessoryEligibleTable(product: TableAccessoryOfferProductRecord): boolean {
    return (
      product.productKind === "table" &&
      (TABLE_ACCESSORY_ELIGIBLE_TABLE_PRODUCT_KEYS as readonly string[]).includes(product.key)
    );
  }

  private isCheckoutableOfferProduct(product: TableAccessoryOfferProductRecord): boolean {
    const hasInvalidPartialViceVariantModel =
      product.key === VICE_PADDLE_PRODUCT_KEY &&
      product.variants.length > 0 &&
      !product.variants.some(
        (variant) =>
          variant.key === VICE_SINGLE_VARIANT_KEY && this.isCheckoutableOfferVariant(variant)
      );

    return (
      !hasInvalidPartialViceVariantModel &&
      product.status === "active" &&
      product.v1PublicNavigation &&
      product.v1CheckoutScope &&
      CHECKOUT_PURCHASE_MODES.has(product.purchaseMode) &&
      product.family.isActive &&
      product.family.isPublic &&
      product.primaryCategory.isActive &&
      product.primaryCategory.v1PublicNavigation &&
      product.primaryCategory.v1CheckoutScope &&
      product.currency.trim().toLowerCase() === "cad"
    );
  }

  private isCheckoutableOfferVariant(variant: TableAccessoryOfferVariantRecord): boolean {
    return (
      variant.isActive &&
      variant.currency.trim().toLowerCase() === "cad" &&
      (variant.purchaseModeOverride === null ||
        !NON_CHECKOUT_VARIANT_PURCHASE_MODES.has(variant.purchaseModeOverride))
    );
  }

  private isValidOfferPrice(value: unknown): value is number {
    return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
  }

  private serializeMedia(media: MediaRecord, includeInternal: boolean) {
    return {
      mediaKey: media.mediaKey,
      role: media.role,
      cloudinarySecureUrl: media.cloudinarySecureUrl,
      cloudinaryPublicId: media.cloudinaryPublicId,
      altText: media.altText,
      title: media.title,
      caption: media.caption,
      sortOrder: media.sortOrder,
      isPrimary: media.isPrimary,
      variantKey: media.variant?.key ?? null,
      ...(includeInternal
        ? {
            sourceUrl: media.sourceUrl,
            sourceProvider: media.sourceProvider,
            isPublic: media.isPublic,
            reviewStatus: media.reviewStatus
          }
        : {})
    };
  }

  private getDatabaseErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Catalog database is unreachable.";
  }
}
