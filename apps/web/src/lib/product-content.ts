import normalizedProductContentData from "../../../../data/product-content/tigerpingpong-product-content-normalized.json";

export interface NormalizedProductContentPriceRange {
  max: number;
  min: number;
}

export interface NormalizedProductContentPrice {
  currency: string;
  priceCents: number | null;
  priceRangeCents: NormalizedProductContentPriceRange | null;
  priceText: string | null;
  reviewNote: string | null;
}

export interface NormalizedProductContentCategory {
  label: string | null;
  path: string[];
}

export interface NormalizedProductContentSeoField {
  sourceEvidence: string;
  text: string | null;
}

export interface NormalizedProductContentSeo {
  description: NormalizedProductContentSeoField;
  title: NormalizedProductContentSeoField;
}

export interface NormalizedProductContentSource {
  file: string;
  legacyPath: string | null;
  legacyShippingNotes: string | null;
  legacyShippingNotesUsage: string;
  legacySlug: string | null;
  sourceUrl: string | null;
}

export interface NormalizedProductContentReview {
  contentQualityNotes: string | null;
  humanReviewNeeded: boolean;
  humanReviewReason: string | null;
  missingFields: string[];
  needsReview: boolean;
  normalizationNotes: string[];
}

export interface NormalizedProductContent {
  availableOptions: string[];
  brand: string | null;
  category: NormalizedProductContentCategory;
  currentAppSlug: string | null;
  dimensions: string | null;
  humanReviewNeeded: boolean;
  includedItems: string[];
  keyFeatures: string[];
  legacySlug: string | null;
  longDescription: string | null;
  mediaNotes: string | null;
  name: string | null;
  needsReview: boolean;
  price: NormalizedProductContentPrice;
  productType: string | null;
  review: NormalizedProductContentReview;
  seo: NormalizedProductContentSeo;
  shortDescription: string | null;
  slug: string | null;
  slugAliases: string[];
  source: NormalizedProductContentSource;
  specifications: string[];
  warrantyNotes: string | null;
}

export interface NormalizedProductContentArtifact {
  artifact: string;
  generatedAt: string;
  generatedFrom: string;
  productCount: number;
  products: NormalizedProductContent[];
  publicShippingCopyPolicy: {
    inStockHandling: string;
    note: string;
    orders100CadOrUnder: string;
    ordersOver100Cad: string;
  };
  version: number;
}

const normalizedProductContent =
  normalizedProductContentData as NormalizedProductContentArtifact;

const productContentBySlug = new Map<string, NormalizedProductContent>();

for (const product of normalizedProductContent.products) {
  for (const slug of [product.slug, product.currentAppSlug, product.legacySlug, ...product.slugAliases]) {
    const normalizedSlug = normalizeSlug(slug);

    if (normalizedSlug && !productContentBySlug.has(normalizedSlug)) {
      productContentBySlug.set(normalizedSlug, product);
    }
  }
}

export function getProductContentBySlug(slug: string): NormalizedProductContent | null {
  return productContentBySlug.get(normalizeSlug(slug)) ?? null;
}

export function getNormalizedProductContent(): readonly NormalizedProductContent[] {
  return normalizedProductContent.products;
}

function normalizeSlug(slug: string | null | undefined): string {
  return slug?.trim().toLowerCase() ?? "";
}
