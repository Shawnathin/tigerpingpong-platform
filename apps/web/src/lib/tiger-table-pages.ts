import tableProductGalleryManifestData from "../../../../data/media/table-product-gallery-manifest-v1.json";

import {
  getApprovedTigerTableFact,
  isTigerTableCurrentModelFactSheetComplete,
  tigerTableCurrentModelFactSheets,
  type TigerTableFactKey,
  type TigerTableCurrentModelFactSheet
} from "./tiger-table-fact-sheets";
import { TIGER_TABLE_SLUGS, type TigerTableSlug } from "./tiger-table-slugs";

export { TIGER_TABLE_SLUGS, type TigerTableSlug } from "./tiger-table-slugs";

export type TigerTablePublicationStatus = "draft" | "universal-v1";
export type TigerTableReviewStatus = "approved" | "pending" | "not-applicable";
export type TigerTableEvidenceKind = "owner-locked" | "verified-primary" | "live-catalog";

export interface TigerTableContentEvidence {
  readonly kind: TigerTableEvidenceKind;
  readonly source: string;
}

export type TigerTableContentEvidenceList = readonly [
  TigerTableContentEvidence,
  ...TigerTableContentEvidence[]
];

export type ReviewedSection<T> =
  | {
      readonly content: T;
      readonly evidence: TigerTableContentEvidenceList;
      readonly status: "approved";
    }
  | {
      readonly content?: never;
      readonly evidence?: readonly TigerTableContentEvidence[];
      readonly reason: string;
      readonly status: "pending";
    }
  | {
      readonly content?: never;
      readonly evidence?: never;
      readonly reason: string;
      readonly status: "not-applicable";
    };

export interface TigerTableStoryBlock {
  readonly body: string;
  readonly eyebrow: string;
  readonly heading: string;
}

export interface TigerTableEditorialMedia {
  readonly altText: string;
  readonly mediaKey: string;
  readonly role: "lifestyle";
}

export interface TigerTableTrustFact {
  readonly detail?: string;
  readonly heading: string;
  readonly id: string;
}

export interface TigerTableFeatureMoment {
  readonly explanation: {
    readonly limitation?: string;
    readonly whatItIs: string;
    readonly whyItMatters: string;
  };
  readonly id: string;
  readonly kicker: string;
  readonly mediaKey: string;
  readonly title: string;
}

export interface TigerTableSpecItem {
  readonly id: string;
  readonly label: string;
  readonly note?: string;
  readonly value: string;
}

export interface TigerTableSpecGroup {
  readonly heading: string;
  readonly id: string;
  readonly items: readonly TigerTableSpecItem[];
}

export interface TigerTableSpecsBlock {
  readonly completeness: "complete";
  readonly groups: readonly TigerTableSpecGroup[];
}

export type TigerTableComparisonFactKey =
  | "environment"
  | "use-context"
  | "surface"
  | "playing-feel"
  | "weatherproof"
  | "frame"
  | "folding"
  | "mobility"
  | "net"
  | "installation"
  | "warranty";

export const TIGER_TABLE_COMPARISON_FACT_KEYS = [
  "environment",
  "use-context",
  "surface",
  "playing-feel",
  "weatherproof",
  "frame",
  "folding",
  "mobility",
  "net",
  "installation",
  "warranty"
] as const satisfies readonly TigerTableComparisonFactKey[];

export interface TigerTableComparisonFact {
  readonly key: TigerTableComparisonFactKey;
  readonly label: string;
  readonly value: string;
}

export type TigerTableComparisonFacts = {
  readonly [Key in TigerTableComparisonFactKey]: ReviewedSection<TigerTableComparisonFact>;
};

export interface TigerTableResourceLink {
  readonly href: string;
  readonly id: string;
  readonly kind: "assembly" | "care" | "manual" | "specification" | "support";
  readonly label: string;
}

export interface TigerTableResourceBlock {
  readonly heading: string;
  readonly links: readonly TigerTableResourceLink[];
}

export interface TigerTablePageDefinition {
  readonly comparisonFacts: TigerTableComparisonFacts;
  readonly comparisonPeerSlugs: readonly [TigerTableSlug, TigerTableSlug];
  readonly featureMoments: ReviewedSection<readonly TigerTableFeatureMoment[]>;
  readonly publicationStatus: TigerTablePublicationStatus;
  readonly resources: ReviewedSection<TigerTableResourceBlock>;
  readonly slug: TigerTableSlug;
  readonly specs: ReviewedSection<TigerTableSpecsBlock>;
  readonly story: ReviewedSection<TigerTableStoryBlock>;
  readonly storyMedia: ReviewedSection<TigerTableEditorialMedia>;
  readonly trustFacts: ReviewedSection<readonly TigerTableTrustFact[]>;
}

