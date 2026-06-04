# 003: Scrape Import Prep Build Log

## What Was Added

- Local TigerPingPong.ca scrape/import-prep script.
- Root scripts for a bounded default crawl and a small smoke crawl.
- Gitignore coverage for generated scrape output.
- Scraper README and output specification docs.
- Cloudinary media-planning metadata in the product image manifest.

## Scope

This task is local/dev-only catalog import preparation. It extracts public
catalog and content signals into review files, but it does not import data or
change application behavior.

## Generated Files

The scraper writes generated files under:

```text
var/scrapes/tigerpingpong/
```

That folder is ignored by git.

Required generated review files:

- `scrape_run_report.md`
- `urls_discovered.csv`
- `products_raw.json`
- `products_clean.csv`
- `product_options.csv`
- `product_images_manifest.csv`
- `categories.csv`
- `pages_static.csv`
- `resources_articles.csv`
- `redirect_map_draft.csv`
- `scrape_flags.csv`

## Business Rules Captured

- Tables default to `online_checkout` in v1 unless a specific table SKU is
  manually marked otherwise.
- Table checkout candidates are flagged for freight, curbside, tax, region, and
  shipping policy review before public launch.
- Replacement Parts are preserved for future review and redirects, but are
  deferred from v1 public navigation and checkout scope.
- Product images will be hosted in Cloudinary in the future.
- Original TigerPingPong.ca image URLs are source metadata only, not the final
  production hotlinking strategy.
- Checkout implementation remains a later explicit task.

## Intentionally Not Changed

- Prisma schema
- SQL or migrations
- Supabase data
- API routes
- Frontend pages
- Cart or checkout
- Stripe
- Auth
- Admin screens
- Environment variable values
- Generated scrape output committed to git
- Cloudinary uploads
- Downloaded/raw image files committed to git

## Review Guidance

Review `scrape_flags.csv` and `products_clean.csv` before planning any import.
Treat redirect output as a draft until the final frontend route pattern is
approved.

Review `product_images_manifest.csv` before any future media migration. The
manifest suggests Cloudinary folders, public IDs, and filenames, but it does not
upload or download images.
