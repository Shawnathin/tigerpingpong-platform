import type { CatalogProductDetail, CatalogProductSummary } from "../types/catalog";

interface ProductMediaFallback {
  alt: string;
  caption: string | null;
  role: string;
  src: string;
  title: string;
}

type StorefrontCopyProduct = Pick<
  CatalogProductDetail,
  "category" | "description" | "family" | "name" | "productKind" | "shortDescription" | "slug"
>;

type StorefrontSummaryProduct = Pick<
  CatalogProductSummary,
  "category" | "family" | "name" | "productKind" | "slug"
>;

const PRODUCT_MEDIA_FALLBACKS: Record<string, ProductMediaFallback[]> = {
  "tiger-table-cover-black-polyester": [
    {
      alt: "Ping pong table cover product image",
      caption: "Protective table cover",
      role: "primary",
      src: "/storefront/prototype/table-cover-transparent.png",
      title: "Table cover"
    }
  ],
  "tiger-vice-paddle": [
    {
      alt: "Ping pong paddle product image",
      caption: "Paddle demo image",
      role: "primary",
      src: "/storefront/prototype/aqua-paddle/red-paddle-single-cutout.png",
      title: "Paddle"
    },
    {
      alt: "Alternate ping pong paddle product image",
      caption: "Alternate paddle demo image",
      role: "alternate",
      src: "/storefront/prototype/aqua-paddle/blue-paddle-single-cutout.png",
      title: "Alternate paddle"
    },
    {
      alt: "Paddle box product image",
      caption: "Paddle box demo image",
      role: "packaging",
      src: "/storefront/prototype/aqua-paddle/aqua-4count-box-angle.jpg",
      title: "Paddle box"
    }
  ]
};

const INTERNAL_COPY_MARKERS = [
  "business correction",
  "business sku",
  "candidate",
  "checkout readiness",
  "global checkout policy",
  "mapped by business",
  "placeholder",
  "requires table freight",
  "source notes",
  "source product",
  "source row"
];

export function getProductMediaFallbacks(slug: string): ProductMediaFallback[] {
  return PRODUCT_MEDIA_FALLBACKS[slug] ?? [];
}

export function getPrimaryProductMediaFallback(slug: string): ProductMediaFallback | null {
  return getProductMediaFallbacks(slug)[0] ?? null;
}

export function getProductCardPitch(product: StorefrontSummaryProduct): string {
  const kind = normalizeKind(product.productKind);
  const name = product.name.toLowerCase();

  if (kind === "table") {
    return name.includes("outdoor")
      ? "Outdoor ping pong table for home play, outdoor rallies, and Canada-wide shipping."
      : "Indoor ping pong table for home play, practice, and Canada-wide shipping.";
  }

  if (kind === "paddle") {
    return "A table tennis paddle for ping pong rallies, home play, and friendly matches.";
  }

  if (kind === "ball") {
    return "Table tennis balls for practice, home play, and quick restocks.";
  }

  if (kind === "cover") {
    return "A ping pong table cover accessory for keeping the next home match ready.";
  }

  if (kind === "net") {
    return "A table tennis net and post set for everyday ping pong setup.";
  }

  return `Explore this ${formatKind(product.productKind).toLowerCase()} from the ${
    product.family.name
  } lineup.`;
}

export function getProductShortCopy(product: StorefrontCopyProduct): string {
  const shortDescription = getCustomerReadyCopy(product.shortDescription);

  if (shortDescription) {
    return shortDescription;
  }

  const kind = normalizeKind(product.productKind);
  const name = product.name.toLowerCase();

  if (kind === "table") {
    return name.includes("outdoor")
      ? "A Tiger PingPong outdoor table option for home play and outdoor rallies."
      : "A Tiger PingPong indoor table option for home play and table tennis practice.";
  }

  if (kind === "paddle") {
    return "A ping pong paddle for table tennis rallies, home play, and friendly matches.";
  }

  if (kind === "ball") {
    return "A table tennis ball pack for ping pong practice, home play, and spare supplies.";
  }

  if (kind === "cover") {
    return "A ping pong table cover accessory for between-match protection at home.";
  }

  if (kind === "net") {
    return "A table tennis net and post accessory for everyday ping pong setup.";
  }

  return `A Tiger Ping Pong ${formatKind(product.productKind).toLowerCase()} from the ${
    product.family.name
  } lineup.`;
}

export function getProductDescriptionCopy(product: StorefrontCopyProduct): string {
  const description = getCustomerReadyCopy(product.description);

  if (description) {
    return description;
  }

  const kind = normalizeKind(product.productKind);
  const name = product.name.toLowerCase();

  if (kind === "table") {
    return name.includes("outdoor")
      ? "A Tiger PingPong outdoor table option for home play and outdoor rallies. Review current pricing, checkout availability, and Canada-wide shipping terms before purchase."
      : "A Tiger PingPong indoor table option for home play and regular table tennis practice. Review current pricing, checkout availability, and Canada-wide shipping terms before purchase.";
  }

  if (kind === "paddle") {
    return "A table tennis paddle for casual ping pong rallies, home play, and friendly matches. Canada-wide shipping terms are shown before checkout.";
  }

  if (kind === "ball") {
    return "A practical table tennis ball pack for ping pong practice, home play, and keeping spares ready. Canada-wide shipping terms are shown before checkout.";
  }

  if (kind === "cover") {
    return "A ping pong table cover accessory for keeping a table covered between matches and home play sessions. Not compatible with the Tiger Plaza Table based on current catalog notes.";
  }

  if (kind === "net") {
    return "A table tennis net and post accessory for everyday ping pong setup at home or shared play spaces. Canada-wide shipping terms are shown before checkout.";
  }

  return `A Tiger Ping Pong ${formatKind(product.productKind).toLowerCase()} from the ${
    product.family.name
  } lineup. Review current pricing, checkout availability, and Canada-wide shipping terms before purchase.`;
}

function getCustomerReadyCopy(value: string | null | undefined): string | null {
  const copy = value?.trim();

  if (!copy) {
    return null;
  }

  const normalizedCopy = copy.toLowerCase();

  if (INTERNAL_COPY_MARKERS.some((marker) => normalizedCopy.includes(marker))) {
    return null;
  }

  return copy;
}

function normalizeKind(productKind: string): string {
  return productKind.trim().toLowerCase().replace(/_/g, "-");
}

function formatKind(productKind: string): string {
  return productKind
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