interface TableGalleryManifest {
  readonly products: readonly {
    readonly assets: readonly {
      readonly cloudinary?: {
        readonly secureUrl?: string | null;
      };
      readonly localPublicPath?: string | null;
      readonly mediaKey: string;
      readonly modelVerification: string;
      readonly rightsStatus: string;
      readonly role: string;
    }[];
    readonly productSlug: string;
  }[];
}

const tableGalleryManifest = tableProductGalleryManifestData as TableGalleryManifest;
const reviewedMediaByProductSlug = new Map(
  tableGalleryManifest.products.map((product) => [
    product.productSlug,
    new Map(product.assets.map((asset) => [asset.mediaKey, asset] as const))
  ])
);

const PRODUCT_STORY_REGISTER_EVIDENCE = [
  {
    kind: "owner-locked",
    source:
      "Owner confirmation in the Universal Tiger Table Product Page System task (2026-07-28): all current product-page descriptions and details are truthful"
  },
  {
    kind: "verified-primary",
    source: "data/product-content/tigerpingpong-product-content-normalized.json"
  }
] as const satisfies TigerTableContentEvidenceList;

const UNIVERSAL_PAGE_PLAN_EVIDENCE = [
  {
    kind: "owner-locked",
    source: "Owner-approved Universal Tiger Table Product Page System plan (2026-07-28)"
  }
] as const satisfies TigerTableContentEvidenceList;

const CURRENT_TABLE_ORIGIN_EVIDENCE = [
  {
    kind: "owner-locked",
    source: "docs/brand/FACTS-AND-CLAIMS.md#manufacturing-and-product-development-claims"
  }
] as const satisfies TigerTableContentEvidenceList;

const CURRENT_MEDIA_EVIDENCE = [
  {
    kind: "verified-primary",
    source: "data/media/table-product-gallery-manifest-v1.json"
  },
  {
    kind: "verified-primary",
    source: "data/media/product-detail-image-map-v1.json"
  }
] as const satisfies TigerTableContentEvidenceList;

const CURRENT_RESOURCE_EVIDENCE = [
  {
    kind: "verified-primary",
    source: "data/media/replacement-parts-launch-media-v1.json"
  }
] as const satisfies TigerTableContentEvidenceList;

function approved<T>(content: T, evidence: TigerTableContentEvidenceList): ReviewedSection<T> {
  return {
    content,
    evidence,
    status: "approved"
  };
}

function approvedComparisonFact(
  key: TigerTableComparisonFactKey,
  label: string,
  value: string,
  evidence: TigerTableContentEvidenceList
): ReviewedSection<TigerTableComparisonFact> {
  return approved(
    {
      key,
      label,
      value
    },
    evidence
  );
}

function notApplicable<T>(reason: string): ReviewedSection<T> {
  return {
    reason,
    status: "not-applicable"
  };
}

interface FeatureConfiguration {
  readonly factKey: TigerTableFactKey;
  readonly id: string;
  readonly kicker: string;
  readonly mediaKey: string;
  readonly limitation?: string;
  readonly title: string;
  readonly whyItMatters: string;
}

interface UniversalPackConfiguration {
  readonly comparison: {
    readonly folding: string;
    readonly frame: string;
    readonly installation: string;
    readonly mobility: string;
    readonly net: string;
    readonly playingFeel: string;
    readonly surface: string;
    readonly weatherproof: string;
    readonly warranty?: string;
  };
  readonly features: readonly FeatureConfiguration[];
  readonly manual: {
    readonly href: string;
    readonly label: string;
  };
  readonly additionalResources?: readonly TigerTableResourceLink[];
  readonly setupVideo?: {
    readonly href: string;
    readonly label: string;
  };
  readonly storyMedia: TigerTableEditorialMedia;
  readonly trustFacts: readonly TigerTableTrustFact[];
}

