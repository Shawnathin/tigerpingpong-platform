import type { TigerTableSlug } from "./tiger-table-slugs";

export const TIGER_TABLE_FACT_KEYS = [
  "playing-surface",
  "frame",
  "legs",
  "folding-system",
  "wheels",
  "net",
  "storage",
  "dimensions",
  "weight",
  "warranty",
  "exposure-and-care",
  "assembly",
  "included-items",
  "manual-applicability"
] as const;

export type TigerTableFactKey = (typeof TIGER_TABLE_FACT_KEYS)[number];
export type TigerTableFactReviewStatus = "approved" | "pending" | "not-applicable";
export type TigerTableFactEvidenceKind =
  | "legacy-candidate"
  | "owner-locked"
  | "verified-primary"
  | "live-catalog";
export type TigerTableFactSheetReviewStatus = "discovery" | "owner-review" | "complete";

export interface TigerTableFactEvidence {
  readonly checkedOn: string;
  readonly kind: TigerTableFactEvidenceKind;
  readonly note?: string;
  readonly source: string;
}

export type TigerTableFactEvidenceList = readonly [
  TigerTableFactEvidence,
  ...TigerTableFactEvidence[]
];

export type TigerTableFactConflict =
  | {
      readonly status: "not-reviewed";
    }
  | {
      readonly status: "none";
    }
  | {
      readonly note: string;
      readonly sources: readonly string[];
      readonly status: "unresolved";
    };

export type TigerTableOwnerConfirmation =
  | {
      readonly status: "not-requested";
    }
  | {
      readonly note?: string;
      readonly requestedOn: string;
      readonly status: "requested";
    }
  | {
      readonly confirmedBy: "Shawn Cleve";
      readonly confirmedOn: string;
      readonly source: string;
      readonly status: "confirmed";
    }
  | {
      readonly reason: string;
      readonly status: "not-required";
    }
  | {
      readonly note: string;
      readonly rejectedOn: string;
      readonly status: "rejected";
    };

interface TigerTableFactBase {
  readonly conflict: TigerTableFactConflict;
  readonly evidence: readonly TigerTableFactEvidence[];
  readonly key: TigerTableFactKey;
  readonly label: string;
  readonly ownerConfirmation: TigerTableOwnerConfirmation;
  readonly reviewStatus: TigerTableFactReviewStatus;
}

export interface TigerTableApprovedFact extends TigerTableFactBase {
  readonly conflict: Extract<TigerTableFactConflict, { status: "none" }>;
  readonly evidence: TigerTableFactEvidenceList;
  readonly ownerConfirmation: Extract<
    TigerTableOwnerConfirmation,
    { status: "confirmed" | "not-required" }
  >;
  readonly reviewStatus: "approved";
  readonly value: string;
}

export interface TigerTablePendingFact extends TigerTableFactBase {
  readonly candidateValue?: string;
  readonly reason: string;
  readonly reviewStatus: "pending";
}

export interface TigerTableNotApplicableFact extends TigerTableFactBase {
  readonly conflict: Extract<TigerTableFactConflict, { status: "none" }>;
  readonly evidence: TigerTableFactEvidenceList;
  readonly ownerConfirmation: Extract<
    TigerTableOwnerConfirmation,
    { status: "confirmed" | "not-required" }
  >;
  readonly reason: string;
  readonly reviewStatus: "not-applicable";
}

export type TigerTableFact =
  | TigerTableApprovedFact
  | TigerTablePendingFact
  | TigerTableNotApplicableFact;

export type TigerTableCurrentModelScope =
  | {
      readonly activeSkuReferences: readonly string[];
      readonly conflict: TigerTableFactConflict;
      readonly evidence: readonly TigerTableFactEvidence[];
      readonly ownerConfirmation: TigerTableOwnerConfirmation;
      readonly reason: string;
      readonly reviewStatus: "pending";
    }
  | {
      readonly activeSkuReferences: readonly [string, ...string[]];
      readonly conflict: Extract<TigerTableFactConflict, { status: "none" }>;
      readonly evidence: TigerTableFactEvidenceList;
      readonly ownerConfirmation: Extract<
        TigerTableOwnerConfirmation,
        { status: "confirmed" | "not-required" }
      >;
      readonly reviewStatus: "approved";
    };

