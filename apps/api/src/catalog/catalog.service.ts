import { Injectable, NotFoundException, OnModuleDestroy, ServiceUnavailableException } from "@nestjs/common";
import { createDatabaseConfig, Prisma, PrismaClient } from "@tigerpingpong/db";

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
  reviewStatus: true
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
      const [brands, categories, productFamilies, products, variants, media] =
        await Promise.all([
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

  async getFamilyBySlug(
    slug: string,
    options: CatalogRequestOptions
  ): Promise<unknown> {
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
              where: {
                isActive: true
              },
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
          where: {
            isActive: true
          },
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

  async getProductBySlug(
    slug: string,
    options: CatalogRequestOptions
  ): Promise<unknown> {
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
          where: {
            isActive: true
          },
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
          where: this.getRelationshipWhere(options.includeInternal),
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
          where: this.getRelationshipWhere(options.includeInternal),
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

    return {
      product: this.serializeProductDetail(product, options.includeInternal)
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
      productKind: {
        not: "replacement_part"
      },
      purchaseMode: {
        not: "deferred_from_v1"
      }
    };
  }

  private getRelationshipWhere(includeInternal: boolean): Prisma.ProductRelationshipWhereInput {
    return {
      isActive: true,
      ...(includeInternal
        ? {}
        : {
            isPublic: true
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
      children: node.children.map((child) =>
        this.serializeCategoryNode(child, includeInternal)
      )
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

  private serializeProductListItem(
    product: ProductListRecord,
    includeInternal: boolean
  ) {
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
      primaryMedia: primaryMedia
        ? this.serializeMedia(primaryMedia, includeInternal)
        : null,
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
    includeInternal: boolean
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
      variants: product.variants.map((variant) => ({
        key: variant.key,
        sku: includeInternal ? variant.sku : undefined,
        name: variant.name,
        priceCents: variant.priceCents,
        currency: variant.currency,
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
      })),
      media: product.media.map((media) =>
        this.serializeMedia(media, includeInternal)
      ),
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

  private serializeMedia(media: MediaRecord, includeInternal: boolean) {
    return {
      mediaKey: media.mediaKey,
      role: media.role,
      cloudinarySecureUrl: media.cloudinarySecureUrl,
      altText: media.altText,
      title: media.title,
      caption: media.caption,
      sortOrder: media.sortOrder,
      isPrimary: media.isPrimary,
      ...(includeInternal
        ? {
            cloudinaryPublicId: media.cloudinaryPublicId,
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
