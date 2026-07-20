#!/usr/bin/env node

import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const MANIFEST_PATH = path.join(REPO_ROOT, "data/media/aqua-product-story-image-map-v1.json");
const RESULTS_PATH = path.join(REPO_ROOT, "exports/aqua-story-media/upload-results.json");
const REQUIRED_ENV = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Aqua story media upload failed.");
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const selectedEntries = manifest.entries.filter(
    (entry) =>
      entry.uploadAction === "upload" &&
      (args.assetIds.length === 0 || args.assetIds.includes(entry.assetId))
  );
  const unknownAssetIds = args.assetIds.filter(
    (assetId) => !selectedEntries.some((entry) => entry.assetId === assetId)
  );

  if (unknownAssetIds.length > 0) {
    throw new Error(`Unknown Aqua story asset IDs: ${unknownAssetIds.join(", ")}`);
  }

  const planned = [];
  for (const entry of selectedEntries) {
    const sourcePath = resolveSourcePath(entry, args.downloadsRoot);
    if (!existsSync(sourcePath)) {
      throw new Error(`Missing approved source for ${entry.assetId}: ${entry.sourceRelativePath}`);
    }

    const sourceBuffer = await readFile(sourcePath);
    const sourceSha256 = crypto.createHash("sha256").update(sourceBuffer).digest("hex");
    if (sourceSha256 !== entry.sourceSha256) {
      throw new Error(`Source hash mismatch for ${entry.assetId}; refusing an unreviewed file.`);
    }
    planned.push({ entry, sourceBuffer, sourcePath });
  }

  console.log(
    JSON.stringify(
      {
        mode: args.commit ? "commit" : "dry-run",
        uploadCount: planned.length,
        entries: planned.map(({ entry, sourceBuffer }) => ({
          assetId: entry.assetId,
          bytes: sourceBuffer.byteLength,
          publicId: entry.cloudinaryPublicId,
          sha256: entry.sourceSha256
        }))
      },
      null,
      2
    )
  );

  if (!args.commit) {
    console.log("Dry run complete. No Cloudinary assets or repository files were changed.");
    return;
  }

  loadEnvFile(args.envFile);
  const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]?.trim());
  if (missingEnv.length > 0) {
    throw new Error(`Missing Cloudinary environment names: ${missingEnv.join(", ")}`);
  }

  const credentials = {
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  };

  const collisions = [];
  for (const { entry } of planned) {
    if (await cloudinaryAssetExists(entry.cloudinaryPublicId, credentials)) {
      collisions.push(entry.cloudinaryPublicId);
    }
  }
  if (collisions.length > 0) {
    throw new Error(
      `Cloudinary collision preflight failed; refusing overwrite:\n- ${collisions.join("\n- ")}`
    );
  }

  const results = [];
  try {
    for (const [index, item] of planned.entries()) {
      const result = await uploadEntry(item, credentials);
      results.push(result);
      console.log(`Uploaded ${index + 1}/${planned.length}: ${result.publicId}`);
    }
  } catch (error) {
    await writeResults({
      status: "partial-failure",
      failedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown upload failure.",
      results
    });
    throw error;
  }

  await writeResults({ status: "complete", completedAt: new Date().toISOString(), results });
  console.log(JSON.stringify({ status: "complete", resultsPath: relativePath(RESULTS_PATH) }));
}

function parseArgs(argv) {
  const parsed = {
    assetIds: [],
    commit: false,
    downloadsRoot: path.join(os.homedir(), "Downloads"),
    envFile: path.join(REPO_ROOT, ".env"),
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--commit") parsed.commit = true;
    else if (arg === "--help") parsed.help = true;
    else if (arg === "--asset-id") {
      const value = argv[index + 1];
      if (!value) throw new Error("--asset-id requires a value.");
      parsed.assetIds.push(value);
      index += 1;
    } else if (arg === "--downloads-root" || arg === "--env-file") {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a path.`);
      parsed[arg === "--downloads-root" ? "downloadsRoot" : "envFile"] = value;
      index += 1;
    } else if (arg.startsWith("--asset-id=")) parsed.assetIds.push(arg.slice(11));
    else if (arg.startsWith("--downloads-root=")) parsed.downloadsRoot = arg.slice(17);
    else if (arg.startsWith("--env-file=")) parsed.envFile = arg.slice(11);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return parsed;
}

function printHelp() {
  console.log(`Tiger PingPong Aqua story media uploader

Dry run (default):
  node scripts/media/upload-aqua-story-media.mjs

Real upload:
  node scripts/media/upload-aqua-story-media.mjs --commit --env-file <path>

Safety:
  - Dry run is the default.
  - Every source must match its approved SHA-256.
  - Commit mode refuses existing public IDs and sets overwrite=false.
  - Only the claim-safe artwork extracts and approved Canada Place photograph are accepted.
`);
}

function resolveSourcePath(entry, downloadsRoot) {
  const root = entry.sourceScope === "downloads" ? path.resolve(downloadsRoot) : REPO_ROOT;
  const resolved = path.resolve(root, entry.sourceRelativePath);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Source path escapes its approved root: ${entry.sourceRelativePath}`);
  }
  return resolved;
}

function loadEnvFile(envFile) {
  if (!existsSync(envFile)) throw new Error(`Environment file not found: ${envFile}`);
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const separatorIndex = trimmed.indexOf("=");
    const name = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[name]) process.env[name] = value;
  }
}

async function cloudinaryAssetExists(publicId, credentials) {
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${credentials.cloudName}/resources/image/upload/${encodeURIComponent(publicId)}`,
    {
      headers: {
        authorization: `Basic ${Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString("base64")}`
      }
    }
  );
  if (response.status === 404) return false;
  if (response.ok) return true;
  const body = await safeJson(response);
  throw new Error(
    `Cloudinary collision check failed for ${publicId}: ${response.status} ${body.error?.message ?? ""}`
  );
}

async function uploadEntry({ entry, sourceBuffer, sourcePath }, credentials) {
  const timestamp = Math.floor(Date.now() / 1000);
  const uploadParams = {
    context: `asset_id=${entry.assetId}|role=${entry.role}|rights_status=${entry.rightsStatus}`,
    overwrite: "false",
    public_id: entry.cloudinaryPublicId,
    tags: "tiger-aqua-story,storefront,owner-cleared",
    timestamp: String(timestamp),
    unique_filename: "false"
  };
  const signature = signParams(uploadParams, credentials.apiSecret);
  const formData = new FormData();
  formData.append("file", new Blob([sourceBuffer]), path.basename(sourcePath));
  formData.append("api_key", credentials.apiKey);
  for (const [name, value] of Object.entries(uploadParams)) formData.append(name, value);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`,
    { method: "POST", body: formData }
  );
  const body = await safeJson(response);
  if (!response.ok) {
    throw new Error(
      `Cloudinary upload failed for ${entry.assetId}: ${response.status} ${body.error?.message ?? ""}`
    );
  }
  return {
    assetId: entry.assetId,
    bytes: body.bytes,
    format: body.format,
    height: body.height,
    publicId: body.public_id,
    secureUrl: body.secure_url,
    sha256: entry.sourceSha256,
    version: body.version,
    width: body.width
  };
}

function signParams(params, apiSecret) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}=${value}`)
    .join("&");
  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function writeResults(result) {
  await mkdir(path.dirname(RESULTS_PATH), { recursive: true });
  await writeFile(RESULTS_PATH, `${JSON.stringify(result, null, 2)}\n`);
}

function relativePath(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}
