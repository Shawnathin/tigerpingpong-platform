import {
  getProductContentBySlug,
  type NormalizedProductContent
} from "../../../../lib/product-content";
import {
  getTableSupportResource,
  type TableSupportResource
} from "../../../../lib/table-support-resources";
import { tigerTablesProductStories } from "../../../../lib/tiger-story";
import type {
  CatalogProductDetail,
  CatalogProductSummary,
  CatalogProductVariantSummary
} from "../../../../types/catalog";

import {
  ProductFeatureCarousel,
  type ProductFeatureMoment,
  type ProductFeatureVisual
} from "./ProductFeatureCarousel";
import styles from "./page.module.css";

export const TABLE_COMPARISON_PRODUCT_SLUGS = [
  "tiger-expo-outdoor-table",
  "tiger-portland-indoor-table",
  "tiger-portland-outdoor-table",
  "tiger-whistler-indoor-table",
  "tiger-plaza-outdoor-table-grey"
];

interface LabeledValue {
  label: string;
  note?: string;
  value: string;
}

interface DetailCard {
  items?: string[];
  title: string;
  value?: string;
  visual?: ProductFeatureVisual;
}

type ComparisonValueKey =
  | "primaryUse"
  | "tableTop"
  | "bounceLevel"
  | "weatherproof"
  | "frameStyle"
  | "foldingStyle"
  | "wheels"
  | "netSystem"
  | "bestFor";

interface ComparisonRow {
  key: ComparisonValueKey;
  label: string;
}

interface TableDisplayContent {
  comparisonHeading: string;
  featureMoments: ProductFeatureMoment[];
  moreFeaturesEyebrow?: string;
  moreFeaturesHeading: string;
  moreFeatures: DetailCard[];
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { key: "primaryUse", label: "Primary Use" },
  { key: "tableTop", label: "Table Top" },
  { key: "bounceLevel", label: "Bounce Level" },
  { key: "weatherproof", label: "Weatherproof" },
  { key: "frameStyle", label: "Frame Style" },
  { key: "foldingStyle", label: "Folding Style" },
  { key: "wheels", label: "Wheels" },
  { key: "netSystem", label: "Net System" },
  { key: "bestFor", label: "Best For" }
];

const TABLE_DISPLAY_LABELS: Record<string, string> = {
  "tiger-expo-outdoor-table": "Expo Outdoor",
  "tiger-plaza-outdoor-table-grey": "Plaza",
  "tiger-portland-indoor-table": "Portland Indoor",
  "tiger-portland-outdoor-table": "Portland Outdoor",
  "tiger-whistler-indoor-table": "Whistler"
};

const PRODUCT_DISPLAY_LABELS: Record<string, string> = {
  ...TABLE_DISPLAY_LABELS,
  "tiger-net-post-set": "Net & Post Set",
  "tiger-premium-balls-140": "140-Pack Balls",
  "tiger-premium-balls-6-orange": "6-Pack Orange",
  "tiger-premium-balls-6-white": "6-Pack White",
  "tiger-table-cover-black-polyester": "Table Cover",
  "tiger-vice-paddle": "Vice Paddle"
};

const UNSAFE_TEXT_MARKERS = [
  "candidate",
  "confirm",
  "current stock",
  "customer review",
  "download link",
  "free across canada",
  "free over",
  "google drive",
  "gtin",
  "human review",
  "language appears",
  "missing/not visible",
  "msrp",
  "page also lists",
  "page-source",
  "review needed",
  "schema",
  "source-page",
  "title / color option",
  "upc",
  "usually ships",
  "verify whether",
  "warranty"
];

const UNSAFE_SPEC_LABEL_MARKERS = [
  "availability",
  "current stock",
  "download link",
  "gtin",
  "material language",
  "msrp",
  "shipping",
  "sku",
  "upc",
  "warranty"
];
const TABLE_COLOR_SPEC_LABEL_MARKERS = ["color", "colour", "colors", "colours"];

const BONUS_MARKERS = ["bonus", "$50 paddle package"];
const BALL_REVIEW_MARKERS = ["ittf", "material listed"];
const COLOR_OPTION_LABELS = new Set([
  "black",
  "blue",
  "gray",
  "green",
  "grey",
  "orange",
  "pink",
  "white"
]);

const CLOUDINARY_PRODUCT_DETAIL_BASE =
  "https://res.cloudinary.com/djfcisldm/image/upload/f_auto,q_auto/tigerpingpong/products";

function detailVisual(productSlug: string, assetSlug: string, alt: string): ProductFeatureVisual {
  return {
    alt,
    src: `${CLOUDINARY_PRODUCT_DETAIL_BASE}/${productSlug}/details/${assetSlug}`
  };
}

