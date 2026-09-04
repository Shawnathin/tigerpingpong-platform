import { describe, expect, it } from "vitest";

import {
  getApprovedComparisonFacts,
  getApprovedSectionContent,
  getPublishableTigerTablePage,
  getTigerTablePageDefinition,
  isTigerTableEditorialMediaReady,
  isTigerTablePageReady,
  isTigerTableSlug,
  TIGER_TABLE_SLUGS,
  tigerTablePages
} from "../../apps/web/src/lib/tiger-table-pages";
import {
  TIGER_TABLE_FACT_KEYS,
  isTigerTableCurrentModelFactSheetComplete,
  type TigerTableCurrentModelFactSheet,
  type TigerTableFact
} from "../../apps/web/src/lib/tiger-table-fact-sheets";
import type {
  ReviewedSection,
  TigerTablePageDefinition,
  TigerTableStoryBlock
} from "../../apps/web/src/lib/tiger-table-pages";

describe("universal Tiger table page registry", () => {
  it("exhaustively covers the five active table slugs and excludes Expo Indoor", () => {
    expect(TIGER_TABLE_SLUGS).toEqual([
      "tiger-expo-outdoor-table",
      "tiger-portland-indoor-table",
      "tiger-portland-outdoor-table",
      "tiger-whistler-indoor-table",
      "tiger-plaza-outdoor-table-grey"
    ]);
    expect(Object.keys(tigerTablePages)).toEqual(TIGER_TABLE_SLUGS);
    expect(isTigerTableSlug("tiger-expo-indoor-table")).toBe(false);
    expect(getTigerTablePageDefinition("tiger-expo-indoor-table")).toBeUndefined();

    for (const slug of TIGER_TABLE_SLUGS) {
      expect(isTigerTableSlug(slug)).toBe(true);
      expect(getTigerTablePageDefinition(slug)?.slug).toBe(slug);
    }
  });

  it("keeps live commerce ownership outside the editorial registry", () => {
    const serializedRegistry = JSON.stringify(tigerTablePages);

    for (const commerceField of ["availability", "cart", "currency", "price", "sku", "variant"]) {
      expect(serializedRegistry).not.toContain(`"${commerceField}"`);
    }
  });

  it("publishes complete owner-approved universal packs for all five tables", () => {
    for (const definition of Object.values(tigerTablePages)) {
      expect(definition.publicationStatus).toBe("universal-v1");
      expect(definition.story.status).toBe("approved");
      expect(definition.trustFacts.status).toBe("approved");
      expect(
        definition.trustFacts.status === "approved"
          ? definition.trustFacts.content[0]?.id
          : undefined
      ).toBe("made-in-germany");
      expect(definition.storyMedia.status).toBe("approved");
      expect(definition.featureMoments.status).toBe("approved");
      expect(definition.specs.status).toBe("approved");
      expect(definition.resources.status).toBe("approved");
      expect(definition.comparisonFacts.surface.status).toBe("approved");
      expect(definition.comparisonFacts["playing-feel"].status).toBe("approved");
      expect(definition.comparisonFacts.weatherproof.status).toBe("approved");
      expect(definition.comparisonFacts.frame.status).toBe("approved");
      expect(definition.comparisonFacts.folding.status).toBe("approved");
      expect(definition.comparisonFacts.mobility.status).toBe("approved");
      expect(definition.comparisonFacts.net.status).toBe("approved");
      expect(definition.comparisonFacts.installation.status).toBe("approved");
    }
  });

  it("preserves the current setup and specification resources", () => {
    for (const slug of [
      "tiger-expo-outdoor-table",
      "tiger-portland-indoor-table",
      "tiger-portland-outdoor-table",
      "tiger-whistler-indoor-table"
    ] as const) {
      const resources = getApprovedSectionContent(tigerTablePages[slug].resources);

      expect(resources?.links.some((link) => link.kind === "assembly")).toBe(true);
      expect(resources?.links.some((link) => link.kind === "manual")).toBe(true);
    }

    const plazaResources = getApprovedSectionContent(
      tigerTablePages["tiger-plaza-outdoor-table-grey"].resources
    );

    expect(plazaResources?.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "specification",
          label: "Plaza Outdoor specifications sheet"
        })
      ])
    );
  });

  it("never returns pending content, including malformed runtime input", () => {
    const malformedPending = {
      content: {
        body: "This must not escape.",
        eyebrow: "Unsafe",
        heading: "Unsafe"
      },
      reason: "Still pending.",
      status: "pending"
    } as unknown as ReviewedSection<TigerTableStoryBlock>;

    expect(getApprovedSectionContent(malformedPending)).toBeUndefined();
  });

  it("returns approved comparison facts in canonical row order", () => {
    const portland = tigerTablePages["tiger-portland-outdoor-table"];

    expect(getApprovedComparisonFacts(portland)).toEqual([
      {
        key: "environment",
        label: "Environment",
        value: "Outdoor"
      },
      {
        key: "use-context",
        label: "Made for",
        value: "Cottages, family backyards, schools, and community spaces"
      },
      {
        key: "surface",
        label: "Playing surface",
        value: "6 mm melamine resin"
      },
      {
        key: "playing-feel",
        label: "Playing feel",
        value: "Very good"
      },
      {
        key: "weatherproof",
        label: "Weatherproof",
        value: "Yes"
      },
      {
        key: "frame",
        label: "Frame",
        value: "50 mm steel"
      },
      {
        key: "folding",
        label: "Folding",
        value: "Compact quick-lock folding"
      },
      {
        key: "mobility",
        label: "Mobility",
        value: '5" double wheels; no brakes'
      },
      {
        key: "net",
        label: "Net",
        value: "Fixed / adjustable"
      },
      {
        key: "installation",
        label: "Installation",
        value: "Assembly required"
      },
      {
        key: "warranty",
        label: "Warranty",
        value: "10-year tabletop / 3-year table"
      }
    ]);
  });

  it("locks the current-first comparison peer map", () => {
    expect(
      Object.fromEntries(
        Object.entries(tigerTablePages).map(([slug, definition]) => [
          slug,
          definition.comparisonPeerSlugs
        ])
      )
    ).toEqual({
      "tiger-expo-outdoor-table": [
        "tiger-portland-outdoor-table",
        "tiger-plaza-outdoor-table-grey"
      ],
      "tiger-portland-indoor-table": [
        "tiger-whistler-indoor-table",
        "tiger-portland-outdoor-table"
      ],
      "tiger-portland-outdoor-table": ["tiger-expo-outdoor-table", "tiger-portland-indoor-table"],
      "tiger-whistler-indoor-table": [
        "tiger-portland-indoor-table",
        "tiger-portland-outdoor-table"
      ],
      "tiger-plaza-outdoor-table-grey": ["tiger-portland-outdoor-table", "tiger-expo-outdoor-table"]
    });
  });

  it("publishes every complete universal pack and rejects a status demotion", () => {
    for (const slug of TIGER_TABLE_SLUGS) {
      const definition = tigerTablePages[slug];

      expect(isTigerTablePageReady(definition)).toBe(true);
      expect(getPublishableTigerTablePage(slug)).toBe(definition);
      expect(
        isTigerTablePageReady({
          ...definition,
          publicationStatus: "draft"
        })
      ).toBe(false);
    }
  });

  it("requires every publishable editorial media key to resolve to reviewed current-model media", () => {
    const definition = tigerTablePages["tiger-expo-outdoor-table"];
    const storyEvidence = definition.story.status === "approved" ? definition.story.evidence : [];
    const technicalEvidence = [
      {
        kind: "verified-primary",
        source: "Test-only reviewed primary evidence"
      }
    ] as const;
    const factEvidence = [
      {
        checkedOn: "2026-07-28",
        kind: "verified-primary",
        source: "Test-only reviewed primary evidence"
      }
    ] as const;
    const featureMoments = [
      "tiger-expo-outdoor-table-primary-01",
      "tiger-expo-outdoor-table-variant-grey-01",
      "tiger-expo-outdoor-table-folded-01",
      "tiger-expo-outdoor-table-playback-grey-01"
    ].map((mediaKey, index) => ({
      explanation: {
        whatItIs: "Reviewed technical fact.",
        whyItMatters: "Reviewed practical consequence."
      },
      id: index === 0 ? "playing-surface" : `feature-${index}`,
      kicker: "COMPONENT",
      mediaKey,
      title: `Feature ${index + 1}`
    }));
    const publishableCandidate = {
      ...definition,
      featureMoments: {
        content: featureMoments,
        evidence: technicalEvidence,
        status: "approved"
      },
      publicationStatus: "universal-v1",
      specs: {
        content: {
          completeness: "complete",
          groups: [
            {
              heading: "Table",
              id: "table",
              items: [{ id: "literal", label: "Literal", value: "Reviewed value" }]
            }
          ]
        },
        evidence: technicalEvidence,
        status: "approved"
      },
      storyMedia: {
        content: {
          altText: "Expo Outdoor table in a reviewed outdoor setting",
          mediaKey: "tiger-expo-outdoor-table-lifestyle-poolside-01",
          role: "lifestyle"
        },
        evidence: storyEvidence,
        status: "approved"
      },
      trustFacts: {
        content: [
          { heading: "Made in Germany", id: "made-in-germany" },
          { heading: "Reviewed fact", id: "reviewed-fact" }
        ],
        evidence: storyEvidence,
        status: "approved"
      }
    } satisfies TigerTablePageDefinition;
    const completeFactSheet = {
      facts: Object.fromEntries(
        TIGER_TABLE_FACT_KEYS.map((key) => [
          key,
          {
            conflict: { status: "none" },
            evidence: factEvidence,
            key,
            label: key,
            ownerConfirmation: {
              reason: "Test-only primary evidence is sufficient.",
              status: "not-required"
            },
            reviewStatus: "approved",
            value: "Reviewed value"
          } satisfies TigerTableFact
        ])
      ) as TigerTableCurrentModelFactSheet["facts"],
      modelScope: {
        activeSkuReferences: ["test-current-sku"],
        conflict: { status: "none" },
        evidence: factEvidence,
        ownerConfirmation: {
          reason: "Test-only primary evidence is sufficient.",
          status: "not-required"
        },
        reviewStatus: "approved"
      },
      reviewStatus: "complete",
      slug: definition.slug
    } satisfies TigerTableCurrentModelFactSheet;

    expect(isTigerTableCurrentModelFactSheetComplete(completeFactSheet)).toBe(true);
    expect(
      isTigerTableEditorialMediaReady(
        definition.slug,
        "tiger-expo-outdoor-table-lifestyle-poolside-01",
        "lifestyle"
      )
    ).toBe(true);
    for (const moment of featureMoments) {
      expect(isTigerTableEditorialMediaReady(definition.slug, moment.mediaKey)).toBe(true);
    }
    expect(isTigerTablePageReady(publishableCandidate)).toBe(true);
    expect(isTigerTablePageReady(publishableCandidate, completeFactSheet)).toBe(true);
    expect(
      isTigerTablePageReady(
        {
          ...publishableCandidate,
          storyMedia: {
            ...publishableCandidate.storyMedia,
            content: {
              ...publishableCandidate.storyMedia.content,
              mediaKey: "missing-lifestyle-media"
            }
          }
        },
        completeFactSheet
      )
    ).toBe(false);
    expect(
      isTigerTablePageReady(
        {
          ...publishableCandidate,
          featureMoments: {
            ...publishableCandidate.featureMoments,
            content: publishableCandidate.featureMoments.content.map((moment, index) =>
              index === 3 ? { ...moment, mediaKey: "missing-feature-media" } : moment
            )
          }
        },
        completeFactSheet
      )
    ).toBe(false);
  });

  it("blocks the Portland patio scene until the visible V1 table is reskinned and approved", () => {
    expect(
      isTigerTableEditorialMediaReady(
        "tiger-portland-outdoor-table",
        "tiger-portland-outdoor-table-lifestyle-patio-01",
        "lifestyle"
      )
    ).toBe(false);
    expect(
      isTigerTableEditorialMediaReady(
        "tiger-portland-outdoor-table",
        "tiger-portland-outdoor-table-primary-01"
      )
    ).toBe(true);
    expect(
      isTigerTableEditorialMediaReady(
        "tiger-portland-outdoor-table",
        "tiger-portland-outdoor-table-lifestyle-patio-v2-01",
        "lifestyle"
      )
    ).toBe(true);
  });
});
