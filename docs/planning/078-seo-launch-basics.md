# 078 SEO Launch Basics

Date: 2026-06-16
Branch / PR: `codex/pr-078-seo-launch-basics`
Status: Draft PR planned

## Decision made

Add launch SEO basics for the current public storefront: page metadata, safe
canonicals, `sitemap.xml`, and `robots.txt`.

## Canonical domain

The canonical site URL is `https://tigerpingpong.ca`.

The web app reads `NEXT_PUBLIC_SITE_URL` for canonical, sitemap, robots, and
JSON-LD URL generation. If the value is missing, invalid, localhost, or a Render
preview host, the app falls back to `https://tigerpingpong.ca`.

No DNS/domain cutover was performed.

## Public routes included in sitemap

- `/`
- `/tables`
- `/tables/indoor-tables`
- `/tables/outdoor-tables`
- `/accessories`
- `/accessories/paddles`
- `/accessories/ping-pong-balls`
- `/accessories/covers`
- `/accessories/nets`
- `/resources`
- `/resources/choose-a-ping-pong-table`
- `/resources/ping-pong-rules`
- `/resources/room-size`
- `/resources/indoor-vs-outdoor-ping-pong-tables`
- Public catalog product pages returned by the catalog API when safely
  available at sitemap generation time.

## Excluded routes

- `/admin/`
- `/internal/`
- `/api/`
- `/catalog-preview/`
- `/checkout/`
- Cart state URLs, checkout session URLs, drafts, private/internal/debug routes,
  and replacement-parts product pages.

## Resource article audit

The four migrated resource articles keep their preserved URLs and use their
article metadata. Related links point to current app routes. No old
`tigerpingpong.com` internal links, old `$50` shipping copy, or empty article
headings were found in the resource article source.

Article JSON-LD remains structurally basic and uses the canonical site URL for
`mainEntityOfPage`.

## Follow-up

- Legacy 301 redirect map.
- Search Console submission.
- Bing Webmaster Tools.
- Merchant Center if applicable.
- Final canonical verification after domain cutover.
- Product/schema review.
- Image alt/media sweep.
