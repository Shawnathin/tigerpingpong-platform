#!/usr/bin/env node

import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const COMMIT = process.argv.includes("--commit");
const SOURCE_ROOT = "/Users/shawncleve/Downloads/tiger - photos reorganized";
const EVIDENCE_DIR = "docs/audit/product-imagery-2026-07-17";
const RESULT_PATH = `${EVIDENCE_DIR}/product-detail-upload-results.json`;
const MANIFEST_PATH = "data/media/product-detail-image-map-v1.json";
const CLOUDINARY_BASE = "tigerpingpong/products";

const TARGETS = [
  target(
    "tiger-expo-outdoor-table",
    "Expo Outdoor",
    "5mm Melamine Resin Top",
    "Expo Outdoor/Table Details/5mm Melamine Resin Top.webp",
    800,
    600,
    "5mm-melamine-resin-top"
  ),
  target(
    "tiger-expo-outdoor-table",
    "Expo Outdoor",
    "50mm Powder-Coated Frame",
    "Expo Outdoor/Table Details/50mm Powder-Coated Frame.webp",
    800,
    600,
    "50mm-powder-coated-frame"
  ),
  target(
    "tiger-expo-outdoor-table",
    "Expo Outdoor",
    "Quick-Lock Folding System",
    "Expo Outdoor/Table Details/Quick-Lock Folding System.jpg",
    913,
    1000,
    "quick-lock-folding-system"
  ),
  target(
    "tiger-expo-outdoor-table",
    "Expo Outdoor",
    "Fixed Adjustable Net",
    "Expo Outdoor/Table Details/Fixed Adjustable Net.jpg",
    800,
    600,
    "fixed-adjustable-net"
  ),
  target(
    "tiger-expo-outdoor-table",
    "Expo Outdoor",
    "Double Outdoor Wheels",
    "Expo Outdoor/Table Details/Double Outdoor Wheels.jpg",
    6144,
    4096,
    "double-outdoor-wheels"
  ),
  target(
    "tiger-expo-outdoor-table",
    "Expo Outdoor",
    "Single Frame Rollaway",
    "Expo Outdoor/Table Details/Single Frame Rollaway.jpg",
    800,
    500,
    "single-frame-rollaway"
  ),
  target(
    "tiger-expo-outdoor-table",
    "Expo Outdoor",
    "Playback Position",
    "Expo Outdoor/Table Details/Playback Position.jpg",
    450,
    450,
    "playback-position"
  ),
  target(
    "tiger-expo-outdoor-table",
    "Expo Outdoor",
    "Built-In Storage",
    "Expo Outdoor/Table Details/Built-In Storage.webp",
    800,
    600,
    "built-in-storage"
  ),

  target(
    "tiger-plaza-outdoor-table-grey",
    "Plaza",
    "10mm Resin Playing Surface",
    "Plaza/Table Details/10mm Resin Playing Surface.jpg",
    800,
    600,
    "10mm-resin-playing-surface"
  ),
  target(
    "tiger-plaza-outdoor-table-grey",
    "Plaza",
    "Galvanized Steel Frame",
    "Plaza/Table Details/Galvanized Steel Frame.jpg",
    800,
    600,
    "galvanized-steel-frame"
  ),
  target(
    "tiger-plaza-outdoor-table-grey",
    "Plaza",
    "Ground Anchoring Kit",
    "Plaza/Table Details/Ground Anchoring Kit.jpg",
    800,
    500,
    "ground-anchoring-kit"
  ),
  target(
    "tiger-plaza-outdoor-table-grey",
    "Plaza",
    "Solid Metal Net",
    "Plaza/Table Details/Solid Metal Net.jpg",
    800,
    500,
    "solid-metal-net"
  ),

  target(
    "tiger-portland-indoor-table",
    "Portland Indoor",
    "7/8 Inch Chipboard Top",
    "Portland Indoor/Table Details/78 Inch Chipboard Top.jpg",
    450,
    450,
    "seven-eighths-inch-chipboard-top"
  ),
  target(
    "tiger-portland-indoor-table",
    "Portland Indoor",
    "50mm Powder-Coated Frame",
    "Portland Indoor/Table Details/50mm Powder-Coated Frame.jpg",
    800,
    600,
    "50mm-powder-coated-frame"
  ),
  target(
    "tiger-portland-indoor-table",
    "Portland Indoor",
    "Smart Locking System",
    "Portland Indoor/Table Details/Smart Locking System.jpg",
    913,
    1000,
    "smart-locking-system"
  ),
  target(
    "tiger-portland-indoor-table",
    "Portland Indoor",
    "Fixed Adjustable Net",
    "Portland Indoor/Table Details/Fixed Adjustable Net.jpg",
    800,
    600,
    "fixed-adjustable-net"
  ),
  target(
    "tiger-portland-indoor-table",
    "Portland Indoor",
    "Locking Indoor Wheels",
    "Portland Indoor/Table Details/Easy Roll Locking Wheels.jpg",
    800,
    600,
    "easy-roll-locking-wheels"
  ),
  target(
    "tiger-portland-indoor-table",
    "Portland Indoor",
    "Indoor Top",
    "Portland Indoor/Table Details/Indoor Top.jpg",
    800,
    600,
    "indoor-top"
  ),
  target(
    "tiger-portland-indoor-table",
    "Portland Indoor",
    "Playback Position",
    "Portland Indoor/Table Details/Playback Position.jpg",
    450,
    450,
    "playback-position"
  ),
  target(
    "tiger-portland-indoor-table",
    "Portland Indoor",
    "Built-In Storage",
    "Portland Indoor/Table Details/Built-In Storage.webp",
    800,
    600,
    "built-in-storage"
  ),

  target(
    "tiger-whistler-indoor-table",
    "Whistler",
    "1 Inch Chipboard Top",
    "Whistler/Table Details/1 Inch Chipboard Top.jpg",
    800,
    600,
    "one-inch-chipboard-top"
  ),
  target(
    "tiger-whistler-indoor-table",
    "Whistler",
    "60mm Powder-Coated Frame",
    "Whistler/Table Details/60mm Powder-Coated Frame.jpg",
    800,
    600,
    "60mm-powder-coated-frame"
  ),
  target(
    "tiger-whistler-indoor-table",
    "Whistler",
    "Drawbar Locking System",
    "Whistler/Table Details/Drawbar Locking System - Option 1.jpg",
    800,
    600,
    "drawbar-locking-system"
  ),
  target(
    "tiger-whistler-indoor-table",
    "Whistler",
    "Fixed Adjustable Net",
    "Whistler/Table Details/Fixed Adjustable Net.jpg",
    800,
    600,
    "fixed-adjustable-net"
  ),
  target(
    "tiger-whistler-indoor-table",
    "Whistler",
    "Locking Indoor Wheels",
    "Whistler/Table Details/Locking Indoor Wheels.jpg",
    450,
    450,
    "locking-indoor-wheels"
  )
];

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Product detail upload failed.");
  process.exitCode = 1;
});

