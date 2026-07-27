import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const repoRoot = path.resolve(".");
const uploaderPath = path.join(repoRoot, "scripts/media/upload-replacement-parts-launch-media.mjs");
const historicalManifestPath = path.join(
  repoRoot,
  "data/media/replacement-parts-launch-media-v1.json"
);
const repoTempRoot = path.join(repoRoot, ".temp");

let manifestFixtureRoot = "";
let sourceFixtureRoot = "";

function runUploader(args: string[]) {
  return spawnSync(process.execPath, [uploaderPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env
  });
}

function writeManifest(
  entries: Array<{
    assetId: string;
    cloudinaryPublicId: string;
    cloudinaryResourceType: "image";
    sourceBytes: number;
    sourceRelativePath: string;
    sourceSha256: string;
    uploadAction: "upload";
  }>
) {
  const manifestPath = path.join(manifestFixtureRoot, "replacement-media-test.json");
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify({ entries, status: "planned", version: 1 }, null, 2)}\n`,
    "utf8"
  );
  return manifestPath;
}

beforeEach(() => {
  fs.mkdirSync(repoTempRoot, { recursive: true });
  manifestFixtureRoot = fs.mkdtempSync(path.join(repoTempRoot, "replacement-media-uploader-"));
  sourceFixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "replacement-media-source-"));
});

afterEach(() => {
  fs.rmSync(manifestFixtureRoot, { force: true, recursive: true });
  fs.rmSync(sourceFixtureRoot, { force: true, recursive: true });
});

describe("replacement-parts media uploader manifest selection", () => {
  it("keeps the historical launch manifest as the default", () => {
    const historicalManifest = JSON.parse(fs.readFileSync(historicalManifestPath, "utf8")) as {
      entries: Array<{ assetId: string }>;
    };
    const result = runUploader(["--source-root", sourceFixtureRoot]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      `Missing approved source for ${historicalManifest.entries[0]?.assetId}`
    );
  });

  it("dry-runs one hash-locked asset from a custom in-repository manifest", () => {
    const sourceContents = Buffer.from("approved replacement-net media fixture\n");
    const sourceRelativePath = "replacement-net-system-primary.jpg";
    fs.writeFileSync(path.join(sourceFixtureRoot, sourceRelativePath), sourceContents);
    const manifestPath = writeManifest([
      {
        assetId: "replacement-net-system-primary",
        cloudinaryPublicId:
          "tiger-pingpong/products/replacement-parts/replacement-nets/test-primary-01",
        cloudinaryResourceType: "image",
        sourceBytes: sourceContents.byteLength,
        sourceRelativePath,
        sourceSha256: createHash("sha256").update(sourceContents).digest("hex"),
        uploadAction: "upload"
      }
    ]);
    const manifestBefore = fs.readFileSync(manifestPath, "utf8");

    const result = runUploader(["--manifest", manifestPath, "--source-root", sourceFixtureRoot]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain('"mode": "dry-run"');
    expect(result.stdout).toContain('"uploadCount": 1');
    expect(result.stdout).toContain('"assetId": "replacement-net-system-primary"');
    expect(result.stdout).toContain(
      "Dry run complete. No Cloudinary assets or repository files were changed."
    );
    expect(fs.readFileSync(manifestPath, "utf8")).toBe(manifestBefore);
  });

  it("rejects manifests outside the repository", () => {
    const externalManifestPath = path.join(sourceFixtureRoot, "external-manifest.json");
    fs.writeFileSync(externalManifestPath, '{"entries":[]}\n', "utf8");

    const result = runUploader(["--manifest", externalManifestPath]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Manifest path must stay inside the repository.");
  });

  it("fails safely when a selected manifest is missing", () => {
    const missingManifestPath = path.join(manifestFixtureRoot, "missing.json");

    const result = runUploader(["--manifest", missingManifestPath]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Manifest does not exist:");
    expect(result.stderr).toContain("missing.json");
  });

  it("rejects source paths that escape the approved source root", () => {
    const manifestPath = writeManifest([
      {
        assetId: "escaping-source",
        cloudinaryPublicId:
          "tiger-pingpong/products/replacement-parts/replacement-nets/escape-test",
        cloudinaryResourceType: "image",
        sourceBytes: 1,
        sourceRelativePath: "../outside.jpg",
        sourceSha256: "0".repeat(64),
        uploadAction: "upload"
      }
    ]);

    const result = runUploader(["--manifest", manifestPath, "--source-root", sourceFixtureRoot]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Source path escapes the approved root: ../outside.jpg");
  });
});
