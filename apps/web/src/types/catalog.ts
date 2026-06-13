export interface CatalogCounts {
  brands: number;
  categories: number;
  productFamilies: number;
  products: number;
  variants: number;
  media: number;
}

export interface CatalogHealth {
  status: string;
  service: string;
  timestamp: string;
  counts: CatalogCounts;
}

export interface CatalogSummary {
  key: string;
  slug: string;
  name: string;
}

export interface CatalogCategory extends CatalogSummary {
  id: string;
  description: string | null;
  sortOrder: number;
  v1PublicNavigation: boolean;
  v1CheckoutScope: boolean;
  children: CatalogCategory[];
}

export interface CatalogFamily extends CatalogSummary {
  id: string;
  description: string | null;
  sortOrder: number;
  isPublic: boolean;
  isActive: boolean;
  brand: CatalogSummary;
  primaryCategory: CatalogSummary & {
    v1PublicNavigation: boolean;
    v1CheckoutScope: boolean;
  };
  products?: CatalogProductSummary[];
}

export interface ProductMediaSummary {
  mediaKey: string;
  role: string;
  cloudinarySecureUrl: string | null;
  altText: string | null;
  title: string | null;
  caption: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface CatalogProductVariantOption {
  name: string;
  displayName: string | null;
  value: string;
  label: string | null;
  sortOrder: number;
  optionSortOrder: number;
}

export interface CatalogProductVariantSummary {
  key: string;
  sku?: string | null;
  name: string | null;
  priceCents: number | null;
  currency: string;
  purchaseModeOverride: string | null;
  isActive: boolean;
  options: CatalogProductVariantOption[];
}

export interface CatalogProductSummary extends CatalogSummary {
  productKind: string;
  purchaseMode: string;
  priceCents: number | null;
  currency: string;
  v1PublicNavigation: boolean;
  v1CheckoutScope: boolean;
  shippingReviewRequired: boolean;
  family: CatalogSummary;
  category: CatalogSummary;
  primaryMedia: ProductMediaSummary | null;
}

export interface CatalogProductDetail extends Omit<CatalogProductSummary, "primaryMedia"> {
  shortDescription: string | null;
  description: string | null;
  media: ProductMediaSummary[];
  variants?: CatalogProductVariantSummary[];
  contentSections?: unknown[];
  specGroups?: unknown[];
  relationships?: Record<string, unknown>;
}

export interface CatalogCategoriesResponse {
  categories: CatalogCategory[];
}

export interface CatalogFamiliesResponse {
  productFamilies: CatalogFamily[];
}

export interface CatalogFamilyResponse {
  productFamily: CatalogFamily;
}

export interface CatalogProductsResponse {
  products: CatalogProductSummary[];
}

export interface CatalogProductResponse {
  product: CatalogProductDetail;
}
