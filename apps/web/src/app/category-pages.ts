import type { CategoryLandingPageConfig } from "./CategoryLandingPage";
import { TABLE_SHIPPING_MESSAGE, getTableProductOrder } from "../lib/product-browsing";
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
      eyebrow: "Shop tables",
      title: "Ping pong tables for home, school, club, and outdoor play.",
      intro:
        "Browse Tiger Ping Pong tables with secure checkout, product details, and Canada-wide shipping terms.",
      heroImageSlug: "tiger-portland-outdoor-table",
      navLinks: tableNavLinks,
      productLayout: "editorial",
      productOrder: getTableProductOrder("all"),
      shippingMessage: TABLE_SHIPPING_MESSAGE,
      productFilter: isTable
    }),
    "indoor-tables": categoryConfig({
      activeItem: "tables",
      eyebrow: "Indoor tables",
      title: "Indoor ping pong tables for practice, family play, and game rooms.",
      intro:
        "Explore indoor Tiger Ping Pong table options, including Portland and Whistler indoor table products where available.",
      heroImageSlug: "tiger-portland-indoor-table",
      navLinks: tableNavLinks,
      productLayout: "editorial",
      productOrder: getTableProductOrder("indoor"),
      shippingMessage: TABLE_SHIPPING_MESSAGE,
      productFilter: (product) => isTable(product) && hasMarker(product, "indoor")
    }),
    "outdoor-tables": categoryConfig({
      activeItem: "tables",
      eyebrow: "Outdoor tables",
      title: "Outdoor ping pong tables built for patios, parks, and fresh-air rallies.",
      intro:
        "Explore outdoor Tiger Ping Pong table options with storefront checkout and Canada-wide shipping terms.",
      heroImageSlug: "tiger-portland-outdoor-table",
      navLinks: tableNavLinks,
      productLayout: "editorial",
      productOrder: getTableProductOrder("outdoor"),
      shippingMessage: TABLE_SHIPPING_MESSAGE,
      productFilter: (product) => isTable(product) && hasMarker(product, "outdoor")
    }),
    accessories: categoryConfig({
      activeItem: "accessories",
      eyebrow: "Shop accessories",
      title: "Paddles, balls, covers, nets, and table tennis accessories.",
      intro:
        "Round out the table setup with Tiger Ping Pong accessories for play, protection, and replacement setup needs.",
      heroImageSlug: "tiger-vice-paddle",
      navLinks: accessoryNavLinks,
      productFilter: isAccessory
    }),
    paddles: categoryConfig({
      activeItem: "paddles",
      eyebrow: "Shop paddles",
      title: "Ping pong paddles for quick matches and everyday rallies.",
      intro: "Browse Tiger Ping Pong paddle products for home play and friendly table tennis.",
      heroImageSlug: "tiger-vice-paddle",
      navLinks: accessoryNavLinks,
      productFilter: (product) => !isReplacementPart(product) && isProductKind(product, "paddle")
    }),
    balls: categoryConfig({
      activeItem: "balls",
      eyebrow: "Shop balls",
      title: "Ping pong balls for practice, games, and restocks.",
      intro:
        "Browse Tiger Ping Pong ball packs for home play, practice, and table tennis restocks.",
      heroImageSlug: "tiger-premium-balls-140",
      navLinks: accessoryNavLinks,
      productFilter: (product) => !isReplacementPart(product) && isProductKind(product, "ball")
    }),
    covers: categoryConfig({
      activeItem: "accessories",
      eyebrow: "Shop covers",
      title: "Ping pong table covers for protecting the next match.",
      intro:
        "Browse table cover accessories for Tiger Ping Pong setups and keep the table ready between games.",
      heroImageSlug: "tiger-table-cover-black-polyester",
      navLinks: accessoryNavLinks,
      productFilter: (product) => !isReplacementPart(product) && isProductKind(product, "cover")
    }),
    nets: categoryConfig({
      activeItem: "accessories",
      eyebrow: "Shop nets",
      title: "Table tennis nets and post sets for everyday setup.",
      intro: "Browse net and post products for keeping a Tiger Ping Pong table ready to play.",
      heroImageSlug: "tiger-net-post-set",
      navLinks: accessoryNavLinks,
      productFilter: (product) => !isReplacementPart(product) && isProductKind(product, "net")
    }),
    "replacement-parts": categoryConfig({
      activeItem: "accessories",
      eyebrow: "Replacement parts",
      title: "Replacement parts support for Tiger Ping Pong products.",
      intro:
        "Find replacement-parts support for Tiger Ping Pong tables and accessories. Contact support when a specific part needs confirmation.",
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