const UNIVERSAL_PACK_CONFIGURATIONS = {
  "tiger-expo-outdoor-table": {
    comparison: {
      folding: "Compact quick-lock folding",
      frame: "50 mm steel",
      installation: "Assembly required",
      mobility: "Four double 128 mm wheels",
      net: "Fixed / adjustable",
      playingFeel: "Good",
      surface: "5 mm melamine resin",
      weatherproof: "Yes",
      warranty: "10-year tabletop / 3-year table"
    },
    features: [
      {
        factKey: "playing-surface",
        id: "playing-surface",
        kicker: "PLAYING SURFACE",
        mediaKey: "tiger-expo-outdoor-table-detail-playing-surface-01",
        title: "5 mm melamine resin top",
        whyItMatters:
          "The resin surface is specified for outdoor play, while the matte finish reduces reflected glare."
      },
      {
        factKey: "frame",
        id: "frame",
        kicker: "FRAME & LEGS",
        mediaKey: "tiger-expo-outdoor-table-detail-frame-01",
        title: "Powder-coated steel frame",
        whyItMatters:
          "The steel undercarriage supports the playing surface, and the coating protects the frame during regular outdoor use."
      },
      {
        factKey: "folding-system",
        id: "folding-system",
        kicker: "FOLDING SYSTEM",
        mediaKey: "tiger-expo-outdoor-table-detail-folding-system-01",
        title: "Locking-handle fold",
        whyItMatters:
          "One person can close the table and return it to play without removing the net."
      },
      {
        factKey: "wheels",
        id: "wheels",
        kicker: "MOBILITY",
        mediaKey: "tiger-expo-outdoor-table-detail-wheels-01",
        title: "Four double outdoor wheels",
        whyItMatters:
          "The larger double-wheel format makes the folded table easier to move across patios and other firm outdoor surfaces."
      },
      {
        factKey: "net",
        id: "net",
        kicker: "NET SYSTEM",
        mediaKey: "tiger-expo-outdoor-table-detail-net-01",
        title: "Fixed adjustable net",
        whyItMatters:
          "It stays attached when the table is folded, so there is no separate net to reinstall."
      },
      {
        factKey: "storage",
        id: "storage",
        kicker: "GEAR STORAGE",
        limitation: "Paddles and balls are sold separately.",
        mediaKey: "tiger-expo-outdoor-table-detail-storage-01",
        title: "Built-in paddle and ball storage",
        whyItMatters: "The gear can stay with the table between games."
      }
    ],
    manual: {
      href: "https://res.cloudinary.com/djfcisldm/raw/upload/fl_attachment:Tiger-Expo-Outdoor-Installation-Guide/v1784409337/tiger-pingpong/resources/manuals/expo-outdoor-installation-guide.pdf",
      label: "Expo Outdoor installation guide"
    },
    setupVideo: {
      href: "https://www.youtube.com/watch?v=3WAdtN03EJ4",
      label: "Watch the Expo Outdoor setup video"
    },
    storyMedia: {
      altText: "Expo Outdoor PingPong table beside a pool",
      mediaKey: "tiger-expo-outdoor-table-lifestyle-poolside-01",
      role: "lifestyle"
    },
    trustFacts: [
      { detail: "Made in", heading: "Germany", id: "made-in-germany" },
      { detail: "Outdoor tabletop warranty", heading: "10 years", id: "tabletop-warranty" },
      { detail: "Table warranty", heading: "3 years", id: "table-warranty" }
    ]
  },
  "tiger-portland-indoor-table": {
    comparison: {
      folding: "Compact quick-lock folding",
      frame: "50 mm steel",
      installation: "Assembly required",
      mobility: "Four 100 mm wheels; locking wheels",
      net: "Fixed / adjustable",
      playingFeel: "Professional",
      surface: "22 mm chipboard",
      weatherproof: "No",
      warranty: "3-year table warranty"
    },
    features: [
      {
        factKey: "playing-surface",
        id: "playing-surface",
        kicker: "PLAYING SURFACE",
        mediaKey: "tiger-portland-indoor-table-detail-playing-surface-01",
        title: "22 mm indoor top",
        whyItMatters:
          "The thicker indoor top gives the ball a firm, steady rebound for everyday and repeat play."
      },
      {
        factKey: "frame",
        id: "frame",
        kicker: "FRAME & LEGS",
        mediaKey: "tiger-portland-indoor-table-detail-frame-01",
        title: "Powder-coated steel frame",
        whyItMatters:
          "It supports the heavier indoor top while keeping the folded footprint manageable."
      },
      {
        factKey: "folding-system",
        id: "folding-system",
        kicker: "FOLDING SYSTEM",
        mediaKey: "tiger-portland-indoor-table-detail-folding-system-01",
        title: "Visible-handle locking system",
        whyItMatters: "One person can open, fold, and store the table without dismantling the net."
      },
      {
        factKey: "wheels",
        id: "wheels",
        kicker: "MOBILITY",
        mediaKey: "tiger-portland-indoor-table-detail-wheels-01",
        title: "Easy-roll locking wheels",
        whyItMatters:
          "That makes it practical in rooms that need to change between play and other uses."
      },
      {
        factKey: "net",
        id: "net",
        kicker: "NET SYSTEM",
        mediaKey: "tiger-portland-indoor-table-detail-net-01",
        title: "Fixed adjustable net",
        whyItMatters: "It is ready with the table instead of becoming another part to store."
      },
      {
        factKey: "storage",
        id: "storage",
        kicker: "GEAR STORAGE",
        limitation: "Paddles and balls are sold separately.",
        mediaKey: "tiger-portland-indoor-table-detail-storage-01",
        title: "Built-in paddle and ball storage",
        whyItMatters: "The gear stays close to the table between games."
      }
    ],
    manual: {
      href: "https://res.cloudinary.com/djfcisldm/raw/upload/fl_attachment:Tiger-Portland-Indoor-Installation-Guide/v1784409346/tiger-pingpong/resources/manuals/portland-indoor-installation-guide.pdf",
      label: "Portland Indoor installation guide"
    },
    setupVideo: {
      href: "https://www.youtube.com/watch?v=EDCxiCuWoIo",
      label: "Watch the Portland Indoor setup video"
    },
    storyMedia: {
      altText: "Portland Indoor PingPong table in a shared indoor space",
      mediaKey: "tiger-portland-indoor-table-lifestyle-lobby-01",
      role: "lifestyle"
    },
    trustFacts: [
      { detail: "Made in", heading: "Germany", id: "made-in-germany" },
      { detail: "Table warranty", heading: "3 years", id: "table-warranty" }
    ]
  },
  "tiger-portland-outdoor-table": {
    comparison: {
      folding: "Compact quick-lock folding",
      frame: "50 mm steel",
      installation: "Assembly required",
      mobility: '5" double wheels; no brakes',
      net: "Fixed / adjustable",
      playingFeel: "Very good",
      surface: "6 mm melamine resin",
      weatherproof: "Yes",
      warranty: "10-year tabletop / 3-year table"
    },
    features: [
      {
        factKey: "playing-surface",
        id: "playing-surface",
        kicker: "PLAYING SURFACE",
        mediaKey: "tiger-portland-outdoor-table-primary-01",
        title: "6 mm indoor/outdoor top",
        whyItMatters:
          "The surface is specified for outdoor use and provides a firm rebound without the weight of a thick indoor wood top."
      },
      {
        factKey: "frame",
        id: "frame",
        kicker: "FRAME & LEVELLING",
        mediaKey: "tiger-portland-outdoor-table-gallery-03",
        title: "Welded steel frame",
        whyItMatters:
          "The welded undercarriage supports the table through regular play and movement."
      },
      {
        factKey: "folding-system",
        id: "folding-system",
        kicker: "FOLDING SYSTEM",
        mediaKey: "tiger-portland-outdoor-table-gallery-04",
        title: "SMS locking system",
        whyItMatters:
          "That keeps the changeover between play, solo playback, and storage straightforward."
      },
      {
        factKey: "wheels",
        id: "wheels",
        kicker: "MOBILITY",
        limitation: "The wheels do not have brakes.",
        mediaKey: "tiger-portland-outdoor-table-variant-grey-playback-01",
        title: '5" double wheels',
        whyItMatters: "The double-wheel format spreads the load while the table is being moved."
      },
      {
        factKey: "net",
        id: "net",
        kicker: "NET SYSTEM",
        mediaKey: "tiger-portland-outdoor-table-detail-net-01",
        title: "Fixed adjustable net",
        whyItMatters:
          "It remains with the table between play and storage, so it does not need to be reinstalled."
      },
      {
        factKey: "storage",
        id: "storage",
        kicker: "GEAR STORAGE",
        limitation: "Paddles and balls are sold separately.",
        mediaKey: "tiger-portland-outdoor-table-detail-storage-01",
        title: "Built-in paddle and ball storage",
        whyItMatters: "The gear stays ready at the table between games."
      },
      {
        factKey: "legs",
        id: "levelling",
        kicker: "LEG LEVELLING",
        mediaKey: "tiger-portland-outdoor-table-gallery-05",
        title: "Adjustable steel levellers",
        whyItMatters:
          "They let the owner correct the playing surface when the floor or patio is not perfectly level."
      }
    ],
    manual: {
      href: "https://res.cloudinary.com/djfcisldm/raw/upload/fl_attachment:Tiger-Portland-Outdoor-Installation-Guide/v1784409348/tiger-pingpong/resources/manuals/portland-outdoor-installation-guide.pdf",
      label: "Portland Outdoor installation guide"
    },
    setupVideo: {
      href: "https://www.youtube.com/watch?v=mUmB-HPWHHs",
      label: "Watch the Portland Outdoor setup video"
    },
    storyMedia: {
      altText: "Grey Portland Outdoor V2 PingPong table on a shaded backyard patio",
      mediaKey: "tiger-portland-outdoor-table-lifestyle-patio-v2-01",
      role: "lifestyle"
    },
    trustFacts: [
      { detail: "Made in", heading: "Germany", id: "made-in-germany" },
      { detail: "Outdoor tabletop warranty", heading: "10 years", id: "tabletop-warranty" },
      { detail: "Table warranty", heading: "3 years", id: "table-warranty" }
    ]
  },
  "tiger-whistler-indoor-table": {
    comparison: {
      folding: "Compact quick-lock folding",
      frame: "60 mm steel",
      installation: "Assembly required",
      mobility: "Four 100 mm wheels; two lock",
      net: "Fixed / adjustable",
      playingFeel: "Elite / tournament",
      surface: "25 mm multi-coated chipboard",
      weatherproof: "No"
    },
    features: [
      {
        factKey: "playing-surface",
        id: "playing-surface",
        kicker: "PLAYING SURFACE",
        mediaKey: "tiger-whistler-indoor-table-detail-playing-surface-01",
        title: "25 mm multi-coated top",
        whyItMatters:
          "The thick indoor top gives the ball a firm, consistent rebound for players who pay attention to playing feel."
      },
      {
        factKey: "frame",
        id: "frame",
        kicker: "FRAME & LEGS",
        mediaKey: "tiger-whistler-indoor-table-detail-frame-01",
        title: "60 mm powder-coated frame",
        whyItMatters:
          "The substantial frame supports the heavier top, while the leg levellers adjust up to 25 mm."
      },
      {
        factKey: "folding-system",
        id: "folding-system",
        kicker: "FOLDING SYSTEM",
        mediaKey: "tiger-whistler-indoor-table-detail-folding-system-01",
        title: "Drawbar locking system",
        whyItMatters: "The single control keeps the opening and folding sequence direct."
      },
      {
        factKey: "wheels",
        id: "wheels",
        kicker: "WHEELS & LEVELLING",
        mediaKey: "tiger-whistler-indoor-table-detail-wheels-01",
        title: "Four rubber-tread wheels",
        whyItMatters: "The table can be rolled into position, held there, and levelled for play."
      },
      {
        factKey: "net",
        id: "net",
        kicker: "NET SYSTEM",
        mediaKey: "tiger-whistler-indoor-table-detail-net-01",
        title: "Fixed adjustable net",
        whyItMatters: "It remains attached when the table is folded."
      }
    ],
    manual: {
      href: "https://res.cloudinary.com/djfcisldm/raw/upload/fl_attachment:Tiger-Whistler-Indoor-Assembly-Guide/v1784409349/tiger-pingpong/resources/manuals/whistler-indoor-installation-guide.pdf",
      label: "Whistler Indoor assembly guide"
    },
    setupVideo: {
      href: "https://www.youtube.com/watch?v=tuvacihKUCk",
      label: "Watch the Whistler Indoor setup video"
    },
    storyMedia: {
      altText: "Whistler Indoor PingPong table in a modern indoor room",
      mediaKey: "tiger-whistler-indoor-table-lifestyle-lobby-01",
      role: "lifestyle"
    },
    trustFacts: [
      { detail: "Made in", heading: "Germany", id: "made-in-germany" },
      { detail: "Multi-coated indoor top", heading: "25 mm", id: "playing-surface" },
      {
        detail: "Table tennis standards",
        heading: "International",
        id: "playing-standard"
      }
    ]
  },
  "tiger-plaza-outdoor-table-grey": {
    additionalResources: [
      {
        href: "https://drive.google.com/file/d/17TavVOPhXHJZB7uuav2aIWtNi4-ff1ZD/view?usp=sharing",
        id: "specifications-sheet",
        kind: "specification",
        label: "Plaza Outdoor specifications sheet"
      }
    ],
    comparison: {
      folding: "Fixed",
      frame: "Galvanized steel",
      installation: "Ground anchoring kit included",
      mobility: "Fixed; no wheels",
      net: "Solid metal",
      playingFeel: "Thick outdoor top",
      surface: "10 mm melamine resin",
      weatherproof: "Yes",
      warranty: "10-year tabletop / 3-year table"
    },
    features: [
      {
        factKey: "playing-surface",
        id: "playing-surface",
        kicker: "PLAYING SURFACE",
        mediaKey: "tiger-plaza-outdoor-table-grey-detail-playing-surface-01",
        title: "10 mm melamine resin top",
        whyItMatters:
          "The thicker fixed top is intended for repeat play in outdoor and shared settings."
      },
      {
        factKey: "frame",
        id: "frame",
        kicker: "STRUCTURE",
        mediaKey: "tiger-plaza-outdoor-table-grey-detail-frame-01",
        title: "Galvanized steel frame",
        whyItMatters: "It creates a fixed support structure rather than a folding undercarriage."
      },
      {
        factKey: "assembly",
        id: "anchoring",
        kicker: "ANCHORING",
        mediaKey: "tiger-plaza-outdoor-table-grey-detail-anchoring-01",
        title: "Ground fastening kit",
        whyItMatters:
          "The included hardware keeps Plaza assigned to its shared space instead of being moved between games."
      },
      {
        factKey: "net",
        id: "net",
        kicker: "NET SYSTEM",
        mediaKey: "tiger-plaza-outdoor-table-grey-detail-net-01",
        title: "Solid galvanized steel net",
        whyItMatters:
          "It remains ready at the table without removable posts, clamps, or tension straps."
      },
      {
        factKey: "assembly",
        id: "installation-and-care",
        kicker: "INSTALLATION",
        mediaKey: "tiger-plaza-outdoor-table-grey-lifestyle-urban-01",
        title: "Made for permanent placement",
        whyItMatters: "The site and anchoring plan should be settled before installation."
      }
    ],
    manual: {
      href: "https://res.cloudinary.com/djfcisldm/raw/upload/fl_attachment:Tiger-Plaza-Outdoor-Installation-and-Parts-Guide/v1784409350/tiger-pingpong/resources/manuals/plaza-outdoor-installation-guide.pdf",
      label: "Plaza Outdoor installation and parts guide"
    },
    storyMedia: {
      altText: "Plaza Outdoor PingPong table in a community space",
      mediaKey: "tiger-plaza-outdoor-table-grey-lifestyle-community-01",
      role: "lifestyle"
    },
    trustFacts: [
      { detail: "Made in", heading: "Germany", id: "made-in-germany" },
      { detail: "Outdoor tabletop warranty", heading: "10 years", id: "tabletop-warranty" },
      { detail: "Table warranty", heading: "3 years", id: "table-warranty" }
    ]
  }
} as const satisfies Readonly<Record<TigerTableSlug, UniversalPackConfiguration>>;

