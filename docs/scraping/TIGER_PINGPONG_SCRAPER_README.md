# Tiger Ping Pong Scraper README

## Purpose

The Tiger Ping Pong scraper is a local/dev-only import-prep tool. It crawls
public same-domain pages on `https://tigerpingpong.ca`, extracts reviewable
catalog/content fields, and writes generated files for human review.

It does not write to Supabase, Prisma, SQL, migrations, API routes, frontend
pages, checkout, Stripe, auth, or admin screens.

## Business Decisions Reflected

- Tables default to `online_checkout` in v1 and are purchasable unless a
  specific table SKU is manually marked otherwise.
- Every table checkout candidate must be reviewed for freight, curbside, tax,
  region, and shipping policy before public launch.
- Paddles, Balls, Nets, Covers, and Accessories can be checkout candidates when
  add-to-cart behavior is visible.
- Replacement Parts are deferred from v1 public navigation, public launch
  categories, and checkout scope.
- Replacement Parts may still be scraped and preserved for future review,
  redirects, and v1.5/v2 planning.
- Checkout implementation still belongs in a later explicit checkout task.
- Product images will be hosted in Cloudinary in the future.
- The database should eventually store Cloudinary image references and URLs, not
  image files.

## Approved Seeds

- `/`
- `/sitemap.php`
- `/tables/`
- `/tables/indoor-tables/`
- `/tables/outdoor-tables/`
- `/accessories/`
- `/accessories/paddles/`
- `/accessories/ping-pong-balls/`
- `/accessories/covers/`
- `/accessories/nets/`
- `/resources/`
- `/shipping-returns`
- `/about`
- `/contact`

## How To Run

Small smoke crawl:

```bash
pnpm scrape:tiger:test
```

Default bounded crawl:

```bash
pnpm scrape:tiger
```

Optional examples:

```bash
pnpm scrape:tiger -- --limit=40 --max-depth=3 --delay-ms=750
pnpm scrape:tiger -- --seed=/tables/ --seed=/accessories/ --limit=25
pnpm scrape:tiger -- --output=var/scrapes/tigerpingpong/review-run
```

## Generated Output Location

Default output:

```text
var/scrapes/tigerpingpong/latest/
```

Smoke-test output:

```text
var/scrapes/tigerpingpong/test/
```

`var/scrapes/` is ignored by git. Generated scrape output should stay local
unless a later task explicitly asks to attach or copy a sample.

## Review Workflow

1. Open `scrape_run_report.md` for run counts and business-rule notes.
2. Review `scrape_flags.csv` for missing SKU, missing price, replacement part,
   table shipping, and manual review flags.
3. Review `products_clean.csv` for import candidates.
4. Review `product_options.csv` before deciding variant/option import shape.
5. Review `product_images_manifest.csv` before any later Cloudinary upload or
   media import task.
6. Review `redirect_map_draft.csv` only as a draft. Final route patterns must
   be confirmed before redirects are implemented.

## Media Handling

The scraper extracts existing product image URLs from TigerPingPong.ca and
writes them as source metadata. It also suggests future Cloudinary folders,
public IDs, and filenames where practical.

This task does not upload images to Cloudinary, download raw image files, commit
image files, or treat legacy BigCommerce/CDN image URLs as the final production
strategy.

## Guardrails

- Do not import generated files directly into production data.
- Do not treat purchase mode guesses as approvals.
- Do not expose table checkout publicly until freight, curbside, tax, region,
  and shipping policy are confirmed.
- Do not include Replacement Parts in v1 public navigation or checkout scope.
- Do not hotlink old BigCommerce/CDN images as the final production media
  strategy.
- Do not upload images to Cloudinary in this task.
- Do not commit downloaded or raw image files.
- Do not add checkout, cart, Stripe, API, frontend, Prisma, migration, auth, or
  admin work in the scraper task.