export interface TigerTableCurrentModelFactSheet {
  readonly facts: Readonly<Record<TigerTableFactKey, TigerTableFact>>;
  readonly modelScope: TigerTableCurrentModelScope;
  readonly reviewStatus: TigerTableFactSheetReviewStatus;
  readonly slug: TigerTableSlug;
}

const FACT_LABELS = {
  assembly: "Assembly",
  dimensions: "Dimensions",
  "exposure-and-care": "Exposure and care",
  "folding-system": "Folding system",
  frame: "Frame",
  "included-items": "Included items",
  legs: "Legs",
  "manual-applicability": "Manual applicability",
  net: "Net",
  "playing-surface": "Playing surface",
  storage: "Storage",
  warranty: "Warranty",
  weight: "Weight",
  wheels: "Wheels"
} as const satisfies Record<TigerTableFactKey, string>;

const OWNER_PRODUCT_PAGE_CONFIRMATION = {
  checkedOn: "2026-07-28",
  kind: "owner-locked",
  note: "Shawn confirmed that every description and product detail on the current table pages is truthful and may be used as product truth.",
  source: "Owner confirmation in the Universal Tiger Table Product Page System task (2026-07-28)"
} as const satisfies TigerTableFactEvidence;

const NORMALIZED_PRODUCT_PAGE_EVIDENCE = {
  checkedOn: "2026-07-28",
  kind: "owner-locked",
  note: "The normalized current-page record is approved by the owner's explicit confirmation in this task.",
  source: "data/product-content/tigerpingpong-product-content-normalized.json"
} as const satisfies TigerTableFactEvidence;

const CURRENT_VARIANT_SCOPE_EVIDENCE = {
  checkedOn: "2026-07-28",
  kind: "live-catalog",
  source: "data/import-review/tigerpingpong/v1/product_variants_import_v1.csv"
} as const satisfies TigerTableFactEvidence;

const TABLE_MANUAL_EVIDENCE = {
  checkedOn: "2026-07-28",
  kind: "verified-primary",
  note: "Owner-provided manuals are uploaded and delivery-ready in the table support resource manifest.",
  source: "data/media/replacement-parts-launch-media-v1.json"
} as const satisfies TigerTableFactEvidence;

const TABLE_INCLUDED_ITEMS_EVIDENCE = {
  checkedOn: "2026-07-28",
  kind: "owner-locked",
  note: "Current Tiger tables include the table and listed net system; paddles and balls are not included.",
  source: "docs/brand/FACTS-AND-CLAIMS.md#commerce-and-shipping"
} as const satisfies TigerTableFactEvidence;

const OWNER_CONFIRMATION = {
  confirmedBy: "Shawn Cleve",
  confirmedOn: "2026-07-28",
  source: OWNER_PRODUCT_PAGE_CONFIRMATION.source,
  status: "confirmed"
} as const satisfies TigerTableOwnerConfirmation;

const PRODUCT_PAGE_EVIDENCE = [
  OWNER_PRODUCT_PAGE_CONFIRMATION,
  NORMALIZED_PRODUCT_PAGE_EVIDENCE
] as const satisfies TigerTableFactEvidenceList;

const MANUAL_EVIDENCE = [
  OWNER_PRODUCT_PAGE_CONFIRMATION,
  TABLE_MANUAL_EVIDENCE
] as const satisfies TigerTableFactEvidenceList;

const INCLUDED_ITEMS_EVIDENCE = [
  OWNER_PRODUCT_PAGE_CONFIRMATION,
  NORMALIZED_PRODUCT_PAGE_EVIDENCE,
  TABLE_INCLUDED_ITEMS_EVIDENCE
] as const satisfies TigerTableFactEvidenceList;

