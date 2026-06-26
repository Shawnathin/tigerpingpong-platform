import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve } from "node:path";

const SOURCE_MANIFEST = "exports/tpp-media-recovery-source/manifests/source-image-manifest.json";
const TRIAGE_DIR = "exports/tpp-media-recovery-triage";

const DIRS = {
  reviewSheets: join(TRIAGE_DIR, "review-sheets"),
  selected: join(TRIAGE_DIR, "selected-candidates"),
  rejectedLowRes: join(TRIAGE_DIR, "rejected-low-res"),
  rejectedDuplicates: join(TRIAGE_DIR, "rejected-duplicates"),
  needsBackgroundRemoval: join(TRIAGE_DIR, "needs-background-removal"),
  missingProducts: join(TRIAGE_DIR, "missing-products"),
  manifests: join(TRIAGE_DIR, "manifests"),
  reports: join(TRIAGE_DIR, "reports")
};

const TARGETS = [
  {
    id: "expo-outdoor",
    label: "Expo Outdoor",
    type: "product",
    required: true,
    slugs: ["expo-outdoor-ping-pong-table-grey-green-blue"]
  },
  {
    id: "portland-indoor",
    label: "Portland Indoor",
    type: "product",
    required: true,
    slugs: ["portland-indoor-ping-pong-table-grey-green-blue"]
  },
  {
    id: "portland-outdoor",
    label: "Portland Outdoor",
    type: "product",
    required: true,
    slugs: ["portland-outdoor-ping-pong-table-grey-blue"]
  },
  {
    id: "whistler-indoor",
    label: "Whistler Indoor",
    type: "product",
    required: true,
    slugs: ["whistler-indoor-ping-pong-table-in-green-blue"]
  },
  {
    id: "plaza-outdoor",
    label: "Plaza Outdoor",
    type: "product",
    required: true,
    slugs: ["plaza-outdoor-ping-pong-table-grey"]
  },
  {
    id: "vice-paddle",
    label: "Vice Paddle",
    type: "product",
    required: true,
    slugs: ["vice-ping-pong-paddle"]
  },
  {
    id: "aqua-paddle",
    label: "Aqua Paddle",
    type: "product",
    required: true,
    slugs: ["aqua-outdoor-indoor-paddle"]
  },
  {
    id: "balls",
    label: "Balls",
    type: "product-family",
    required: true,
    slugs: [
      "ping-pong-balls-premium-3-star-6-balls-orange",
      "ping-pong-balls-premium-3-star-white",
      "ping-pong-balls-premium-3-star-140-balls-white-orange",
      "newgy-table-tennis-balls-orange"
    ]
  },
  {
    id: "covers",
    label: "Covers",
    type: "product-family",
    required: true,
    slugs: ["ping-pong-table-cover"]
  },
  {
    id: "net-post-set",
    label: "Net/post set",
    type: "product",
    required: true,
    slugs: ["table-tennis-net-post-set"]
  },
  {
    id: "replacement-nets-parts",
    label: "Replacement nets / parts",
    type: "optional-product-family",
    required: false,
    slugs: ["replacement-net", "tiger-pingpong-table-net-replacement-set", "tiger-pingpong-replacement-part-40"]
  },
  {
    id: "category-tables",
    label: "Tables category/hero",
    type: "category",
    required: true,
    slugs: ["tables", "home"]
  },
  {
    id: "category-indoor-tables",
    label: "Indoor tables category/hero",
    type: "category",
    required: true,
    slugs: ["expo-indoor-ping-pong-table-grey-green-blue", "portland-indoor-ping-pong-table-grey-green-blue", "whistler-indoor-ping-pong-table-in-green-blue"]
  },
  {
    id: "category-outdoor-tables",
    label: "Outdoor tables category/hero",
    type: "category",
    required: true,
    slugs: ["expo-outdoor-ping-pong-table-grey-green-blue", "portland-outdoor-ping-pong-table-grey-blue", "plaza-outdoor-ping-pong-table-grey", "tables"]
  },
  {
    id: "category-paddles",
    label: "Paddles category/hero",
    type: "category",
    required: true,
    slugs: ["vice-ping-pong-paddle", "aqua-outdoor-indoor-paddle"]
  },
  {
    id: "category-balls",
    label: "Balls category/hero",
    type: "category",
    required: true,
    slugs: ["ping-pong-balls-premium-3-star-6-balls-orange", "ping-pong-balls-premium-3-star-140-balls-white-orange", "ping-pong-balls-premium-3-star-white", "newgy-table-tennis-balls-orange"]
  },
  {
    id: "category-accessories",
    label: "Accessories category/hero",
    type: "category",
    required: true,
    slugs: ["accessories"]
  }
];

