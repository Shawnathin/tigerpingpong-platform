import type { CatalogProductSummary } from "../types/catalog";
import { resolveProductMediaUrl } from "./product-media";

export interface CuratedReplacementPart {
  body: string;
  compatibility: string;
  featured: boolean;
  heading: string;
  rank: number;
  slug: string;
  supportPrompt: string;
}

export interface LiveCuratedReplacementPart {
  configuration: CuratedReplacementPart;
  imageUrl: string;
  product: CatalogProductSummary & { priceCents: number };
}

export const curatedReplacementParts = [
  {
    body: "If a selected Expo or Portland table gets opened the wrong way, this little clip is often what gives. It's cheap, easy to mail, and a much better fix than replacing the whole opening system.",
    compatibility:
      "Part 40 is used on selected Expo Indoor, Expo Outdoor, Portland Indoor, and Portland Outdoor tables.",
    featured: true,
    heading: "Part 40. Small clip. Big save.",
    rank: 1,
    slug: "tiger-pingpong-replacement-part-40",
    supportPrompt: "Not sure? Send us a photo before ordering."
  }
] as const satisfies readonly CuratedReplacementPart[];

export function resolveLiveCuratedReplacementParts(
  products: readonly CatalogProductSummary[]
): LiveCuratedReplacementPart[] {
  const productsBySlug = new Map(products.map((product) => [product.slug, product] as const));

  return [...curatedReplacementParts]
    .sort((left, right) => left.rank - right.rank)
    .flatMap((configuration) => {
      const product = productsBySlug.get(configuration.slug);

      if (!product || !isCheckoutReadyReplacementPart(product)) {
        return [];
      }

      const imageUrl = product.primaryMedia
        ? resolveProductMediaUrl(product.primaryMedia, product.slug)
        : null;

      if (!imageUrl) {
        return [];
      }

      return [
        {
          configuration,
          imageUrl,
          product: {
            ...product,
            priceCents: product.priceCents
          }
        }
      ];
    });
}

function isCheckoutReadyReplacementPart(
  product: CatalogProductSummary
): product is CatalogProductSummary & { priceCents: number } {
  return (
    product.productKind === "replacement_part" &&
    product.v1PublicNavigation &&
    product.v1CheckoutScope &&
    product.purchaseMode === "online_checkout" &&
    Number.isInteger(product.priceCents) &&
    (product.priceCents ?? 0) > 0 &&
    product.currency.toUpperCase() === "CAD" &&
    product.category.key === "replacement-parts"
  );
}
