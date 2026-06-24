#!/usr/bin/env python3
import argparse
import csv
import json
import math
import shutil
import sys
from collections import Counter, defaultdict
from pathlib import Path


DEFAULT_ROOT = Path("exports/tpp-media-processed-pack")
DEFAULT_MOVE_FORWARD_MANIFEST = Path("exports/tpp-media-recovery-triage/manifests/move-forward-manifest.json")

ROOT = DEFAULT_ROOT
MOVE_FORWARD_MANIFEST = DEFAULT_MOVE_FORWARD_MANIFEST
Image = None
ImageDraw = None
ImageFilter = None
ImageFont = None

PRODUCT_CANVAS = (1600, 1600)
PRODUCT_MARGIN = 80
CATEGORY_MAX = (2400, 1600)

def build_dirs(root):
    return {
        "processed_products": root / "processed" / "products",
        "processed_categories": root / "processed" / "categories",
        "processed_brand": root / "processed" / "brand",
        "transparent": root / "transparent",
        "non_transparent": root / "non-transparent",
        "needs_human_review": root / "needs-human-review",
        "rejected": root / "rejected",
        "qa_sheets": root / "qa-sheets",
        "manifests": root / "manifests",
        "reports": root / "reports",
    }


DIRS = build_dirs(ROOT)

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

LOW_CONFIDENCE_TARGETS = {
    "expo-outdoor",
    "portland-indoor",
    "whistler-indoor",
    "plaza-outdoor",
    "aqua-paddle",
    "covers",
    "net-post-set",
    "category-indoor-tables",
}


def main(argv=None):
    args = parse_args(argv)
    configure_paths(args.move_forward_manifest, args.output_dir)
    validate_generated_output_dir(ROOT)

    if not args.run:
        print_plan()
        return

    rows = load_manifest(MOVE_FORWARD_MANIFEST)
    require_pillow()
    ensure_reset_allowed(ROOT, args.allow_reset)
    reset_output()

    processed = []
    rejected = []
    sequence_by_target_role = defaultdict(int)

    for row in rows:
        try:
            result = process_row(row, sequence_by_target_role)
            processed.append(result)
        except Exception as exc:  # noqa: BLE001 - report per-asset failure and continue.
            rejected_row = {
                **row,
                "processingStatus": "rejected_processing_error",
                "processingNotes": str(exc),
            }
            rejected.append(rejected_row)
            copy_to(row["localPath"], DIRS["rejected"] / safe_segment(row["targetId"]) / Path(row["localPath"]).name)

    write_manifests(processed, rejected)
    write_reports(processed, rejected)
    write_qa_sheets(processed)

    summary = {
        "moveForwardRowsRead": len(rows),
        "processedAssets": len(processed),
        "transparentAssets": sum(1 for item in processed if item["hasTransparentBackground"]),
        "nonTransparentAssets": sum(1 for item in processed if not item["hasTransparentBackground"]),
        "needsHumanReview": sum(1 for item in processed if item["needsHumanReview"]),
        "rejected": len(rejected),
        "cloudinaryReadyManifest": str(DIRS["manifests"] / "cloudinary-ready-manifest.json"),
    }
    print(json.dumps(summary, indent=2))


def parse_args(argv=None):
    parser = argparse.ArgumentParser(
        description="Process recovered TigerPingPong media into a local generated media pack."
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
        "--move-forward-manifest",
        type=Path,
        default=DEFAULT_MOVE_FORWARD_MANIFEST,
        help=f"Move-forward manifest to read. Default: {DEFAULT_MOVE_FORWARD_MANIFEST}",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_ROOT,
        help=f"Generated processed-pack output directory. Must be under exports/. Default: {DEFAULT_ROOT}",
    )
    return parser.parse_args(argv)


def configure_paths(move_forward_manifest, output_dir):
    global MOVE_FORWARD_MANIFEST, ROOT, DIRS
    MOVE_FORWARD_MANIFEST = move_forward_manifest
    ROOT = output_dir
    DIRS = build_dirs(ROOT)


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
        raise SystemExit(f"Missing move-forward manifest: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON in move-forward manifest {path}: {exc}") from exc


