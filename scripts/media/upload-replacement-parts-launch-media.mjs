#!/usr/bin/env node

import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const MANIFEST_PATH = path.join(REPO_ROOT, "data/media/replacement-parts-launch-media-v1.json");
const RESULTS_DIR = path.join(REPO_ROOT, "exports/replacement-parts-launch-media");
const RESULTS_PATH = path.join(RESULTS_DIR, "upload-results.json");
const REQUIRED_ENV = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Replacement-parts media upload failed.");
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const manifest = readManifest();

  if (args.verify) {
    await verifyManifestDeliveries(manifest);
    return;
  }

  const sourceRoot = path.resolve(args.sourceRoot);
  const planned = await prepareEntries(manifest, sourceRoot);

  console.log(
    JSON.stringify(
      {
        mode: args.commit ? "commit" : "dry-run",
        sourceRoot,
        uploadCount: planned.length,
        entries: planned.map(({ entry, sourceBuffer }) => ({
          assetId: entry.assetId,
          cloudinaryPublicId: entry.cloudinaryPublicId,
          cloudinaryResourceType: entry.cloudinaryResourceType,
          sourceBytes: sourceBuffer.byteLength,
          sourceRelativePath: entry.sourceRelativePath,
          sourceSha256: entry.sourceSha256
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

  loadLocalEnv(args.envFiles);
  const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]?.trim());

  if (missingEnv.length > 0) {
    throw new Error(`Missing Cloudinary environment names: ${missingEnv.join(", ")}`);
  }

  const credentials = {
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  };

  const alreadyUploaded = manifest.entries.filter(
    (entry) => entry.deliveryStatus === "uploaded" || entry.deliveryStatus === "implemented"
  );

  if (alreadyUploaded.length > 0) {
    throw new Error(
      "Manifest already contains uploaded assets. Use --verify to recheck delivery instead of uploading again."
    );
  }

  const collisions = [];

  for (const { entry } of planned) {
    if (await cloudinaryAssetExists(entry, credentials)) {
      collisions.push(`${entry.cloudinaryResourceType}:${entry.cloudinaryPublicId}`);
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
      error: error instanceof Error ? error.message : "Unknown upload failure.",
      failedAt: new Date().toISOString(),
      results,
      status: "partial-failure"
    });
    throw error;
  }

  const uploadedAt = new Date().toISOString();
  const resultByAssetId = new Map(results.map((result) => [result.assetId, result]));
  const uploadedManifest = {
    ...manifest,
    status: "uploaded",
    updatedAt: uploadedAt,
    entries: manifest.entries.map((entry) => {
      const result = resultByAssetId.get(entry.assetId);

      if (!result) return entry;

      return {
        ...entry,
        cloudinaryAssetId: result.cloudinaryAssetId,
        deliveryStatus: "uploaded",
        downloadUrl: result.downloadUrl,
        finalUrl: result.finalUrl,
        uploadedAt
      };
    })
  };

  await writeManifest(uploadedManifest);
  await writeResults({ completedAt: uploadedAt, results, status: "uploaded" });

  await verifyManifestDeliveries(uploadedManifest);
}

function parseArgs(argv) {
  const parsed = {
    commit: false,
    envFiles: [],
    help: false,
    sourceRoot: path.join(os.homedir(), "Downloads"),
    verify: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--commit") {
      parsed.commit = true;
      continue;
    }

    if (arg === "--verify") {
      parsed.verify = true;
      continue;
    }

    if (arg === "--help") {
      parsed.help = true;
      continue;
    }

    if (arg === "--source-root" || arg === "--env-file") {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a path.`);

      if (arg === "--source-root") parsed.sourceRoot = value;
      if (arg === "--env-file") parsed.envFiles.push(value);
      index += 1;
      continue;
    }

    if (arg.startsWith("--source-root=")) {
      parsed.sourceRoot = arg.slice("--source-root=".length);
      continue;
    }

    if (arg.startsWith("--env-file=")) {
      parsed.envFiles.push(arg.slice("--env-file=".length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (parsed.commit && parsed.verify) {
    throw new Error("Choose either --commit or --verify, not both.");
  }

  return parsed;
}

function printHelp() {
  console.log(`Tiger PingPong replacement-parts launch media uploader

Dry run (default):
  node scripts/media/upload-replacement-parts-launch-media.mjs

Real upload:
  node scripts/media/upload-replacement-parts-launch-media.mjs --commit

Verify uploaded delivery URLs:
  node scripts/media/upload-replacement-parts-launch-media.mjs --verify

Options:
  --source-root <path>  Root containing the approved source-relative files.
  --env-file <path>     Optional local env file. May be supplied more than once.
  --commit              Upload after hash and collision preflight.
  --verify              Verify URLs already recorded in the manifest.
  --help                Show this help.

Safety:
  - Dry run is the default.
  - Every source must match the approved SHA-256 and byte count.
  - Commit mode refuses existing Cloudinary public IDs.
  - overwrite=false and unique_filename=false are signed upload parameters.
  - Credentials are never printed or written.
`);
}

function readManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
}

async function prepareEntries(manifest, sourceRoot) {
  const uploadEntries = manifest.entries.filter((entry) => entry.uploadAction === "upload");
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

    if (sourceBuffer.byteLength !== entry.sourceBytes) {
      throw new Error(`Source byte count mismatch for ${entry.assetId}.`);
    }

    planned.push({ entry, sourceBuffer, sourcePath });
  }

  return planned;
}

function resolveSourcePath(sourceRoot, relativeSourcePath) {
  const resolved = path.resolve(sourceRoot, relativeSourcePath);
  const relative = path.relative(sourceRoot, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Source path escapes the approved root: ${relativeSourcePath}`);
  }

  return resolved;
}

function loadLocalEnv(extraEnvFiles) {
  const envFiles = [
    path.join(REPO_ROOT, ".env"),
    path.join(REPO_ROOT, "apps/api/.env"),
    ...extraEnvFiles.map((file) => path.resolve(file))
  ];

  for (const file of envFiles) {
    if (!existsSync(file)) continue;

    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
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
}

async function cloudinaryAssetExists(entry, credentials) {
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${credentials.cloudName}/resources/${entry.cloudinaryResourceType}/upload/${encodeURIComponent(entry.cloudinaryPublicId)}`,
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
    `Cloudinary collision check failed for ${entry.assetId}: ${response.status} ${body.error?.message ?? ""}`
  );
}

async function uploadEntry({ entry, sourceBuffer, sourcePath }, credentials) {
  const timestamp = Math.floor(Date.now() / 1000);
  const uploadParams = {
    context: `asset_id=${entry.assetId}|role=${entry.role}|rights_status=${entry.rightsStatus}`,
    overwrite: "false",
    public_id: entry.cloudinaryPublicId,
    tags: "tiger-replacement-parts,storefront,owner-provided",
    timestamp: String(timestamp),
    unique_filename: "false"
  };
  const signature = signParams(uploadParams, credentials.apiSecret);
  const formData = new FormData();
  const mimeType = entry.cloudinaryResourceType === "raw" ? "application/pdf" : "image/jpeg";

  formData.append("file", new Blob([sourceBuffer], { type: mimeType }), path.basename(sourcePath));
  formData.append("api_key", credentials.apiKey);

  for (const [key, value] of Object.entries(uploadParams)) {
    formData.append(key, value);
  }

  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${credentials.cloudName}/${entry.cloudinaryResourceType}/upload`,
    { body: formData, method: "POST" }
  );
  const body = await safeJson(response);

  if (!response.ok || !body.secure_url) {
    throw new Error(
      `Cloudinary upload failed for ${entry.assetId}: ${response.status} ${body.error?.message ?? ""}`
    );
  }

  const finalUrl = body.secure_url;
  const downloadUrl = buildDownloadUrl(entry, finalUrl);

  return {
    assetId: entry.assetId,
    bytes: body.bytes,
    cloudinaryAssetId: body.asset_id,
    downloadUrl,
    finalUrl,
    format: body.format,
    publicId: body.public_id,
    resourceType: body.resource_type,
    version: body.version
  };
}

function buildDownloadUrl(entry, finalUrl) {
  if (!entry.downloadFilename) return null;

  // Cloudinary restores the raw asset extension automatically. Including it in
  // fl_attachment makes the suffix look like another transformation flag.
  const attachmentName = path.parse(entry.downloadFilename).name;

  return finalUrl.replace(
    `/${entry.cloudinaryResourceType}/upload/`,
    `/${entry.cloudinaryResourceType}/upload/fl_attachment:${encodeURIComponent(attachmentName)}/`
  );
}

function signParams(params, apiSecret) {
  const serialized = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

async function verifyManifestDeliveries(manifest) {
  const deliverableEntries = manifest.entries.filter((entry) => entry.finalUrl);

  if (deliverableEntries.length !== manifest.entries.length) {
    throw new Error("Manifest is missing uploaded delivery URLs. Run --commit first.");
  }

  const verification = [];

  for (const entry of deliverableEntries) {
    const finalHeaders = await fetchDeliveryHeaders(entry.finalUrl);
    const contentType = finalHeaders.get("content-type") ?? "";

    if (entry.assetType === "manual" && !contentType.includes("application/pdf")) {
      throw new Error(`Manual delivery did not return application/pdf: ${entry.assetId}`);
    }

    if (entry.assetType === "image" && !contentType.startsWith("image/")) {
      throw new Error(`Part image delivery did not return an image: ${entry.assetId}`);
    }

    const downloadUrl = buildDownloadUrl(entry, entry.finalUrl);

    if (downloadUrl) {
      const downloadHeaders = await fetchDeliveryHeaders(downloadUrl);
      const disposition = downloadHeaders.get("content-disposition") ?? "";

      if (!disposition.toLowerCase().includes("attachment")) {
        throw new Error(`Manual download URL is not an attachment: ${entry.assetId}`);
      }
    }

    verification.push({
      assetId: entry.assetId,
      contentType,
      deliveryStatus: "implemented",
      downloadIsAttachment: Boolean(downloadUrl)
    });
  }

  const verifiedAt = new Date().toISOString();
  const verifiedManifest = {
    ...manifest,
    status: "implemented",
    updatedAt: verifiedAt,
    entries: manifest.entries.map((entry) => ({
      ...entry,
      deliveryStatus: "implemented",
      downloadUrl: buildDownloadUrl(entry, entry.finalUrl),
      verifiedAt
    }))
  };

  await writeManifest(verifiedManifest);
  await writeResults({ completedAt: verifiedAt, results: verification, status: "implemented" });

  console.log(
    JSON.stringify(
      {
        status: "implemented",
        verifiedAt,
        verifiedCount: verification.length
      },
      null,
      2
    )
  );
}

async function fetchDeliveryHeaders(url) {
  let response = await fetch(url, { method: "HEAD", redirect: "follow" });

  if (response.status === 405) {
    response = await fetch(url, {
      headers: { range: "bytes=0-1023" },
      method: "GET",
      redirect: "follow"
    });
  }

  if (!response.ok) {
    const aclHint =
      response.status === 401 || response.status === 403
        ? " Enable 'Allow delivery of PDF and ZIP files' in Cloudinary Security settings, then run --verify."
        : "";
    throw new Error(`Cloudinary delivery check failed (${response.status}) for ${url}.${aclHint}`);
  }

  return response.headers;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function writeManifest(manifest) {
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function writeResults(payload) {
  await mkdir(RESULTS_DIR, { recursive: true });
  await writeFile(RESULTS_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
