import type { CatalogProductSummary } from "../types/catalog";
import { resolveProductMediaUrl } from "./product-media";

export interface CuratedReplacementPart {
  anchorId: string;
  assetId: string;
  body: string;
  cardLabel: string;
  compatibility: string;
  confirmationLabel: string;
  descriptor: string;
  featured: boolean;
  heading: string;
  humanNote?: string;
  included: readonly string[];
  legacyNote?: string;
  notIncluded?: string;
  rank: number;
  section: "featured-part" | "replacement-nets";
  slug: string;
  supportEmailKey: "part40" | "standardReplacementNet" | "expoPortlandNetUpgrade";
  supportPrompt: string;
}

export interface LiveCuratedReplacementPart {
  configuration: CuratedReplacementPart;
  imageUrl: string;
  product: CatalogProductSummary & { priceCents: number };
}

export const curatedReplacementParts: readonly CuratedReplacementPart[] = [
  {
    anchorId: "part-40",
    assetId: "replacement-part-40-primary",
    body: "If a selected Expo or Portland table gets opened the wrong way, this little clip is often what gives. It's cheap, easy to mail, and a much better fix than replacing the whole opening system.",
    cardLabel: "Most-requested fix",
    compatibility:
      "Part 40 is used on selected Expo Indoor, Expo Outdoor, Portland Indoor, and Portland Outdoor tables.",
    confirmationLabel: "Part 40 is in your cart.",
    descriptor: "Small clip. Big save.",
    featured: true,
    heading: "Part 40. Small clip. Big save.",
    included: ["One Part 40 replacement clip"],
    rank: 1,
    section: "featured-part",
    slug: "tiger-pingpong-replacement-part-40",
    supportEmailKey: "part40",
    supportPrompt: "Not sure? Send us a photo before ordering."
  },
  {
    anchorId: "standard-replacement-net",
    assetId: "tiger-replacement-net-primary-01",
    body: "A standard replacement net for any standard PingPong table—Tiger or otherwise.",
    cardLabel: "Net only",
    compatibility: "Use this when your existing posts and mounting hardware are still in place.",
    confirmationLabel: "Your replacement net is in your cart.",
    descriptor: "Keep the posts. Replace the net.",
    featured: false,
    heading: "Standard PingPong Replacement Net",
    included: ["One replacement net"],
    notIncluded: "Posts and mounting hardware are not included.",
    rank: 2,
    section: "replacement-nets",
    slug: "tiger-replacement-net",
    supportEmailKey: "standardReplacementNet",
    supportPrompt: "Not sure if you need the net or the full system? Send us a photo."
  },
  {
    anchorId: "expo-portland-net-upgrade",
    assetId: "tiger-table-net-replacement-set-primary-01",
    body: "A complete move to Tiger's current net system when an older setup is missing pieces.",
    cardLabel: "Complete upgrade",
    compatibility:
      "Fits every Tiger PingPong Expo and Portland table, indoor or outdoor. It does not fit Whistler or Plaza.",
    confirmationLabel: "Your Expo & Portland net upgrade system is in your cart.",
    descriptor: "Replace the whole net setup.",
    featured: false,
    heading: "Expo & Portland Net Upgrade System",
    humanNote: "We know that's more than a little fix.",
    included: [
      "Replacement net",
      "Two triangular support pieces",
      "Net-support assembly",
      "All installation hardware",
      "Two new side panels"
    ],
    legacyNote:
      "Older Expo and Portland tables used removable metal uprights, and those pieces were easy to misplace. The earlier and current hardware do not interchange piece by piece. If anything from the older setup is missing, this complete kit moves the table to the current system.",
    rank: 3,
    section: "replacement-nets",
    slug: "tiger-table-net-replacement-set",
    supportEmailKey: "expoPortlandNetUpgrade",
    supportPrompt: "Not sure which setup you have? Send us a photo before ordering."
  }
] as const;

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