const TABLE_DISPLAY_CONTENT: Record<string, TableDisplayContent> = {
  "tiger-expo-outdoor-table": {
    comparisonHeading: "See how Expo stacks up.",
    featureMoments: [
      {
        description:
          "Expo uses a pure melamine resin board with a matte anti-reflective finish, made to resist weather, impact, and everyday outdoor play.",
        kicker: "Weather-ready bounce",
        title: "5mm Melamine Resin Top",
        visual: detailVisual(
          "tiger-expo-outdoor-table",
          "5mm-melamine-resin-top",
          "Close-up of the Expo Outdoor table's 5mm melamine resin playing surface"
        )
      },
      {
        description:
          "The 50mm powder-coated steel frame and 30 x 30mm legs keep Expo steady while preserving an easy-to-move outdoor footprint.",
        kicker: "Strength and stability",
        title: "50mm Powder-Coated Frame",
        visual: detailVisual(
          "tiger-expo-outdoor-table",
          "50mm-powder-coated-frame",
          "Expo Outdoor table's powder-coated frame and undercarriage"
        )
      },
      {
        description:
          "A highly visible handle and quick-lock folding system secure the table in play or storage position, so folding and rolling the table feels simple.",
        kicker: "Simple open and close",
        title: "Quick-Lock Folding System",
        visual: detailVisual(
          "tiger-expo-outdoor-table",
          "quick-lock-folding-system",
          "Red handle for the Expo Outdoor quick-lock folding system"
        )
      },
      {
        description:
          "The included fixed black net is height and tension adjustable, and stays with the table when it is folded away.",
        kicker: "Ready when you open it",
        title: "Fixed Adjustable Net",
        visual: detailVisual(
          "tiger-expo-outdoor-table",
          "fixed-adjustable-net",
          "Fixed adjustable net attached to the Expo Outdoor table"
        )
      },
      {
        description:
          "Four 128mm double wheels with rubber tread make Expo easier to move across patios, garages, and backyard spaces.",
        kicker: "Rolls across patios",
        title: "Double Outdoor Wheels",
        visual: detailVisual(
          "tiger-expo-outdoor-table",
          "double-outdoor-wheels",
          "Double outdoor wheels on the Expo Outdoor table"
        )
      }
    ],
    moreFeaturesHeading: "The little details.",
    moreFeatures: [
      {
        title: "Single Frame Rollaway",
        value:
          "A compact frame and quick-lock folding system help one person fold and roll the table away.",
        visual: detailVisual(
          "tiger-expo-outdoor-table",
          "single-frame-rollaway",
          "Expo Outdoor table folded into its single-frame rollaway position"
        )
      },
      {
        title: "Playback Position",
        value: "Fold one side up and practice solo between matches.",
        visual: {
          alt: "Blue Expo Outdoor table with one side raised for solo playback",
          src: "https://res.cloudinary.com/djfcisldm/image/upload/f_auto,q_auto,c_limit,w_800/v1784575467/tigerpingpong/products/tiger-expo-outdoor-table/owner-gallery/expo-playback-blue-owner-01.jpg"
        }
      },
      {
        title: "Built-In Storage",
        value: "Storage for up to 4 paddles and 18 balls keeps gear close.",
        visual: detailVisual(
          "tiger-expo-outdoor-table",
          "built-in-storage",
          "Built-in paddle and ball storage on the Expo Outdoor table"
        )
      }
    ]
  },
  "tiger-plaza-outdoor-table-grey": {
    comparisonHeading: "See how Plaza stacks up.",
    featureMoments: [
      {
        description:
          "A 10mm melamine resin top gives Plaza its solid, confident outdoor feel, with a surface made for weather, public use, and repeat play.",
        kicker: "Permanent outdoor bounce",
        title: "10mm Resin Playing Surface",
        visual: detailVisual(
          "tiger-plaza-outdoor-table-grey",
          "10mm-resin-playing-surface",
          "Close-up of the Plaza table's 10mm resin playing surface"
        )
      },
      {
        description:
          "The galvanized steel frame is made for permanent placement, with a powder-coated finish that keeps the look clean and durable.",
        kicker: "Park-ready structure",
        title: "Galvanized Steel Frame",
        visual: detailVisual(
          "tiger-plaza-outdoor-table-grey",
          "galvanized-steel-frame",
          "Galvanized steel frame underneath the Plaza outdoor table"
        )
      },
      {
        description:
          "Plaza includes the hardware needed to secure the table in place, ideal for parks, resorts, schools, shared patios, and public play areas.",
        kicker: "Install and leave it ready",
        title: "Ground Anchoring Kit",
        visual: detailVisual(
          "tiger-plaza-outdoor-table-grey",
          "ground-anchoring-kit",
          "Ground anchoring bracket on the Plaza outdoor table"
        )
      },
      {
        description:
          "The permanent metal net keeps the table ready for play without clips, tension straps, or a removable net that needs to be stored.",
        kicker: "No loose parts",
        title: "Solid Metal Net",
        visual: detailVisual(
          "tiger-plaza-outdoor-table-grey",
          "solid-metal-net",
          "Solid metal net on the Plaza outdoor table"
        )
      },
      {
        description:
          "A simple fixed footprint makes Plaza easy to understand, easy to keep ready, and a strong fit for spaces where people come and go.",
        kicker: "Low-maintenance setup",
        title: "Made for Shared Spaces",
        visual: {
          alt: "Plaza Outdoor permanent table",
          src: "https://res.cloudinary.com/djfcisldm/image/upload/v1784269866/tigerpingpong/products/tiger-plaza-outdoor-table-grey/refresh-20260716-primary.jpg"
        }
      }
    ],
    moreFeaturesEyebrow: "Permanent details",
    moreFeaturesHeading: "The little details.",
    moreFeatures: [
      {
        title: "Thick Outdoor Top",
        value: "10mm resin surface for steady outdoor bounce and durability.",
        visual: detailVisual(
          "tiger-plaza-outdoor-table-grey",
          "10mm-resin-playing-surface",
          "Close-up of the Plaza table's 10mm resin playing surface"
        )
      },
      {
        title: "Anchored In Place",
        value: "Ground anchor kit helps keep the table secure in shared spaces.",
        visual: detailVisual(
          "tiger-plaza-outdoor-table-grey",
          "ground-anchoring-kit",
          "Ground anchoring bracket on the Plaza outdoor table"
        )
      },
      {
        title: "Permanent Steel Net",
        value: "Solid net system stays attached and ready between matches.",
        visual: detailVisual(
          "tiger-plaza-outdoor-table-grey",
          "solid-metal-net",
          "Solid metal net on the Plaza outdoor table"
        )
      }
    ]
  },
  "tiger-portland-indoor-table": {
    comparisonHeading: "See how Portland Indoor stacks up.",
    featureMoments: [
      {
        description:
          "Portland Indoor uses a 22mm chipboard playing surface manufactured with tournament-style production processes for a smooth, steady indoor bounce.",
        kicker: "Clean indoor bounce",
        title: "7/8 Inch Chipboard Top",
        visual: detailVisual(
          "tiger-portland-indoor-table",
          "seven-eighths-inch-chipboard-top",
          "Close-up of the Portland Indoor table's 7/8 inch chipboard top"
        )
      },
      {
        description:
          "The 50mm powder-coated frame and compact undercarriage give the table a sturdy, clean look for homes, schools, and club rooms.",
        kicker: "Strength and stability",
        title: "50mm Powder-Coated Frame",
        visual: detailVisual(
          "tiger-portland-indoor-table",
          "50mm-powder-coated-frame",
          "Powder-coated frame and undercarriage of the Portland Indoor table"
        )
      },
      {
        description:
          "A visible handle and safety lock system help one person fold, open, and store the table with a secure feel.",
        kicker: "Simple open and close",
        title: "Smart Locking System",
        visual: detailVisual(
          "tiger-portland-indoor-table",
          "smart-locking-system",
          "Red handle for the Portland Indoor smart locking system"
        )
      },
      {
        description:
          "The included net stays compact with the table and adjusts for height and tension, so setup feels quick before each match.",
        kicker: "Ready when you open it",
        title: "Fixed Adjustable Net",
        visual: detailVisual(
          "tiger-portland-indoor-table",
          "fixed-adjustable-net",
          "Fixed adjustable net attached to the Portland Indoor table"
        )
      },
      {
        description:
          "Four 100mm rubber-tread wheels roll smoothly across indoor floors, and built-in paddle and ball storage keeps gear close.",
        kicker: "Roll out, lock in",
        title: "Locking Indoor Wheels",
        visual: detailVisual(
          "tiger-portland-indoor-table",
          "easy-roll-locking-wheels",
          "Locking indoor wheel on the Portland Indoor table"
        )
      }
    ],
    moreFeaturesHeading: "The little details.",
    moreFeatures: [
      {
        title: "Indoor Top",
        value: "7/8 inch chipboard gives Portland its confident indoor bounce.",
        visual: detailVisual(
          "tiger-portland-indoor-table",
          "indoor-top",
          "Close-up of the Portland Indoor table top"
        )
      },
      {
        title: "Easy Roll Locking Wheels",
        value: "Rubber-tread wheels help the table move smoothly indoors.",
        visual: detailVisual(
          "tiger-portland-indoor-table",
          "easy-roll-locking-wheels",
          "Locking indoor wheel on the Portland Indoor table"
        )
      },
      {
        title: "Built-In Storage",
        value: "Storage for paddles and balls keeps the room organized.",
        visual: detailVisual(
          "tiger-portland-indoor-table",
          "built-in-storage",
          "Built-in paddle and ball storage on the Portland Indoor table"
        )
      }
    ]
  },
  "tiger-portland-outdoor-table": {
    comparisonHeading: "See how Portland stacks up.",
    featureMoments: [
      {
        description:
          "The weatherproof 6mm melamine resin playing surface is made for outdoor play and gives a strong rebound that feels impressively close to a thick wood-top table.",
        kicker: "True bounce matte top",
        title: "6mm Indoor / Outdoor Top",
        visual: {
          alt: "Portland Outdoor 6mm table top in playback position",
          src: "https://res.cloudinary.com/djfcisldm/image/upload/v1784515187/tigerpingpong/products/tiger-portland-outdoor-table/gallery-restoration/grey-playback-v1.jpg"
        }
      },
      {
        description:
          "The 1 by 2 inch steel frame is welded for strength, then powder-coated for a durable finish that stands up to regular outdoor use.",
        kicker: "Strength and stability",
        title: "Welded Steel Frame"
      },
      {
        description:
          "A highly visible handle and dual-slot lock system secure the table in play or storage position, so one person can fold, unlock, and roll it away.",
        kicker: "Simple open and close",
        title: "Smart Locking System"
      },
      {
        description:
          "The fixed net is height adjustable on both sides, with a red rotating adjuster for height and simple tension control.",
        kicker: "Ready when you open it",
        title: "Adjustable Net",
        visual: {
          alt: "Portland Outdoor adjustable net",
          src: "https://res.cloudinary.com/djfcisldm/image/upload/v1784515188/tigerpingpong/products/tiger-portland-outdoor-table/gallery-restoration/net-detail-v1.jpg"
        }
      },
      {
        description:
          "Built-in storage keeps up to 4 paddles and 18 balls close to the table, so the next game starts with the gear in reach.",
        kicker: "Everything has a place",
        title: "Paddle & Ball Storage",
        visual: {
          alt: "Portland Outdoor paddle and ball storage",
          src: "https://res.cloudinary.com/djfcisldm/image/upload/v1784515188/tigerpingpong/products/tiger-portland-outdoor-table/gallery-restoration/storage-detail-v1.jpg"
        }
      }
    ],
    moreFeaturesHeading: "The little details.",
    moreFeatures: [
      {
        title: "Single Person Playback",
        value: "Fold one side up and practice against the back board.",
        visual: {
          alt: "Portland Outdoor playback position",
          src: "https://res.cloudinary.com/djfcisldm/image/upload/v1784515187/tigerpingpong/products/tiger-portland-outdoor-table/gallery-restoration/grey-playback-v1.jpg"
        }
      },
      {
        title: "Easily Movable",
        value: "5 inch double rubberized wheels roll across varied terrain."
      },
      {
        title: "Easy Leg Level",
        value: "Large steel leg levelers rotate up to 1 1/4 inches."
      }
    ]
  },
  "tiger-whistler-indoor-table": {
    comparisonHeading: "See how Whistler stacks up.",
    featureMoments: [
      {
        description:
          "Whistler uses a 25mm multi-coated chipboard surface, made to tournament specifications for the firm, consistent bounce serious indoor players expect.",
        kicker: "Tournament-minded bounce",
        title: "1 Inch Chipboard Top",
        visual: detailVisual(
          "tiger-whistler-indoor-table",
          "one-inch-chipboard-top",
          "Close-up of the Whistler table's one-inch chipboard top"
        )
      },
      {
        description:
          "The A-60mm powder-coated frame and 40 x 40mm rectangle-tube legs give the table a solid, low-profile foundation for repeat play.",
        kicker: "Strength and stability",
        title: "60mm Powder-Coated Frame",
        visual: detailVisual(
          "tiger-whistler-indoor-table",
          "60mm-powder-coated-frame",
          "Powder-coated frame and undercarriage of the Whistler table"
        )
      },
      {
        description:
          "A bright red drawbar unlocks both safety devices at once, making it simple to open, close, and store the table with confidence.",
        kicker: "Simple open and close",
        title: "Drawbar Locking System",
        visual: detailVisual(
          "tiger-whistler-indoor-table",
          "drawbar-locking-system",
          "Drawbar locking system underneath the Whistler table"
        )
      },
      {
        description:
          "The included black polyethylene net stays fixed to the table and remains in place when folded, with height and tension adjustment.",
        kicker: "Ready when you open it",
        title: "Fixed Adjustable Net",
        visual: detailVisual(
          "tiger-whistler-indoor-table",
          "fixed-adjustable-net",
          "Fixed adjustable net attached to the Whistler table"
        )
      },
      {
        description:
          "Four 100mm rubber-tread wheels roll smoothly across home floors, with two locking wheels to hold Whistler in place during play.",
        kicker: "Roll out, lock in",
        title: "Locking Indoor Wheels",
        visual: detailVisual(
          "tiger-whistler-indoor-table",
          "locking-indoor-wheels",
          "Locking indoor wheel on the Whistler table"
        )
      }
    ],
    moreFeaturesHeading: "The little details.",
    moreFeatures: [
      {
        title: "Professional Top",
        value: "1 inch multi-coated chipboard gives Whistler its tournament feel.",
        visual: detailVisual(
          "tiger-whistler-indoor-table",
          "one-inch-chipboard-top",
          "Close-up of the Whistler table's one-inch chipboard top"
        )
      },
      {
        title: "Safe Folding",
        value: "The drawbar unlocks both safety devices together.",
        visual: detailVisual(
          "tiger-whistler-indoor-table",
          "drawbar-locking-system",
          "Drawbar locking system underneath the Whistler table"
        )
      },
      {
        title: "Lockable Wheels",
        value: "Two wheels lock, and leg levelers adjust up to 25mm.",
        visual: detailVisual(
          "tiger-whistler-indoor-table",
          "locking-indoor-wheels",
          "Locking indoor wheel on the Whistler table"
        )
      }
    ]
  }
};

