#!/usr/bin/env node

import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const MANIFEST_PATH = path.join(REPO_ROOT, "data/media/homepage-summer-image-map-v1.json");
const RESULTS_DIR = path.join(REPO_ROOT, "exports/homepage-summer-media");
const RESULTS_PATH = path.join(RESULTS_DIR, "upload-results.json");
const REQUIRED_ENV = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Homepage summer media upload failed.");
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const uploadEntries = manifest.entries.filter((entry) => entry.uploadAction === "upload");
  const sourceRoot = path.resolve(args.sourceRoot);
  const planned = [];

  for (const entry of uploadEntries) {
    const sourcePath = resolveSourcePath(sourceRoot, entry.sourceRelativePath);

    if (!existsSync(sourcePath)) {
      throw new Error(`Missing approved source for ${entry.assetId}: ${entry.sourceRelativePath}`);
    }

    const sourceBuffer = await readFile(sourcePath);
    const sourceSha256 = crypto.createHash("sha256").update(sourceBuffer).digest("hex");

    if (sourceSha256 !== entry.sourceSha256) {
      throw new Error(
        `Source hash mismatch for ${entry.assetId}; refusing to upload an unreviewed file.`
      );
    }

    planned.push({ entry, sourceBuffer, sourcePath });
  }

  console.log(
    JSON.stringify(
      {
        mode: args.commit ? "commit" : "dry-run",
        sourceRoot,
        uploadCount: planned.length,
        entries: planned.map(({ entry, sourceBuffer }) => ({
          assetId: entry.assetId,
          sourceRelativePath: entry.sourceRelativePath,
          sourceBytes: sourceBuffer.byteLength,
          sourceSha256: entry.sourceSha256,
          publicId: entry.cloudinaryPublicId
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

  await writeResults({
    status: "complete",
    completedAt: new Date().toISOString(),
    results
  });

  console.log(
    JSON.stringify({ status: "complete", resultsPath: relativePath(RESULTS_PATH) }, null, 2)
  );
}

function parseArgs(argv) {
  const parsed = {
    commit: false,
    envFile: path.join(REPO_ROOT, ".env"),
    help: false,
    sourceRoot: REPO_ROOT
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--commit") {
      parsed.commit = true;
      continue;
    }

    if (arg === "--help") {
      parsed.help = true;
      continue;
    }

    if (arg === "--env-file" || arg === "--source-root") {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a path.`);
      parsed[arg === "--env-file" ? "envFile" : "sourceRoot"] = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--env-file=")) {
      parsed.envFile = arg.slice("--env-file=".length);
      continue;
    }

    if (arg.startsWith("--source-root=")) {
      parsed.sourceRoot = arg.slice("--source-root=".length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function printHelp() {
  console.log(`Tiger PingPong homepage summer media uploader

Dry run (default):
  node scripts/media/upload-homepage-summer-media.mjs

Real upload:
  node scripts/media/upload-homepage-summer-media.mjs --commit

Options:
  --source-root <path>  Root containing the approved source-relative files.
  --env-file <path>     Environment file containing Cloudinary credentials.
  --commit              Upload after hash and Cloudinary collision preflight.
  --help                Show this help.

Safety:
  - Dry run is the default.
  - Every local source must match the approved SHA-256.
  - Commit mode refuses any existing Cloudinary public ID.
  - overwrite=false and unique_filename=false are signed upload parameters.
  - Upload results contain public delivery metadata only; credentials are never written.
`);
}

function resolveSourcePath(sourceRoot, relativeSourcePath) {
  const resolved = path.resolve(sourceRoot, relativeSourcePath);
  const relative = path.relative(sourceRoot, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Source path escapes the approved root: ${relativeSourcePath}`);
  }

  return resolved;
}

function loadEnvFile(envFile) {
  if (!existsSync(envFile)) {
    throw new Error(`Environment file not found: ${envFile}`);
  }

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
    tags: "tiger-homepage-summer,storefront,owner-cleared",
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
    publicId: body.public_id,
    version: body.version,
    secureUrl: body.secure_url,
    width: body.width,
    height: body.height,
    format: body.format,
    bytes: body.bytes,
    sourceRelativePath: entry.sourceRelativePath,
    sourceSha256: entry.sourceSha256
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
  await mkdir(RESULTS_DIR, { recursive: true });
  await writeFile(RESULTS_PATH, `${JSON.stringify(result, null, 2)}\n`);
}

function relativePath(filePath) {
  return path.relative(REPO_ROOT, filePath).replaceAll(path.sep, "/");
}
