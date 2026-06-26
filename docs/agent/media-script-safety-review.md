# Media Script Safety Review

Date: 2026-06-24
Branch: `codex/media-cloudinary-app-mapping`
Task: `Focused script-safety review of scripts/media/*.py and scripts/media/*.mjs`

## Executive summary

The untracked `scripts/media/*.py` and `scripts/media/*.mjs` files are project-specific media recovery, processing, upload-prep, and Cloudinary upload tooling. They appear useful as source history for the Cloudinary media workflow, but none of the five source scripts should be committed exactly as-is from this review task.

Four scripts are local export-generation tools that read generated manifests or live TigerPingPong pages, then write or rewrite ignored `exports/` workspaces. Those should be preserved only after a small hardening pass adds usage documentation, explicit output-root guardrails, and clear "generated output only" expectations.

The Cloudinary upload script is higher risk. It reads Cloudinary credentials from local env files, calls the Cloudinary Admin and Upload APIs, and writes upload-result manifests containing Cloudinary result fields. It needs explicit Shawn approval and stronger run-mode gating before it is preserved or used.

No scripts were executed during this review.

## Script inventory

| Script                                             | Runtime           | Classification           | External calls                        | Writes/deletes files | Needs env/secrets | Commit now |
| -------------------------------------------------- | ----------------- | ------------------------ | ------------------------------------- | -------------------- | ----------------- | ---------- |
| `scripts/media/prepare_tpp_cloudinary_upload.py`   | Python 3 stdlib   | needs edit before commit | No                                    | Yes                  | No                | No         |
| `scripts/media/process_tpp_media_pack.py`          | Python 3 + Pillow | needs edit before commit | No                                    | Yes                  | No                | No         |
| `scripts/media/recover-tpp-source-images.mjs`      | Node.js ESM       | needs edit before commit | Yes, TigerPingPong site/image fetches | Yes                  | No                | No         |
| `scripts/media/triage-tpp-source-images.mjs`       | Node.js ESM       | needs edit before commit | No                                    | Yes                  | No                | No         |
| `scripts/media/upload_tpp_cloudinary_approved.mjs` | Node.js ESM       | needs Shawn review       | Yes, Cloudinary Admin and Upload APIs | Yes                  | Yes               | No         |

Ignored/generated item observed but not reviewed as source: `scripts/media/__pycache__/process_tpp_media_pack.cpython-312.pyc`.

## Per-script review notes

### `scripts/media/prepare_tpp_cloudinary_upload.py`

- Language/runtime: Python 3; uses stdlib modules `csv`, `json`, `shutil`, `collections`, and `pathlib`.
- Apparent purpose: converts the processed media pack into a Cloudinary upload-prep workspace with upload-ready buckets, review buckets, manifests, reports, QA sheets, and generated Cloudinary CLI command text.
- Inputs: `exports/tpp-media-processed-pack/manifests/processed-manifest.json`, processed media paths referenced by that manifest, and optional QA artifacts from `exports/tpp-media-processed-pack/qa-sheets/`.
- Outputs: rewrites `exports/tpp-cloudinary-upload-prep/`, including `upload-ready/`, `upload-ready-best-available/`, `needs-shawn-review/`, `do-not-upload/`, `cloudinary-cli/`, `manifests/`, `reports/`, and `qa/`.
- Reads files: yes; reads the processed manifest and source media paths.
- Writes files: yes; copies image files, writes JSON/CSV/Markdown reports, writes generated shell/CLI command files, and chmods the generated shell script.
- Deletes files: yes; `reset_output()` removes the whole `exports/tpp-cloudinary-upload-prep` directory with `shutil.rmtree()` before recreating it.
- Uploads or external APIs: no direct upload or external API call. It generates Cloudinary CLI upload commands that could upload if manually run later.
- Secrets/env vars: no secrets read.
- Deterministic/repeatable: mostly deterministic given the processed manifest and local files, but it destructively regenerates the output directory.
- Obvious risks: hardcoded output paths, hardcoded target/threshold policy, destructive output reset, generated upload command files, source URLs in manifests/reports, no CLI help or confirmation, and no separation between dry-run/report generation and upload-command generation.
- Recommended action: keep as a candidate for preservation, but first add usage docs, output-root safety checks, and explicit "does not upload" messaging in a script-focused hardening task.
- Should be committed now: no.