async function main() {
  loadLocalEnv();
  const missing = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].filter(
    (name) => !process.env[name]?.trim()
  );
  if (missing.length) throw new Error(`Missing required environment names: ${missing.join(", ")}`);

  const duplicateIds = duplicates(TARGETS.map((item) => item.publicId));
  if (duplicateIds.length)
    throw new Error(`Duplicate target public IDs: ${duplicateIds.join(", ")}`);
  for (const item of TARGETS) {
    if (!existsSync(item.sourcePath))
      throw new Error(`Missing approved source: ${item.relativeSourcePath}`);
  }

  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const preflight = [];
  for (const item of TARGETS) {
    const existing = await cloudinaryAsset(item.publicId);
    if (existing && (existing.width !== item.width || existing.height !== item.height)) {
      throw new Error(
        `Cloudinary collision for ${item.publicId}: dimensions do not match approved source.`
      );
    }
    preflight.push({ ...item, existing });
  }

  if (!COMMIT) {
    const manifestStatus = preflight.every((item) => item.existing)
      ? "implemented"
      : "approved_for_upload";
    await writeManifest(preflight, manifestStatus);
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          targetCount: TARGETS.length,
          existingCount: preflight.filter((item) => item.existing).length,
          manifest: MANIFEST_PATH
        },
        null,
        2
      )
    );
    console.log("Dry run complete. No Cloudinary assets were created or changed.");
    return;
  }

  const results = [];
  for (const item of preflight) {
    const upload = item.existing ?? (await uploadCloudinary(item));
    results.push({
      productSlug: item.productSlug,
      feature: item.feature,
      relativeSourcePath: item.relativeSourcePath,
      publicId: upload.publicId,
      secureUrl: upload.secureUrl,
      width: upload.width,
      height: upload.height,
      format: upload.format,
      bytes: upload.bytes,
      reusedExisting: Boolean(item.existing)
    });
  }
  await writeFile(
    RESULT_PATH,
    `${JSON.stringify({ status: "complete", completedAt: new Date().toISOString(), uploads: results }, null, 2)}\n`
  );
  await writeManifest(preflight, "implemented", results);
  console.log(
    JSON.stringify(
      {
        mode: "commit",
        targetCount: results.length,
        createdCount: results.filter((item) => !item.reusedExisting).length,
        reusedCount: results.filter((item) => item.reusedExisting).length,
        results: RESULT_PATH,
        manifest: MANIFEST_PATH
      },
      null,
      2
    )
  );
}