const COPY_BUCKETS = new Map();

main().catch((error) => {
  console.error(error?.message ?? error);
  process.exitCode = 1;
});

async function main() {
  const runOptions = parseArgs(process.argv.slice(2));

  if (runOptions.help) {
    console.log(usage());
    return;
  }

  assertGeneratedOutputDir(TRIAGE_DIR);

  if (!runOptions.run) {
    await printPlan();
    return;
  }

  if (existsSync(TRIAGE_DIR) && !runOptions.allowReset) {
    throw new Error(
      `Output directory already exists and would be reset: ${TRIAGE_DIR}. ` +
        "Rerun with --run --allow-reset after confirming it is generated local output."
    );
  }

  const sourceRows = JSON.parse(await readFile(SOURCE_MANIFEST, "utf8"));
  await resetOutput();
  const rows = await enrichRows(sourceRows);
  const decisions = makeDecisions(rows);
  await copyBuckets(decisions);
  await writeManifests(decisions);
  await writeReports(decisions);

  console.log(
    JSON.stringify(
      {
        sourceImagesReviewed: rows.length,
        selectedCandidates: decisions.selected.length,
        rejectedLowResolution: decisions.rejectedLowRes.length,
        rejectedDuplicates: decisions.rejectedDuplicates.length,
        needsBackgroundRemoval: decisions.needsBackgroundRemoval.length,
        missingOrLowConfidenceTargets: decisions.missingTargets.length,
        triageManifest: join(DIRS.manifests, "triage-manifest.json")
      },
      null,
      2
    )
  );
}

