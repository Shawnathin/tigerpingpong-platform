#!/usr/bin/env python3
import argparse
import csv
import json
import shutil
import sys
from collections import Counter, defaultdict
from pathlib import Path


DEFAULT_PROCESSED_MANIFEST = Path("exports/tpp-media-processed-pack/manifests/processed-manifest.json")
DEFAULT_OUTPUT_DIR = Path("exports/tpp-cloudinary-upload-prep")

PROCESSED_MANIFEST = DEFAULT_PROCESSED_MANIFEST
OUTPUT_DIR = DEFAULT_OUTPUT_DIR


def build_dirs(output_dir):
    return {
        "upload_ready": output_dir / "upload-ready",
        "upload_ready_best_available": output_dir / "upload-ready-best-available",
        "do_not_upload": output_dir / "do-not-upload",
        "needs_shawn_review": output_dir / "needs-shawn-review",
        "cloudinary_cli": output_dir / "cloudinary-cli",
        "manifests": output_dir / "manifests",
        "reports": output_dir / "reports",
        "qa": output_dir / "qa",
    }


DIRS = build_dirs(OUTPUT_DIR)

PRODUCT_MIN = 800
PRODUCT_PREFERRED = 1200
GALLERY_MIN_LONGEST_EDGE = 800
CATEGORY_HERO_MIN_WIDTH = 1600
CATEGORY_HERO_PREFERRED_WIDTH = 2400

BEST_AVAILABLE_ALLOWED = {
    "expo-outdoor",
    "portland-indoor",
    "whistler-indoor",
    "plaza-outdoor",
    "aqua-paddle",
    "covers",
    "net-post-set",
    "category-indoor-tables",
}

PRODUCT_TARGETS = {
    "expo-outdoor",
    "portland-indoor",
    "portland-outdoor",
    "whistler-indoor",
    "plaza-outdoor",
    "vice-paddle",
    "aqua-paddle",
    "balls",
    "covers",
    "net-post-set",
    "replacement-nets-parts",
}


def main(argv=None):
    args = parse_args(argv)
    configure_paths(args.processed_manifest, args.output_dir)
    validate_generated_output_dir(OUTPUT_DIR)

    if not args.run:
        print_plan()
        return

    rows = load_manifest(PROCESSED_MANIFEST)
    ensure_reset_allowed(OUTPUT_DIR, args.allow_reset)
    reset_output()
    prepared = [classify(row) for row in rows]
    copy_buckets(prepared)
    write_manifests(prepared)
    write_cli(prepared)
    write_reports(prepared)
    write_qa(prepared)

    counts = Counter(row["uploadPrepStatus"] for row in prepared)
    print(
        json.dumps(
            {
                "assetsReviewed": len(prepared),
                "uploadReady": counts["upload_ready"],
                "uploadReadyBestAvailable": counts["upload_ready_best_available"],
                "needsShawnReview": counts["needs_shawn_review"],
                "doNotUpload": counts["do_not_upload"],
                "uploadManifest": str(DIRS["manifests"] / "cloudinary-upload-manifest.json"),
            },
            indent=2,
        )
    )


def parse_args(argv=None):
    parser = argparse.ArgumentParser(
        description="Build the local Cloudinary upload-prep export pack without uploading anything."
    )
    parser.add_argument(
        "--run",
        action="store_true",
        help="Write generated outputs. Without this flag, the script prints a read-only plan.",
    )
    parser.add_argument(
        "--allow-reset",
        action="store_true",
        help="Allow deleting and recreating the output directory when --run is used.",
    )
    parser.add_argument(
        "--processed-manifest",
        type=Path,
        default=DEFAULT_PROCESSED_MANIFEST,
        help=f"Processed media manifest to read. Default: {DEFAULT_PROCESSED_MANIFEST}",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Generated upload-prep output directory. Must be under exports/. Default: {DEFAULT_OUTPUT_DIR}",
    )
    return parser.parse_args(argv)


def configure_paths(processed_manifest, output_dir):
    global PROCESSED_MANIFEST, OUTPUT_DIR, DIRS
    PROCESSED_MANIFEST = processed_manifest
    OUTPUT_DIR = output_dir
    DIRS = build_dirs(OUTPUT_DIR)


def validate_generated_output_dir(path):
    exports_root = Path("exports").resolve()
    resolved = path.resolve()
    try:
        relative = resolved.relative_to(exports_root)
    except ValueError as exc:
        raise SystemExit(f"Refusing output directory outside exports/: {path}") from exc
    if not relative.parts:
        raise SystemExit("Refusing to use exports/ itself as the output directory.")