### `scripts/media/process_tpp_media_pack.py`

- Language/runtime: Python 3 with Pillow (`PIL.Image`, `ImageDraw`, `ImageFilter`, `ImageFont`).
- Apparent purpose: processes selected recovered source images into a generated media pack, applying product canvases, category sizing, optional white-background transparency heuristics, QA sheets, manifests, and reports.
- Inputs: `exports/tpp-media-recovery-triage/manifests/move-forward-manifest.json` and local image files referenced by that manifest.
- Outputs: rewrites `exports/tpp-media-processed-pack/`, including processed product/category images, transparent/non-transparent buckets, human-review buckets, manifests, reports, contact sheets, HTML gallery, and QA review sheets.
- Reads files: yes; reads the move-forward manifest and local image files.
- Writes files: yes; writes/copies images, JSON/CSV manifests, Markdown reports, PNG contact sheets, HTML gallery, and QA sheets.
- Deletes files: yes; `reset_output()` removes the whole `exports/tpp-media-processed-pack` directory with `shutil.rmtree()` before recreating it.
- Uploads or external APIs: no.
- Secrets/env vars: no secrets read.
- Deterministic/repeatable: mostly deterministic given the manifest, local images, and Pillow version, but image compression/optimization details may vary by runtime/library version.
- Obvious risks: hardcoded image policy, hardcoded target lists, destructive output reset, undeclared/undocumented Pillow dependency, heuristic background removal that needs human review, and generated Cloudinary public IDs that should be reviewed before reuse.
- Recommended action: keep as a candidate for preservation after adding usage docs, dependency notes, output-root safety checks, and a reviewed statement that generated images/manifests remain ignored unless deliberately selected.
- Should be committed now: no.

### `scripts/media/recover-tpp-source-images.mjs`

- Language/runtime: Node.js ESM; uses Node built-ins plus global `fetch`, `Blob` is not used in this script.
- Apparent purpose: crawls TigerPingPong pages, extracts likely product/category image URLs from HTML, downloads selected source images, and writes source-image manifests/reports.
- Inputs: hardcoded seeds under `https://tigerpingpong.com` and `https://tigerpingpong.ca`, live page HTML, and discovered image URLs.
- Outputs: writes under `exports/tpp-media-recovery-source/`, including `originals/`, `by-product/`, `reports/`, and `manifests/`.
- Reads files: no local input files beyond checking generated records in memory.
- Writes files: yes; creates directories, writes downloaded images with `flag: "wx"`, copies images into by-product buckets, and writes JSON/CSV/Markdown reports.
- Deletes files: no direct delete/reset. Re-running may fail on existing filenames because downloads use exclusive create mode.
- Uploads or external APIs: yes; performs HTTP fetches against TigerPingPong pages and image URLs.
- Secrets/env vars: no secrets read.
- Deterministic/repeatable: not fully deterministic because it depends on live website state, redirects, response content, network availability, and source image availability.
- Obvious risks: live crawl/download behavior, hardcoded source hosts and target heuristics, no CLI controls for max pages/depth/output path, no explicit approval gate before network activity, no documented robots/crawl expectations, and possible rerun failures if outputs already exist.
- Recommended action: keep as a candidate for preservation only after adding usage docs, explicit network-crawl warning, CLI options or constants documentation, and output behavior guidance.
- Should be committed now: no.

### `scripts/media/triage-tpp-source-images.mjs`

- Language/runtime: Node.js ESM; uses Node built-ins only.
- Apparent purpose: reads recovered source-image manifest rows, selects target-specific primary/gallery candidates, rejects low-resolution/duplicate candidates, and writes triage buckets, manifests, reports, and review galleries.
- Inputs: `exports/tpp-media-recovery-source/manifests/source-image-manifest.json` and local files referenced by each row.
- Outputs: rewrites `exports/tpp-media-recovery-triage/`, including selected/rejected/background-review buckets, manifests, reports, human-review sheets, and HTML gallery.
- Reads files: yes; reads the source manifest and each local image file for hashing/stat metadata.
- Writes files: yes; copies files into triage buckets and writes JSON/CSV/Markdown/HTML reports.
- Deletes files: yes; `resetOutput()` removes the whole `exports/tpp-media-recovery-triage` directory with `rm(..., { recursive: true, force: true })` before recreating it.
- Uploads or external APIs: no.
- Secrets/env vars: no secrets read.
- Deterministic/repeatable: mostly deterministic given the source manifest and local files.
- Obvious risks: destructive output reset, hardcoded target/slug list, hardcoded media-selection policy, source URLs in generated manifests/reports, and no usage docs or output-root safety checks.
- Recommended action: keep as a candidate for preservation after adding usage docs and output-root guardrails.
- Should be committed now: no.

