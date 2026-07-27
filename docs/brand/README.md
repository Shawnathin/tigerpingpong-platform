# Tiger PingPong Brand Operating System

Version: 2.3.0
Effective: 2026-07-27
Brand owner: Shawn Cleve
Status: Canonical after merge

This folder is the contract for how Tiger PingPong presents itself. It governs customer-facing story, copy, product positioning, photography, interface design, and service language. It exists so a new contributor can continue the same Tiger without rediscovering or redesigning the brand.

The short version:

> Tiger is the Vancouver-born PingPong company that makes serious gear for real life, keeps the game easygoing, and gives people real help without the runaround.

## Mandatory reading

Before changing any public-facing copy, layout, media, campaign, category, or product page, read:

1. This file.
2. [TIGER-BRAND-BIBLE.md](./TIGER-BRAND-BIBLE.md).
3. [FACTS-AND-CLAIMS.md](./FACTS-AND-CLAIMS.md).

Then read the files that match the task:

| Task                                                           | Also read                                                |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| Copy, campaign, metadata, support language                     | [VOICE-AND-COPY.md](./VOICE-AND-COPY.md)                 |
| Layout, component, interaction, photography, responsive work   | [VISUAL-UX-SYSTEM.md](./VISUAL-UX-SYSTEM.md)             |
| Product page or product/category story                         | [PRODUCT-STORY-CONTRACT.md](./PRODUCT-STORY-CONTRACT.md) |
| New research, comparison, historical claim, or source decision | [RESEARCH-SOURCES.md](./RESEARCH-SOURCES.md)             |
| Any customer-facing implementation or review                   | [AGENT-CHECKLIST.md](./AGENT-CHECKLIST.md)               |
| Updating this system                                           | [CHANGE-CONTROL.md](./CHANGE-CONTROL.md)                 |

## Authority order

When sources disagree, use this order:

1. Shawn's latest explicit written decision.
2. A locked entry in [FACTS-AND-CLAIMS.md](./FACTS-AND-CLAIMS.md).
3. Canonical implemented wording in `apps/web/src/lib/tiger-story.ts`.
4. This brand operating system.
5. The current live custom storefront.
6. The legacy storefront, catalog imports, archived copy, or competitor examples.

The legacy site is a research lead, not automatic truth. Competitor copy is context, never a Tiger source. Live catalog data owns price and availability.

If a conflict could change a product fact, compatibility statement, warranty, shipping promise, price, availability, origin claim, or operational promise, do not pick a convenient answer. Mark it **Pending owner confirmation** and ask Shawn.

## The non-negotiables

- The registered brand and house spelling is **Tiger PingPong**. **PingPong** is one word even when used as a common noun. Do not silently normalize it to “ping pong” in new public copy.
- Tiger is Vancouver-born, West Coast in outlook, Canadian in reach, and established—not newly arriving in the rest of Canada.
- The internal north star is **Serious about the gear. Easygoing about the game.**
- The customer promise is **Good gear. Real help. No runaround.**
- Explain the reason a product exists before reciting engineering. Keep verified specifications available, but do not make the brand sound like a technical datasheet.
- Tell the story in useful doses. Customers came to shop. Do not force an About-page speech into every page.
- Use real cleared photography and exact product imagery. Do not invent, redraw, or cosmetically alter product construction, branding, colours, proportions, or included items.
- Preserve the established glassy West Coast system. A new route is a new chapter of the same site, not permission to invent a new design language.
- Never invent product claims, specifications, compatibility, warranties, prices, availability, shipping promises, event dates, business history, or customer-service commitments.

## Canonical implementation sources

- Brand and page story content: `apps/web/src/lib/tiger-story.ts`
- Product-specific fact and story briefs: `docs/brand/product-briefs/`
- Story placement and dosage: `docs/planning/tiger-storytelling-content-map-v1.md`
- Global visual tokens and navigation: `apps/web/src/app/globals.css`
- Homepage system: `apps/web/src/app/page.module.css`
- Full narrative system: `apps/web/src/app/about/page.module.css`
- Human-support system: `apps/web/src/app/contact/page.module.css`
- Table shopping system: `apps/web/src/app/tables/page.module.css`
- Table category system: `apps/web/src/app/tables/table-category.module.css`
- Gear shopping system: `apps/web/src/app/_gear/gear-category.module.css`

Reuse and extract from these sources before introducing a parallel component or a near-match token.

## A living contract, not a suggestion box

Only Shawn can lock a new brand fact, product story, origin story, or operational promise. Contributors may propose revisions and may mark copy provisional, but must not quietly promote an inference into fact.

The version 2.0 origin refinement is now locked: the green skinny-leg table came before Expo; the orange-legged table was the first Expo iteration. Do not combine them into one table or one event chapter.