def load_manifest(path):
    try:
        return json.loads(path.read_text())
    except FileNotFoundError as exc:
        raise SystemExit(f"Missing processed manifest: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON in processed manifest {path}: {exc}") from exc


def ensure_reset_allowed(path, allow_reset):
    if path.exists() and not allow_reset:
        raise SystemExit(
            f"Output directory already exists and would be reset: {path}. "
            "Rerun with --run --allow-reset after confirming it is generated local output."
        )


def print_plan():
    count = "missing"
    if PROCESSED_MANIFEST.exists():
        count = len(load_manifest(PROCESSED_MANIFEST))
    print(
        json.dumps(
            {
                "mode": "dry-run",
                "message": "No files were written. Re-run with --run to generate output.",
                "processedManifest": str(PROCESSED_MANIFEST),
                "outputDir": str(OUTPUT_DIR),
                "assetsToReview": count,
                "willUpload": False,
                "requiresSecrets": False,
            },
            indent=2,
        )
    )


def reset_output():
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    for directory in DIRS.values():
        directory.mkdir(parents=True, exist_ok=True)


def classify(row):
    source_width = int(row["sourceWidth"])
    source_height = int(row["sourceHeight"])
    longest_edge = max(source_width, source_height)
    shortest_edge = min(source_width, source_height)
    is_product = row["targetId"] in PRODUCT_TARGETS
    is_category = row["assetType"] == "category"
    role = row["role"]
    target_id = row["targetId"]

    reasons = []
    threshold_status = "unknown"
    upload_status = "needs_shawn_review"

    if bool(row.get("wasUpscaled")):
        reasons.append("Processed manifest indicates upscaling; do not upload.")
        upload_status = "do_not_upload"
        threshold_status = "failed"
    elif is_product:
        if role == "primary":
            if source_width >= PRODUCT_PREFERRED and source_height >= PRODUCT_PREFERRED:
                threshold_status = "preferred"
                upload_status = "upload_ready"
                reasons.append("Primary product image meets preferred 1200x1200+ threshold.")
            elif source_width >= PRODUCT_MIN and source_height >= PRODUCT_MIN:
                threshold_status = "launch_ready"
                upload_status = "upload_ready"
                reasons.append("Primary product image meets 800x800 launch threshold.")
            elif target_id in BEST_AVAILABLE_ALLOWED and longest_edge >= GALLERY_MIN_LONGEST_EDGE:
                threshold_status = "best_available"
                upload_status = "upload_ready_best_available"
                reasons.append("Primary product image is below 800x800 but has 800px+ longest edge and is approved for best-available review bucket.")
            else:
                threshold_status = "below_launch"
                upload_status = "needs_shawn_review"
                reasons.append("Primary product image is below 800x800 launch threshold.")
        else:
            if longest_edge >= PRODUCT_PREFERRED:
                threshold_status = "preferred"
                upload_status = "upload_ready"
                reasons.append("Gallery image meets preferred 1200px+ longest-edge threshold.")
            elif longest_edge >= GALLERY_MIN_LONGEST_EDGE:
                threshold_status = "launch_ready"
                upload_status = "upload_ready"
                reasons.append("Gallery image meets 800px longest-edge launch threshold.")
            elif target_id in BEST_AVAILABLE_ALLOWED and longest_edge >= 700:
                threshold_status = "best_available"
                upload_status = "upload_ready_best_available"
                reasons.append("Gallery image is best-available but below normal 800px longest-edge threshold.")
            else:
                threshold_status = "below_launch"
                upload_status = "needs_shawn_review"
                reasons.append("Gallery image is below 800px longest-edge launch threshold.")

        if target_id == "replacement-nets-parts" and shortest_edge < PRODUCT_MIN:
            upload_status = "needs_shawn_review"
            reasons.append("Replacement/parts media is optional and below product launch threshold.")

    elif is_category:
        if source_width >= CATEGORY_HERO_PREFERRED_WIDTH:
            threshold_status = "preferred_hero"
            upload_status = "upload_ready"
            reasons.append("Category image meets preferred 2400px hero width.")
        elif source_width >= CATEGORY_HERO_MIN_WIDTH:
            threshold_status = "hero_ready"
            upload_status = "upload_ready"
            reasons.append("Category image meets 1600px hero width.")
        elif role == "gallery" and longest_edge >= GALLERY_MIN_LONGEST_EDGE:
            threshold_status = "small_category_card"
            upload_status = "needs_shawn_review"
            reasons.append("Category image is below 1600px hero width; only consider for small category/card use.")
        elif target_id in BEST_AVAILABLE_ALLOWED and longest_edge >= GALLERY_MIN_LONGEST_EDGE:
            threshold_status = "best_available_not_hero_ready"
            upload_status = "upload_ready_best_available"
            reasons.append("Best-available category candidate is not hero-ready but may be usable in a smaller slot.")
        else:
            threshold_status = "below_category_launch"
            upload_status = "needs_shawn_review"
            reasons.append("Category image is below 1600px hero width.")
    else:
        threshold_status = "review"
        upload_status = "needs_shawn_review"
        reasons.append("Unrecognized asset type.")

    if row["backgroundRemovalAttempted"] and not row["backgroundRemoved"]:
        reasons.append("Background removal was attempted but not accepted; visually review before upload.")
        if upload_status == "upload_ready":
            upload_status = "needs_shawn_review"

    source_notes = row.get("reviewReasons") or ""
    if source_notes and upload_status == "upload_ready_best_available":
        reasons.append(source_notes)

    bucket_relative_path = f"{bucket_folder(upload_status)}/{safe_segment(target_id)}/{row['processedFilename']}"
    return {
        **row,
        "sourceLongestEdge": longest_edge,
        "sourceShortestEdge": shortest_edge,
        "launchThresholdStatus": threshold_status,
        "uploadPrepStatus": upload_status,
        "uploadPrepReasons": " ".join(dict.fromkeys(reasons)),
        "uploadPrepRelativePath": bucket_relative_path,
        "recommendedUse": recommended_use(row, threshold_status),
        "requiresApprovalBeforeUpload": upload_status in {"needs_shawn_review", "do_not_upload"},
    }


