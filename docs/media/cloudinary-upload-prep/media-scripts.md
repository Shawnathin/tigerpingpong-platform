# Media Recovery Scripts

These scripts preserve the local TigerPingPong media recovery pipeline as source tooling. They write only ignored generated output under `exports/`, do not require secrets, and do not upload to Cloudinary.

The live Cloudinary upload script, `scripts/media/upload_tpp_cloudinary_approved.mjs`, is intentionally not committed by this task. It needs a separate Shawn-approved live-upload hardening task before it is preserved or used.

## Scripts

| Script                                           | Purpose                                                                    | Default behavior              | Writes output                         |
| ------------------------------------------------ | -------------------------------------------------------------------------- | ----------------------------- | ------------------------------------- |
| `scripts/media/recover-tpp-source-images.mjs`    | Crawl TigerPingPong pages and download candidate source images             | Dry run, no network or writes | `exports/tpp-media-recovery-source/`  |
| `scripts/media/triage-tpp-source-images.mjs`     | Select/reject recovered source image candidates for launch review          | Dry run, no file changes      | `exports/tpp-media-recovery-triage/`  |
| `scripts/media/process_tpp_media_pack.py`        | Process selected candidates into generated product/category media packs    | Dry run, no file changes      | `exports/tpp-media-processed-pack/`   |
| `scripts/media/prepare_tpp_cloudinary_upload.py` | Sort processed media into local Cloudinary upload-prep buckets and reports | Dry run, no file changes      | `exports/tpp-cloudinary-upload-prep/` |

## Safe Commands

Run from the repository root.

```bash
node scripts/media/recover-tpp-source-images.mjs --help
node scripts/media/triage-tpp-source-images.mjs --help
python3 scripts/media/process_tpp_media_pack.py --help
python3 scripts/media/prepare_tpp_cloudinary_upload.py --help
```

Dry-run mode is the default:

```bash
node scripts/media/recover-tpp-source-images.mjs
node scripts/media/triage-tpp-source-images.mjs
python3 scripts/media/process_tpp_media_pack.py
python3 scripts/media/prepare_tpp_cloudinary_upload.py
```

Generate local outputs only after confirming the input/output paths:

```bash
node scripts/media/recover-tpp-source-images.mjs --run --allow-existing
node scripts/media/triage-tpp-source-images.mjs --run --allow-reset
python3 scripts/media/process_tpp_media_pack.py --run --allow-reset
python3 scripts/media/prepare_tpp_cloudinary_upload.py --run --allow-reset
```

## Pipeline Order

1. `recover-tpp-source-images.mjs`
2. `triage-tpp-source-images.mjs`
3. `process_tpp_media_pack.py`
4. `prepare_tpp_cloudinary_upload.py`

Each step consumes generated output from the previous step.

## Inputs And Outputs

- `recover-tpp-source-images.mjs` reads public TigerPingPong pages and image URLs only when `--run` is passed. It writes downloaded source candidates, manifests, and reports under `exports/tpp-media-recovery-source/`.
- `triage-tpp-source-images.mjs` reads `exports/tpp-media-recovery-source/manifests/source-image-manifest.json` and local files referenced by that manifest. It rewrites `exports/tpp-media-recovery-triage/`.
- `process_tpp_media_pack.py` reads `exports/tpp-media-recovery-triage/manifests/move-forward-manifest.json` and local files referenced by that manifest. It rewrites `exports/tpp-media-processed-pack/`.
- `prepare_tpp_cloudinary_upload.py` reads `exports/tpp-media-processed-pack/manifests/processed-manifest.json` and local processed media. It rewrites `exports/tpp-cloudinary-upload-prep/`.

## What These Scripts Do Not Do

- They do not read Cloudinary credentials.
- They do not call Cloudinary.
- They do not upload media.
- They do not import catalog data.
- They do not change app media mappings.
- They do not change product data, database schema, migrations, env files, deployment config, Stripe, Render, DNS, or runtime behavior.

## Guardrails

- Generated output directories must stay under `exports/`.
- Scripts default to dry-run/help behavior.
- Scripts that reset generated folders require `--run --allow-reset`.
- The crawler requires `--run` before it performs network requests and writes downloaded images.
- `/exports` is ignored by git. Bulk generated media should not be committed wholesale.
- Commit only small reviewed evidence copied into docs, such as the Markdown evidence already preserved in `docs/media/cloudinary-upload-prep/`.
