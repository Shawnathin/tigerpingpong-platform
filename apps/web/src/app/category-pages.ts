import type { CategoryLandingPageConfig } from "./CategoryLandingPage";
import {
  TABLE_SHIPPING_MESSAGE,
  getAccessoryParentProductOrder,
  getTableProductOrder
} from "../lib/product-browsing";
import type { CatalogProductSummary } from "../types/catalog";

function normalizedText(...values: Array<string | null | undefined>): string {
  return values
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function hasMarker(product: CatalogProductSummary, marker: string): boolean {
  return normalizedText(
    product.productKind,
    product.key,
    product.slug,
    product.name,
    product.category.key,
    product.category.slug,
    product.category.name,
    product.family.key,
    product.family.slug,
    product.family.name
  ).includes(marker);
}

function isProductKind(product: CatalogProductSummary, kind: string): boolean {
  return normalizedText(product.productKind) === kind;
}

function isCategory(product: CatalogProductSummary, categoryKey: string): boolean {
  return product.category.key === categoryKey || product.category.slug === categoryKey;
}

function isReplacementPart(product: CatalogProductSummary): boolean {
  return hasMarker(product, "replacement-part") || hasMarker(product, "replacement-parts");
}

function isTable(product: CatalogProductSummary): boolean {
  return (
    !isReplacementPart(product) &&
    (isProductKind(product, "table") || isCategory(product, "tables"))
  );
}

function isAccessory(product: CatalogProductSummary): boolean {
  return !isReplacementPart(product) && !isTable(product);
}

function categoryConfig(
  config: Omit<CategoryLandingPageConfig, "emptyBody" | "emptyTitle" | "productCtaLabel"> & {
    emptyBody?: string;
    emptyTitle?: string;
    productCtaLabel?: string;
  }
): CategoryLandingPageConfig {
  return {
    emptyTitle: "This page is being prepared.",
    emptyBody:
      "The storefront is ready for this category route. Contact Tiger Ping Pong for current availability or product help.",
    productCtaLabel: "View product",
    ...config
  };
}

export const tableNavLinks = [
  { href: "/tables/", label: "All Tables" },
  { href: "/tables/indoor-tables/", label: "Indoor Tables" },
  { href: "/tables/outdoor-tables/", label: "Outdoor Tables" }
];

export const accessoryNavLinks = [
  { href: "/accessories/", label: "All Accessories" },
  { href: "/accessories/paddles/", label: "Paddles" },
  { href: "/accessories/ping-pong-balls/", label: "Balls" },
  { href: "/accessories/covers/", label: "Covers" },
  { href: "/accessories/nets/", label: "Nets" },
  { href: "/replacement-parts/", label: "Replacement Parts" }
];

export function getCategoryPageConfig(key: string): CategoryLandingPageConfig {
  const configs: Record<string, CategoryLandingPageConfig> = {
    tables: categoryConfig({
      activeItem: "tables",
      activeNavHref: "/tables/",
      eyebrow: "Shop tables",
      title: "PingPong Tables",
      heroImage: {
        alt: "Tiger Expo Outdoor ping pong table overlooking the Okanagan landscape",
        fit: "cover",
        src: "https://res.cloudinary.com/djfcisldm/image/upload/f_auto,q_auto,w_1200/v1784301152/tigerpingpong/storefront/category-heroes/ping-pong-tables.jpg"
      },
      mobileCategoryNavLinks: tableNavLinks,
      navLinks: tableNavLinks,
      productLayout: "editorial",
      productOrder: getTableProductOrder("all"),
      showProductRail: true,
      shippingMessage: TABLE_SHIPPING_MESSAGE,
      productFilter: isTable
    }),
    "indoor-tables": categoryConfig({
      activeItem: "tables",
      activeNavHref: "/tables/indoor-tables/",
      eyebrow: "Indoor tables",
      title: "Indoor tables",
      heroImageSlug: "tiger-portland-indoor-table",
      mobileCategoryNavLinks: tableNavLinks,
      navLinks: tableNavLinks,
      productLayout: "editorial",
      productOrder: getTableProductOrder("indoor"),
      productRailLabels: {
        "tiger-portland-indoor-table": "Portland Indoor Table",
        "tiger-whistler-indoor-table": "Whistler Indoor Table"
      },
      showProductRail: true,
      shippingMessage: TABLE_SHIPPING_MESSAGE,
      productFilter: (product) => isTable(product) && hasMarker(product, "indoor")
    }),
    "outdoor-tables": categoryConfig({
      activeItem: "tables",
      activeNavHref: "/tables/outdoor-tables/",
      eyebrow: "Outdoor tables",
      title: "Outdoor tables",
      heroImageSlug: "tiger-portland-outdoor-table",
      mobileCategoryNavLinks: tableNavLinks,
      navLinks: tableNavLinks,
      productLayout: "editorial",
      productOrder: getTableProductOrder("outdoor"),
      showProductRail: true,
      shippingMessage: TABLE_SHIPPING_MESSAGE,
      productFilter: (product) => isTable(product) && hasMarker(product, "outdoor")
    }),
    accessories: categoryConfig({
      activeItem: "accessories",
      eyebrow: "Shop accessories",
      title: "Accessories",
      heroImageSlug: "tiger-vice-paddle",
      navLinks: accessoryNavLinks,
      productOrder: getAccessoryParentProductOrder(),
      productFilter: isAccessory
    }),
    paddles: categoryConfig({
      activeItem: "paddles",
      eyebrow: "Shop paddles",
      title: "Paddles",
      heroImageSlug: "tiger-vice-paddle",
      navLinks: accessoryNavLinks,
      productFilter: (product) => !isReplacementPart(product) && isProductKind(product, "paddle")
    }),
    balls: categoryConfig({
      activeItem: "balls",
      eyebrow: "Shop balls",
      title: "Ping pong balls",
      heroImageSlug: "tiger-premium-balls-140",
      navLinks: accessoryNavLinks,
      productFilter: (product) => !isReplacementPart(product) && isProductKind(product, "ball")
    }),
    covers: categoryConfig({
      activeItem: "accessories",
      eyebrow: "Shop covers",
      title: "Table covers",
      heroImageSlug: "tiger-table-cover-black-polyester",
      navLinks: accessoryNavLinks,
      productFilter: (product) => !isReplacementPart(product) && isProductKind(product, "cover")
    }),
    nets: categoryConfig({
      activeItem: "accessories",
      eyebrow: "Shop nets",
      title: "Nets and post sets",
      heroImageSlug: "tiger-net-post-set",
      navLinks: accessoryNavLinks,
      productFilter: (product) => !isReplacementPart(product) && isProductKind(product, "net")
    }),
    "replacement-parts": categoryConfig({
      activeItem: "accessories",
      eyebrow: "Replacement parts",
      title: "Replacement parts",
      navLinks: accessoryNavLinks,
      emptyTitle: "Replacement parts are handled with support confirmation.",
      emptyBody:
        "Tell us the product name, part needed, and any order reference you have so we can help identify the right replacement part.",
      productFilter: isReplacementPart,
      productCtaLabel: "Contact support",
      productHref: () => "/contact"
    })
  };

  return configs[key] ?? configs.tables;
}