def recommended_use(row, threshold_status):
    if row["assetType"] == "category":
        if threshold_status in {"preferred_hero", "hero_ready"}:
            return "category_hero_or_card"
        return "small_category_card_only"
    if row["role"] == "primary":
        return "pdp_primary"
    return "pdp_gallery"


def bucket_folder(upload_status):
    return {
        "upload_ready": "upload-ready",
        "upload_ready_best_available": "upload-ready-best-available",
        "needs_shawn_review": "needs-shawn-review",
        "do_not_upload": "do-not-upload",
    }[upload_status]


def copy_buckets(rows):
    for row in rows:
        destination = OUTPUT_DIR / row["uploadPrepRelativePath"]
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(row["processedPath"], destination)


def write_manifests(rows):
    uploadable = [row for row in rows if row["uploadPrepStatus"] in {"upload_ready", "upload_ready_best_available"}]
    strict_ready = [row for row in rows if row["uploadPrepStatus"] == "upload_ready"]
    best_available = [row for row in rows if row["uploadPrepStatus"] == "upload_ready_best_available"]
    review = [row for row in rows if row["uploadPrepStatus"] == "needs_shawn_review"]
    rejected = [row for row in rows if row["uploadPrepStatus"] == "do_not_upload"]

    manifest_rows = [to_upload_manifest_row(row) for row in uploadable]
    strict_manifest_rows = [to_upload_manifest_row(row) for row in strict_ready]
    best_manifest_rows = [to_upload_manifest_row(row) for row in best_available]

    write_json(DIRS["manifests"] / "upload-prep-manifest.json", rows)
    write_csv(DIRS["manifests"] / "upload-prep-manifest.csv", rows)
    write_json(DIRS["manifests"] / "cloudinary-upload-manifest.json", manifest_rows)
    write_csv(DIRS["manifests"] / "cloudinary-upload-manifest.csv", manifest_rows)
    write_json(DIRS["manifests"] / "cloudinary-upload-ready-strict.json", strict_manifest_rows)
    write_json(DIRS["manifests"] / "cloudinary-upload-ready-best-available.json", best_manifest_rows)
    write_json(DIRS["manifests"] / "needs-shawn-review-manifest.json", review)
    write_json(DIRS["manifests"] / "do-not-upload-manifest.json", rejected)


