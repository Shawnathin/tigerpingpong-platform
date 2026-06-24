# Media Artifact Git-Safety Triage

Date: 2026-06-24
Branch: `codex/media-cloudinary-app-mapping`
Task: `Cloudinary media artifact git-safety triage`

## Summary

The current untracked media/export state is not safe to commit as-is.

`exports/` is a large generated media workspace: 866 files total under `exports` and `scripts/media` at the time of inspection, with `exports/` alone at about 226 MB. Most untracked export content is generated image output, recovered source media, local review buckets, or upload-prep bundles. These should stay local unless Shawn intentionally selects a smaller reviewed subset.

`scripts/media/` contains reusable source scripts plus one generated Python cache file. The scripts appear intentionally project-specific, but they include network/upload tooling and should get a focused code review before being committed.

No `.gitignore` change was made in this task.

## Inventory

| Path                                  | Files | Tracked | Untracked |    Size | Main types                             |
| ------------------------------------- | ----: | ------: | --------: | ------: | -------------------------------------- |
| `exports/tpp-cloudinary-upload-prep/` |   100 |       4 |        96 | 23.1 MB | jpg, png, md, json, csv, txt, html, sh |
| `exports/tpp-media-processed-pack/`   |   210 |       0 |       210 | 49.9 MB | jpg, png, md, json, csv, html          |
| `exports/tpp-media-recovery-source/`  |   328 |       0 |       328 | 68.9 MB | jpg, webp, md, csv, json               |
| `exports/tpp-media-recovery-triage/`  |   228 |       0 |       228 | 82.6 MB | jpg, webp, md, csv, json, html         |
| `scripts/media/`                      |     6 |       0 |         6 |  0.1 MB | mjs, py, pyc                           |

Full file-extension summary across inspected paths:

- `615` `.jpg`
- `97` `.webp`
- `25` `.png`
- `24` `.md`
- `14` `.json`
- `11` `.csv`
- `3` `.mjs`
- `3` `.html`
- `2` `.txt`
- `2` `.py`
- `1` `.sh`
- `1` `.pyc`
- `1` `.DS_Store`

Existing tracked files under `exports/`:

- `exports/tpp-cloudinary-upload-prep/qa/media-category-card-contact-sheet.png`
- `exports/tpp-cloudinary-upload-prep/qa/media-product-gallery-contact-sheet.png`
- `exports/tpp-cloudinary-upload-prep/reports/app-media-mapping-report.md`
- `exports/tpp-cloudinary-upload-prep/reports/media-mapping-qa-report.md`

## Secret / Token Scan

Command used:

```bash
rg -n "CLOUDINARY_API_SECRET|CLOUDINARY_URL|STRIPE_SECRET|STRIPE_WEBHOOK|DATABASE_URL|SUPABASE_SERVICE_ROLE|INTERNAL_ORDERS_API_TOKEN|PASSWORD|PRIVATE_KEY|BEGIN [A-Z ]*PRIVATE KEY" exports scripts/media || true
```

Findings:

- No actual secret values were identified by this scan.
- `scripts/media/upload_tpp_cloudinary_approved.mjs` contains expected Cloudinary env var names and uses `CLOUDINARY_API_SECRET` at runtime.
- `exports/tpp-cloudinary-upload-prep/reports/media-mapping-qa-report.md` contains placeholder/example `DATABASE_URL` commands.
- `exports/tpp-cloudinary-upload-prep/manifests/cloudinary-upload-results.json` and `.csv` contain Cloudinary upload result fields such as `signature`, `secureUrl`, public asset IDs, and source URLs. Treat those result manifests as `needs Shawn review` before committing.

## Classification