function approvedFact(
  key: TigerTableFactKey,
  value: string,
  evidence: TigerTableFactEvidenceList = PRODUCT_PAGE_EVIDENCE
): TigerTableApprovedFact {
  return {
    conflict: {
      status: "none"
    },
    evidence,
    key,
    label: FACT_LABELS[key],
    ownerConfirmation: OWNER_CONFIRMATION,
    reviewStatus: "approved",
    value
  };
}

function notApplicableFact(
  key: TigerTableFactKey,
  reason: string,
  evidence: TigerTableFactEvidenceList = PRODUCT_PAGE_EVIDENCE
): TigerTableNotApplicableFact {
  return {
    conflict: {
      status: "none"
    },
    evidence,
    key,
    label: FACT_LABELS[key],
    ownerConfirmation: OWNER_CONFIRMATION,
    reason,
    reviewStatus: "not-applicable"
  };
}

function completeFactSheet(
  slug: TigerTableSlug,
  activeSkuReferences: readonly [string, ...string[]],
  facts: Record<TigerTableFactKey, TigerTableFact>
): TigerTableCurrentModelFactSheet {
  return {
    facts,
    modelScope: {
      activeSkuReferences,
      conflict: {
        status: "none"
      },
      evidence: [
        OWNER_PRODUCT_PAGE_CONFIRMATION,
        CURRENT_VARIANT_SCOPE_EVIDENCE
      ] as const satisfies TigerTableFactEvidenceList,
      ownerConfirmation: OWNER_CONFIRMATION,
      reviewStatus: "approved"
    },
    reviewStatus: "complete",
    slug
  };
}