def to_upload_manifest_row(row):
    return {
        "publicId": row["cloudinaryPublicId"],
        "folder": row["cloudinaryFolder"],
        "localPath": row["processedPath"],
        "uploadPrepPath": str(OUTPUT_DIR / row["uploadPrepRelativePath"]),
        "filename": row["processedFilename"],
        "targetId": row["targetId"],
        "targetLabel": row["targetLabel"],
        "assetType": row["assetType"],
        "role": row["role"],
        "sequence": row["sequence"],
        "altText": row["finalAltText"],
        "format": row["format"],
        "sourceWidth": row["sourceWidth"],
        "sourceHeight": row["sourceHeight"],
        "processedWidth": row["processedWidth"],
        "processedHeight": row["processedHeight"],
        "hasTransparentBackground": row["hasTransparentBackground"],
        "launchThresholdStatus": row["launchThresholdStatus"],
        "uploadPrepStatus": row["uploadPrepStatus"],
        "recommendedUse": row["recommendedUse"],
        "sourcePageUrl": row["sourcePageUrl"],
        "originalImageUrl": row["originalImageUrl"],
        "notes": row["uploadPrepReasons"],
    }


def write_cli(rows):
    uploadable = [row for row in rows if row["uploadPrepStatus"] in {"upload_ready", "upload_ready_best_available"}]
    strict_ready = [row for row in rows if row["uploadPrepStatus"] == "upload_ready"]
    best_available = [row for row in rows if row["uploadPrepStatus"] == "upload_ready_best_available"]

    lines = [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        "",
        "# Dry-run command list only. Review before executing manually.",
        "# Requires Cloudinary CLI configuration. Do not run until Shawn approves upload.",
        "",
    ]
    for row in uploadable:
        lines.append(cloudinary_command(row))
    script_path = DIRS["cloudinary_cli"] / "upload-approved-assets.sh"
    script_path.write_text("\n".join(lines) + "\n")
    script_path.chmod(0o755)

    (DIRS["cloudinary_cli"] / "upload-ready-strict-commands.txt").write_text(
        "\n".join(cloudinary_command(row) for row in strict_ready) + "\n"
    )
    (DIRS["cloudinary_cli"] / "upload-ready-best-available-commands.txt").write_text(
        "\n".join(cloudinary_command(row) for row in best_available) + "\n"
    )


def cloudinary_command(row):
    file_path = OUTPUT_DIR / row["uploadPrepRelativePath"]
    context = (
        f"target_id={row['targetId']}|role={row['role']}|source_page={row['sourcePageUrl']}|"
        f"launch_status={row['launchThresholdStatus']}"
    )
    return (
        "cloudinary uploader upload "
        f"{shell_quote(str(file_path))} "
        f"--public_id {shell_quote(row['cloudinaryPublicId'])} "
        "--resource_type image "
        "--overwrite false "
        f"--context {shell_quote(context)} "
        f"--tags {shell_quote('tpp-media-recovery,v1-launch,' + row['uploadPrepStatus'])}"
    )


