import { describe, expect, it } from "vitest";

import {
  getApprovedTigerTableFact,
  isTigerTableCurrentModelFactSheetComplete,
  isTigerTableFactResolved,
  TIGER_TABLE_FACT_KEYS,
  tigerTableCurrentModelFactSheets,
  type TigerTableFact,
  type TigerTablePendingFact
} from "../../apps/web/src/lib/tiger-table-fact-sheets";
import { TIGER_TABLE_SLUGS } from "../../apps/web/src/lib/tiger-table-pages";

describe("Tiger table current-model fact sheets", () => {
  it("exhaustively covers the five active table slugs", () => {
    expect(Object.keys(tigerTableCurrentModelFactSheets)).toEqual(TIGER_TABLE_SLUGS);
    expect(tigerTableCurrentModelFactSheets).not.toHaveProperty("tiger-expo-indoor-table");
  });

  it("contains every required technical field and resolves every fact sheet", () => {
    for (const factSheet of Object.values(tigerTableCurrentModelFactSheets)) {
      expect(Object.keys(factSheet.facts)).toEqual(TIGER_TABLE_FACT_KEYS);
      expect(factSheet.reviewStatus).toBe("complete");
      expect(factSheet.modelScope.reviewStatus).toBe("approved");
      expect(factSheet.modelScope.activeSkuReferences.length).toBeGreaterThan(0);
      expect(isTigerTableCurrentModelFactSheetComplete(factSheet)).toBe(true);

      for (const key of TIGER_TABLE_FACT_KEYS) {
        const fact = factSheet.facts[key];

        expect(fact.key).toBe(key);
        expect(fact.label).not.toBe("");
        expect(fact.conflict.status).toBe("none");
        expect(fact.ownerConfirmation.status).toBe("confirmed");
        expect(isTigerTableFactResolved(fact)).toBe(true);
      }
    }
  });

  it("locks the active current-model variant scope for all five tables", () => {
    expect(
      Object.fromEntries(
        Object.entries(tigerTableCurrentModelFactSheets).map(([slug, factSheet]) => [
          slug,
          factSheet.modelScope.activeSkuReferences
        ])
      )
    ).toEqual({
      "tiger-expo-outdoor-table": [
        "tiger-expo-outdoor-table-color-grey (SKU 15224)",
        "tiger-expo-outdoor-table-color-blue (SKU 15225)"
      ],
      "tiger-portland-indoor-table": [
        "tiger-portland-indoor-table-color-grey (SKU 9476)",
        "tiger-portland-indoor-table-color-green (SKU 7012)"
      ],
      "tiger-portland-outdoor-table": [
        "tiger-portland-outdoor-table-v2-grey (SKU 14445)",
        "tiger-portland-outdoor-table-v2-blue (SKU 14446)"
      ],
      "tiger-whistler-indoor-table": [
        "tiger-whistler-indoor-table-color-green (SKU 7008)",
        "tiger-whistler-indoor-table-color-blue (SKU 7011)"
      ],
      "tiger-plaza-outdoor-table-grey": ["tiger-plaza-outdoor-table-grey-color-grey (SKU 10272)"]
    });
  });

  it("publishes the approved Portland Outdoor V2 facts literally", () => {
    const portland = tigerTableCurrentModelFactSheets["tiger-portland-outdoor-table"];

    expect(getApprovedTigerTableFact(portland.facts["playing-surface"])?.value).toContain(
      "6 mm melamine resin"
    );
    expect(getApprovedTigerTableFact(portland.facts.frame)?.value).toContain("Welded");
    expect(getApprovedTigerTableFact(portland.facts.warranty)?.value).toContain(
      "Ten-year tabletop warranty"
    );
    expect(getApprovedTigerTableFact(portland.facts["included-items"])?.value).toContain(
      "Paddles and balls are not included"
    );
    expect(getApprovedTigerTableFact(portland.facts.warranty)?.value).toContain(
      "transportation, acts of nature, or accidents"
    );
    expect(getApprovedTigerTableFact(portland.facts["exposure-and-care"])?.value).toContain(
      "outdoors all year round"
    );
  });

  it("preserves approved current-page inclusions and positioning facts", () => {
    const expo = tigerTableCurrentModelFactSheets["tiger-expo-outdoor-table"];
    const portlandIndoor = tigerTableCurrentModelFactSheets["tiger-portland-indoor-table"];
    const whistler = tigerTableCurrentModelFactSheets["tiger-whistler-indoor-table"];

    expect(getApprovedTigerTableFact(expo.facts["exposure-and-care"])?.value).toContain(
      "weather-proof"
    );
    expect(getApprovedTigerTableFact(portlandIndoor.facts["playing-surface"])?.value).toContain(
      "tournament-style production processes"
    );
    expect(getApprovedTigerTableFact(portlandIndoor.facts.warranty)?.value).toContain(
      "original purchaser"
    );
    expect(getApprovedTigerTableFact(whistler.facts["playing-surface"])?.value).toContain(
      "international table tennis standards"
    );
  });

  it("omits absent Whistler claims instead of inventing them", () => {
    const whistler = tigerTableCurrentModelFactSheets["tiger-whistler-indoor-table"];

    expect(whistler.facts.warranty).toMatchObject({
      reviewStatus: "not-applicable",
      reason: expect.stringContaining("no warranty claim")
    });
    expect(whistler.facts.storage).toMatchObject({
      reviewStatus: "not-applicable"
    });
    expect(getApprovedTigerTableFact(whistler.facts.warranty)).toBeUndefined();
  });

  it("never treats a pending fact as approved, even if malformed runtime data contains a value", () => {
    const malformedPending = {
      candidateValue: "An unreviewed value",
      conflict: {
        status: "none"
      },
      evidence: [
        {
          checkedOn: "2026-07-28",
          kind: "verified-primary",
          source: "Unreviewed source"
        }
      ],
      key: "frame",
      label: "Frame",
      ownerConfirmation: {
        reason: "Incorrectly marked",
        status: "not-required"
      },
      reason: "Still pending",
      reviewStatus: "pending"
    } as TigerTablePendingFact;

    expect(getApprovedTigerTableFact(malformedPending)).toBeUndefined();
    expect(isTigerTableFactResolved(malformedPending)).toBe(false);
  });

  it("rejects malformed approved facts without approval evidence", () => {
    const malformedApproval = {
      conflict: {
        status: "none"
      },
      evidence: [
        {
          checkedOn: "2026-07-28",
          kind: "legacy-candidate",
          source: "Legacy-only source"
        }
      ],
      key: "weight",
      label: "Weight",
      ownerConfirmation: {
        reason: "Incorrectly treated as sufficient.",
        status: "not-required"
      },
      reviewStatus: "approved",
      value: "Legacy value"
    } as unknown as TigerTableFact;

    expect(getApprovedTigerTableFact(malformedApproval)).toBeUndefined();
    expect(isTigerTableFactResolved(malformedApproval)).toBe(false);
  });
});