def ensure_reset_allowed(path, allow_reset):
    if path.exists() and not allow_reset:
        raise SystemExit(
            f"Output directory already exists and would be reset: {path}. "
            "Rerun with --run --allow-reset after confirming it is generated local output."
        )


def print_plan():
    count = "missing"
    if MOVE_FORWARD_MANIFEST.exists():
        count = len(load_manifest(MOVE_FORWARD_MANIFEST))
    print(
        json.dumps(
            {
                "mode": "dry-run",
                "message": "No files were written. Re-run with --run to generate output.",
                "moveForwardManifest": str(MOVE_FORWARD_MANIFEST),
                "outputDir": str(ROOT),
                "rowsToProcess": count,
                "willUpload": False,
                "requiresSecrets": False,
            },
            indent=2,
        )
    )


def require_pillow():
    global Image, ImageDraw, ImageFilter, ImageFont
    if Image is not None:
        return
    try:
        from PIL import Image as pillow_image
        from PIL import ImageDraw as pillow_image_draw
        from PIL import ImageFilter as pillow_image_filter
        from PIL import ImageFont as pillow_image_font
    except ImportError as exc:
        raise SystemExit("Pillow is required to process media. Install project tooling dependencies before using --run.") from exc
    Image = pillow_image
    ImageDraw = pillow_image_draw
    ImageFilter = pillow_image_filter
    ImageFont = pillow_image_font


def reset_output():
    if ROOT.exists():
        shutil.rmtree(ROOT)
    for directory in DIRS.values():
        directory.mkdir(parents=True, exist_ok=True)


def process_row(row, sequence_by_target_role):
    source_path = Path(row["localPath"])
    target_id = row["targetId"]
    asset_type = "product" if target_id in PRODUCT_TARGETS else "category"
    role = "primary" if row["triageStatus"] == "selected_primary" else "gallery"
    sequence_by_target_role[(target_id, role)] += 1
    index = sequence_by_target_role[(target_id, role)]
    base_name = f"tpp-{target_id}-{role}-{index:02d}"

    remove_background = (
        asset_type == "product"
        and bool(row["needsBackgroundRemovalCandidate"])
        and row["width"] >= 700
        and row["height"] >= 700
    )

    image = Image.open(source_path)
    image.load()
    original_mode = image.mode
    original_size = image.size

    background_removed = False
    transparent_pixel_ratio = 0.0

    if asset_type == "product":
        if remove_background:
            cutout, transparent_pixel_ratio = remove_white_background(image)
            if 0.04 <= transparent_pixel_ratio <= 0.92:
                image = cutout
                background_removed = True
            else:
                image = image.convert("RGBA")
        else:
            image = image.convert("RGBA")

        if background_removed:
            processed_image = standard_product_canvas(image, transparent=True)
            extension = "png"
            output_dir = DIRS["processed_products"] / target_id
            sibling_dir = DIRS["transparent"] / target_id
            has_transparent_background = True
        else:
            processed_image = standard_product_canvas(image, transparent=False)
            extension = "jpg"
            output_dir = DIRS["processed_products"] / target_id
            sibling_dir = DIRS["non_transparent"] / target_id
            has_transparent_background = False
    else:
        processed_image = prepare_category_image(image)
        extension = source_extension_or_jpg(source_path)
        if extension in {"png", "webp"} and processed_image.mode == "RGB":
            extension = "jpg"
        output_dir = DIRS["processed_categories"] / target_id
        sibling_dir = DIRS["non_transparent"] / target_id
        has_transparent_background = False

    output_filename = f"{base_name}.{extension}"
    output_path = output_dir / output_filename
    sibling_path = sibling_dir / output_filename
    save_image(processed_image, output_path, extension)
    copy_to(output_path, sibling_path)

    needs_human_review = (
        target_id in LOW_CONFIDENCE_TARGETS
        or not bool(row["acceptableForProcessing"])
        or (remove_background and not background_removed)
    )
    if needs_human_review:
        copy_to(output_path, DIRS["needs_human_review"] / target_id / output_filename)

    final_alt_text = final_alt_text_for(row, role, asset_type)
    public_id = f"tigerpingpong/recovered/{asset_type}s/{target_id}/{Path(output_filename).stem}"

    return {
        "targetId": target_id,
        "targetLabel": row["targetLabel"],
        "assetType": asset_type,
        "role": role,
        "sequence": index,
        "sourceFilename": row["downloadedFilename"],
        "sourcePath": row["localPath"],
        "processedFilename": output_filename,
        "processedPath": str(output_path),
        "bucketPath": str(sibling_path),
        "cloudinaryPublicId": public_id,
        "cloudinaryFolder": f"tigerpingpong/recovered/{asset_type}s/{target_id}",
        "finalAltText": final_alt_text,
        "sourcePageUrl": row["sourcePageUrl"],
        "originalImageUrl": row["originalImageUrl"],
        "sourceWidth": row["width"],
        "sourceHeight": row["height"],
        "processedWidth": processed_image.size[0],
        "processedHeight": processed_image.size[1],
        "sourceMode": original_mode,
        "sourceSize": f"{original_size[0]}x{original_size[1]}",
        "format": extension,
        "hasTransparentBackground": has_transparent_background,
        "backgroundRemovalAttempted": remove_background,
        "backgroundRemoved": background_removed,
        "transparentPixelRatio": round(transparent_pixel_ratio, 4),
        "wasUpscaled": False,
        "acceptableForProcessing": bool(row["acceptableForProcessing"]),
        "needsHumanReview": needs_human_review,
        "reviewReasons": review_reasons(row, remove_background, background_removed),
        "processingStatus": "processed_needs_human_review" if needs_human_review else "processed_ready",
    }