const SPEC_GROUPS = [
  {
    heading: "Construction",
    id: "construction",
    keys: ["playing-surface", "frame", "legs"] as const
  },
  {
    heading: "Opening, movement, and storage",
    id: "handling",
    keys: ["folding-system", "wheels", "net", "storage"] as const
  },
  {
    heading: "Dimensions and weight",
    id: "dimensions-and-weight",
    keys: ["dimensions", "weight"] as const
  },
  {
    heading: "Use, assembly, and coverage",
    id: "ownership",
    keys: ["exposure-and-care", "assembly", "included-items", "warranty"] as const
  }
] as const satisfies readonly {
  heading: string;
  id: string;
  keys: readonly TigerTableFactKey[];
}[];

function buildFeatureMoments(
  slug: TigerTableSlug,
  configurations: readonly FeatureConfiguration[]
): readonly TigerTableFeatureMoment[] {
  const factSheet = tigerTableCurrentModelFactSheets[slug];

  return configurations.map((configuration) => {
    const fact = getApprovedTigerTableFact(factSheet.facts[configuration.factKey]);

    if (!fact) {
      throw new Error(
        `Universal table feature requires approved fact: ${slug}#${configuration.factKey}`
      );
    }

    return {
      explanation: {
        ...(configuration.limitation ? { limitation: configuration.limitation } : {}),
        whatItIs: fact.value,
        whyItMatters: configuration.whyItMatters
      },
      id: configuration.id,
      kicker: configuration.kicker,
      mediaKey: configuration.mediaKey,
      title: configuration.title
    };
  });
}

