import type { CatalogProductDetail, CatalogProductSummary } from "../types/catalog";

interface ProductMediaFallback {
  alt: string;
  caption: string | null;
  mediaKey?: string;
  role: string;
  src: string;
  title: string;
  variantKey?: string | null;
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
  // Temporary frontend-only fallback media until canonical catalog/Cloudinary media is complete.
  "tiger-expo-outdoor-table": [
    {
      alt: "Expo Outdoor table",
      caption: "Expo Outdoor table",
      role: "primary",
      src: "https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/114/601/expo_outdoor-01__84166.1651174263.jpg?c=1",
      title: "Expo Outdoor table"
    }
  ],
  "tiger-net-post-set": [
    {
      alt: "Tiger Ping Pong net and post set",
      caption: "Net and post set",
      role: "primary",
      src: "https://cdn11.bigcommerce.com/s-dh0jici9dm/products/128/images/644/home_accessories-net_post_set__11719.1650711219__23376.1659982669.386.513.png?c=1",
      title: "Net and post set"
    }
  ],
  "tiger-plaza-outdoor-table-grey": [
    {
      alt: "Plaza Outdoor table in grey",
      caption: "Plaza Outdoor table",
      role: "primary",
      src: "https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/117/409/plaza_outdoor-01__91454.1659978562.jpg?c=1",
      title: "Plaza Outdoor table"
    }
  ],
  "tiger-portland-indoor-table": [
    {
      alt: "Portland Indoor table",
      caption: "Portland Indoor table",
      role: "primary",
      src: "https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/115/609/portland_indoor-04__35084.1665858559.jpg?c=1",
      title: "Portland Indoor table"
    }
  ],
  "tiger-portland-outdoor-table": [
    {
      alt: "Portland Outdoor table",
      caption: "Portland Outdoor table",
      role: "primary",
      src: "https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/112/774/Portland_Outdoor_Black_-_Grey_Top__73629.1685479931.jpg?c=1",
      title: "Portland Outdoor table"
    },
    {
      alt: "Portland Outdoor table folded for solo play",
      caption: "Playback position",
      role: "alternate",
      src: "https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/original/image-manager/portland-outdoor-black-grey-top.jpg?t=1685557874",
      title: "Portland Outdoor playback position"
    },
    {
      alt: "Portland Outdoor adjustable net detail",
      caption: "Adjustable net",
      role: "detail",
      src: "https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/original/image-manager/adjustable-net.jpg?t=1685557091",
      title: "Portland Outdoor adjustable net"
    },
    {
      alt: "Portland Outdoor wheel detail",
      caption: "Wheel detail",
      role: "detail",
      src: "https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/original/image-manager/portland-wheel2.jpg?t=1685558011",
      title: "Portland Outdoor wheels"
    }
  ],
  "tiger-premium-balls-140": [
    {
      alt: "Tiger Ping Pong balls 140 pack",
      caption: "140 pack balls",
      role: "primary",
      src: "https://cdn11.bigcommerce.com/s-dh0jici9dm/products/126/images/655/Asset_63__05208__66402.1659978470.386.513.jpg?c=1",
      title: "Tiger Ping Pong balls"
    }
  ],
  "tiger-premium-balls-6-orange": [
    {
      alt: "Tiger Ping Pong orange balls 6 pack",
      caption: "Orange 6 pack balls",
      role: "primary",
      src: "https://cdn11.bigcommerce.com/s-dh0jici9dm/products/135/images/688/Asset_34__95063_600x600__38848.1652347243.386.513.jpg?c=1",
      title: "Orange ping pong balls"
    }
  ],
  "tiger-premium-balls-6-white": [
    {
      alt: "Tiger Ping Pong white balls 6 pack",
      caption: "White 6 pack balls",
      role: "primary",
      src: "https://res.cloudinary.com/djfcisldm/image/upload/v1781303660/tigerpingpong/products/tiger-premium-balls-6-white/01-main.jpg",
      title: "White ping pong balls"
    }
  ],
  "tiger-table-cover-black-polyester": [
    {
      alt: "Tiger Ping Pong table cover",
      caption: "Protective table cover",
      role: "primary",
      src: "/storefront/prototype/table-cover-transparent.png",
      title: "Tiger Ping Pong table cover"
    }
  ],
  "tiger-vice-paddle": [
    {
      alt: "Tiger PingPong Vice paddle in pink with a white ball.",
      caption: "Vice paddle",
      role: "primary",
      src: "https://res.cloudinary.com/djfcisldm/image/upload/v1781303652/tigerpingpong/products/tiger-vice-paddle/01-main.jpg",
      title: "Tiger PingPong Vice paddle"
    },
    {
      alt: "Pink Tiger PingPong Vice paddle on a transparent background.",
      caption: "Vice paddle",
      role: "alternate",
      src: "https://res.cloudinary.com/djfcisldm/image/upload/v1781745073/tigerpingpong/recovered/products/vice-paddle/tpp-vice-paddle-gallery-02.png",
      title: "Tiger PingPong Vice paddle cutout"
    }
  ],
  "tiger-aqua-outdoor-indoor-paddle": [
    {
      alt: "Tiger PingPong Aqua paddles in Ocean Blue and Canada Red",
      caption: "Ocean Blue and Canada Red Aqua paddles",
      mediaKey: "tiger-aqua-outdoor-indoor-paddle-primary-01",
      role: "primary",
      src: "https://res.cloudinary.com/djfcisldm/image/upload/v1784416233/tigerpingpong/products/tiger-aqua-outdoor-indoor-paddle/01-main.jpg",
      title: "Aqua paddles"
    },
    {
      alt: "Single Tiger PingPong Aqua paddle in Ocean Blue",
      caption: "Single · Ocean Blue",
      mediaKey: "tiger-aqua-outdoor-indoor-paddle-gallery-01",
      role: "variant",
      src: "https://res.cloudinary.com/djfcisldm/image/upload/v1784416234/tigerpingpong/products/tiger-aqua-outdoor-indoor-paddle/02-single-ocean-blue.jpg",
      title: "Aqua Ocean Blue single paddle",
      variantKey: "tiger-aqua-package-single-ocean-blue"
    },
    {
      alt: "Single Tiger PingPong Aqua paddle in Canada Red",
      caption: "Single · Canada Red",
      mediaKey: "tiger-aqua-outdoor-indoor-paddle-gallery-02",
      role: "variant",
      src: "https://res.cloudinary.com/djfcisldm/image/upload/v1784416235/tigerpingpong/products/tiger-aqua-outdoor-indoor-paddle/03-single-coral-red.jpg",
      title: "Aqua Canada Red single paddle",
      variantKey: "tiger-aqua-package-single-coral"
    },
    {
      alt: "Two Aqua paddles, one Ocean Blue and one Canada Red, with three balls",
      caption: "2 paddles + 3 balls",
      mediaKey: "tiger-aqua-outdoor-indoor-paddle-gallery-03",
      role: "variant",
      src: "https://res.cloudinary.com/djfcisldm/image/upload/v1784416235/tigerpingpong/products/tiger-aqua-outdoor-indoor-paddle/04-two-pack.jpg",
      title: "Aqua two-paddle package",
      variantKey: "tiger-aqua-package-2-pack-3-balls"
    },
    {
      alt: "Four Aqua paddles, two Ocean Blue and two Canada Red, with three balls",
      caption: "4 paddles + 3 balls",
      mediaKey: "tiger-aqua-outdoor-indoor-paddle-gallery-04",
      role: "variant",
      src: "https://res.cloudinary.com/djfcisldm/image/upload/v1784416236/tigerpingpong/products/tiger-aqua-outdoor-indoor-paddle/05-four-pack.jpg",
      title: "Aqua four-paddle package",
      variantKey: "tiger-aqua-package-4-pack-3-balls"
    },
    {
      alt: "Close view of the Aqua paddle face texture and moulded Tiger PingPong mark",
      caption: "Moulded face detail",
      mediaKey: "tiger-aqua-outdoor-indoor-paddle-gallery-05",
      role: "detail",
      src: "https://res.cloudinary.com/djfcisldm/image/upload/v1784416237/tigerpingpong/products/tiger-aqua-outdoor-indoor-paddle/06-face-detail.jpg",
      title: "Aqua face texture and Tiger mark"
    },
    {
      alt: "Close view of the Aqua paddle grip and three curved openings",
      caption: "Grip and curved openings",
      mediaKey: "tiger-aqua-outdoor-indoor-paddle-gallery-06",
      role: "detail",
      src: "https://res.cloudinary.com/djfcisldm/image/upload/v1784416238/tigerpingpong/products/tiger-aqua-outdoor-indoor-paddle/07-grip-detail.jpg",
      title: "Aqua grip detail"
    },
    {
      alt: "Aqua package lid beside Ocean Blue and Canada Red paddles fitted in the package window",
      caption: "Package lid and fitted window",
      mediaKey: "tiger-aqua-outdoor-indoor-paddle-gallery-07",
      role: "packaging",
      src: "https://res.cloudinary.com/djfcisldm/image/upload/v1784419487/tigerpingpong/products/tiger-aqua-outdoor-indoor-paddle/08-packaging-window.jpg",
      title: "Aqua package lid and fitted paddle window"
    }
  ],
  "tiger-whistler-indoor-table": [
    {
      alt: "Whistler Indoor table",
      caption: "Whistler Indoor table",
      role: "primary",
      src: "https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/116/623/whistler_indoor-04__70000.1665858593.jpg?c=1",
      title: "Whistler Indoor table"
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
      ? "Outdoor ping pong table for home play and outdoor rallies."
      : "Indoor ping pong table for home play and practice.";
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