export const tigerTableCurrentModelFactSheets = {
  "tiger-expo-outdoor-table": completeFactSheet(
    "tiger-expo-outdoor-table",
    [
      "tiger-expo-outdoor-table-color-grey (SKU 15224)",
      "tiger-expo-outdoor-table-color-blue (SKU 15225)"
    ],
    {
      "playing-surface": approvedFact(
        "playing-surface",
        "5 mm pure melamine resin board with a matte anti-reflection coating; impact-, shock-, and weather-resistant."
      ),
      frame: approvedFact(
        "frame",
        'Powder-coated steel frame with a 50 mm L-profile trim and a 2" × 1 1/4" frame section.'
      ),
      legs: approvedFact("legs", '1.18" × 1.18" powder-coated steel legs.'),
      "folding-system": approvedFact(
        "folding-system",
        "Locking-handle folding system with a compact single-frame rollaway and one-side playback position."
      ),
      wheels: approvedFact("wheels", "Four double 128 mm wheels with rubber tread."),
      net: approvedFact(
        "net",
        "Fixed black polyethylene net with height and tension adjustment; it remains attached when the table is folded."
      ),
      storage: approvedFact(
        "storage",
        "Storage on both sides for up to four paddles and 18 balls."
      ),
      dimensions: approvedFact(
        "dimensions",
        "Playing: 274 × 152 × 76 cm. Storage: 152–184 × 72 × 155 cm. Original package: 144 × 9 × 162 cm."
      ),
      weight: approvedFact("weight", "Net: 60 kg. Gross: 65 kg."),
      warranty: approvedFact(
        "warranty",
        "Three years against manufacturing defects; 10 years on the outdoor tabletop. Wheels, net, and net posts are excluded."
      ),
      "exposure-and-care": approvedFact(
        "exposure-and-care",
        "Outdoor table with a durable, weather-proof top and powder-coated frame."
      ),
      assembly: approvedFact(
        "assembly",
        "Expo Outdoor installation guide MA 212, revision 14.05.13-03.",
        MANUAL_EVIDENCE
      ),
      "included-items": approvedFact(
        "included-items",
        "Fixed adjustable net set. Paddles and balls are not included.",
        INCLUDED_ITEMS_EVIDENCE
      ),
      "manual-applicability": approvedFact(
        "manual-applicability",
        "Tiger Expo Outdoor Installation Guide, MA 212, revision 14.05.13-03.",
        MANUAL_EVIDENCE
      )
    }
  ),
  "tiger-portland-indoor-table": completeFactSheet(
    "tiger-portland-indoor-table",
    [
      "tiger-portland-indoor-table-color-grey (SKU 9476)",
      "tiger-portland-indoor-table-color-green (SKU 7012)"
    ],
    {
      "playing-surface": approvedFact(
        "playing-surface",
        '22 mm (7/8") chipboard playing surface manufactured with tournament-style production processes.'
      ),
      frame: approvedFact(
        "frame",
        '2" × 1 1/4" powder-coated steel frame with a compact undercarriage.'
      ),
      legs: approvedFact("legs", "Powder-coated steel legs."),
      "folding-system": approvedFact(
        "folding-system",
        "Visible-handle locking system for opening, folding, and storage; one side can be raised for solo playback."
      ),
      wheels: approvedFact(
        "wheels",
        "Four 100 mm rubber-tread easy-roll wheels with locking wheels."
      ),
      net: approvedFact(
        "net",
        "Fixed net with height and tension adjustment; it remains with the table when folded."
      ),
      storage: approvedFact("storage", "Built-in storage for up to four paddles and 18 balls."),
      dimensions: approvedFact(
        "dimensions",
        "Playing: 274 × 153 × 76 cm. Storage: 152–184 × 70 × 155 cm. Original package: 144 × 16 × 162 cm."
      ),
      weight: approvedFact("weight", "Net: 91 kg. Gross: 97 kg."),
      warranty: approvedFact(
        "warranty",
        "Three-year table warranty against defects in materials and workmanship for the original purchaser in the United States and Canada. Wearable items such as the net and damage from improper use, negligence, abuse, transportation, acts of nature, or accidents are excluded. A table with apparent shipping damage should be refused before delivery is accepted."
      ),
      "exposure-and-care": approvedFact(
        "exposure-and-care",
        "Indoor table for dry, controlled rooms."
      ),
      assembly: approvedFact(
        "assembly",
        "Portland Indoor installation guide MA 205, revision 25.05.16-01.",
        MANUAL_EVIDENCE
      ),
      "included-items": approvedFact(
        "included-items",
        "Fixed adjustable net set. Paddles and balls are not included.",
        INCLUDED_ITEMS_EVIDENCE
      ),
      "manual-applicability": approvedFact(
        "manual-applicability",
        "Tiger Portland Indoor Installation Guide, MA 205, revision 25.05.16-01.",
        MANUAL_EVIDENCE
      )
    }
  ),
  "tiger-portland-outdoor-table": completeFactSheet(
    "tiger-portland-outdoor-table",
    [
      "tiger-portland-outdoor-table-v2-grey (SKU 14445)",
      "tiger-portland-outdoor-table-v2-blue (SKU 14446)"
    ],
    {
      "playing-surface": approvedFact(
        "playing-surface",
        "6 mm melamine resin playing surface with an anti-reflection finish."
      ),
      frame: approvedFact("frame", 'Welded 1" × 2" powder-coated steel frame.'),
      legs: approvedFact("legs", '2" × 1 1/4" steel legs with adjustable levellers up to 1 1/4".'),
      "folding-system": approvedFact(
        "folding-system",
        "SMS locking system with a visible handle; one person can fold and roll the table, and one side can be raised for solo playback."
      ),
      wheels: approvedFact("wheels", '5" double rubberized wheels without brakes.'),
      net: approvedFact("net", "Fixed net with height and tension adjustment."),
      storage: approvedFact("storage", "Built-in storage for up to four paddles and 18 balls."),
      dimensions: approvedFact(
        "dimensions",
        'Open: 108" × 60" (72" including net) × 30". Folded: 61" × 72" × 28". Shipping: 64" × 56" × 6".'
      ),
      weight: approvedFact("weight", "Table: 155 lb. Packaged: 168 lb."),
      warranty: approvedFact(
        "warranty",
        "Ten-year tabletop warranty and three-year table warranty against defects in materials and workmanship. Wearable items such as the net and damage from improper use, negligence, abuse, transportation, acts of nature, or accidents are excluded."
      ),
      "exposure-and-care": approvedFact(
        "exposure-and-care",
        "Indoor/outdoor table with a weatherproof top and powder-coated frame. The current product page states it can be played outdoors all year round."
      ),
      assembly: approvedFact(
        "assembly",
        "Portland Outdoor installation guide MA 213, revision 30.04.13-03.",
        MANUAL_EVIDENCE
      ),
      "included-items": approvedFact(
        "included-items",
        "Fixed adjustable net. Paddles and balls are not included.",
        INCLUDED_ITEMS_EVIDENCE
      ),
      "manual-applicability": approvedFact(
        "manual-applicability",
        "Tiger Portland Outdoor Installation Guide, MA 213, revision 30.04.13-03.",
        MANUAL_EVIDENCE
      )
    }
  ),
  "tiger-whistler-indoor-table": completeFactSheet(
    "tiger-whistler-indoor-table",
    [
      "tiger-whistler-indoor-table-color-green (SKU 7008)",
      "tiger-whistler-indoor-table-color-blue (SKU 7011)"
    ],
    {
      "playing-surface": approvedFact(
        "playing-surface",
        '25 mm (1") multi-coated chipboard playing surface. The current product page describes Whistler as built to professional standards and international table tennis standards.'
      ),
      frame: approvedFact("frame", "A-60 mm powder-coated steel frame profile."),
      legs: approvedFact(
        "legs",
        "40 × 40 mm powder-coated rectangular-tube legs with levellers adjustable up to 25 mm."
      ),
      "folding-system": approvedFact(
        "folding-system",
        "Drawbar locking system that releases both safety devices together for opening and folding."
      ),
      wheels: approvedFact("wheels", "Four 100 mm rubber-tread wheels; two wheels lock."),
      net: approvedFact(
        "net",
        "Fixed black polyethylene net with height and tension adjustment; it remains attached when folded."
      ),
      storage: notApplicableFact(
        "storage",
        "No built-in paddle or ball storage is listed for Whistler Indoor."
      ),
      dimensions: approvedFact(
        "dimensions",
        "Playing: 274 × 152 × 76 cm. Storage: 152–184 × 70 × 155 cm. Original package: 144 × 22 × 162 cm."
      ),
      weight: approvedFact("weight", "Net: 109 kg. Gross: 120 kg."),
      warranty: notApplicableFact(
        "warranty",
        "No warranty term is listed on the current Whistler Indoor product page, so no warranty claim is published."
      ),
      "exposure-and-care": approvedFact(
        "exposure-and-care",
        "Indoor table for dry, controlled rooms."
      ),
      assembly: approvedFact(
        "assembly",
        "Whistler Indoor assembly guide MA 258.4-7, revision 30.07.09-01.",
        MANUAL_EVIDENCE
      ),
      "included-items": approvedFact(
        "included-items",
        "Fixed adjustable net set. Paddles and balls are not included.",
        INCLUDED_ITEMS_EVIDENCE
      ),
      "manual-applicability": approvedFact(
        "manual-applicability",
        "Tiger Whistler Indoor Assembly Guide, MA 258.4-7, revision 30.07.09-01.",
        MANUAL_EVIDENCE
      )
    }
  ),
  "tiger-plaza-outdoor-table-grey": completeFactSheet(
    "tiger-plaza-outdoor-table-grey",
    ["tiger-plaza-outdoor-table-grey-color-grey (SKU 10272)"],
    {
      "playing-surface": approvedFact(
        "playing-surface",
        "10 mm melamine resin board with limited impact resistance, dampness resistance, double strengthening, and an additional cross-section."
      ),
      frame: approvedFact("frame", "Powder-coated galvanized sheet-steel frame."),
      legs: notApplicableFact(
        "legs",
        "The current Plaza Outdoor page specifies the fixed galvanized steel structure rather than a separate leg profile."
      ),
      "folding-system": notApplicableFact(
        "folding-system",
        "Plaza Outdoor is a fixed table and does not fold."
      ),
      wheels: notApplicableFact(
        "wheels",
        "Plaza Outdoor is anchored in place and does not use wheels."
      ),
      net: approvedFact(
        "net",
        "Solid galvanized sheet-steel net measuring 160 × 16 cm × 4 mm and weighing 4.85 kg."
      ),
      storage: notApplicableFact(
        "storage",
        "Plaza Outdoor is a fixed table with no built-in paddle or ball storage listed."
      ),
      dimensions: approvedFact(
        "dimensions",
        "Net: 160 × 16 cm × 4 mm. Overall table dimensions are not listed on the current product page."
      ),
      weight: approvedFact(
        "weight",
        "Net: 4.85 kg. Overall table weight is not listed on the current product page."
      ),
      warranty: approvedFact(
        "warranty",
        "Three years against manufacturing defects; 10 years on the outdoor tabletop."
      ),
      "exposure-and-care": approvedFact(
        "exposure-and-care",
        "Outdoor/indoor fixed table with a weatherproof top and powder-coated galvanized steel structure."
      ),
      assembly: approvedFact(
        "assembly",
        "Includes a fastening kit for ground anchoring. Installation and parts guide MA 244, revision 25.05.16-01.",
        MANUAL_EVIDENCE
      ),
      "included-items": approvedFact(
        "included-items",
        "Fastening kit and solid metal net. Paddles and balls are not included.",
        INCLUDED_ITEMS_EVIDENCE
      ),
      "manual-applicability": approvedFact(
        "manual-applicability",
        "Tiger Plaza Outdoor Installation and Parts Guide, MA 244, revision 25.05.16-01.",
        MANUAL_EVIDENCE
      )
    }
  )
} as const satisfies Readonly<Record<TigerTableSlug, TigerTableCurrentModelFactSheet>>;