function buildSpecs(slug: TigerTableSlug): TigerTableSpecsBlock {
  const factSheet = tigerTableCurrentModelFactSheets[slug];

  return {
    completeness: "complete",
    groups: SPEC_GROUPS.flatMap((group) => {
      const items = group.keys.flatMap((key) => {
        const fact = getApprovedTigerTableFact(factSheet.facts[key]);

        return fact
          ? [
              {
                id: key,
                label: fact.label,
                value: fact.value
              }
            ]
          : [];
      });

      return items.length > 0
        ? [
            {
              heading: group.heading,
              id: group.id,
              items
            }
          ]
        : [];
    })
  };
}

interface UniversalTablePageInput {
  comparisonPeerSlugs: readonly [TigerTableSlug, TigerTableSlug];
  environment: "Indoor" | "Outdoor";
  slug: TigerTableSlug;
  story: TigerTableStoryBlock;
  storyEvidence?: TigerTableContentEvidenceList;
  useContext: string;
}

function createUniversalTablePage(input: UniversalTablePageInput): TigerTablePageDefinition {
  const storyEvidence = input.storyEvidence ?? PRODUCT_STORY_REGISTER_EVIDENCE;
  const pack: UniversalPackConfiguration = UNIVERSAL_PACK_CONFIGURATIONS[input.slug];
  const comparisonWarranty = "warranty" in pack.comparison ? pack.comparison.warranty : undefined;

  return {
    comparisonFacts: {
      environment: approvedComparisonFact(
        "environment",
        "Environment",
        input.environment,
        storyEvidence
      ),
      "use-context": approvedComparisonFact(
        "use-context",
        "Made for",
        input.useContext,
        storyEvidence
      ),
      surface: approvedComparisonFact(
        "surface",
        "Playing surface",
        pack.comparison.surface,
        PRODUCT_STORY_REGISTER_EVIDENCE
      ),
      "playing-feel": approvedComparisonFact(
        "playing-feel",
        "Playing feel",
        pack.comparison.playingFeel,
        PRODUCT_STORY_REGISTER_EVIDENCE
      ),
      weatherproof: approvedComparisonFact(
        "weatherproof",
        "Weatherproof",
        pack.comparison.weatherproof,
        PRODUCT_STORY_REGISTER_EVIDENCE
      ),
      frame: approvedComparisonFact(
        "frame",
        "Frame",
        pack.comparison.frame,
        PRODUCT_STORY_REGISTER_EVIDENCE
      ),
      folding: approvedComparisonFact(
        "folding",
        "Folding",
        pack.comparison.folding,
        PRODUCT_STORY_REGISTER_EVIDENCE
      ),
      mobility: approvedComparisonFact(
        "mobility",
        "Mobility",
        pack.comparison.mobility,
        PRODUCT_STORY_REGISTER_EVIDENCE
      ),
      net: approvedComparisonFact(
        "net",
        "Net",
        pack.comparison.net,
        PRODUCT_STORY_REGISTER_EVIDENCE
      ),
      installation: approvedComparisonFact(
        "installation",
        "Installation",
        pack.comparison.installation,
        PRODUCT_STORY_REGISTER_EVIDENCE
      ),
      warranty: comparisonWarranty
        ? approvedComparisonFact(
            "warranty",
            "Warranty",
            comparisonWarranty,
            PRODUCT_STORY_REGISTER_EVIDENCE
          )
        : notApplicable(
            "No warranty term appears on the current product page, so no warranty comparison is published."
          )
    },
    comparisonPeerSlugs: input.comparisonPeerSlugs,
    featureMoments: approved(
      buildFeatureMoments(input.slug, pack.features),
      PRODUCT_STORY_REGISTER_EVIDENCE
    ),
    publicationStatus: "universal-v1",
    resources: approved(
      {
        heading: "Manuals and real help",
        links: [
          {
            href: pack.manual.href,
            id: "assembly-guide",
            kind: "manual",
            label: pack.manual.label
          },
          ...(pack.setupVideo
            ? [
                {
                  href: pack.setupVideo.href,
                  id: "setup-video",
                  kind: "assembly" as const,
                  label: pack.setupVideo.label
                }
              ]
            : []),
          ...(pack.additionalResources ?? [])
        ]
      },
      CURRENT_RESOURCE_EVIDENCE
    ),
    slug: input.slug,
    specs: approved(buildSpecs(input.slug), PRODUCT_STORY_REGISTER_EVIDENCE),
    story: approved(input.story, storyEvidence),
    storyMedia: approved(pack.storyMedia, CURRENT_MEDIA_EVIDENCE),
    trustFacts: approved(pack.trustFacts, [
      ...CURRENT_TABLE_ORIGIN_EVIDENCE,
      ...PRODUCT_STORY_REGISTER_EVIDENCE
    ])
  };
}