function parseArgs(argv) {
  const parsed = {
    allowReset: false,
    help: false,
    run: false
  };
  for (const arg of argv) {
    if (arg === "--run") {
      parsed.run = true;
    } else if (arg === "--allow-reset") {
      parsed.allowReset = true;
    } else if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}\n\n${usage()}`);
    }
  }
  return parsed;
}

function usage() {
  return `Usage: node scripts/media/triage-tpp-source-images.mjs [--run] [--allow-reset]

Triage recovered source images into ignored local exports.

Default mode is a dry run: no files are copied, deleted, or written.

Options:
  --run           Read the source manifest and write generated triage exports.
  --allow-reset   Allow deleting and recreating the triage output directory.
  -h, --help      Show this help text.

Input:
  ${SOURCE_MANIFEST}

Output:
  ${TRIAGE_DIR}

This script does not call Cloudinary, read secrets, import data, or change app mappings.`;
}

async function printPlan() {
  let sourceImages = "missing";
  if (existsSync(SOURCE_MANIFEST)) {
    const sourceRows = JSON.parse(await readFile(SOURCE_MANIFEST, "utf8"));
    sourceImages = sourceRows.length;
  }
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        message: "No files were copied, deleted, or written. Re-run with --run to generate triage output.",
        sourceManifest: SOURCE_MANIFEST,
        outputDir: TRIAGE_DIR,
        sourceImages,
        willUpload: false,
        requiresSecrets: false
      },
      null,
      2
    )
  );
}

function assertGeneratedOutputDir(dir) {
  const exportsRoot = resolve("exports");
  const resolvedDir = resolve(dir);
  const relativePath = relative(exportsRoot, resolvedDir);
  if (!relativePath || relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error(`Refusing output directory outside exports/: ${dir}`);
  }
}

async function resetOutput() {
  await rm(TRIAGE_DIR, { recursive: true, force: true });
  await Promise.all(Object.values(DIRS).map((dir) => mkdir(dir, { recursive: true })));
}

async function enrichRows(rows) {
  return Promise.all(
    rows.map(async (row) => {
      const buffer = await readFile(row.localPath);
      const exactHash = createHash("sha256").update(buffer).digest("hex");
      const fileStats = await stat(row.localPath);
      return {
        ...row,
        exactHash,
        sourceFileSizeBytes: fileStats.size,
        area: row.width * row.height,
        longestEdge: Math.max(row.width, row.height),
        shortEdge: Math.min(row.width, row.height),
        lowResolutionReasons: lowResolutionReasons(row),
        acceptableForProcessing: acceptableForProcessing(row),
        familyKey: familyKey(row),
        sourceBasenameKey: sourceBasenameKey(row.originalImageUrl),
        triageStatus: "review",
        triageReason: ""
      };
    })
  );
}

function makeDecisions(rows) {
  const exactDuplicateFilenames = new Set();
  const exactGroups = groupBy(rows, (row) => row.exactHash);
  for (const groupRows of exactGroups.values()) {
    if (groupRows.length <= 1) {
      continue;
    }
    const keep = [...groupRows].sort(compareCandidateQuality)[0];
    for (const row of groupRows) {
      if (row.downloadedFilename !== keep.downloadedFilename) {
        exactDuplicateFilenames.add(row.downloadedFilename);
      }
    }
  }

  const nearDuplicateFilenames = new Set();
  const nearGroups = groupBy(rows, (row) => `${row.detectedProductSlug}:${row.sourceBasenameKey}`);
  for (const groupRows of nearGroups.values()) {
    if (groupRows.length <= 1) {
      continue;
    }
    const keep = [...groupRows].sort(compareCandidateQuality)[0];
    for (const row of groupRows) {
      if (row.downloadedFilename !== keep.downloadedFilename && row.area <= keep.area) {
        nearDuplicateFilenames.add(row.downloadedFilename);
      }
    }
  }

  const targetReviews = TARGETS.map((target) => reviewTarget(target, rows, exactDuplicateFilenames, nearDuplicateFilenames));
  const selectedNames = new Set(targetReviews.flatMap((review) => review.selected.map((row) => row.downloadedFilename)));

  const selected = [];
  for (const review of targetReviews) {
    for (const row of review.selected) {
      selected.push({
        ...row,
        targetId: review.target.id,
        targetLabel: review.target.label,
        triageStatus: row.downloadedFilename === review.primary?.downloadedFilename ? "selected_primary" : "selected_gallery",
        triageReason: selectedReason(row)
      });
    }
  }

  const rejectedDuplicates = rows
    .filter((row) => !selectedNames.has(row.downloadedFilename) && (exactDuplicateFilenames.has(row.downloadedFilename) || nearDuplicateFilenames.has(row.downloadedFilename)))
    .map((row) => ({
      ...row,
      triageStatus: exactDuplicateFilenames.has(row.downloadedFilename) ? "rejected_exact_duplicate" : "rejected_near_duplicate",
      triageReason: exactDuplicateFilenames.has(row.downloadedFilename)
        ? "Exact byte duplicate of a better retained image."
        : "Likely near-duplicate based on same product/source basename with no quality advantage."
    }));

  const duplicateNames = new Set(rejectedDuplicates.map((row) => row.downloadedFilename));
  const rejectedLowRes = rows
    .filter((row) => !selectedNames.has(row.downloadedFilename) && !duplicateNames.has(row.downloadedFilename) && row.lowResolutionReasons.length > 0)
    .map((row) => ({
      ...row,
      triageStatus: "rejected_low_resolution",
      triageReason: row.lowResolutionReasons.join("; ")
    }));

  const selectedOrReviewNames = new Set([...selectedNames, ...duplicateNames, ...rejectedLowRes.map((row) => row.downloadedFilename)]);
  const reviewOnly = rows
    .filter((row) => !selectedOrReviewNames.has(row.downloadedFilename))
    .map((row) => ({
      ...row,
      triageStatus: "review_not_selected",
      triageReason: "Acceptable source image, but not selected as primary/gallery for the scoped V1 triage."
    }));

  const needsBackgroundRemoval = selected
    .filter((row) => row.needsBackgroundRemovalCandidate || row.isLikelyProductOnWhiteBackground)
    .map((row) => ({
      ...row,
      triageStatus: "needs_background_removal",
      triageReason: "Selected product candidate appears to be on a plain or near-white background. Do not remove yet."
    }));

  const missingTargets = targetReviews
    .filter((review) => review.target.required && (!review.primary || !review.hasAcceptablePrimary))
    .map((review) => ({
      targetId: review.target.id,
      targetLabel: review.target.label,
      targetType: review.target.type,
      candidateCount: review.candidates.length,
      selectedCount: review.selected.length,
      bestAvailableFilename: review.primary?.downloadedFilename ?? "",
      bestAvailableDimensions: review.primary ? `${review.primary.width}x${review.primary.height}` : "",
      reason: !review.primary
        ? "No source image found for this target."
        : `Best available image is below processing threshold: ${review.primary.lowResolutionReasons.join("; ")}`
    }));

  return {
    rows,
    targetReviews,
    selected,
    rejectedDuplicates,
    rejectedLowRes,
    reviewOnly,
    needsBackgroundRemoval,
    missingTargets
  };
}

function reviewTarget(target, rows, exactDuplicateFilenames, nearDuplicateFilenames) {
  const candidates = rows
    .filter((row) => target.slugs.includes(row.detectedProductSlug))
    .filter((row) => !exactDuplicateFilenames.has(row.downloadedFilename));
  const sorted = [...candidates].sort(compareCandidateQuality);
  const primary = sorted.find((row) => targetPrimaryEligible(target, row)) ?? sorted[0] ?? null;
  const galleryLimit = target.type === "category" ? 4 : 6;
  const selected = sorted
    .filter((row) => row.downloadedFilename !== primary?.downloadedFilename)
    .filter((row) => !nearDuplicateFilenames.has(row.downloadedFilename))
    .filter((row) => row.acceptableForProcessing || row.area >= 800 * 500)
    .slice(0, galleryLimit - 1);
  if (primary) {
    selected.unshift(primary);
  }

  return {
    target,
    candidates,
    primary,
    selected,
    hasAcceptablePrimary: Boolean(primary?.acceptableForProcessing)
  };
}

function targetPrimaryEligible(target, row) {
  if (target.type === "category") {
    return ["category", "gallery", "thumbnail"].includes(row.imageRoleGuess) && row.width >= 800 && row.height >= 500;
  }
  return ["primary", "gallery", "thumbnail"].includes(row.imageRoleGuess);
}

function compareCandidateQuality(a, b) {
  return qualityScore(b) - qualityScore(a) || b.area - a.area || b.fileSizeBytes - a.fileSizeBytes || a.downloadedFilename.localeCompare(b.downloadedFilename);
}

function qualityScore(row) {
  let score = 0;
  if (row.acceptableForProcessing) score += 200000000;
  if (row.imageRoleGuess === "primary") score += 1200000;
  if (row.imageRoleGuess === "gallery") score += 900000;
  if (row.imageRoleGuess === "category") score += 600000;
  if (row.imageRoleGuess === "thumbnail") score -= 300000;
  if (row.isLikelyThumbnail) score -= 900000;
  if (row.needsBackgroundRemovalCandidate) score -= 25000;
  if (row.width >= 800 && row.height >= 500) score += 250000;
  if (row.width === row.height) score += 10000;
  return score + row.area;
}

function acceptableForProcessing(row) {
  if (!row.width || !row.height || row.isLikelyThumbnail) {
    return false;
  }
  if (["category", "hero", "thumbnail"].includes(row.imageRoleGuess)) {
    return row.width >= 1200 || row.height >= 1000;
  }
  return row.width >= 800 && row.height >= 800 && Math.max(row.width, row.height) >= 1200;
}

function lowResolutionReasons(row) {
  const reasons = [];
  if (!row.width || !row.height) reasons.push("dimensions missing");
  if (row.width < 800) reasons.push("width under 800px");
  if (row.height < 800) reasons.push("height under 800px");
  if (["primary", "gallery"].includes(row.imageRoleGuess) && Math.max(row.width ?? 0, row.height ?? 0) < 1200) {
    reasons.push("product image longest edge under 1200px");
  }
  if (row.isLikelyThumbnail) reasons.push("appears to be a thumbnail/cropped card image");
  return reasons;
}

function selectedReason(row) {
  if (row.acceptableForProcessing) {
    return "Best available scoped candidate that meets processing threshold.";
  }
  return `Best available scoped candidate, but requires human approval because it is low-res: ${row.lowResolutionReasons.join("; ")}`;
}

async function copyBuckets(decisions) {
  for (const row of decisions.selected) {
    addCopy("selected", row);
  }
  for (const row of decisions.rejectedLowRes) {
    addCopy("rejectedLowRes", row);
  }
  for (const row of decisions.rejectedDuplicates) {
    addCopy("rejectedDuplicates", row);
  }
  for (const row of decisions.needsBackgroundRemoval) {
    addCopy("needsBackgroundRemoval", row);
  }
  for (const [bucket, rows] of COPY_BUCKETS.entries()) {
    const dir = DIRS[bucket];
    for (const row of rows) {
      const targetDir = join(dir, safeSegment(row.targetId || row.detectedProductSlug || "unknown"));
      await mkdir(targetDir, { recursive: true });
      await copyFile(row.localPath, join(targetDir, row.downloadedFilename));
    }
  }
  await writeFile(join(DIRS.missingProducts, "missing-or-low-confidence-products.md"), buildMissingProductsReport(decisions));
}

function addCopy(bucket, row) {
  const rows = COPY_BUCKETS.get(bucket) ?? [];
  if (!rows.some((existing) => existing.downloadedFilename === row.downloadedFilename && existing.targetId === row.targetId)) {
    rows.push(row);
  }
  COPY_BUCKETS.set(bucket, rows);
}

async function writeManifests(decisions) {
  const triageRows = [
    ...decisions.selected,
    ...decisions.rejectedLowRes,
    ...decisions.rejectedDuplicates,
    ...decisions.reviewOnly
  ].map(toManifestRow);
  await writeFile(join(DIRS.manifests, "triage-manifest.json"), `${JSON.stringify(triageRows, null, 2)}\n`);
  await writeFile(join(DIRS.manifests, "triage-manifest.csv"), toCsv(triageRows));
  await writeFile(
    join(DIRS.manifests, "move-forward-manifest.json"),
    `${JSON.stringify(decisions.selected.map(toManifestRow), null, 2)}\n`
  );
  await writeFile(join(DIRS.manifests, "move-forward-manifest.csv"), toCsv(decisions.selected.map(toManifestRow)));
}

function toManifestRow(row) {
  return {
    targetId: row.targetId ?? "",
    targetLabel: row.targetLabel ?? "",
    triageStatus: row.triageStatus,
    triageReason: row.triageReason,
    downloadedFilename: row.downloadedFilename,
    localPath: row.localPath,
    triageRelativePath: triageRelativePath(row),
    sourcePageUrl: row.sourcePageUrl,
    detectedProductName: row.detectedProductName,
    detectedProductSlug: row.detectedProductSlug,
    detectedCategory: row.detectedCategory,
    originalImageUrl: row.originalImageUrl,
    width: row.width,
    height: row.height,
    format: row.format,
    fileSizeBytes: row.fileSizeBytes,
    imageRoleGuess: row.imageRoleGuess,
    acceptableForProcessing: row.acceptableForProcessing,
    lowResolutionReasons: row.lowResolutionReasons.join("; "),
    needsBackgroundRemovalCandidate: row.needsBackgroundRemovalCandidate,
    isLikelyProductOnWhiteBackground: row.isLikelyProductOnWhiteBackground,
    altTextFromSource: row.altTextFromSource
  };
}

function triageRelativePath(row) {
  if (row.triageStatus?.startsWith("selected_")) {
    return join("selected-candidates", safeSegment(row.targetId || row.detectedProductSlug || "unknown"), row.downloadedFilename);
  }
  if (row.triageStatus === "rejected_low_resolution") {
    return join("rejected-low-res", safeSegment(row.detectedProductSlug || "unknown"), row.downloadedFilename);
  }
  if (row.triageStatus?.includes("duplicate")) {
    return join("rejected-duplicates", safeSegment(row.detectedProductSlug || "unknown"), row.downloadedFilename);
  }
  return "";
}

async function writeReports(decisions) {
  await writeFile(join(DIRS.reports, "triage-summary.md"), buildSummary(decisions));
  await writeFile(join(DIRS.reports, "primary-gallery-recommendations.md"), buildRecommendations(decisions));
  await writeFile(join(DIRS.reports, "low-resolution-review.md"), buildLowResolutionReview(decisions));
  await writeFile(join(DIRS.reports, "duplicates-review.md"), buildDuplicatesReview(decisions));
  await writeFile(join(DIRS.reports, "background-removal-review.md"), buildBackgroundReview(decisions));
  await writeFile(join(DIRS.reviewSheets, "human-review-sheet.md"), buildHumanReviewSheet(decisions));
  await writeFile(join(DIRS.reviewSheets, "human-review-sheet.csv"), toCsv(decisions.targetReviews.flatMap(reviewToSheetRows)));
  await writeFile(join(DIRS.reviewSheets, "image-gallery.html"), buildHtmlGallery(decisions));
}

function buildSummary(decisions) {
  const selectedAcceptable = decisions.selected.filter((row) => row.acceptableForProcessing).length;
  const selectedLowRes = decisions.selected.length - selectedAcceptable;
  return `${[
    "# TigerPingPong Media Recovery Triage Summary",
    "",
    "This is a review pack only. No Cloudinary uploads, background removal, resizing, compression, product data changes, or app image mapping changes were performed.",
    "",
    `Source images reviewed: ${decisions.rows.length}`,
    `Selected move-forward candidates: ${decisions.selected.length}`,
    `Selected candidates meeting processing threshold: ${selectedAcceptable}`,
    `Selected best-available but low-resolution candidates: ${selectedLowRes}`,
    `Rejected low-resolution images: ${decisions.rejectedLowRes.length}`,
    `Rejected exact/near duplicates: ${decisions.rejectedDuplicates.length}`,
    `Selected images flagged for later background removal: ${decisions.needsBackgroundRemoval.length}`,
    `Missing or low-confidence required targets: ${decisions.missingTargets.length}`,
    "",
    "## Output Locations",
    "",
    `- Selected candidates: ${DIRS.selected}`,
    `- Background-removal candidates: ${DIRS.needsBackgroundRemoval}`,
    `- Low-resolution rejects: ${DIRS.rejectedLowRes}`,
    `- Duplicate rejects: ${DIRS.rejectedDuplicates}`,
    `- Human review sheets: ${DIRS.reviewSheets}`,
    `- Triage manifests: ${DIRS.manifests}`,
    "",
    "## Important Triage Caveat",
    "",
    "Many table images are useful and were selected as best available, but remain below the preferred product-image threshold because their source dimensions are 800x500 or 800x600.",
    ""
  ].join("\n")}\n`;
}

function buildRecommendations(decisions) {
  const lines = ["# Primary And Gallery Recommendations", ""];
  for (const review of decisions.targetReviews) {
    lines.push(`## ${review.target.label}`);
    lines.push("");
    if (!review.primary) {
      lines.push("Primary image: Missing");
      lines.push("Gallery candidates: 0");
      lines.push("");
      continue;
    }
    lines.push(`Primary image: ${review.primary.downloadedFilename} (${review.primary.width}x${review.primary.height})`);
    lines.push(`Primary status: ${review.hasAcceptablePrimary ? "acceptable" : "best available but low-resolution"}`);
    lines.push(`Primary reason: ${selectedReason(review.primary)}`);
    lines.push("");
    lines.push("Gallery candidates:");
    for (const row of review.selected.filter((row) => row.downloadedFilename !== review.primary.downloadedFilename)) {
      lines.push(`- ${row.downloadedFilename} (${row.width}x${row.height}) - ${row.acceptableForProcessing ? "acceptable" : "low-res review"}`);
    }
    if (review.selected.length <= 1) {
      lines.push("- None selected");
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function buildLowResolutionReview(decisions) {
  const lines = ["# Low-Resolution Review", ""];
  lines.push("## Selected But Still Low-Resolution", "");
  for (const row of decisions.selected.filter((item) => !item.acceptableForProcessing)) {
    lines.push(`- ${row.targetLabel}: ${row.downloadedFilename} (${row.width}x${row.height}) - ${row.lowResolutionReasons.join("; ")}`);
  }
  lines.push("");
  lines.push("## Rejected Low-Resolution", "");
  for (const row of decisions.rejectedLowRes) {
    lines.push(`- ${row.downloadedFilename} (${row.width}x${row.height}) - ${row.triageReason}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function buildDuplicatesReview(decisions) {
  const lines = ["# Duplicate And Near-Duplicate Review", ""];
  if (decisions.rejectedDuplicates.length === 0) {
    lines.push("No duplicate rejects were identified.", "");
    return `${lines.join("\n")}\n`;
  }
  for (const row of decisions.rejectedDuplicates) {
    lines.push(`- ${row.downloadedFilename} (${row.width}x${row.height}) - ${row.triageStatus}`);
    lines.push(`  - Reason: ${row.triageReason}`);
    lines.push(`  - Product: ${row.detectedProductName}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function buildBackgroundReview(decisions) {
  const lines = ["# Background-Removal Review", ""];
  if (decisions.needsBackgroundRemoval.length === 0) {
    lines.push("No selected candidates were flagged for later background removal.", "");
    return `${lines.join("\n")}\n`;
  }
  for (const row of decisions.needsBackgroundRemoval) {
    lines.push(`- ${row.targetLabel}: ${row.downloadedFilename} (${row.width}x${row.height})`);
    lines.push(`  - Source: ${row.originalImageUrl}`);
  }
  lines.push("");
  lines.push("No background removal was performed.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function buildMissingProductsReport(decisions) {
  const lines = ["# Missing Or Low-Confidence Products", ""];
  if (decisions.missingTargets.length === 0) {
    lines.push("All required targets have an acceptable primary candidate.", "");
    return `${lines.join("\n")}\n`;
  }
  for (const item of decisions.missingTargets) {
    lines.push(`- ${item.targetLabel}: ${item.reason}`);
    if (item.bestAvailableFilename) {
      lines.push(`  - Best available: ${item.bestAvailableFilename} (${item.bestAvailableDimensions})`);
    }
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function buildHumanReviewSheet(decisions) {
  const lines = ["# Human Review Sheet", ""];
  for (const review of decisions.targetReviews) {
    lines.push(`## ${review.target.label}`);
    lines.push("");
    lines.push(`Candidate count: ${review.candidates.length}`);
    lines.push(`Selected count: ${review.selected.length}`);
    if (review.primary) {
      lines.push(`Primary recommendation: ${review.primary.downloadedFilename} (${review.primary.width}x${review.primary.height})`);
    } else {
      lines.push("Primary recommendation: Missing");
    }
    lines.push("");
    for (const row of review.selected) {
      const relPath = relative(DIRS.reviewSheets, join(DIRS.selected, safeSegment(review.target.id), row.downloadedFilename));
      lines.push(`![${row.downloadedFilename}](${relPath})`);
      lines.push("");
      lines.push(`- File: ${row.downloadedFilename}`);
      lines.push(`- Status: ${row.downloadedFilename === review.primary?.downloadedFilename ? "primary" : "gallery"}`);
      lines.push(`- Dimensions: ${row.width}x${row.height}`);
      lines.push(`- Acceptable for processing: ${row.acceptableForProcessing ? "yes" : "no"}`);
      lines.push(`- Needs background removal later: ${row.needsBackgroundRemovalCandidate ? "yes" : "no"}`);
      lines.push(`- Source: ${row.originalImageUrl}`);
      lines.push("");
    }
  }
  return `${lines.join("\n")}\n`;
}

function reviewToSheetRows(review) {
  return review.selected.map((row) => ({
    targetId: review.target.id,
    targetLabel: review.target.label,
    recommendation: row.downloadedFilename === review.primary?.downloadedFilename ? "primary" : "gallery",
    downloadedFilename: row.downloadedFilename,
    dimensions: `${row.width}x${row.height}`,
    acceptableForProcessing: row.acceptableForProcessing,
    needsBackgroundRemovalCandidate: row.needsBackgroundRemovalCandidate,
    lowResolutionReasons: row.lowResolutionReasons.join("; "),
    sourcePageUrl: row.sourcePageUrl,
    originalImageUrl: row.originalImageUrl,
    altTextFromSource: row.altTextFromSource
  }));
}

function buildHtmlGallery(decisions) {
  const cards = [];
  for (const review of decisions.targetReviews) {
    cards.push(`<section><h2>${escapeHtml(review.target.label)}</h2>`);
    if (review.selected.length === 0) {
      cards.push("<p>No selected candidates.</p>");
    }
    cards.push('<div class="grid">');
    for (const row of review.selected) {
      const relPath = relative(DIRS.reviewSheets, join(DIRS.selected, safeSegment(review.target.id), row.downloadedFilename));
      const role = row.downloadedFilename === review.primary?.downloadedFilename ? "Primary" : "Gallery";
      cards.push(`<article>
        <img src="${escapeHtml(relPath)}" alt="${escapeHtml(row.altTextFromSource || row.downloadedFilename)}">
        <h3>${escapeHtml(role)}: ${escapeHtml(row.downloadedFilename)}</h3>
        <p>${row.width}x${row.height} | ${row.acceptableForProcessing ? "acceptable" : "low-res review"} | background removal: ${row.needsBackgroundRemovalCandidate ? "yes" : "no"}</p>
      </article>`);
    }
    cards.push("</div></section>");
  }
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>TigerPingPong Media Triage Gallery</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; color: #18202a; }
    h1 { margin-bottom: 4px; }
    section { margin: 32px 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    article { border: 1px solid #d9dee7; border-radius: 8px; padding: 12px; }
    img { width: 100%; height: 180px; object-fit: contain; background: #f6f7f9; }
    h3 { font-size: 14px; line-height: 1.3; }
    p { font-size: 13px; color: #495566; }
  </style>
</head>
<body>
  <h1>TigerPingPong Media Triage Gallery</h1>
  <p>Review only. No processing or live asset replacement has been performed.</p>
  ${cards.join("\n")}
</body>
</html>
`;
}

function groupBy(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return groups;
}

function familyKey(row) {
  if (row.detectedProductSlug.includes("ball")) return "balls";
  if (row.detectedProductSlug.includes("paddle")) return "paddles";
  if (row.detectedProductSlug.includes("cover")) return "covers";
  if (row.detectedProductSlug.includes("net")) return "nets";
  if (row.detectedProductSlug.includes("table")) return "tables";
  return row.detectedProductSlug;
}

function sourceBasenameKey(urlValue) {
  try {
    return basename(new URL(urlValue).pathname)
      .toLowerCase()
      .replace(/\.(jpg|jpeg|png|webp|gif)$/i, "")
      .replace(/\.\d+\.386\.513$/i, "")
      .replace(/__\d+.*/i, "")
      .replace(/_\d+x\d+/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  } catch {
    return "";
  }
}

function toCsv(records) {
  if (records.length === 0) {
    return "";
  }
  const headers = Object.keys(records[0]);
  return `${[headers.join(","), ...records.map((record) => headers.map((header) => csvCell(record[header])).join(","))].join("\n")}\n`;
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function safeSegment(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