| Artifact or folder                                                            | Classification        | Rationale                                                                                                                                                                   |
| ----------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exports/tpp-cloudinary-upload-prep/cloudinary-cli/`                          | needs Shawn review    | Generated upload command text and shell wrapper. No credentials observed, but commands can trigger Cloudinary upload if run in a configured shell.                          |
| `exports/tpp-cloudinary-upload-prep/manifests/cloudinary-upload-results.json` | needs Shawn review    | Generated upload-result manifest includes public URLs and upload signatures/hashes. Do not commit until Shawn confirms this is acceptable.                                  |
| `exports/tpp-cloudinary-upload-prep/manifests/cloudinary-upload-results.csv`  | needs Shawn review    | Same sensitivity as the JSON upload-result manifest.                                                                                                                        |
| `exports/tpp-cloudinary-upload-prep/manifests/` except upload results         | needs Shawn review    | Generated media manifests may be useful launch evidence, but should be reviewed as a deliberate subset rather than committed with the whole export pack.                    |
| `exports/tpp-cloudinary-upload-prep/reports/cloudinary-upload-results.md`     | commit-ready          | Generated human-readable report of 55 uploaded public Cloudinary delivery URLs; no secrets found in scan. Still best committed only with a focused media-record PR.         |
| `exports/tpp-cloudinary-upload-prep/reports/do-not-upload.md`                 | commit-ready          | Generated review report; no secrets found in scan.                                                                                                                          |
| `exports/tpp-cloudinary-upload-prep/reports/needs-shawn-review.md`            | commit-ready          | Generated review report naming assets needing human review; no secrets found in scan.                                                                                       |
| `exports/tpp-cloudinary-upload-prep/reports/upload-prep-summary.md`           | commit-ready          | Generated summary report; no secrets found in scan.                                                                                                                         |
| `exports/tpp-cloudinary-upload-prep/reports/upload-readiness-by-target.md`    | commit-ready          | Generated review report; no secrets found in scan.                                                                                                                          |
| `exports/tpp-cloudinary-upload-prep/qa/upload-prep-review-sheet.md`           | commit-ready          | Human-readable QA sheet; no secrets found in scan.                                                                                                                          |
| `exports/tpp-cloudinary-upload-prep/qa/upload-prep-review-sheet.csv`          | needs Shawn review    | Generated review CSV may be useful, but should be reviewed for source URLs and fields before commit.                                                                        |
| `exports/tpp-cloudinary-upload-prep/qa/qa-gallery.html`                       | local-only            | Generated local review gallery references local files; not needed in git unless selected for a review workflow.                                                             |
| `exports/tpp-cloudinary-upload-prep/qa/contact-sheet-categories.png`          | needs Shawn review    | Generated visual review artifact; potentially useful, but binary and should be intentionally selected.                                                                      |
| `exports/tpp-cloudinary-upload-prep/qa/contact-sheet-products.png`            | needs Shawn review    | Generated visual review artifact; potentially useful, but binary and should be intentionally selected.                                                                      |
| `exports/tpp-cloudinary-upload-prep/upload-ready/`                            | local-only            | Generated image files intended for upload. Do not commit raw/bulk media outputs.                                                                                            |
| `exports/tpp-cloudinary-upload-prep/upload-ready-best-available/`             | local-only            | Generated image files intended for upload/review. Do not commit raw/bulk media outputs.                                                                                     |
| `exports/tpp-cloudinary-upload-prep/needs-shawn-review/`                      | local-only            | Generated image review bucket. Do not commit raw/bulk media outputs.                                                                                                        |
| `exports/tpp-media-processed-pack/`                                           | local-only            | Generated processed media pack with many binary images and review outputs. Keep local unless a tiny reviewed report subset is selected later.                               |
| `exports/tpp-media-recovery-source/`                                          | local-only            | Generated crawl/download source media pack. Contains recovered source images and manifests; keep local.                                                                     |
| `exports/tpp-media-recovery-triage/`                                          | local-only            | Generated triage pack with selected/rejected image buckets and review sheets; keep local unless a tiny reviewed report subset is selected later.                            |
| `scripts/media/prepare_tpp_cloudinary_upload.py`                              | needs Shawn review    | Project-specific source script; potentially commit-ready after focused script review. Generates upload prep outputs.                                                        |
| `scripts/media/process_tpp_media_pack.py`                                     | needs Shawn review    | Project-specific source script; potentially commit-ready after focused script review. Depends on image-processing libraries and rewrites generated export folders when run. |
| `scripts/media/recover-tpp-source-images.mjs`                                 | needs Shawn review    | Project-specific source script; performs web crawl/download work when run. Needs focused review before commit.                                                              |
| `scripts/media/triage-tpp-source-images.mjs`                                  | needs Shawn review    | Project-specific source script; rewrites generated triage outputs when run. Needs focused review before commit.                                                             |
| `scripts/media/upload_tpp_cloudinary_approved.mjs`                            | needs Shawn review    | Project-specific source script that reads Cloudinary credentials and performs uploads when run. Needs focused review and usage docs before commit.                          |
| `scripts/media/__pycache__/`                                                  | ignore-rule candidate | Generated Python bytecode cache; should not be committed.                                                                                                                   |
| Any nested `.DS_Store` under export folders                                   | ignore-rule candidate | Generated OS metadata; already covered by `.gitignore` pattern but may remain inside otherwise-untracked directories.                                                       |
| Top-level `exports/` generated media workspaces                               | ignore-rule candidate | Consider a future ignore rule for generated export roots after deciding how to preserve reviewed reports/manifests.                                                         |

## Recommended Git Handling

- Do not stage `exports/` as a whole.
- Do not stage any bulk image buckets from `upload-ready`, `upload-ready-best-available`, `needs-shawn-review`, `processed`, `originals`, `selected-candidates`, `rejected-*`, or similar generated media folders.
- If preserving evidence in git, prefer a focused docs/report-only commit containing selected `.md` reports and possibly selected `.csv` or `.json` manifests after Shawn review.
- Review and potentially commit `scripts/media/*.py` and `scripts/media/*.mjs` in a separate script-focused task with usage notes and dry-run safety documented.
- Add ignore rules in a later cleanup task for generated export roots, Python caches, and any remaining OS/cache artifacts, after reviewed report/manifests are either committed or moved elsewhere.

## Validation

This triage task used read-only inventory, file-type, size, tracked-state, and secret-string scans. No files were moved, deleted, uploaded, imported, or executed.
