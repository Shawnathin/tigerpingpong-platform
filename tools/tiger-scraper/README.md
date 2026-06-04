# Tiger Ping Pong Scraper Tool

This tool crawls public TigerPingPong.ca pages and writes local review files for
catalog import planning. It does not write to Supabase, Prisma, the API, the web
app, or any checkout system.

## Commands

Run a small smoke crawl:

```bash
pnpm scrape:tiger:test
```

Run the default crawl:

```bash
pnpm scrape:tiger
```

Useful options:

```bash
pnpm scrape:tiger -- --limit=40 --max-depth=3 --delay-ms=750
pnpm scrape:tiger -- --output=var/scrapes/tigerpingpong/review-2026-06-02
pnpm scrape:tiger -- --seed=/tables/indoor-tables/ --limit=15
```

Generated files are written under `var/scrapes/tigerpingpong/` and are ignored
by git. The product image manifest contains original source image URLs plus
suggested Cloudinary folder/public ID metadata for a later media task. This tool
does not upload images to Cloudinary or download image files.