def write_reports(rows):
    counts = Counter(row["uploadPrepStatus"] for row in rows)
    threshold_counts = Counter(row["launchThresholdStatus"] for row in rows)
    lines = [
        "# TigerPingPong Cloudinary Upload Prep Summary",
        "",
        "No Cloudinary uploads were performed. This pack only sorts files, writes manifests, and generates dry-run CLI command text.",
        "",
        f"Assets reviewed: {len(rows)}",
        f"Upload-ready: {counts['upload_ready']}",
        f"Upload-ready best-available: {counts['upload_ready_best_available']}",
        f"Needs Shawn review: {counts['needs_shawn_review']}",
        f"Do not upload: {counts['do_not_upload']}",
        "",
        "## Launch Threshold Counts",
        "",
    ]
    for key, value in sorted(threshold_counts.items()):
        lines.append(f"- {key}: {value}")
    lines.extend(
        [
            "",
            "## Threshold Rules Applied",
            "",
            "- Product primary images: 800x800 minimum, 1200x1200+ preferred.",
            "- PDP gallery images: 800px longest edge minimum, 1200px+ preferred.",
            "- Category/hero images: 1600px wide minimum for hero use, 2400px wide preferred.",
            "- Images below hero threshold may only be considered for small category/card use.",
            "- No image was upscaled.",
            "",
        ]
    )
    (DIRS["reports"] / "upload-prep-summary.md").write_text("\n".join(lines) + "\n")

    by_target = defaultdict(list)
    for row in rows:
        by_target[row["targetId"]].append(row)
    target_lines = ["# Upload Readiness By Target", ""]
    for target_id in sorted(by_target):
        target_rows = sorted(by_target[target_id], key=lambda item: (item["role"] != "primary", item["sequence"]))
        target_lines.append(f"## {target_rows[0]['targetLabel']}")
        target_lines.append("")
        for row in target_rows:
            target_lines.append(
                f"- {row['role']} {row['sequence']:02d}: {row['processedFilename']} - "
                f"{row['uploadPrepStatus']} ({row['launchThresholdStatus']}); "
                f"source {row['sourceWidth']}x{row['sourceHeight']}"
            )
            target_lines.append(f"  - {row['uploadPrepReasons']}")
        target_lines.append("")
    (DIRS["reports"] / "upload-readiness-by-target.md").write_text("\n".join(target_lines) + "\n")

    review_lines = ["# Needs Shawn Review", ""]
    for row in rows:
        if row["uploadPrepStatus"] == "needs_shawn_review":
            review_lines.append(
                f"- {row['targetLabel']} / {row['role']} {row['sequence']:02d}: "
                f"{row['processedFilename']} - {row['uploadPrepReasons']}"
            )
    review_lines.append("")
    (DIRS["reports"] / "needs-shawn-review.md").write_text("\n".join(review_lines) + "\n")

    do_not_lines = ["# Do Not Upload", ""]
    do_not_rows = [row for row in rows if row["uploadPrepStatus"] == "do_not_upload"]
    if not do_not_rows:
        do_not_lines.append("No assets were classified as do-not-upload.")
    for row in do_not_rows:
        do_not_lines.append(f"- {row['processedFilename']}: {row['uploadPrepReasons']}")
    do_not_lines.append("")
    (DIRS["reports"] / "do-not-upload.md").write_text("\n".join(do_not_lines) + "\n")


def write_qa(rows):
    source_dir = Path("exports/tpp-media-processed-pack/qa-sheets")
    for filename in ["contact-sheet-products.png", "contact-sheet-categories.png", "qa-gallery.html"]:
        source = source_dir / filename
        if source.exists():
            shutil.copy2(source, DIRS["qa"] / filename)

    review_rows = [
        {
            "uploadPrepStatus": row["uploadPrepStatus"],
            "targetId": row["targetId"],
            "targetLabel": row["targetLabel"],
            "role": row["role"],
            "sequence": row["sequence"],
            "filename": row["processedFilename"],
            "uploadPrepPath": row["uploadPrepRelativePath"],
            "sourceDimensions": f"{row['sourceWidth']}x{row['sourceHeight']}",
            "processedDimensions": f"{row['processedWidth']}x{row['processedHeight']}",
            "launchThresholdStatus": row["launchThresholdStatus"],
            "recommendedUse": row["recommendedUse"],
            "reasons": row["uploadPrepReasons"],
        }
        for row in rows
    ]
    write_csv(DIRS["qa"] / "upload-prep-review-sheet.csv", review_rows)
    write_review_markdown(rows)


def write_review_markdown(rows):
    lines = ["# Cloudinary Upload Prep Review Sheet", ""]
    for row in rows:
        lines.append(f"## {row['targetLabel']} - {row['role']} {row['sequence']:02d}")
        lines.append("")
        rel = Path("..") / row["uploadPrepRelativePath"]
        lines.append(f"![{row['finalAltText']}]({rel.as_posix()})")
        lines.append("")
        lines.append(f"- Status: {row['uploadPrepStatus']}")
        lines.append(f"- Threshold: {row['launchThresholdStatus']}")
        lines.append(f"- Source dimensions: {row['sourceWidth']}x{row['sourceHeight']}")
        lines.append(f"- Processed dimensions: {row['processedWidth']}x{row['processedHeight']}")
        lines.append(f"- Recommended use: {row['recommendedUse']}")
        lines.append(f"- Notes: {row['uploadPrepReasons']}")
        lines.append("")
    (DIRS["qa"] / "upload-prep-review-sheet.md").write_text("\n".join(lines) + "\n")


def write_json(path, rows):
    path.write_text(json.dumps(rows, indent=2) + "\n")


def write_csv(path, rows):
    if not rows:
        path.write_text("")
        return
    keys = list(rows[0].keys())
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=keys)
        writer.writeheader()
        writer.writerows(rows)


def safe_segment(value):
    return "".join(char if char.isalnum() else "-" for char in str(value).lower()).strip("-")


def shell_quote(value):
    return "'" + str(value).replace("'", "'\"'\"'") + "'"


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        sys.exit(1)