const TABLE_COMPARISON_VALUES: Record<string, Record<ComparisonValueKey, string>> = {
  "tiger-expo-outdoor-table": {
    bestFor: "Families / Backyards",
    bounceLevel: "Good",
    foldingStyle: "Compact quick-lock folding",
    frameStyle: "50mm steel",
    netSystem: "Fixed / Adjustable",
    primaryUse: "Outdoor (Standard)",
    tableTop: "5mm melamine",
    weatherproof: "Yes",
    wheels: "4 x 128mm double"
  },
  "tiger-plaza-outdoor-table-grey": {
    bestFor: "Parks / Resorts",
    bounceLevel: "Thick outdoor top",
    foldingStyle: "Fixed",
    frameStyle: "Galvanized steel",
    netSystem: "Solid metal",
    primaryUse: "Outdoor (Permanent)",
    tableTop: "10mm melamine",
    weatherproof: "Yes",
    wheels: "Floor anchor"
  },
  "tiger-portland-indoor-table": {
    bestFor: "Schools / Clubs",
    bounceLevel: "Professional",
    foldingStyle: "Compact quick-lock folding",
    frameStyle: "50mm steel",
    netSystem: "Fixed / Adjustable",
    primaryUse: "Mid-range indoor",
    tableTop: "22mm chipboard",
    weatherproof: "No",
    wheels: "Rubberized locking wheels"
  },
  "tiger-portland-outdoor-table": {
    bestFor: "All-weather performance",
    bounceLevel: "Very good",
    foldingStyle: "Compact quick-lock folding",
    frameStyle: "50mm steel",
    netSystem: "Fixed / Adjustable",
    primaryUse: "Outdoor (High Performance)",
    tableTop: "6mm melamine",
    weatherproof: "Yes",
    wheels: "4 x 128mm double"
  },
  "tiger-whistler-indoor-table": {
    bestFor: "Serious players",
    bounceLevel: "Elite / Tournament",
    foldingStyle: "Compact quick-lock folding",
    frameStyle: "60mm steel",
    netSystem: "Fixed / Adjustable",
    primaryUse: "Indoor (Tournament)",
    tableTop: "25mm chipboard",
    weatherproof: "No",
    wheels: "Rubberized locking wheels"
  }
};