def remove_white_background(image):
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    visited = set()
    stack = []

    def is_near_white(x, y):
        r, g, b, a = pixels[x, y]
        if a < 10:
            return True
        return r >= 238 and g >= 238 and b >= 238 and max(r, g, b) - min(r, g, b) <= 24

    for x in range(width):
        stack.append((x, 0))
        stack.append((x, height - 1))
    for y in range(height):
        stack.append((0, y))
        stack.append((width - 1, y))

    mask = Image.new("L", (width, height), 255)
    mask_pixels = mask.load()
    while stack:
        x, y = stack.pop()
        if (x, y) in visited or x < 0 or y < 0 or x >= width or y >= height:
            continue
        visited.add((x, y))
        if not is_near_white(x, y):
            continue
        mask_pixels[x, y] = 0
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    mask = mask.filter(ImageFilter.GaussianBlur(0.6))
    rgba.putalpha(mask)
    mask_values = mask.get_flattened_data() if hasattr(mask, "get_flattened_data") else mask.getdata()
    transparent = sum(1 for value in mask_values if value < 12)
    return rgba, transparent / float(width * height)


def standard_product_canvas(image, transparent):
    bbox = image.getbbox() if image.mode == "RGBA" else None
    if bbox:
        image = image.crop(bbox)

    max_width = PRODUCT_CANVAS[0] - PRODUCT_MARGIN * 2
    max_height = PRODUCT_CANVAS[1] - PRODUCT_MARGIN * 2
    image = fit_without_upscale(image, max_width, max_height)

    if transparent:
        canvas = Image.new("RGBA", PRODUCT_CANVAS, (255, 255, 255, 0))
        paste_layer = image.convert("RGBA")
        position = centered_position(PRODUCT_CANVAS, paste_layer.size)
        canvas.alpha_composite(paste_layer, position)
        return canvas

    canvas = Image.new("RGB", PRODUCT_CANVAS, (255, 255, 255))
    paste_layer = image.convert("RGBA")
    position = centered_position(PRODUCT_CANVAS, paste_layer.size)
    canvas.paste(paste_layer.convert("RGB"), position, paste_layer.getchannel("A"))
    return canvas


def prepare_category_image(image):
    image = image.convert("RGB")
    image = fit_without_upscale(image, CATEGORY_MAX[0], CATEGORY_MAX[1])
    return image