### `scripts/media/upload_tpp_cloudinary_approved.mjs`

- Language/runtime: Node.js ESM; uses Node built-ins, global `fetch`, `FormData`, and `Blob`.
- Apparent purpose: uploads approved image rows from `exports/tpp-cloudinary-upload-prep/manifests/cloudinary-upload-manifest.json` to Cloudinary, after checking that target public IDs do not already exist.
- Inputs: Cloudinary upload manifest, local image files referenced by `uploadPrepPath`, and Cloudinary credentials.
- Outputs: writes `exports/tpp-cloudinary-upload-prep/manifests/cloudinary-upload-results.json`, `cloudinary-upload-results.csv`, and `exports/tpp-cloudinary-upload-prep/reports/cloudinary-upload-results.md`.
- Reads files: yes; reads `.env` and `apps/api/.env` for Cloudinary keys if process env is missing, reads the upload manifest, and reads local image files.
- Writes files: yes; writes upload result manifests and report.
- Deletes files: no.
- Uploads or external APIs: yes; calls the Cloudinary Admin API to check existing resources and the Cloudinary Upload API to upload images.
- Secrets/env vars: yes; requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`, and can populate them from local `.env` files.
- Deterministic/repeatable: not deterministic because it depends on Cloudinary remote state, current timestamps, upload responses, and network/API behavior. It refuses overwrite but still performs real uploads when preflight passes.
- Obvious risks: executing it performs real Cloudinary uploads; no dry-run-only default or `--commit` gate; reads local env files automatically; writes result files containing Cloudinary upload result fields such as `signature`, public IDs, and URLs; hardcoded expectation of exactly 55 manifest rows; hardcoded allowed buckets and output paths.
- Recommended action: do not commit or use without explicit Shawn approval. If preserved later, add a no-upload default, an explicit `--commit` or equivalent live-upload gate, usage docs, safe result-manifest handling, and a reviewed decision on whether upload signatures/result manifests belong in git.
- Should be committed now: no.

## Risks/blockers

- The scripts are not currently wired into `package.json`; the existing `media:cloudinary:products` command points to `scripts/upload-product-media-to-cloudinary.mjs`, not these untracked `scripts/media/` files.
- There is no `scripts/media/README.md` or equivalent usage contract explaining the required run order, dependencies, expected inputs, or safe operating mode.
- Several scripts destructively reset generated output directories under `exports/`.
- The recovery crawler performs live network fetches against TigerPingPong pages and images.
- The upload script performs real Cloudinary API checks/uploads and reads local env files automatically.
- Generated manifests/reports can contain source URLs, Cloudinary public IDs, upload result fields, and local generated paths; these need deliberate review before committing.
- The Python processing script depends on Pillow, but this review did not verify whether that dependency is already installed or declared for this tooling path.

## Recommended commit set

Commit no media scripts as-is from this review.

Recommended future preservation set after a hardening task:

- `scripts/media/recover-tpp-source-images.mjs`
- `scripts/media/triage-tpp-source-images.mjs`
- `scripts/media/process_tpp_media_pack.py`
- `scripts/media/prepare_tpp_cloudinary_upload.py`
- A new `scripts/media/README.md` documenting run order, dependencies, generated output paths, and safety rules.

Keep `scripts/media/upload_tpp_cloudinary_approved.mjs` out of the recommended commit set until Shawn explicitly approves preserving a live-upload tool and the script is hardened to default to no-upload behavior.

## Recommended next task

Harden and preserve the non-upload media recovery scripts with usage docs and output-root guardrails; leave the Cloudinary upload script local-only unless Shawn explicitly selects a live-upload-tool hardening task.
