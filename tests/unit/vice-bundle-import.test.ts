import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyDerivedCatalogValues,
  applyViceBundleImportScope,
  createViceBundlePlan
} from "../../packages/db/scripts/import-tiger-deployed-catalog.mjs";

const importerPath = path.resolve("packages/db/scripts/import-tiger-deployed-catalog.mjs");
const reviewedInputDir = path.resolve("data/import-review/tigerpingpong/v1");
const importerEnv = {
  ...process.env,
  DATABASE_URL: "postgresql://unused:unused@127.0.0.1:65535/tigerpingpong"
};

function runImporter(
  scope: "all" | "vice-bundle",
  mode: "--dry-run" | "--write",
  envOverrides: NodeJS.ProcessEnv = {}
) {
  return spawnSync(
    process.execPath,
    [importerPath, "--confirm-deployed-import", "--target=staging", `--scope=${scope}`, mode],
    {
      encoding: "utf8",
      env: {
        ...importerEnv,
        ...envOverrides
      },
      timeout: 30_000
    }
  );
}

function combinedOutput(result: ReturnType<typeof runImporter>) {
  return `${result.stdout}\n${result.stderr}`;
}

describe("Vice bundle deployed catalog import", () => {
  it("plans only the Vice package records with the assigned SKU and derives the blank durable bundle price", () => {
    const result = runImporter("vice-bundle", "--dry-run");
    const output = combinedOutput(result);

    expect(result.status).toBe(0);
    expect(output).toContain("Scope: vice-bundle");
    expect(output).toContain("- products: 1");
    expect(output).toContain("- product_variants: 2");
    expect(output).toContain("Single option: Single Vice Paddle, key=tiger-vice-package-single");
    expect(output).toContain("parent_sku=(blank), base_price_cents=1500");
    expect(output).toContain(
      "Bundle option: 4 Vice paddles + 6 white balls, key=tiger-vice-package-4-pack-6-white-balls"
    );
    expect(output).toContain(
      "sku=15488, durable_price_cents=(blank), derived_regular_price_cents=6800"
    );
    expect(output).toContain(
      "4 x 1500 (tiger-vice-paddle, sku=9174) + 1 x 800 (tiger-premium-balls-6-white, sku=9157) = 6800 CAD cents"
    );
    expect(output).toContain(
      "SKU review flag: owner_sku_required, severity=blocker, owner=business, status=resolved"
    );
    expect(output).toContain("Blocking catalog gates: none for this scope.");
    expect(output).toContain(
      "Dry run complete. No database connection was opened and no rows were written."
    );
  });

  it("records the exact owner-assigned SKU and resolves its reviewed catalog flag", () => {
    const variants = fs.readFileSync(
      path.join(reviewedInputDir, "product_variants_import_v1.csv"),
      "utf8"
    );
    const flags = fs.readFileSync(
      path.join(reviewedInputDir, "import_review_flags_v1.csv"),
      "utf8"
    );

    expect(variants).toContain(
      '"tiger-vice-package-4-pack-6-white-balls","tiger-vice-paddle","15488","4 Vice paddles + 6 white balls","Package Options","4-vice-paddles-6-white-balls","","","","CAD","","true"'
    );
    expect(flags).toContain(
      '"variant","tiger-vice-package-4-pack-6-white-balls","https://tigerpingpong.ca/accessories/vice-ping-pong-paddle","owner_sku_required","blocker","business","resolved"'
    );
  });

  it.each(["vice-bundle", "all"] as const)(
    "blocks the %s write before connecting while the exact bundle SKU is blank",
    (scope) => {
      const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tiger-vice-unassigned-"));
      const fixtureInputDir = path.join(fixtureRoot, "input");
      const fixtureOutputDir = path.join(fixtureRoot, "validation");

      try {
        fs.cpSync(reviewedInputDir, fixtureInputDir, { recursive: true });
        prepareUnassignedSkuFixture(fixtureInputDir);

        const result = runImporter(scope, "--write", {
          TIGER_IMPORT_INPUT_DIR: fixtureInputDir,
          TIGER_IMPORT_OUTPUT_DIR: fixtureOutputDir
        });
        const output = combinedOutput(result);

        expect(result.status).toBe(1);
        expect(output).toContain("Deployed catalog write blocked before database connection.");
        expect(output).toContain(
          "Owner-assigned SKU required for tiger-vice-package-4-pack-6-white-balls"
        );
        expect(output).toContain("No database connection was opened and no rows were written.");
        expect(output).not.toMatch(/ECONNREFUSED|Can't reach database server/i);
      } finally {
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
      }
    }
  );

  it("clears the pure SKU gate and scopes an assigned ready-state package exactly", () => {
    const importData = createReadyStateImportData();
    const viceBundlePlan = createViceBundlePlan(importData);
    const prepared = applyDerivedCatalogValues(importData, viceBundlePlan);
    const scoped = applyViceBundleImportScope(prepared);
    const scopedVariants = scoped.files.get("variants")?.rows ?? [];

    expect(viceBundlePlan.blockers).toEqual([]);
    expect(scopedVariants.map((row: Record<string, string>) => row.variant_key)).toEqual([
      "tiger-vice-package-single",
      "tiger-vice-package-4-pack-6-white-balls"
    ]);
    expect(scopedVariants[1]).toMatchObject({
      price_cents: "6800",
      sku: "15488",
      purchase_mode_override: "",
      is_active: "true"
    });
  });
});

function prepareUnassignedSkuFixture(inputDir: string): void {
  const variantsPath = path.join(inputDir, "product_variants_import_v1.csv");
  const flagsPath = path.join(inputDir, "import_review_flags_v1.csv");
  const variants = fs.readFileSync(variantsPath, "utf8");
  const flags = fs.readFileSync(flagsPath, "utf8");
  const assignedVariant =
    '"tiger-vice-package-4-pack-6-white-balls","tiger-vice-paddle","15488","4 Vice paddles + 6 white balls","Package Options","4-vice-paddles-6-white-balls","","","","CAD","","true"';
  const pendingVariant =
    '"tiger-vice-package-4-pack-6-white-balls","tiger-vice-paddle","","4 Vice paddles + 6 white balls","Package Options","4-vice-paddles-6-white-balls","","","","CAD","deferred_from_v1","false"';
  const resolvedFlag =
    '"variant","tiger-vice-package-4-pack-6-white-balls","https://tigerpingpong.ca/accessories/vice-ping-pong-paddle","owner_sku_required","blocker","business","resolved"';
  const pendingFlag =
    '"variant","tiger-vice-package-4-pack-6-white-balls","https://tigerpingpong.ca/accessories/vice-ping-pong-paddle","owner_sku_required","blocker","business","open"';

  expect(variants).toContain(assignedVariant);
  expect(flags).toContain(resolvedFlag);
  fs.writeFileSync(variantsPath, variants.replace(assignedVariant, pendingVariant));
  fs.writeFileSync(flagsPath, flags.replace(resolvedFlag, pendingFlag));
}

function createReadyStateImportData() {
  const files = new Map<string, { rows: Array<Record<string, string>> }>([
    ["brands", { rows: [{ brand_key: "tiger-pingpong" }] }],
    [
      "categories",
      {
        rows: [{ category_key: "accessories" }, { category_key: "paddles" }]
      }
    ],
    ["families", { rows: [{ family_key: "vice-paddle" }] }],
    [
      "products",
      {
        rows: [
          {
            product_key: "tiger-vice-paddle",
            price_cents: "1500",
            sku: ""
          },
          {
            product_key: "tiger-premium-balls-6-white",
            price_cents: "800",
            sku: "9157"
          }
        ]
      }
    ],
    [
      "variants",
      {
        rows: [
          {
            variant_key: "tiger-vice-package-single",
            product_key: "tiger-vice-paddle",
            name: "Single Vice Paddle",
            option_1_name: "Package Options",
            option_1_value: "single-vice-paddle",
            sku: "9174",
            price_cents: "1500",
            is_active: "true"
          },
          {
            variant_key: "tiger-vice-package-4-pack-6-white-balls",
            product_key: "tiger-vice-paddle",
            name: "4 Vice paddles + 6 white balls",
            option_1_name: "Package Options",
            option_1_value: "4-vice-paddles-6-white-balls",
            sku: "15488",
            price_cents: "",
            purchase_mode_override: "",
            is_active: "true"
          },
          {
            variant_key: "tiger-vice-future-test-only",
            product_key: "tiger-vice-paddle",
            name: "Future test-only option",
            option_1_name: "Package Options",
            option_1_value: "future-test-only",
            sku: "99998",
            price_cents: "2000",
            purchase_mode_override: "deferred_from_v1",
            is_active: "false"
          }
        ]
      }
    ],
    ["media", { rows: [] }],
    ["redirects", { rows: [] }],
    [
      "flags",
      {
        rows: [
          {
            entity_type: "variant",
            entity_key: "tiger-vice-package-4-pack-6-white-balls",
            flag: "owner_sku_required",
            severity: "blocker",
            resolution_owner: "business",
            resolution_status: "resolved"
          }
        ]
      }
    ]
  ]);

  return {
    files,
    issues: []
  };
}