def fit_without_upscale(image, max_width, max_height):
    width, height = image.size
    scale = min(max_width / width, max_height / height, 1.0)
    if scale >= 1:
        return image
    new_size = (max(1, math.floor(width * scale)), max(1, math.floor(height * scale)))
    return image.resize(new_size, Image.Resampling.LANCZOS)


def centered_position(canvas_size, image_size):
    return ((canvas_size[0] - image_size[0]) // 2, (canvas_size[1] - image_size[1]) // 2)


def save_image(image, path, extension):
    path.parent.mkdir(parents=True, exist_ok=True)
    if extension == "png":
        image.save(path, format="PNG", optimize=True)
    elif extension == "webp":
        image.save(path, format="WEBP", quality=95, method=6)
    else:
        image.convert("RGB").save(path, format="JPEG", quality=95, optimize=True, progressive=True)


def copy_to(source, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def source_extension_or_jpg(path):
    extension = path.suffix.lower().lstrip(".")
    if extension == "jpeg":
        return "jpg"
    if extension in {"jpg", "png", "webp"}:
        return extension
    return "jpg"


def final_alt_text_for(row, role, asset_type):
    label = row["targetLabel"].replace(" category/hero", "")
    if asset_type == "category":
        return f"TigerPingPong {label} image"
    if role == "primary":
        return f"{label} product image"
    return f"{label} product detail image"


def review_reasons(row, remove_background, background_removed):
    reasons = []
    if not bool(row["acceptableForProcessing"]):
        reasons.append(row.get("lowResolutionReasons") or "selected candidate is below preferred processing threshold")
    if row["targetId"] in LOW_CONFIDENCE_TARGETS:
        reasons.append("target was flagged as low-confidence during triage")
    if remove_background and not background_removed:
        reasons.append("background removal was attempted but not accepted by transparency-ratio safety check")
    return "; ".join(dict.fromkeys(reason for reason in reasons if reason))


def write_manifests(processed, rejected):
    cloudinary = [
        {
            "publicId": item["cloudinaryPublicId"],
            "folder": item["cloudinaryFolder"],
            "localPath": item["processedPath"],
            "filename": item["processedFilename"],
            "targetId": item["targetId"],
            "targetLabel": item["targetLabel"],
            "assetType": item["assetType"],
            "role": item["role"],
            "sequence": item["sequence"],
            "altText": item["finalAltText"],
            "width": item["processedWidth"],
            "height": item["processedHeight"],
            "format": item["format"],
            "hasTransparentBackground": item["hasTransparentBackground"],
            "needsHumanReviewBeforeUpload": item["needsHumanReview"],
            "sourcePath": item["sourcePath"],
            "sourcePageUrl": item["sourcePageUrl"],
            "originalImageUrl": item["originalImageUrl"],
        }
        for item in processed
    ]
    write_json(DIRS["manifests"] / "processed-manifest.json", processed)
    write_json(DIRS["manifests"] / "cloudinary-ready-manifest.json", cloudinary)
    write_json(DIRS["manifests"] / "needs-human-review-manifest.json", [item for item in processed if item["needsHumanReview"]])
    write_json(DIRS["manifests"] / "rejected-manifest.json", rejected)
    write_csv(DIRS["manifests"] / "processed-manifest.csv", processed)
    write_csv(DIRS["manifests"] / "cloudinary-ready-manifest.csv", cloudinary)


def write_reports(processed, rejected):
    counts = Counter(item["processingStatus"] for item in processed)
    transparent = [item for item in processed if item["hasTransparentBackground"]]
    review = [item for item in processed if item["needsHumanReview"]]

    lines = [
        "# TigerPingPong Processed Media Pack Summary",
        "",
        "Media-only processing pass. No Cloudinary uploads, app image mapping changes, product data changes, or live asset replacements were performed.",
        "",
        f"Processed target-candidates: {len(processed)}",
        f"Transparent assets: {len(transparent)}",
        f"Non-transparent assets: {len(processed) - len(transparent)}",
        f"Needs human review before upload/use: {len(review)}",
        f"Rejected/failed processing: {len(rejected)}",
        f"Ready without review flags: {counts.get('processed_ready', 0)}",
        "",
        "## Canvas Rules",
        "",
        f"- Product images: {PRODUCT_CANVAS[0]}x{PRODUCT_CANVAS[1]} canvas.",
        f"- Product images were downscaled only when larger than the canvas safe area; low-resolution images were not upscaled.",
        f"- Category images were kept non-transparent and constrained only if larger than {CATEGORY_MAX[0]}x{CATEGORY_MAX[1]}.",
        "",
        "## Output",
        "",
        f"- Processed products: {DIRS['processed_products']}",
        f"- Processed categories: {DIRS['processed_categories']}",
        f"- Transparent copies: {DIRS['transparent']}",
        f"- Non-transparent copies: {DIRS['non_transparent']}",
        f"- Needs human review: {DIRS['needs_human_review']}",
        f"- Cloudinary-ready manifest: {DIRS['manifests'] / 'cloudinary-ready-manifest.json'}",
        "",
    ]
    (DIRS["reports"] / "processing-summary.md").write_text("\n".join(lines) + "\n")

    bg_lines = ["# Background Removal Report", ""]
    for item in processed:
        if item["backgroundRemovalAttempted"]:
            bg_lines.append(
                f"- {item['processedFilename']}: {'removed' if item['backgroundRemoved'] else 'not removed'} "
                f"(transparent ratio {item['transparentPixelRatio']}) from {item['sourceFilename']}"
            )
    bg_lines.append("")
    (DIRS["reports"] / "background-removal-report.md").write_text("\n".join(bg_lines) + "\n")

    review_lines = ["# Needs Human Review", ""]
    for item in review:
        review_lines.append(f"- {item['targetLabel']} / {item['role']}: {item['processedFilename']} - {item['reviewReasons']}")
    review_lines.append("")
    (DIRS["reports"] / "needs-human-review-report.md").write_text("\n".join(review_lines) + "\n")

    rejected_lines = ["# Rejected Or Failed Processing", ""]
    if not rejected:
        rejected_lines.append("No assets failed processing.")
    for item in rejected:
        rejected_lines.append(f"- {item.get('downloadedFilename', '')}: {item.get('processingNotes', '')}")
    rejected_lines.append("")
    (DIRS["reports"] / "rejected-report.md").write_text("\n".join(rejected_lines) + "\n")


def write_qa_sheets(processed):
    write_html_gallery(processed)
    write_contact_sheet(
        [item for item in processed if item["assetType"] == "product"],
        DIRS["qa_sheets"] / "contact-sheet-products.png",
        "Processed Product Candidates",
    )
    write_contact_sheet(
        [item for item in processed if item["assetType"] == "category"],
        DIRS["qa_sheets"] / "contact-sheet-categories.png",
        "Processed Category Candidates",
    )
    sheet_rows = [
        {
            "targetId": item["targetId"],
            "targetLabel": item["targetLabel"],
            "role": item["role"],
            "processedFilename": item["processedFilename"],
            "processedPath": item["processedPath"],
            "sourceFilename": item["sourceFilename"],
            "dimensions": f"{item['processedWidth']}x{item['processedHeight']}",
            "transparent": item["hasTransparentBackground"],
            "needsHumanReview": item["needsHumanReview"],
            "reviewReasons": item["reviewReasons"],
            "altText": item["finalAltText"],
        }
        for item in processed
    ]
    write_csv(DIRS["qa_sheets"] / "qa-review-sheet.csv", sheet_rows)

    md_lines = ["# Processed Media QA Review", ""]
    for item in processed:
        rel = Path("..") / Path(item["processedPath"]).relative_to(ROOT)
        md_lines.extend(
            [
                f"## {item['targetLabel']} - {item['role']} {item['sequence']:02d}",
                "",
                f"![{item['finalAltText']}]({rel.as_posix()})",
                "",
                f"- File: {item['processedFilename']}",
                f"- Source: {item['sourceFilename']}",
                f"- Transparent: {'yes' if item['hasTransparentBackground'] else 'no'}",
                f"- Needs human review: {'yes' if item['needsHumanReview'] else 'no'}",
                f"- Alt text: {item['finalAltText']}",
                "",
            ]
        )
    (DIRS["qa_sheets"] / "qa-review-sheet.md").write_text("\n".join(md_lines) + "\n")


def write_contact_sheet(items, path, title):
    if not items:
        return
    columns = 4
    thumb_w, thumb_h = 260, 220
    label_h = 82
    gap = 18
    header_h = 58
    rows = math.ceil(len(items) / columns)
    width = columns * thumb_w + (columns + 1) * gap
    height = header_h + rows * (thumb_h + label_h + gap) + gap
    sheet = Image.new("RGB", (width, height), (248, 250, 252))
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    draw.text((gap, 20), title, fill=(18, 28, 40), font=font)

    for idx, item in enumerate(items):
        col = idx % columns
        row = idx // columns
        x = gap + col * (thumb_w + gap)
        y = header_h + row * (thumb_h + label_h + gap)
        draw.rectangle((x, y, x + thumb_w, y + thumb_h), fill=(236, 239, 244), outline=(210, 216, 225))
        tile = checkerboard((thumb_w, thumb_h))
        image = Image.open(item["processedPath"]).convert("RGBA")
        image.thumbnail((thumb_w - 20, thumb_h - 20), Image.Resampling.LANCZOS)
        tile.alpha_composite(image, centered_position((thumb_w, thumb_h), image.size))
        sheet.paste(tile.convert("RGB"), (x, y))
        label = [
            item["targetLabel"],
            f"{item['role']} {item['sequence']:02d} | {item['processedFilename']}",
            "review" if item["needsHumanReview"] else "ready",
        ]
        text_y = y + thumb_h + 8
        for line in label:
            draw.text((x, text_y), truncate(line, 42), fill=(45, 55, 72), font=font)
            text_y += 18
    sheet.save(path, format="PNG", optimize=True)


def checkerboard(size):
    image = Image.new("RGBA", size, (255, 255, 255, 255))
    draw = ImageDraw.Draw(image)
    cell = 16
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2 == 0:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(238, 241, 245, 255))
    return image


def truncate(value, limit):
    value = str(value)
    return value if len(value) <= limit else value[: limit - 1] + "..."


def write_html_gallery(processed):
    cards = []
    for item in processed:
        rel = Path("..") / Path(item["processedPath"]).relative_to(ROOT)
        cards.append(
            f"""
      <article class="{ 'review' if item['needsHumanReview'] else 'ready' }">
        <img src="{html_escape(rel.as_posix())}" alt="{html_escape(item['finalAltText'])}">
        <h2>{html_escape(item['targetLabel'])}</h2>
        <p>{html_escape(item['role'])} {item['sequence']:02d} | {item['processedWidth']}x{item['processedHeight']} | {'transparent' if item['hasTransparentBackground'] else 'non-transparent'}</p>
        <p>{'Needs review: ' + html_escape(item['reviewReasons']) if item['needsHumanReview'] else 'Ready candidate'}</p>
        <code>{html_escape(item['processedFilename'])}</code>
      </article>
"""
        )

    html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>TigerPingPong Processed Media QA</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; color: #17202a; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }}
    article {{ border: 1px solid #d6dbe4; border-radius: 8px; padding: 12px; background: #fff; }}
    article.review {{ border-color: #c98a1a; background: #fffaf0; }}
    img {{ width: 100%; height: 220px; object-fit: contain; background: linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px; }}
    h2 {{ font-size: 16px; margin: 10px 0 4px; }}
    p, code {{ font-size: 13px; color: #465162; }}
  </style>
</head>
<body>
  <h1>TigerPingPong Processed Media QA</h1>
  <p>Review only. No Cloudinary uploads or live asset replacements have been performed.</p>
  <div class="grid">
    {''.join(cards)}
  </div>
</body>
</html>
"""
    (DIRS["qa_sheets"] / "qa-gallery.html").write_text(html)


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


def html_escape(value):
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        sys.exit(1)