function target(productSlug, productName, feature, relativeSourcePath, width, height, assetSlug) {
  return {
    productSlug,
    productName,
    feature,
    relativeSourcePath,
    sourcePath: path.join(SOURCE_ROOT, relativeSourcePath),
    width,
    height,
    publicId: `${CLOUDINARY_BASE}/${productSlug}/details/${assetSlug}`,
    matchMethod: "exact product folder and feature filename",
    confidence: "high"
  };
}

async function writeManifest(items, status, results = []) {
  const resultById = new Map(results.map((item) => [item.publicId, item]));
  const manifest = {
    schemaVersion: "product-detail-image-map-v1",
    generatedAt: new Date().toISOString(),
    sourceRoot: SOURCE_ROOT,
    policy: "Only high-confidence exact product/feature matches are eligible for implementation.",
    entries: items.map((item) => {
      const result = resultById.get(item.publicId);
      return {
        productSlug: item.productSlug,
        productName: item.productName,
        feature: item.feature,
        existingImage: "generated placeholder or legacy remote detail image",
        proposedSource: item.relativeSourcePath,
        matchMethod: item.matchMethod,
        confidence: item.confidence,
        sourceDimensions: { width: item.width, height: item.height },
        processing: "original bytes; Cloudinary delivery uses automatic format and quality",
        cloudinaryPublicId: item.publicId,
        finalUrl: result?.secureUrl ?? item.existing?.secureUrl ?? null,
        status,
        notes: "No catalog database or product-media row change; presentation-only feature asset."
      };
    })
  };
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

function loadLocalEnv() {
  for (const file of [".env", "apps/api/.env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const name = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      )
        value = value.slice(1, -1);
      if (!process.env[name]) process.env[name] = value;
    }
  }
}

async function cloudinaryAsset(publicId) {
  const authorization = Buffer.from(
    `${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`
  ).toString("base64");
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(process.env.CLOUDINARY_CLOUD_NAME)}/resources/image/upload/${encodeURIComponent(publicId)}`,
    { headers: { authorization: `Basic ${authorization}` } }
  );
  if (response.status === 404) return null;
  const body = await safeJson(response);
  if (!response.ok)
    throw new Error(`Cloudinary preflight failed for ${publicId}: HTTP ${response.status}.`);
  return normalizeUpload(body);
}

async function uploadCloudinary(item) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const parameters = {
    overwrite: "false",
    public_id: item.publicId,
    tags: "tpp-product-detail,approved-audit-20260717",
    timestamp,
    unique_filename: "false"
  };
  const form = new FormData();
  form.set(
    "file",
    new Blob([await readFile(item.sourcePath)], { type: mimeType(item.sourcePath) }),
    path.basename(item.sourcePath)
  );
  form.set("api_key", process.env.CLOUDINARY_API_KEY);
  form.set("signature", sign(parameters, process.env.CLOUDINARY_API_SECRET));
  for (const [name, value] of Object.entries(parameters)) form.set(name, value);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(process.env.CLOUDINARY_CLOUD_NAME)}/image/upload`,
    { method: "POST", body: form }
  );
  const body = await safeJson(response);
  if (!response.ok)
    throw new Error(`Cloudinary upload failed for ${item.publicId}: HTTP ${response.status}.`);
  return normalizeUpload(body);
}

function normalizeUpload(body) {
  return {
    publicId: body.public_id,
    secureUrl: body.secure_url,
    width: body.width,
    height: body.height,
    bytes: body.bytes,
    format: body.format
  };
}

function sign(parameters, apiSecret) {
  const serialized = Object.entries(parameters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value}`)
    .join("&");
  return crypto.createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

function mimeType(file) {
  return path.extname(file).toLowerCase() === ".webp" ? "image/webp" : "image/jpeg";
}

function duplicates(values) {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