export const tigerTablePages = {
  "tiger-expo-outdoor-table": createUniversalTablePage({
    comparisonPeerSlugs: ["tiger-portland-outdoor-table", "tiger-plaza-outdoor-table-grey"],
    environment: "Outdoor",
    slug: "tiger-expo-outdoor-table",
    story: {
      body: "Expo Outdoor is the relaxed backyard choice: a real outdoor table that is straightforward to open, play, fold, and move when the space has other plans. Less overthinking. More rallies.",
      eyebrow: "Why Expo",
      heading: "Easygoing outdoor."
    },
    useContext: "Backyards"
  }),
  "tiger-portland-indoor-table": createUniversalTablePage({
    comparisonPeerSlugs: ["tiger-whistler-indoor-table", "tiger-portland-outdoor-table"],
    environment: "Indoor",
    slug: "tiger-portland-indoor-table",
    story: {
      body: "Portland Indoor is a proper playing table for basements, rec rooms, schools, and shared indoor spaces that still need their room back. Open it for the rally. Fold and roll it away when something else is on the schedule.",
      eyebrow: "Why Portland Indoor",
      heading: "Home-court feel."
    },
    useContext: "Basements, rec rooms, and community centres"
  }),
  "tiger-portland-outdoor-table": createUniversalTablePage({
    comparisonPeerSlugs: ["tiger-expo-outdoor-table", "tiger-portland-indoor-table"],
    environment: "Outdoor",
    slug: "tiger-portland-outdoor-table",
    story: {
      body: "At a cottage, in a family backyard, at a school, or inside a community space, the PingPong table is rarely the only thing happening. Portland Outdoor is made for that rhythm: a proper playing table when the rally starts, then a folding, rolling piece of gear when the space needs to do something else.",
      eyebrow: "Why Portland",
      heading: "The space has other plans."
    },
    storyEvidence: UNIVERSAL_PAGE_PLAN_EVIDENCE,
    useContext: "Cottages, family backyards, schools, and community spaces"
  }),
  "tiger-whistler-indoor-table": createUniversalTablePage({
    comparisonPeerSlugs: ["tiger-portland-indoor-table", "tiger-portland-outdoor-table"],
    environment: "Indoor",
    slug: "tiger-whistler-indoor-table",
    story: {
      body: "Whistler is for the player who notices the playing feel and wants the room to feel considered too. The thicker indoor top, substantial frame, and precise levelling do the serious work. The rest is still a game.",
      eyebrow: "Why Whistler",
      heading: "For the serious rallies."
    },
    useContext: "Dry rooms for players who notice the bounce"
  }),
  "tiger-plaza-outdoor-table-grey": createUniversalTablePage({
    comparisonPeerSlugs: ["tiger-portland-outdoor-table", "tiger-expo-outdoor-table"],
    environment: "Outdoor",
    slug: "tiger-plaza-outdoor-table-grey",
    story: {
      body: "Plaza is the durable, robust, weatherproof alternative to a concrete table for parks, campuses, community spaces, and shared buildings. It anchors in place, keeps a solid metal net ready, and waits for whoever starts the next rally.",
      eyebrow: "Why Plaza",
      heading: "Made for shared spaces."
    },
    useContext: "Parks, campuses, and community centres"
  })
} as const satisfies Readonly<Record<TigerTableSlug, TigerTablePageDefinition>>;