function hasUsableEvidence(
  evidence: readonly TigerTableFactEvidence[]
): evidence is TigerTableFactEvidenceList {
  return (
    evidence.length > 0 &&
    evidence.every((item) => item.checkedOn.trim().length > 0 && item.source.trim().length > 0)
  );
}

function hasApprovalEvidence(evidence: readonly TigerTableFactEvidence[]): boolean {
  return hasUsableEvidence(evidence) && evidence.some((item) => item.kind !== "legacy-candidate");
}

function hasResolvedOwnerConfirmation(
  ownerConfirmation: TigerTableOwnerConfirmation
): ownerConfirmation is Extract<
  TigerTableOwnerConfirmation,
  { status: "confirmed" | "not-required" }
> {
  return ownerConfirmation.status === "confirmed" || ownerConfirmation.status === "not-required";
}

export function getApprovedTigerTableFact(
  fact: TigerTableFact
): TigerTableApprovedFact | undefined {
  if (
    fact.reviewStatus !== "approved" ||
    fact.conflict.status !== "none" ||
    !hasApprovalEvidence(fact.evidence) ||
    !hasResolvedOwnerConfirmation(fact.ownerConfirmation) ||
    fact.value.trim().length === 0
  ) {
    return undefined;
  }

  return fact;
}

export function isTigerTableFactResolved(fact: TigerTableFact): boolean {
  if (fact.reviewStatus === "approved") {
    return getApprovedTigerTableFact(fact) !== undefined;
  }

  if (fact.reviewStatus === "not-applicable") {
    return (
      fact.conflict.status === "none" &&
      hasApprovalEvidence(fact.evidence) &&
      hasResolvedOwnerConfirmation(fact.ownerConfirmation)
    );
  }

  return false;
}

export function isTigerTableCurrentModelFactSheetComplete(
  factSheet: TigerTableCurrentModelFactSheet
): boolean {
  return (
    factSheet.reviewStatus === "complete" &&
    factSheet.modelScope.reviewStatus === "approved" &&
    factSheet.modelScope.activeSkuReferences.length > 0 &&
    factSheet.modelScope.conflict.status === "none" &&
    hasApprovalEvidence(factSheet.modelScope.evidence) &&
    hasResolvedOwnerConfirmation(factSheet.modelScope.ownerConfirmation) &&
    TIGER_TABLE_FACT_KEYS.every((key) => isTigerTableFactResolved(factSheet.facts[key]))
  );
}
