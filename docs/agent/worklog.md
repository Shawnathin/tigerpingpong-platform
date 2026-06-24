# Agent Worklog

Short record of workflow actions and proof. This is not a changelog for every code edit.

## 2026-06-24 - Onboarding workflow install

- Read the onboarding request from the attached prompt.
- Confirmed repo path: `/Users/shawncleve/Code/tigerpingpong-platform`.
- Confirmed branch: `codex/media-cloudinary-app-mapping`.
- Inspected safe repo state, package scripts, env template, Prisma schema location, deployment docs, and launch-readiness docs.
- Found existing untracked media/export artifacts under `exports/` and `scripts/media/`; left them untouched.
- Added build-control workflow guidance to `AGENTS.md`.
- Created `goals.md` and the initial `docs/agent/` workflow files.
- Selected the first current task card: `Cloudinary media artifact git-safety triage`.

Validation results will be recorded in the onboarding final report.

## 2026-06-24 - Media artifact git-safety triage

- Confirmed repo path: `/Users/shawncleve/Code/tigerpingpong-platform`.
- Confirmed branch: `codex/media-cloudinary-app-mapping`.
- Inspected only `exports/`, `scripts/media/`, tracked state, ignore behavior, file types, sizes, counts, and selected generated text artifacts.
- Found `exports/` is about 226 MB and mostly generated image/media output.
- Found `scripts/media/` contains five untracked source scripts plus one generated Python cache file.
- Ran a secret-string scan over `exports` and `scripts/media`; found env var names/placeholders and Cloudinary upload result fields, but no actual secret values from the scanned terms.
- Created `docs/agent/media-artifact-git-safety-triage.md`.
- Left all media/export artifacts untouched and unstaged.

Validation results will be recorded in the task final report.

## 2026-06-24 - Preserve reviewed media evidence and ignore generated exports

- Confirmed repo path: `/Users/shawncleve/Code/tigerpingpong-platform`.
- Confirmed branch: `codex/media-cloudinary-app-mapping`.
- Used `docs/agent/media-artifact-git-safety-triage.md` to select only commit-ready Markdown evidence from `exports/tpp-cloudinary-upload-prep/`.
- Copied selected reports and the Markdown upload-prep review sheet into `docs/media/cloudinary-upload-prep/`.
- Added README context explaining the evidence source, why bulk generated media stays local, and why generated exports should not be committed wholesale.
- Added ignore rules for the generated `/exports/` workspace and `scripts/media/__pycache__/`.
- Left bulk images, upload-ready folders, CSV/JSON manifests needing Shawn review, local galleries, command wrappers, and media source scripts unstaged.
- Targeted Prettier checks pass for touched docs, but the requested repo-wide Markdown Prettier check still fails on unrelated pre-existing docs outside this task.
- No commit was created because the exact requested validation set did not fully pass.

Validation results will be recorded in the task final report.

## 2026-06-24 - Commit scoped media evidence/ignore change

- Confirmed the working tree changes are limited to `.gitignore`, `docs/media/cloudinary-upload-prep/`, and workflow docs, with unreviewed `scripts/media/*.py` and `scripts/media/*.mjs` left unstaged.
- Confirmed bulk generated `exports/` output is ignored by `.gitignore`.
- Ran scoped validation for the touched files only: `git diff --check` and targeted `pnpm exec prettier --check --ignore-unknown`.
- The exact targeted Prettier command without `--ignore-unknown` stopped on `.gitignore` because no parser was inferred; Markdown files passed after unknown files were ignored, and `.gitignore` whitespace was covered by `git diff --check`.
- Recorded the repo-wide Markdown Prettier baseline failure as pre-existing, unrelated formatting debt and left unrelated docs untouched.
- Committed the scoped media evidence/ignore change.

## 2026-06-24 - Focused media script safety review

- Confirmed repo path: `/Users/shawncleve/Code/tigerpingpong-platform`.
- Confirmed branch: `codex/media-cloudinary-app-mapping`.
- Inspected untracked `scripts/media/*.py` and `scripts/media/*.mjs` with read-only source commands only.
- Did not run, rewrite, move, delete, stage, or commit any media script.
- Classified four export-generation scripts as `needs edit before commit`.
- Classified `scripts/media/upload_tpp_cloudinary_approved.mjs` as `needs Shawn review` because it reads Cloudinary credentials and performs real Cloudinary Admin/Upload API calls.
- Created `docs/agent/media-script-safety-review.md`.
- Recommended a follow-up hardening task before preserving any source scripts.

## 2026-06-24 - Harden non-upload media recovery scripts

- Confirmed repo path: `/Users/shawncleve/Code/tigerpingpong-platform`.
- Confirmed branch: `codex/media-cloudinary-app-mapping`.
- Hardened four non-upload media scripts with dry-run defaults, help text, readable argument validation, output-root checks, and overwrite/reset gates.
- Kept `scripts/media/upload_tpp_cloudinary_approved.mjs` unmodified and uncommitted.
- Added `docs/media/cloudinary-upload-prep/media-scripts.md` with script purposes, run order, inputs, outputs, safe commands, and generated-output warnings.
- Confirmed the scripts do not read secrets or call Cloudinary.
- Did not run media generation, uploads, imports, mapping changes, cleanup, or app changes.

## 2026-06-24 - Cloudinary app media mapping/import plan

- Confirmed repo path: `/Users/shawncleve/Code/tigerpingpong-platform`.
- Confirmed branch: `codex/media-cloudinary-app-mapping`.
- Reviewed the committed Cloudinary upload-prep evidence under `docs/media/cloudinary-upload-prep/`.
- Inspected the current `ProductMedia` schema, product media import scripts, catalog API media serialization, web media resolver, and category hero config with read-only commands.
- Confirmed the running app path is CSV import source to Prisma `ProductMedia`, API catalog responses, then web Cloudinary URL resolution; the app does not read the CSV directly.
- Confirmed category pages currently use product `heroImageSlug` media and do not have a standalone category media import/config target.
- Created `docs/media/cloudinary-upload-prep/app-media-mapping-import-plan.md`.
- Recommended a dry-run media mapping validator/report as the next implementation task before any CSV edit, import, upload, or app behavior change.
- Did not edit catalog data, app runtime files, generated exports, database schema/migrations, env/deployment config, package files, or the live Cloudinary upload script.