const tigerTableSlugSet: ReadonlySet<string> = new Set(TIGER_TABLE_SLUGS);

export function isTigerTableSlug(value: unknown): value is TigerTableSlug {
  return typeof value === "string" && tigerTableSlugSet.has(value);
}

export function getTigerTablePageDefinition(
  productSlug: string
): TigerTablePageDefinition | undefined {
  return isTigerTableSlug(productSlug) ? tigerTablePages[productSlug] : undefined;
}

export function getApprovedSectionContent<T>(section: ReviewedSection<T>): T | undefined {
  return section.status === "approved" ? section.content : undefined;
}

export function getApprovedComparisonFacts(
  definition: TigerTablePageDefinition
): readonly TigerTableComparisonFact[] {
  return TIGER_TABLE_COMPARISON_FACT_KEYS.flatMap((key) => {
    const content = getApprovedSectionContent(definition.comparisonFacts[key]);
    return content ? [content] : [];
  });
}

function hasSafeComparisonBasics(slug: TigerTableSlug): boolean {
  const definition = tigerTablePages[slug];
  return Boolean(
    getApprovedSectionContent(definition.comparisonFacts.environment) &&
    getApprovedSectionContent(definition.comparisonFacts["use-context"])
  );
}

function hasResolvedEditorialMedia(
  definition: TigerTablePageDefinition,
  storyMedia: TigerTableEditorialMedia,
  featureMoments: readonly TigerTableFeatureMoment[]
): boolean {
  if (!isTigerTableEditorialMediaReady(definition.slug, storyMedia.mediaKey, "lifestyle")) {
    return false;
  }

  return featureMoments.every((moment) =>
    isTigerTableEditorialMediaReady(definition.slug, moment.mediaKey)
  );
}

