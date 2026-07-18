# Tiger Customer-Facing Agent Checklist

Version: 1.0
Effective: 2026-07-18

Use this before, during, and after any Tiger copy, design, media, category, product, campaign, or support-page task.

## Before work

- [ ] Read `docs/brand/README.md`.
- [ ] Read `docs/brand/TIGER-BRAND-BIBLE.md`.
- [ ] Read `docs/brand/FACTS-AND-CLAIMS.md`.
- [ ] Read the task-specific voice, visual, or product-story file.
- [ ] Read `docs/agent/current-task.md` and confirm the requested route is in scope.
- [ ] Inspect the current implementation, adjacent canonical page, and `apps/web/src/lib/tiger-story.ts` before proposing a new system.
- [ ] Identify which content is approved, provisional, live-catalog owned, time-sensitive, or pending.
- [ ] Confirm that the branch and worktree are clean and focused. Do not overwrite unrelated user changes.

## Brand framing

- [ ] The work supports **Serious about the gear. Easygoing about the game.**
- [ ] The customer experiences **Good gear. Real help. No runaround.**
- [ ] Vancouver/West Coast identity is proven with a relevant detail, image, or service behaviour—not repeated as empty decoration.
- [ ] Tiger is established across Canada, not described as newly expanding there.
- [ ] The page helps someone shop, choose, use, or get help before it asks them to admire the brand.

## Copy

- [ ] **Tiger PingPong** and **PingPong** use the locked spelling.
- [ ] Canadian English is used in new house copy.
- [ ] The headline makes one clear point.
- [ ] Product-stage story is no more than two sentences.
- [ ] The reason a product exists is distinct from its specifications.
- [ ] The CTA names a real next step without pressure.
- [ ] A joke, if any, is short, situation-based, and never at the customer's expense.
- [ ] Payment, error, shipping, fit, care, safety, warranty, and order-status copy is calm and precise.
- [ ] No rejected challenger cliché, fake urgency, or unsupported superlative appears.

## Facts and commerce

- [ ] Every product claim has an exact source or locked owner status.
- [ ] Prices and availability come from the live catalog.
- [ ] Required options stay required before add-to-cart.
- [ ] Compatibility and included items are explicit where they affect purchase.
- [ ] Shipping wording matches the exact current threshold and checkout behaviour.
- [ ] No warranty, delivery time, inventory, replacement-part, response-time, or origin promise was inferred.
- [ ] Any conflict is marked **Pending owner confirmation** rather than silently resolved.
- [ ] Checkout, payment truth, webhook, order status, auth, API, database, redirects, canonicals, and DNS remain untouched unless explicitly in scope.

## Visual and media

- [ ] The page looks like a chapter of the existing Tiger system.
- [ ] Existing components/tokens were reused or deliberately extracted before a new pattern was added.
- [ ] Real cleared photography and exact product media were preferred.
- [ ] Product construction, logo, shape, colour, and included items were not altered or generated.
- [ ] Source resolution and aspect ratio suit the assigned frame.
- [ ] The product or customer remains the visual focus.
- [ ] Orange is restrained; glass, mist, pool blue, and Pacific navy remain coherent.
- [ ] The layout has one dominant personality moment per viewport.

## Responsive and accessible

- [ ] The desktop composition is intentional.
- [ ] The mobile composition is intentionally reordered, not merely squeezed.
- [ ] No horizontal overflow exists at `390`, `417`, `768`, `1280`, or `1440` pixels.
- [ ] Sticky navigation and shipping messages do not mask content.
- [ ] One `h1`, logical headings, useful alternatives, visible focus, and native controls are present.
- [ ] Below-fold media is lazy-loaded without layout jump.
- [ ] Reduced-motion mode is complete and static.
- [ ] Hover is not required to understand or operate the page.

## Proof and handoff

- [ ] Focused tests cover route content, destinations, live catalog use, metadata, accessibility, and overflow.
- [ ] Adjacent canonical-page regressions are run when shared systems change.
- [ ] Desktop, tablet, and mobile viewport/full-page screenshots are reviewed.
- [ ] Lint, typecheck, relevant tests, and production build are run in proportion to the change.
- [ ] Secret scan and launch preflight are run when required by the selected task.
- [ ] `docs/agent/current-task.md` and the story map are updated when the implementation changes the canonical experience.
- [ ] A new owner decision or claim status is recorded through `docs/brand/CHANGE-CONTROL.md`.
- [ ] The final handoff states what changed, files touched, checks run, checks omitted, assumptions, risks, and follow-up.

## Stop conditions

Stop and ask Shawn when:

- A new fact would materially change a product choice or claim.
- Two sources disagree on compatibility, construction, current model, warranty, shipping, price ownership, or included items.
- The requested design would create a new visual language rather than extend Tiger's.
- A story needs a name origin, date, partnership, testimonial, or event scope that is not locked.
- A product image may be old, wrong, generated, or a different option.
- The request would broaden into payment, data, auth, infrastructure, SEO routing, or deployment without explicit authority.
