# Tiger Visual and UX System

Version: 1.0
Effective: 2026-07-18

## Visual north star: the West Coast rally

Tiger should feel modern, glassy, bright, and calm—an editorial West Coast shopping experience with real people and serious products underneath it.

The desired tension is:

- **Bold enough to feel alive.**
- **Calm enough to feel considered.**
- **Glassy enough to feel modern.**
- **Real enough to feel local.**
- **Playful enough to feel like PingPong.**

“Apple-ish” means clarity, hierarchy, restraint, product focus, and confident space. It does not mean copying Apple components, monochrome minimalism, or removing Tiger's colour and humour.

## Canonical palette

Global code tokens in `apps/web/src/app/globals.css` are authoritative:

| Token                 | Value                             | Role                           |
| --------------------- | --------------------------------- | ------------------------------ |
| `--tiger-orange`      | `#f28a2e`                         | Primary Tiger accent           |
| `--tiger-orange-deep` | `#e86f18`                         | CTA depth, emphasis            |
| `--tiger-blue`        | `#74c8f2`                         | Pool and sky accent            |
| `--tiger-teal`        | `#51d2bf`                         | Secondary water/outdoor accent |
| `--tiger-ink`         | `#171b2e`                         | Primary type and dark anchor   |
| `--tiger-muted`       | `#5d6678`                         | Supporting copy                |
| `--tiger-line`        | `rgba(255, 255, 255, 0.72)`       | Glass edge                     |
| `--tiger-panel`       | `rgba(255, 255, 255, 0.74)`       | Glass surface                  |
| `--tiger-shadow`      | `0 22px 70px rgb(27 36 65 / 14%)` | Soft lifted depth              |

Established supporting navies include `#102947`, `#122c49`, `#15283c`, and `#1c3145`. Use them as Pacific depth, not as a second brand palette.

The page ground is a misted warm-to-cool field, currently based on `#fffaf5`, `#f3f8ff`, and `#edf9fc`.

### Colour behaviour

- Orange is an accent, CTA, interlude, or warm edge. It should not shout across every section.
- Use translucent peach-orange and amber glass before defaulting to a flat saturated orange wall.
- Pool blue is strongest around Aqua, summer, water, and airy decision surfaces.
- Pacific navy holds education, manufacturing, serious proof, and high-contrast story chapters.
- White is rarely dead white. Use glass, mist, depth, and a faint warm/cool cast.
- Avoid introducing bright red or unrelated yellow blocks. They fought the established calm in early homepage concepts.

## Typography

The implemented family is `Inter` with system fallbacks. Do not add or replace the font without an explicit design-system task.

The Tiger type character comes from scale and weight:

- Oversized, tightly tracked headlines.
- Heavy weight with clean geometry.
- Short line lengths and deliberate wraps.
- Strong contrast between editorial headline and useful supporting copy.
- Small uppercase eyebrows with a dot or restrained orange cue.

Do not use novelty fonts, italic sports type, tournament-style condensed faces, script, or retro Canadian display type as a shortcut to personality.

## Vancouver visual vocabulary

Use recognizable visual relationships rather than souvenir graphics:

- Pacific and pool water, rain, wet pavement, mountain air, patio foliage, glass, and reflected blue.
- Canada Place's white sails as a possible visual rhyme with the Tiger claw marks.
- North Shore mountains, Vancouver rooftops, False Creek, campuses, community spaces, and working patios when the photo is real and cleared.
- Aqua's deep blue, water shimmer, and the scratches/sails relationship as an approved creative direction.

These are composition cues, not automatic origin claims. Do not say the Tiger logo, Aqua name, or product colour was historically inspired by Canada Place unless Shawn separately locks that fact. A personal object, including Shawn's same-coloured bike, can inform the feeling but should not become public backstory without approval.

## Glass, depth, and shape

Tiger glass is warm, layered, and useful:

- A translucent white surface.
- A soft warm-to-cool gradient.
- A thin light border.
- A restrained inner highlight.
- Blur and saturation where browser support allows it.
- A soft navy shadow rather than a hard black drop shadow.

The sticky public navigation is the clearest reference: pill shape, nested warm/cool light, crisp logo, and orange cart action.

Use large radii intentionally:

- Heroes and major chapters: roughly `32px`–`42px` desktop.
- Product and education stages: roughly `24px`–`32px`.
- Compact panels: roughly `20px`–`26px`.
- Buttons and segmented controls: pill radii.

Do not round every small item merely to look friendly. Repeated floating pills can turn an editorial page into a settings screen.

## Page rhythm

Tiger pages are chapters of one continuous rally, not stacks of generic cards.

Preferred building blocks:

- A cinematic real-photo hero.
- A low-profile glass shopping or decision shelf.
- Large alternating product stages for a limited catalog.
- A full-colour education interlude.
- Sticky copy with scrolling proof images on desktop when the story merits it.
- Offset real-photo fields.
- Oversized typographic bands.
- A small orange ball or broken rally line used sparingly as connective tissue.

Avoid:

- Identical three-card feature grids as the default answer.
- A corporate timeline with dates, icons, and mission statements.
- Dense filter interfaces for a five-product catalog.
- Multiple competing sticky elements.
- Decorative patterns that distract from product or people.
- A separate manifesto and support grid at the bottom of every page.

## Heroes

A Tiger hero should answer three questions quickly:

1. Where am I?
2. Why does this matter to me?
3. What can I do next?

Rules:

- Use a real cleared product or lifestyle photograph when one exists.
- Keep the current product legible and dominant.
- Use gradients for copy contrast rather than destructive photo editing.
- A brand hero may be cinematic; a gear-category hero should be shorter and quicker.
- A mobile hero puts copy and essential action before supporting imagery unless the image itself is the essential first impression.
- Do not repeat one hero across unrelated pages merely for convenience. Repetition is acceptable when deliberately giving search landings the strongest product-first introduction, as on `/tables` and `/tables/outdoor-tables/`.
- Do not lead the About page with the bad first table. Current Tiger and Vancouver come first; the origin reveal belongs below the fold.

## Product stages

Tiger has a limited catalog, so products deserve space.

- Use large editorial stages rather than small ecommerce tiles when the page is telling the category story.
- Alternate image and copy on desktop to create pace.
- Keep exact product imagery sharp and complete.
- Pair descriptor, live price, a one- or two-sentence reason to exist, and one direct product action.
- Keep verified specs and options on the product page rather than turning category stages into data tables.
- Use compact cards only for paired products or secondary repeated catalog items, such as the two ball colours on Accessories.

## Photography contract

### What Tiger photography should feel like

- Observed, not staged like a tournament advertisement.
- Real people, imperfect rallies, recognizable places, and a little weather.
- Vancouver and Canada as lived context, not stock scenery.
- The product in actual use: patio, school, community centre, rec room, campus, festival, garage, or shared space.
- Warm enough to feel social; clean enough that the product remains credible.

### Product fidelity

- Never use generative editing to alter product construction, logo, proportions, colour, materials, included accessories, or table model.
- Exact product cutouts may be layered over a separately created lifestyle background only when the composite is clearly faithful and reviewed.
- Do not use a generated full-page mock as production media.
- Preserve visible historical watermarks or attribution rather than cropping them away.
- Do not upscale a small source into a large blurry hero. Size the role to the source.
- Match frame shape to source shape. Square product photography, such as the Net & Post Set, should retain a square contained frame instead of being forced into a wide crop.
- Use `object-fit`, `object-position`, and responsive art direction deliberately for each source.

### Image hierarchy

1. Current real lifestyle photo with the correct Tiger product.
2. Current exact product photograph or cutout.
3. Cleared historical/event proof.
4. Verified fallback media.
5. A clearly labelled pending-media state.

Do not replace missing evidence with an invented scene that implies a real Tiger event, customer, installation, or partnership.

## Interaction and motion

Tiger motion is quietly alive:

- Small progressive image and text entrances.
- Gentle button lift.
- One or two sticky transitions on a long narrative page.
- No heavy parallax, scroll hijacking, constant floating objects, or hover-only information.
- Every motion-enhanced page must provide a complete static experience under `prefers-reduced-motion: reduce`.

Interaction must feel responsive, not playful at the expense of control.

## Responsive contract

Desktop and mobile are two deliberate compositions, not the same collage squeezed narrower.

Below `900px`:

- Remove sticky story positioning unless it remains unquestionably clear.
- Stack copy, action, and media in a purposeful order.
- Use full-width product stages.
- Eliminate horizontal scrolling.
- Do not compress desktop collages into unreadable mosaics.
- Hide desktop-only decision shelves when the same actions already appear in a compact category switch and the products follow immediately.

At `390px`–`417px`:

- Keep the header legible and clear of sticky shipping messages.
- A category switch should fit as a stable grid or segmented control; do not require a horizontal swipe for primary routes.
- Keep centred mobile links centred when they are independent decisions.
- Aim for one product stage—including image, name, live price, story, and CTA—to fit within an `844px` mobile viewport when content permits.
- Tighten padding before shrinking important type into illegibility.
- Check long words and headings for clipping.

Required QA widths for customer-facing work are `390`, `417`, `768`, `1280`, and `1440` pixels unless a task specifies more.

## Accessibility contract

- One `h1` per route and logical heading order.
- Real links for navigation and real buttons for actions.
- Visible keyboard focus on every interactive control.
- Descriptive image alternatives; use empty alternatives only for truly decorative media.
- No essential meaning in colour, hover, animation, or visual position alone.
- Sufficient overlay contrast across responsive crops.
- Lazy-load below-fold media and protect layout stability.
- Decorative rally lines and balls must be `aria-hidden`.
- Reduced-motion mode must be fully usable and static.

## Canonical implementation references

Before creating a new visual pattern, inspect:

- Global tokens and glass navigation: `apps/web/src/app/globals.css`
- Homepage product-first composition: `apps/web/src/app/page.module.css`
- About narrative chapters: `apps/web/src/app/about/page.module.css`
- Contact editorial support flow: `apps/web/src/app/contact/page.module.css`
- Table decision and product stages: `apps/web/src/app/tables/page.module.css`
- Indoor/outdoor category chapters: `apps/web/src/app/tables/table-category.module.css`
- Short gear category chapters: `apps/web/src/app/_gear/gear-category.module.css`

The first implementation step is reuse, extraction, or adaptation. Do not build a near-identical parallel system because a route lives in a different folder.

## Visual QA checklist

- [ ] The page unmistakably belongs to the same Tiger site.
- [ ] Product or customer task is clearer than the brand decoration.
- [ ] Orange is controlled and glassy, not a wall of noise.
- [ ] Real photography carries the story where evidence exists.
- [ ] Product imagery is exact and not cosmetically invented.
- [ ] Source shape and resolution match the assigned frame.
- [ ] There is one dominant personality moment per viewport.
- [ ] Desktop has intentional rhythm; mobile has intentional order.
- [ ] No horizontal overflow at required widths.
- [ ] Header, shipping reminders, and sticky elements never mask content.
- [ ] Focus, contrast, alternatives, heading order, lazy loading, and reduced motion have been checked.
- [ ] Viewport and full-page screenshots have been compared with the approved reference or adjacent canonical page.