export function isTigerTableEditorialMediaReady(
  productSlug: TigerTableSlug,
  mediaKey: string,
  requiredRole?: string
): boolean {
  const asset = reviewedMediaByProductSlug.get(productSlug)?.get(mediaKey);

  return Boolean(
    asset &&
    (!requiredRole || asset.role === requiredRole) &&
    asset.rightsStatus === "owner_cleared" &&
    asset.modelVerification.startsWith("verified_current") &&
    (asset.localPublicPath?.trim() || asset.cloudinary?.secureUrl?.trim())
  );
}

export function isTigerTablePageReady(
  definition: TigerTablePageDefinition,
  factSheet: TigerTableCurrentModelFactSheet = tigerTableCurrentModelFactSheets[definition.slug]
): boolean {
  const story = getApprovedSectionContent(definition.story);
  const storyMedia = getApprovedSectionContent(definition.storyMedia);
  const trustFacts = getApprovedSectionContent(definition.trustFacts);
  const featureMoments = getApprovedSectionContent(definition.featureMoments);
  const specs = getApprovedSectionContent(definition.specs);
  const comparisonSlugs = [definition.slug, ...definition.comparisonPeerSlugs] as const;

  return Boolean(
    definition.publicationStatus === "universal-v1" &&
    factSheet.slug === definition.slug &&
    isTigerTableCurrentModelFactSheetComplete(factSheet) &&
    story &&
    storyMedia &&
    trustFacts &&
    trustFacts.length >= 2 &&
    featureMoments &&
    featureMoments.length >= 4 &&
    featureMoments[0]?.id === "playing-surface" &&
    hasResolvedEditorialMedia(definition, storyMedia, featureMoments) &&
    specs &&
    specs.completeness === "complete" &&
    specs.groups.length > 0 &&
    specs.groups.every((group) => group.items.length > 0) &&
    comparisonSlugs.every(hasSafeComparisonBasics)
  );
}

export function getPublishableTigerTablePage(
  productSlug: string
): TigerTablePageDefinition | undefined {
  const definition = getTigerTablePageDefinition(productSlug);
  return definition && isTigerTablePageReady(definition) ? definition : undefined;
}