export function ProductFamilySwitcher({
  product,
  products
}: {
  product: CatalogProductDetail;
  products: CatalogProductSummary[];
}) {
  if (!isTableProduct(product)) {
    return null;
  }

  const siblingProducts = getSiblingProducts(product, products);

  if (siblingProducts.length <= 1) {
    return null;
  }

  return (
    <nav className={styles.productCategoryJump} aria-label="Tiger table models">
      <div className={styles.tableSubnavLinks}>
        {siblingProducts.map((siblingProduct) => {
          const isCurrentProduct = siblingProduct.slug === product.slug;
          const linkClassName = isCurrentProduct
            ? `${styles.siblingLink} ${styles.siblingLinkActive}`
            : styles.siblingLink;

          return (
            <a
              key={siblingProduct.slug}
              aria-current={isCurrentProduct ? "page" : undefined}
              className={linkClassName}
              href={`/catalog/products/${siblingProduct.slug}`}
            >
              <strong>{getProductDisplayLabel(siblingProduct)}</strong>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export function QuickFactsSection({
  normalizedContent,
  product
}: {
  normalizedContent: NormalizedProductContent | null;
  product: CatalogProductDetail;
}) {
  const facts = getQuickFacts(product, normalizedContent);
  const isTable = isTableProduct(product);

  if (facts.length === 0) {
    return null;
  }

  return (
    <section
      className={
        isTable
          ? `${styles.detailStrip} ${styles.tableDetailStrip}`
          : `${styles.detailStrip} ${styles.accessoryDetailStrip}`
      }
      aria-labelledby="quick-facts-title"
    >
      <div className={styles.detailStripHeading}>
        <div>
          <p className={styles.eyebrow}>{isTable ? "Why this table" : "Quick facts"}</p>
          <h2 id="quick-facts-title">{getDetailStripHeading(product)}</h2>
        </div>
        {!isTable ? <p>{getDetailStripIntro(product)}</p> : null}
      </div>
      <dl className={styles.detailStatGrid}>
        {facts.map((fact) => (
          <div key={`${fact.label}-${fact.value}`} className={styles.detailStatCard}>
            <dt>{fact.label}</dt>
            <dd>
              <strong>{fact.value}</strong>
              {fact.note ? <span>{fact.note}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ProductStorySection({
  normalizedContent,
  product
}: {
  normalizedContent: NormalizedProductContent | null;
  product: CatalogProductDetail;
}) {
  const storyCopy =
    getProductStoryCopy(product, normalizedContent) ?? getSafeCopy(product.description);

  if (!storyCopy) {
    return null;
  }

  return (
    <section
      className={
        isTableProduct(product)
          ? styles.descriptionBand
          : `${styles.descriptionBand} ${styles.accessoryDescriptionBand}`
      }
      aria-labelledby="product-description-title"
    >
      <p className={styles.eyebrow}>Product details</p>
      <h2 id="product-description-title">{getStoryHeading(product)}</h2>
      <p>{storyCopy}</p>
    </section>
  );
}

export function FeatureHighlightsSection({
  normalizedContent,
  product
}: {
  normalizedContent: NormalizedProductContent | null;
  product: CatalogProductDetail;
}) {
  const featureMoments = getFeatureMoments(product);
  const highlights = getSafeFeatureHighlights(product, normalizedContent);

  if (featureMoments.length === 0 && highlights.length === 0) {
    return null;
  }

  if (isTableProduct(product) && featureMoments.length > 0) {
    return (
      <section className={styles.featureMoments} aria-labelledby="feature-highlights-title">
        <header className={styles.featureMomentsHeading}>
          <div>
            <h2 id="feature-highlights-title">All the good parts, close up.</h2>
          </div>
          <a className={styles.secondaryPill} href="#specs">
            View specs
          </a>
        </header>
        <ProductFeatureCarousel
          ariaLabel={`${getProductDisplayLabel(product)} feature cards`}
          moments={featureMoments}
        />
      </section>
    );
  }

  return (
    <section
      className={
        isTableProduct(product) ? styles.section : `${styles.section} ${styles.accessorySection}`
      }
      aria-labelledby="feature-highlights-title"
    >
      <div className={styles.sectionHeader}>
        <p className={styles.eyebrow}>Highlights</p>
        <h2 id="feature-highlights-title">Highlights that matter.</h2>
      </div>
      <ul className={styles.featureChipList}>
        {highlights.map((highlight) => (
          <li key={highlight} className={styles.featureChip}>
            {highlight}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EverydayDetailsSection({
  normalizedContent,
  product
}: {
  normalizedContent: NormalizedProductContent | null;
  product: CatalogProductDetail;
}) {
  const displayContent = getTableDisplayContent(product.slug);
  const details = getEverydayDetails(product, normalizedContent);
  const isTable = isTableProduct(product);

  if (details.length === 0) {
    return null;
  }

  return (
    <section
      className={
        isTable ? styles.moreFeatures : `${styles.moreFeatures} ${styles.accessoryGoodToKnow}`
      }
      aria-labelledby="everyday-details-title"
    >
      <div className={styles.moreFeaturesHeading}>
        {isTable && displayContent?.moreFeaturesEyebrow ? (
          <p className={styles.eyebrow}>{displayContent.moreFeaturesEyebrow}</p>
        ) : null}
        <h2 id="everyday-details-title">
          {isTable ? getEverydayHeading(product) : "Good to know."}
        </h2>
      </div>
      <div className={styles.detailGrid}>
        {details.map((detail) => (
          <article key={detail.title}>
            {detail.visual ? <DetailVisual visual={detail.visual} /> : null}
            <h3>{detail.title}</h3>
            {detail.value ? <p>{detail.value}</p> : null}
            {detail.items ? (
              <ul>
                {detail.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function SpecificationGrid({ fields }: { fields: LabeledValue[] }) {
  return (
    <dl className={styles.specGrid}>
      {fields.map((field) => (
        <div key={`${field.label}-${field.value}`}>
          <dt>{field.label}</dt>
          <dd>{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TableSupportLinks({ resource }: { resource: TableSupportResource }) {
  return (
    <div
      className={styles.specResources}
      data-product-slug={resource.productSlug}
      data-testid="table-support-resources"
    >
      <div className={styles.specResourcesCopy}>
        <p className={styles.eyebrow}>Manuals &amp; setup</p>
        <h3>Ready when the toolbox comes out.</h3>
      </div>
      <div className={styles.specResourceActions}>
        <a
          aria-label={`Download ${resource.title} assembly guide PDF`}
          className={styles.specResourcePrimary}
          download
          href={resource.downloadUrl}
        >
          Assembly guide (PDF)
        </a>
        {resource.videoUrl ? (
          <a
            aria-label={`Watch ${resource.title} setup video on YouTube`}
            className={styles.specResourceSecondary}
            href={resource.videoUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Setup video
          </a>
        ) : null}
        <a className={styles.specResourceSecondary} href="/replacement-parts/">
          Replacement parts
        </a>
      </div>
    </div>
  );
}

export function SpecsGridSection({
  normalizedContent,
  product
}: {
  normalizedContent: NormalizedProductContent | null;
  product: CatalogProductDetail;
}) {
  const fields = getSpecificationFields(product, normalizedContent);
  const isTable = isTableProduct(product);
  const supportResource = isTable ? getTableSupportResource(product.slug) : null;
  const title = isTable ? "Specs and dimensions." : "Specs.";

  if (fields.length === 0) {
    return null;
  }

  return (
    <section
      className={
        isTable ? styles.specSection : `${styles.specSection} ${styles.accessorySpecSection}`
      }
      id="specs"
      aria-label="Specifications"
    >
      <div className={styles.specHeading}>
        <p className={styles.eyebrow}>Specifications</p>
        <h2 id="product-specs-title">{title}</h2>
      </div>
      <SpecificationGrid fields={fields} />
      <details className={`${styles.mobileDisclosure} ${styles.mobileSpecsDisclosure}`}>
        <summary className={styles.mobileDisclosureSummary}>
          <span className={styles.mobileDisclosureLabel}>
            <span className={styles.eyebrow}>Specifications</span>
            <span className={styles.mobileDisclosureTitle}>{title}</span>
          </span>
          <span aria-hidden="true" className={styles.mobileDisclosureIcon} />
        </summary>
        <div className={styles.mobileDisclosureBody}>
          <SpecificationGrid fields={fields} />
        </div>
      </details>
      {supportResource ? <TableSupportLinks resource={supportResource} /> : null}
    </section>
  );
}

export function TableComparisonSection({
  currentSlug,
  products
}: {
  currentSlug: string;
  products: CatalogProductDetail[];
}) {
  const columns = sortTableProducts(products.filter(isTableProduct)).map((product) => {
    const normalizedContent = getProductContentBySlug(product.slug);

    return {
      product,
      values: getComparisonValues(product, normalizedContent)
    };
  });

  if (columns.length < 2) {
    return null;
  }

  const rows = COMPARISON_ROWS.filter((row) =>
    columns.some((column) => Boolean(column.values[row.key]))
  );
  const comparisonHeading = getComparisonHeading(currentSlug);

  return (
    <section className={styles.tableComparisonSection} aria-label="Table comparison">
      <div className={styles.comparisonSectionHeading}>
        <p className={styles.eyebrow}>Compare tables</p>
        <h2 id="table-comparison-title">{comparisonHeading}</h2>
      </div>
      <div className={styles.comparisonTableScroll}>
        <table className={styles.fullComparisonTable}>
          <thead>
            <tr>
              <th scope="col">Feature</th>
              {columns.map((column) => (
                <th
                  className={
                    column.product.slug === currentSlug ? styles.currentComparisonCell : undefined
                  }
                  key={column.product.slug}
                  scope="col"
                >
                  <a href={`/catalog/products/${column.product.slug}`}>
                    {getProductDisplayLabel(column.product)}
                  </a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.label}</th>
                {columns.map((column) => (
                  <td
                    className={
                      column.product.slug === currentSlug ? styles.currentComparisonCell : undefined
                    }
                    key={`${row.key}-${column.product.slug}`}
                  >
                    {column.values[row.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className={styles.mobileDisclosure} open>
        <summary className={styles.mobileDisclosureSummary}>
          <span className={styles.mobileDisclosureLabel}>
            <span className={styles.eyebrow}>Compare tables</span>
            <span className={styles.mobileDisclosureTitle}>{comparisonHeading}</span>
          </span>
          <span aria-hidden="true" className={styles.mobileDisclosureIcon} />
        </summary>
        <div className={styles.mobileDisclosureBody}>
          <div
            aria-label="Table comparison cards"
            className={styles.mobileComparisonTrack}
            role="region"
            tabIndex={0}
          >
            {columns.map((column) => {
              const isCurrent = column.product.slug === currentSlug;

              return (
                <article
                  className={styles.mobileComparisonCard}
                  data-current={isCurrent ? "true" : undefined}
                  key={column.product.slug}
                >
                  <div className={styles.mobileComparisonCardHeader}>
                    {isCurrent ? (
                      <span className={styles.currentComparisonBadge}>Current table</span>
                    ) : null}
                    <h3>
                      <a href={`/catalog/products/${column.product.slug}`}>
                        {getProductDisplayLabel(column.product)}
                      </a>
                    </h3>
                  </div>
                  <dl className={styles.mobileComparisonValues}>
                    {rows.map((row) => (
                      <div key={`${column.product.slug}-${row.key}`}>
                        <dt>{row.label}</dt>
                        <dd>{column.values[row.key] ?? "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              );
            })}
          </div>
        </div>
      </details>
    </section>
  );
}

function getSiblingProducts(
  product: CatalogProductDetail,
  products: CatalogProductSummary[]
): CatalogProductSummary[] {
  const productsBySlug = new Map(
    products.map((catalogProduct) => [catalogProduct.slug, catalogProduct])
  );

  if (isTableProduct(product)) {
    return TABLE_COMPARISON_PRODUCT_SLUGS.map((slug) => productsBySlug.get(slug)).filter(
      (catalogProduct): catalogProduct is CatalogProductSummary => Boolean(catalogProduct)
    );
  }

  const sameFamilyProducts = products.filter(
    (catalogProduct) => catalogProduct.family.key === product.family.key
  );

  if (sameFamilyProducts.length > 1) {
    return sortProductsByName(sameFamilyProducts);
  }

  const sameCategoryKindProducts = products.filter(
    (catalogProduct) =>
      catalogProduct.category.key === product.category.key &&
      normalizeKind(catalogProduct.productKind) === normalizeKind(product.productKind)
  );

  return sortProductsByName(sameCategoryKindProducts);
}

function getProductDisplayLabel(product: { name: string; slug: string }): string {
  const mappedLabel = PRODUCT_DISPLAY_LABELS[product.slug];

  if (mappedLabel) {
    return mappedLabel;
  }

  return product.name
    .replace(/^Tiger\s+PingPong\s+/i, "")
    .replace(/\s+Ping Pong Table\b/i, "")
    .replace(/\s+Ping Pong\b/i, "")
    .trim();
}

function getTableDisplayContent(slug: string): TableDisplayContent | null {
  return TABLE_DISPLAY_CONTENT[slug] ?? null;
}

function getComparisonHeading(slug: string): string {
  return getTableDisplayContent(slug)?.comparisonHeading ?? "Compare the table lineup.";
}

function DetailVisual({ visual }: { visual: ProductFeatureVisual }) {
  return <img src={visual.src} alt={visual.alt ?? ""} />;
}

function getStoryHeading(product: CatalogProductDetail): string {
  const kind = normalizeKind(product.productKind);
  const useFact = getUseFact(product, null);

  if (kind === "table") {
    const tableStory = getTigerTableProductStory(product.slug);

    if (tableStory) {
      return tableStory.detail.heading;
    }
  }

  if (kind !== "table") {
    return "Product details.";
  }

  if (kind === "table" && useFact === "Outdoor") {
    return "Built for outdoor rallies.";
  }

  if (kind === "table" && useFact === "Indoor") {
    return "Built for indoor play.";
  }

  if (kind === "table") {
    return "Built for the next match.";
  }

  if (kind === "paddle") {
    return "Built for everyday control.";
  }

  if (kind === "ball") {
    return "Ready for the next rally.";
  }

  return "Made for everyday play.";
}

function getEverydayHeading(product: CatalogProductDetail): string {
  const tableHeading = getTableDisplayContent(product.slug)?.moreFeaturesHeading;

  if (tableHeading) {
    return tableHeading;
  }

  const kind = normalizeKind(product.productKind);

  if (kind === "table") {
    return "Setup, storage, and play.";
  }

  if (kind === "cover") {
    return "Fit and use.";
  }

  return "Setup and play.";
}

function getDetailStripHeading(product: CatalogProductDetail): string {
  if (!isTableProduct(product)) {
    return "Key facts.";
  }

  return "The good stuff.";
}

function getDetailStripIntro(product: CatalogProductDetail): string {
  if (!isTableProduct(product)) {
    return "Only the sourced product details that help with the purchase decision.";
  }

  const useFact = getUseFact(product, null);

  if (useFact === "Outdoor") {
    return "Outdoor-ready details, focused on the things buyers ask about first.";
  }

  if (useFact === "Indoor") {
    return "Indoor table details, focused on play feel, setup, and daily use.";
  }

  return "Table details, focused on the things buyers ask about first.";
}

function getQuickFacts(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null
): LabeledValue[] {
  if (isTableProduct(product)) {
    return getTableDetailStats(product, normalizedContent);
  }

  return getAccessoryQuickFacts(product, normalizedContent);
}

function getTableDetailStats(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null
): LabeledValue[] {
  const stats: LabeledValue[] = [];
  const surfaceStat = getSurfaceStat(normalizedContent);
  const madeIn = getMadeInStat(normalizedContent);
  const tabletopWarranty = getWarrantyStat(normalizedContent, "tabletop");
  const tableWarranty = getWarrantyStat(normalizedContent, "table");
  const tableWeight = getTableWeightStat(normalizedContent);
  const colorOptions = getDisplayColorOptions(product, normalizedContent);
  const includedItem = getShortIncludedFact(normalizedContent);
  const useFact = getUseFact(product, normalizedContent);

  if (surfaceStat) {
    stats.push({
      label: surfaceStat.label,
      value: surfaceStat.value
    });
  }

  if (madeIn) {
    stats.push(madeIn);
  }

  if (tabletopWarranty) {
    stats.push(tabletopWarranty);
  }

  if (tableWarranty) {
    stats.push(tableWarranty);
  }

  if (stats.length < 4 && tableWeight) {
    stats.push(tableWeight);
  }

  if (colorOptions.length > 0) {
    stats.push({
      label: "Active colours",
      value: joinShortList(colorOptions)
    });
  }

  if (stats.length < 4 && includedItem) {
    stats.push({
      label: includedItem,
      value: "Included"
    });
  }

  if (stats.length < 4 && useFact) {
    stats.push({
      label: "Use",
      value: useFact
    });
  }

  return stats.slice(0, 4);
}

function getAccessoryQuickFacts(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null
): LabeledValue[] {
  if (normalizeKind(product.productKind) !== "ball") {
    return [];
  }

  const facts = [
    getSpecFact(normalizedContent, "Quantity", ["Quantity"]),
    getBallColourFact(product, normalizedContent),
    getSpecFact(normalizedContent, "Ball size", ["Ball size"])
  ].filter((fact): fact is LabeledValue => Boolean(fact));

  return dedupeLabeledValues(facts).slice(0, 3);
}

function getBallColourFact(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null
): LabeledValue | null {
  if (product.slug.includes("6-orange")) {
    return { label: "Colour", value: "Orange" };
  }

  if (product.slug.includes("6-white")) {
    return { label: "Colour", value: "White" };
  }

  const colourFeature = getSafeList(normalizedContent?.keyFeatures, product).find((feature) =>
    /^white\s+or\s+orange$/i.test(feature)
  );

  if (colourFeature) {
    return { label: "Colours", value: "White or orange" };
  }

  return null;
}

function getSpecFact(
  normalizedContent: NormalizedProductContent | null,
  label: string,
  candidateLabels: string[]
): LabeledValue | null {
  const value = getFirstSpecValue(normalizedContent, candidateLabels);

  if (!value) {
    return null;
  }

  return {
    label,
    value
  };
}

function getSafeFeatureHighlights(
  product: { productKind: string },
  normalizedContent: NormalizedProductContent | null
): string[] {
  if (isTableProduct(product)) {
    return getSafeList(normalizedContent?.keyFeatures, product)
      .filter((feature) => !isCompatibilityNote(feature))
      .slice(0, 8);
  }

  return [];
}

function getFeatureMoments(product: CatalogProductDetail): ProductFeatureMoment[] {
  return getTableDisplayContent(product.slug)?.featureMoments ?? [];
}

function getProductStoryCopy(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null
): string | null {
  if (isTableProduct(product)) {
    const tableStory = getTigerTableProductStory(product.slug);

    if (tableStory) {
      return tableStory.detail.body;
    }

    return getSafeLongDescription(normalizedContent?.longDescription);
  }

  return getAccessoryStoryCopy(normalizedContent?.longDescription);
}

function getTigerTableProductStory(productSlug: string) {
  return tigerTablesProductStories[productSlug as keyof typeof tigerTablesProductStories] ?? null;
}

function getAccessoryStoryCopy(value: string | null | undefined): string | null {
  const copy = normalizeWhitespace(value);

  if (!copy) {
    return null;
  }

  const safeSentences = copy
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => getSafeCopy(sentence))
    .filter((sentence): sentence is string => Boolean(sentence))
    .filter((sentence) => !isCompatibilityNote(sentence))
    .filter((sentence) => !hasAnyMarker(sentence, ["fit most", "specifically designed to fit"]))
    .filter((sentence) => !hasAnyMarker(sentence, BALL_REVIEW_MARKERS))
    .filter((sentence) => !hasAnyMarker(sentence, ["standard 40mm"]))
    .filter((sentence) => !hasAnyMarker(sentence, ["feature sections describe"]));

  if (safeSentences.length === 0) {
    return null;
  }

  return safeSentences.join(" ");
}

function getEverydayDetails(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null
): DetailCard[] {
  const tableDetails = getTableDisplayContent(product.slug)?.moreFeatures;

  if (tableDetails) {
    return tableDetails;
  }

  if (["ball", "paddle"].includes(normalizeKind(product.productKind))) {
    return [];
  }

  const details: DetailCard[] = [];
  const includedItems = getSafeIncludedItems(normalizedContent);
  const compatibilityNotes = getCompatibilityNotes(product, normalizedContent);
  const setupFacts = getPracticalSetupFacts(product, normalizedContent);

  if (includedItems.length > 0) {
    details.push({
      items: includedItems,
      title: "Included items"
    });
  }

  if (compatibilityNotes.length > 0) {
    details.push({
      items: compatibilityNotes,
      title: "Compatibility"
    });
  }

  if (setupFacts.length > 0) {
    details.push({
      items: setupFacts,
      title: isTableProduct(product) ? "Setup and storage" : "Practical notes"
    });
  }

  return details;
}

function getSpecificationFields(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null
): LabeledValue[] {
  const fields: LabeledValue[] = [];
  const dimensions = getSafeDimensions(normalizedContent?.dimensions);
  const colorOptions = getDisplayColorOptions(product, normalizedContent);

  if (isTableProduct(product) && colorOptions.length > 0) {
    fields.push({
      label: "Colours",
      value: joinShortList(colorOptions)
    });
  }

  if (dimensions) {
    fields.push(...parseDimensionFields(dimensions));
  }

  for (const spec of normalizedContent?.specifications ?? []) {
    const parsedSpec = parseSpecification(spec, product);

    if (parsedSpec && !isSupersededTableColorSpec(product, parsedSpec, colorOptions)) {
      fields.push(parsedSpec);
    }
  }

  const uniqueFields = dedupeLabeledValues(fields);

  if (isTableProduct(product)) {
    return uniqueFields.slice(0, 18);
  }

  if (normalizeKind(product.productKind) === "ball" || uniqueFields.length < 2) {
    return [];
  }

  return uniqueFields.slice(0, 6);
}

function getUseFact(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null
): string | null {
  const useText = [
    normalizedContent?.productType,
    product.name,
    product.category.name,
    product.family.name
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (useText.includes("outdoor / indoor") || useText.includes("indoor / outdoor")) {
    return "Indoor / outdoor";
  }

  if (useText.includes("outdoor") && useText.includes("indoor")) {
    return "Indoor / outdoor";
  }

  if (useText.includes("outdoor")) {
    return "Outdoor";
  }

  if (useText.includes("indoor")) {
    return "Indoor";
  }

  return null;
}

function getSurfaceFact(normalizedContent: NormalizedProductContent | null): string | null {
  return getFirstSpecValue(normalizedContent, [
    "Playing Surface",
    "Tabletop",
    "Tabletop thickness",
    "Thickness"
  ]);
}

function getSurfaceStat(normalizedContent: NormalizedProductContent | null): LabeledValue | null {
  const surface = getSurfaceFact(normalizedContent);

  if (!surface) {
    return null;
  }

  const thicknessMatch =
    surface.match(/\b\d+(?:\.\d+)?\s*mm\b/i) ?? surface.match(/\b\d+(?:\/\d+)?"\b/);
  const value = thicknessMatch ? thicknessMatch[0].replace(/\s+/g, "") : "Top";
  const technicalLabel = surface
    .replace(thicknessMatch?.[0] ?? "", "")
    .replace(/\btable\s*top\b/gi, "")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ")
    .trim();
  const label = /melamine\s+resin/i.test(technicalLabel)
    ? "Weather-ready top"
    : /chipboard/i.test(technicalLabel)
      ? "Indoor playing top"
      : technicalLabel || surface;

  return {
    label,
    value
  };
}

function getTableWeightStat(
  normalizedContent: NormalizedProductContent | null
): LabeledValue | null {
  const tableWeight = getFirstSpecValue(normalizedContent, ["Table Weight"]);

  if (!tableWeight) {
    return null;
  }

  return {
    label: "Table weight",
    value: tableWeight.replace(/\s+/g, " ").replace(/\blbs\b/i, "lb")
  };
}

function getMadeInStat(normalizedContent: NormalizedProductContent | null): LabeledValue | null {
  const madeIn =
    getFirstSpecValue(normalizedContent, ["Made In"]) ??
    getSafeList(normalizedContent?.keyFeatures, null).find((feature) =>
      feature.toLowerCase().includes("made in germany")
    );

  if (!madeIn) {
    return null;
  }

  return {
    label: "Made in",
    value: "Germany"
  };
}

function getWarrantyStat(
  normalizedContent: NormalizedProductContent | null,
  warrantyKind: "table" | "tabletop"
): LabeledValue | null {
  const warrantyNotes = getSafeWarrantyNotes(normalizedContent);

  if (!warrantyNotes) {
    return null;
  }

  if (warrantyKind === "tabletop" && /\b10\s*years?\b/i.test(warrantyNotes)) {
    return {
      label: "Tabletop warranty",
      value: "10 years"
    };
  }

  if (warrantyKind === "table" && /\b3[-\s]*years?\b/i.test(warrantyNotes)) {
    return {
      label: "Table warranty",
      value: "3 years"
    };
  }

  return null;
}

function getSafeWarrantyNotes(normalizedContent: NormalizedProductContent | null): string | null {
  const warrantyNotes = normalizeWhitespace(normalizedContent?.warrantyNotes);

  if (!warrantyNotes || hasAnyMarker(warrantyNotes, ["missing/not visible", "confirm"])) {
    return null;
  }

  return warrantyNotes;
}

function getShortIncludedFact(normalizedContent: NormalizedProductContent | null): string | null {
  const includedItems = getSafeIncludedItems(normalizedContent);
  const shortItems = includedItems.filter((item) => item.length <= 64);
  const combinedItems = shortItems.join(", ");

  if (combinedItems && combinedItems.length <= 72) {
    return combinedItems;
  }

  return shortItems[0] ?? null;
}

function getBestForUse(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null
): string | null {
  const productType = getSafeCopy(normalizedContent?.productType)?.toLowerCase() ?? "";
  const useFact = getUseFact(product, normalizedContent);

  if (productType.includes("fixed")) {
    return "Fixed outdoor-style setup";
  }

  if (useFact === "Indoor / outdoor") {
    return "Indoor / outdoor play";
  }

  if (useFact === "Outdoor") {
    return "Outdoor rallies";
  }

  if (useFact === "Indoor") {
    return "Indoor play";
  }

  return null;
}

function getNetSummary(normalizedContent: NormalizedProductContent | null): string | null {
  const netText = [
    ...getSpecCandidateValues(normalizedContent, [
      "Net Type",
      "Adjustable Net",
      "Net",
      "Removable or Fixed"
    ]),
    ...getSafeList(normalizedContent?.includedItems, null),
    ...getSafeList(normalizedContent?.keyFeatures, null).filter((feature) =>
      feature.toLowerCase().includes("net")
    )
  ]
    .join(" ")
    .toLowerCase();

  if (!netText) {
    return null;
  }

  if (netText.includes("solid metal")) {
    return "Solid metal net";
  }

  if (
    netText.includes("fixed adjustable") ||
    (netText.includes("fixed") &&
      (netText.includes("height") || netText.includes("tension") || netText.includes("adjustable")))
  ) {
    return "Fixed adjustable net";
  }

  if (netText.includes("black polyethylene")) {
    return "Black polyethylene net";
  }

  if (netText.includes("fixed")) {
    return "Fixed net";
  }

  if (netText.includes("net")) {
    return "Net set";
  }

  return null;
}

function getComparisonValues(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null
): Record<ComparisonValueKey, string | null> {
  const curatedValues = TABLE_COMPARISON_VALUES[product.slug];

  if (curatedValues) {
    return curatedValues;
  }

  return {
    bestFor: getBestForUse(product, normalizedContent),
    bounceLevel: getBounceSummary(normalizedContent),
    foldingStyle: getFoldingStyleSummary(normalizedContent),
    frameStyle: getFrameStyleSummary(normalizedContent),
    netSystem: getNetSummary(normalizedContent),
    primaryUse: getUseFact(product, normalizedContent),
    tableTop: getSurfaceFact(normalizedContent),
    weatherproof: getWeatherproofSummary(product, normalizedContent),
    wheels: getWheelSummary(normalizedContent)
  };
}

function getBounceSummary(normalizedContent: NormalizedProductContent | null): string | null {
  const text = getSearchableProductText(normalizedContent);

  if (hasAnyMarker(text, ["international table tennis standards", "professional standards"])) {
    return "Professional standards";
  }

  if (hasAnyMarker(text, ["bounce every level", "every level of player"])) {
    return "Every-level bounce";
  }

  return null;
}

function getWeatherproofSummary(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null
): string | null {
  const text = getSearchableProductText(normalizedContent);

  if (hasAnyMarker(text, ["weatherproof", "weather-proof", "weather resistant", "dampness"])) {
    return "Weather-resistant";
  }

  if (getUseFact(product, normalizedContent) === "Indoor") {
    return "Indoor use";
  }

  return null;
}

function getFrameStyleSummary(normalizedContent: NormalizedProductContent | null): string | null {
  const text = getSearchableProductText(normalizedContent);

  if (hasAnyMarker(text, ["galvanized sheet-steel", "galvanised sheet steel"])) {
    return "Galvanized sheet steel";
  }

  if (hasAnyMarker(text, ["powder coated steel", "powder-coated steel"])) {
    return "Powder-coated steel";
  }

  if (text.includes("steel frame")) {
    return "Steel frame";
  }

  return null;
}

function getFoldingStyleSummary(normalizedContent: NormalizedProductContent | null): string | null {
  const text = getSearchableProductText(normalizedContent);

  if (hasAnyMarker(text, ["anchoring", "anchored", "fastening kit"])) {
    return "Fixed anchoring kit";
  }

  if (hasAnyMarker(text, ["locking handle system", "fold up", "folded", "storage position"])) {
    return "Fold-up storage";
  }

  if (text.includes("compact frame")) {
    return "Compact folding frame";
  }

  return null;
}

function getWheelSummary(normalizedContent: NormalizedProductContent | null): string | null {
  const text = getSearchableProductText(normalizedContent);

  if (hasAnyMarker(text, ["lockable wheels", "locking wheels", "wheels lock"])) {
    return "Locking wheels";
  }

  if (hasAnyMarker(text, ["double rubberized wheels", "double 128mm wheels", "double wheels"])) {
    return "Double wheels";
  }

  if (text.includes("wheels")) {
    return "Wheels";
  }

  return null;
}

function getSearchableProductText(normalizedContent: NormalizedProductContent | null): string {
  return [
    normalizedContent?.productType,
    normalizedContent?.shortDescription,
    getSafeLongDescription(normalizedContent?.longDescription),
    ...(normalizedContent?.keyFeatures ?? []).map((feature) => getSafeCopy(feature)),
    ...(normalizedContent?.specifications ?? []).map((specification) => {
      const parsedSpec = parseLabelValue(specification);
      return parsedSpec && !isUnsafeSpecField(parsedSpec.label, parsedSpec.value)
        ? `${parsedSpec.label} ${parsedSpec.value}`
        : null;
    })
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}

function getDisplayColorOptions(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null
): string[] {
  const activeVariantColors = getActiveVariantColorOptions(product.variants ?? []);

  if (activeVariantColors.length > 0) {
    return activeVariantColors;
  }

  if (normalizeKind(product.productKind) === "ball") {
    return [];
  }

  return getSafeList(normalizedContent?.availableOptions, product).filter(isColorOptionLabel);
}

function getActiveVariantColorOptions(variants: CatalogProductVariantSummary[]): string[] {
  const colors: string[] = [];

  for (const variant of variants) {
    if (
      !variant.isActive ||
      variant.purchaseModeOverride === "disabled" ||
      variant.purchaseModeOverride === "deferred_from_v1"
    ) {
      continue;
    }

    const colorOption = variant.options.find(
      (option) =>
        normalizeKind(option.name) === "color" ||
        normalizeKind(option.displayName ?? "") === "color"
    );
    const label = getSafeCopy(colorOption?.label ?? colorOption?.value);

    if (label && isColorOptionLabel(label)) {
      colors.push(label);
    }
  }

  return dedupeStrings(colors);
}

function isSupersededTableColorSpec(
  product: CatalogProductDetail,
  field: LabeledValue,
  activeColorOptions: string[]
): boolean {
  if (!isTableProduct(product) || activeColorOptions.length === 0) {
    return false;
  }

  return TABLE_COLOR_SPEC_LABEL_MARKERS.some((marker) =>
    field.label.toLowerCase().includes(marker)
  );
}

function isColorOptionLabel(value: string): boolean {
  return COLOR_OPTION_LABELS.has(value.trim().toLowerCase());
}

function getSafeIncludedItems(normalizedContent: NormalizedProductContent | null): string[] {
  return getSafeList(normalizedContent?.includedItems, null);
}

function getSafeList(
  values: string[] | undefined,
  product: { productKind: string } | null
): string[] {
  return dedupeStrings(
    (values ?? [])
      .map((value) => getSafeCopy(value))
      .filter((value): value is string => Boolean(value))
      .filter((value) => !hasAnyMarker(value, BONUS_MARKERS))
      .filter((value) => {
        if (product && normalizeKind(product.productKind) === "ball") {
          return !hasAnyMarker(value, BALL_REVIEW_MARKERS);
        }

        return true;
      })
  );
}

function getSafeLongDescription(value: string | null | undefined): string | null {
  const copy = normalizeWhitespace(value);

  if (!copy) {
    return null;
  }

  const safeSentences = copy
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => getSafeCopy(sentence))
    .filter((sentence): sentence is string => Boolean(sentence))
    .filter((sentence) => !hasAnyMarker(sentence, ["feature sections describe"]));

  if (safeSentences.length === 0) {
    return null;
  }

  return safeSentences.join(" ");
}

function getSafeDimensions(value: string | null | undefined): string | null {
  const dimensions = getSafeCopy(value);

  if (
    !dimensions ||
    hasAnyMarker(dimensions, ["linked spec sheet", "overall table dimensions are missing"])
  ) {
    return null;
  }

  return dimensions;
}

function parseDimensionFields(dimensions: string): LabeledValue[] {
  return dimensions
    .split(";")
    .map((part) => parseLabelValue(part))
    .filter((field): field is LabeledValue => Boolean(field))
    .filter((field) => !isUnsafeSpecField(field.label, field.value));
}

function parseSpecification(
  specification: string,
  product: CatalogProductDetail
): LabeledValue | null {
  const parsedSpec = parseLabelValue(specification);

  if (!parsedSpec || isUnsafeSpecField(parsedSpec.label, parsedSpec.value)) {
    return null;
  }

  if (!isTableProduct(product) && isCompatibilityNote(`${parsedSpec.label} ${parsedSpec.value}`)) {
    return null;
  }

  if (
    normalizeKind(product.productKind) === "ball" &&
    (parsedSpec.label.toLowerCase().includes("color options") ||
      hasAnyMarker(`${parsedSpec.label} ${parsedSpec.value}`, BALL_REVIEW_MARKERS))
  ) {
    return null;
  }

  return {
    label: formatSpecLabel(parsedSpec.label),
    value: formatSpecValue(parsedSpec.label, parsedSpec.value)
  };
}

function parseLabelValue(value: string): LabeledValue | null {
  const safeValue = getSafeCopy(value);

  if (!safeValue) {
    return null;
  }

  const separatorIndex = safeValue.indexOf(":");

  if (separatorIndex <= 0) {
    return null;
  }

  const label = safeValue.slice(0, separatorIndex).trim();
  const fieldValue = safeValue.slice(separatorIndex + 1).trim();

  if (!label || !fieldValue) {
    return null;
  }

  return {
    label,
    value: fieldValue
  };
}

function isUnsafeSpecField(label: string, value: string): boolean {
  const normalizedLabel = label.toLowerCase();

  return (
    UNSAFE_SPEC_LABEL_MARKERS.some((marker) => normalizedLabel.includes(marker)) ||
    isUnsafeText(`${label} ${value}`)
  );
}

function getFirstSpecValue(
  normalizedContent: NormalizedProductContent | null,
  labels: string[]
): string | null {
  return getSpecCandidateValues(normalizedContent, labels)[0] ?? null;
}

function getSpecCandidateValues(
  normalizedContent: NormalizedProductContent | null,
  labels: string[]
): string[] {
  const normalizedLabels = labels.map(normalizeSpecLabel);
  const values: string[] = [];

  for (const specification of normalizedContent?.specifications ?? []) {
    const parsedSpec = parseLabelValue(specification);

    if (!parsedSpec || isUnsafeSpecField(parsedSpec.label, parsedSpec.value)) {
      continue;
    }

    const normalizedLabel = normalizeSpecLabel(parsedSpec.label);

    if (
      normalizedLabels.some((label) => normalizedLabel === label || normalizedLabel.includes(label))
    ) {
      values.push(parsedSpec.value);
    }
  }

  return dedupeStrings(values);
}

function getCompatibilityNotes(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null
): string[] {
  if (product.slug === "tiger-net-post-set") {
    return getSearchableProductText(normalizedContent).includes("not compatible")
      ? ["Not compatible with Tiger Expo, Portland, and Whistler indoor/outdoor tables."]
      : [];
  }

  if (product.slug === "tiger-table-cover-black-polyester") {
    const text = getSearchableProductText(normalizedContent);

    if (text.includes("not compatible") && text.includes("plaza")) {
      return [
        "Fits most ping pong tables and Tiger tables. Not compatible with the Tiger Plaza Table."
      ];
    }
  }

  const candidates = [
    normalizedContent?.longDescription,
    ...(normalizedContent?.keyFeatures ?? []),
    ...(normalizedContent?.specifications ?? [])
  ].flatMap((candidate) => splitIntoSentences(candidate));

  return dedupeStrings(
    candidates
      .map((candidate) => getSafeCopy(candidate))
      .filter((candidate): candidate is string => Boolean(candidate))
      .filter(isCompatibilityNote)
      .map((candidate) => stripSpecLabel(candidate))
  );
}

function splitIntoSentences(value: string | null | undefined): string[] {
  const copy = normalizeWhitespace(value);

  if (!copy) {
    return [];
  }

  return copy.split(/(?<=[.!?])\s+/);
}

function getPracticalSetupFacts(
  product: { productKind: string },
  normalizedContent: NormalizedProductContent | null
): string[] {
  const markers = isTableProduct(product)
    ? ["fold", "storage", "playback", "anchoring", "leveller", "locking", "wheels"]
    : ["clamp", "control", "draw strap", "handle", "sponge"];
  const candidates = [
    ...(normalizedContent?.keyFeatures ?? []),
    ...(normalizedContent?.specifications ?? []).map(stripSpecLabel)
  ];

  return dedupeStrings(
    candidates
      .map((candidate) => getSafeCopy(candidate))
      .filter((candidate): candidate is string => Boolean(candidate))
      .filter((candidate) => !isCompatibilityNote(candidate))
      .filter((candidate) => hasAnyMarker(candidate, markers))
  ).slice(0, isTableProduct(product) ? 5 : 3);
}

function stripSpecLabel(value: string | null | undefined): string {
  const copy = normalizeWhitespace(value);

  if (!copy) {
    return "";
  }

  const separatorIndex = copy.indexOf(":");

  return separatorIndex > 0 ? copy.slice(separatorIndex + 1).trim() : copy;
}

function isCompatibilityNote(value: string): boolean {
  return value.toLowerCase().includes("compatible");
}

function getSafeCopy(value: string | null | undefined): string | null {
  const copy = normalizeWhitespace(value);

  if (!copy || isUnsafeText(copy)) {
    return null;
  }

  return copy;
}

function isUnsafeText(value: string): boolean {
  return hasAnyMarker(value, UNSAFE_TEXT_MARKERS);
}

function hasAnyMarker(value: string, markers: string[]): boolean {
  const normalizedValue = value.toLowerCase();

  return markers.some((marker) => normalizedValue.includes(marker.toLowerCase()));
}

function normalizeWhitespace(value: string | null | undefined): string | null {
  const copy = value?.replace(/\s+/g, " ").trim();
  return copy || null;
}

function normalizeKind(productKind: string): string {
  return productKind
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function normalizeSpecLabel(label: string): string {
  return normalizeKind(label).replace(/[^a-z0-9-]/g, "");
}

function formatSpecLabel(label: string): string {
  return label
    .replace(/\blisted\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (firstCharacter) => firstCharacter.toUpperCase());
}

function formatSpecValue(label: string, value: string): string {
  if (
    label.toLowerCase().includes("locking") &&
    value.toLowerCase().includes("sms locking system")
  ) {
    return "Quick-lock folding system";
  }

  return value;
}

function joinShortList(values: string[]): string {
  return values.join(" / ");
}

function sortProductsByName(products: CatalogProductSummary[]): CatalogProductSummary[] {
  return [...products].sort((left, right) => left.name.localeCompare(right.name));
}

function sortTableProducts<T extends { slug: string }>(products: T[]): T[] {
  const orderBySlug = new Map(TABLE_COMPARISON_PRODUCT_SLUGS.map((slug, index) => [slug, index]));

  return [...products].sort(
    (left, right) =>
      (orderBySlug.get(left.slug) ?? Number.MAX_SAFE_INTEGER) -
      (orderBySlug.get(right.slug) ?? Number.MAX_SAFE_INTEGER)
  );
}

function isTableProduct(product: { productKind: string }): boolean {
  return normalizeKind(product.productKind) === "table";
}

function dedupeLabeledValues(values: LabeledValue[]): LabeledValue[] {
  const seenValues = new Set<string>();
  const uniqueValues: LabeledValue[] = [];

  for (const value of values) {
    const key = `${value.label.toLowerCase()}::${value.value.toLowerCase()}`;

    if (seenValues.has(key)) {
      continue;
    }

    seenValues.add(key);
    uniqueValues.push(value);
  }

  return uniqueValues;
}

function dedupeStrings(values: string[]): string[] {
  const seenValues = new Set<string>();
  const uniqueValues: string[] = [];

  for (const value of values) {
    const normalizedValue = value.toLowerCase();

    if (seenValues.has(normalizedValue)) {
      continue;
    }

    seenValues.add(normalizedValue);
    uniqueValues.push(value);
  }

  return uniqueValues;
}
