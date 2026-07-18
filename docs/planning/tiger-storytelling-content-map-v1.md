# Tiger PingPong Storytelling Content Map V1

Date: 2026-07-18
Status: About, Contact, Summer in Canada homepage, all three table category experiences, and six gear category experiences implemented; product, cart, and footer excerpts remain planning only

## Purpose

Give customers the Tiger story during a normal shopping visit without making them read the About page or sit through a brand manifesto.

Brand governance now lives in `docs/brand/README.md` and the files it routes. This map governs where canonical story appears; the brand folder governs identity, voice, visuals, facts, product-story creation, and change control. If they conflict, use the authority order in `docs/brand/README.md`.

The story should feel ambient:

- Homepage: Why Tiger?
- Category page: Why this kind of gear?
- Product page: Why did we make this?
- Cart and checkout: Reassurance, not storytelling
- Footer: One-line signature
- About page: The full story and photographic proof

Internal north star:

> Serious about the gear. Easygoing about the game.

Customer promise:

> Good gear. Real help. No runaround.

## Story dosage

| Surface                       | Story allowance | Purpose                                      |
| ----------------------------- | --------------: | -------------------------------------------- |
| Homepage hero                 |     25–35 words | Establish Vancouver roots and national reach |
| Homepage product support line |      5–20 words | Give each product a human reason             |
| Homepage community proof      |     30–45 words | Prove Vancouver roots with real photography  |
| Category hero introduction    |     18–28 words | Set the shopping context                     |
| Category education band       |     35–55 words | Help customers make a better choice          |
| Product Why We Made It band   |     55–75 words | Explain the product's reason to exist        |
| Product secondary story       |     35–55 words | Introduce a useful, less-obvious use case    |
| Footer signature              |     12–18 words | Leave every visitor with the Tiger identity  |

One strong personality moment per viewport is enough. Do not place a joke in every block.

---

## Homepage

### Implemented order

1. Existing navigation
2. Real Vancouver hero
3. Glass “Shop Your Summer” shelf
4. Aqua “Summer in Canada” campaign
5. Portland Outdoor
6. Vancouver community proof
7. Tiger Table Cover
8. Existing footer

The final order is deliberately product-first. Aqua and Portland establish the summer shopping story; the Vancouver chapter then proves why Tiger builds practical outdoor-minded gear. The rejected support/reach cards do not appear.

### Hero

- Eyebrow: **Our home court**
- Heading: **Raised on the West Coast.**
- Body: “Vancouver is our home court. For more than 15 years, we’ve been helping people play—and shipping Tiger gear across Canada.”
- Actions: **Find Your Table** and **Call 1-888-552-5259**
- Media: exact owner-cleared `MAY-011` Expo photograph

The hero has no About or “Our Story” action. Tiger offers help without pushing the visitor into a brand narrative.

### Shop Your Summer shelf

- **Tables** — “Find the right table”
- **Aqua Paddles** — “Made for summer”
- **Outdoor Gear** — “Ready for real life”

This is a low-profile frosted shelf, not a second hero.

### Aqua seasonal campaign

- Eyebrow: **Summer in Canada**
- Heading: **Make a Splash.**
- Body: “Poolside rallies, backyard BBQs, and the paddle someone forgot outside. Aqua was made for summer in Canada.”
- CTA: **Meet Aqua**

The `summer-canada` wording is selected manually from the typed campaign map. The retained `evergreen` variant reads: “Made for rain, rec rooms, and forgotten paddles.”

### Portland Outdoor

- Eyebrow: **Portland Outdoor**
- Heading: **Take it Outside.**
- Body: “Made for patios, garages, and real life.”
- CTA: **Meet Portland**

The exact Portland table remains sharp and dominant over a softly defocused Canadian summer patio. The lifestyle setting adds reality without competing with the product.

### Vancouver community proof

- Eyebrow: **Vancouver born**
- Heading: **The city was our product test.**
- Body: “Food Cart Fest. Science World. The Shipyards. Schools, universities, and community centres. Real rallies have shaped the gear we make.”
- Pull line: **We build gear that works where people actually play.**
- CTA: **See where we’ve played** → `/about#vancouver`

Real event photography does the proof. Do not add event logos, dates, or a long résumé.

### Tiger Table Cover

- Eyebrow: **Tiger Table Cover**
- Heading: **Ultra Protection.**
- Body: “Ready for whatever just blew in.”
- CTA: **Cover It Up**

The page proceeds directly to the existing footer.

---

## Category pages

### All tables

Status: implemented on `codex/tables-find-your-table`.

Eyebrow:

> Shop tables

Heading:

> Find your table.

Hero introduction:

> Indoors, outdoors, basement, backyard—we’ll help you find the table that fits how you actually play.

Hero media: owner-cleared Portland Outdoor table on a real shaded garden patio.

Hero action:

> Need a hand? Call us.

Destination: `tel:+18885525259`

#### Where will it live?

- **Indoor** — “Best playing feel in a dry, controlled room.” → `/tables/indoor-tables/`
- **Outdoor** — “Built for weather, hard use, and indoors when durability wins.” → `/tables/outdoor-tables/`
- **Compare indoor and outdoor** → `/resources/indoor-vs-outdoor-ping-pong-tables`
- Use real Whistler Indoor and Portland Outdoor lifestyle photography in the two choices.

The chooser hands off to a small sticky glass tab that visually belongs to the main navigation:

- **Every table ships free across Canada.**
- Byline on desktop and mobile: **Yes, even to cottage country.**

#### Product stages

1. **Expo Outdoor** — “Easygoing outdoor.”
   - “We made Expo for backyards that want more playing and less overthinking. It’s the easy yes when you want a real outdoor table and a good time.”
2. **Portland Indoor** — “Home-court feel.”
   - “We made Portland Indoor for basements, rec rooms, and community centres that see plenty of rallies and very little rain. Serious table, relaxed room.”
3. **Portland Outdoor** — “Tough outside. Smart inside.”
   - “We made Portland Outdoor for patios, garages, and busy game rooms where weather, kids, and spilled drinks all happen. It’s the table you worry about less.”
4. **Whistler Indoor** — “For the serious rallies.”
   - “We made Whistler for players who notice the bounce, even if nobody is keeping score. A little more game, zero extra attitude.”
5. **Plaza Outdoor** — “Made for shared spaces.”
   - “We made Plaza for parks, campuses, and community centres where the table belongs to everyone. The whole neighbourhood is invited.”

Names, prices, availability, and primary product media continue to come from the live catalog.

#### Outdoor-inside education

Placement: after Portland Outdoor and before Whistler Indoor.

Eyebrow:

> Good to know

Heading:

> Outdoor doesn’t mean outdoors only.

Body:

> Outdoor tops are made for moisture, changing conditions, and hard use. If kids, parties, a damp garage, or spilled drinks are part of the plan, that extra resilience can be worth it.

CTA: **Compare indoor and outdoor** → `/resources/indoor-vs-outdoor-ping-pong-tables`

The production image uses a real Tiger-branded ball beside the net on a Pacific-navy table. The logo is part of the ball rather than a floating graphic.

No separate brand band or closing pitch is used. The shopping task remains primary.

### Outdoor tables

Status: implemented on `codex/table-subcategories-tiger-vibe`.

Eyebrow:

> Outdoor tables

Heading:

> Take it outside.

Hero introduction:

> Built for backyards and patios. Smart for garages, basements, schools, community centres, and busy game rooms too.

Hero media: the owner-selected shaded Portland Outdoor garden-patio photograph used on `/tables`. The deliberate repetition gives customers landing directly from search the strongest product-first introduction.

Hero link: **Why outdoor works indoors too.** → `#outdoor-indoors`

The All / Indoor / Outdoor category switch remains in normal flow, with Outdoor active. The sticky shipping tab reads:

- **Every table ships free across Canada.**
- **Yes, even to cottage country.**

#### Product stages

1. **Expo Outdoor** — “Easygoing outdoor.”
2. **Portland Outdoor** — “Tough outside. Smart inside.”
3. **Plaza Outdoor** — “Made for shared spaces.”

Each stage uses the canonical two-sentence Tiger story defined under All tables, plus its live catalog price, availability, media, and product destination.

#### Education band

Placement: after Portland Outdoor and before Plaza Outdoor.

Eyebrow:

> Good to know

Heading:

> Outdoor doesn’t mean outdoors only.

Body:

> Outdoor tops are made for moisture, changing conditions, and hard use. If kids, parties, a damp garage, or spilled drinks are part of the plan, that extra resilience can be worth it.

CTA:

> Compare Indoor and Outdoor

Destination:

> `/resources/indoor-vs-outdoor-ping-pong-tables`

The section uses the real Tiger-branded ball image already approved for `/tables`. The page then proceeds directly through Plaza and into the existing footer.

### Indoor tables

Status: implemented on `codex/table-subcategories-tiger-vibe`.

Eyebrow:

> Indoor tables

Heading:

> Bring the rally home.

Hero introduction:

> Basements, rec rooms, schools, community centres—if the room stays dry, indoor tables put playing feel first.

Helpful comparison link:

> Not sure? Compare indoor and outdoor.

Hero media: real Whistler Indoor table beneath geometric lights in a modern shared lobby.

Caption: **Whistler Indoor. Inside, naturally.**

The All / Indoor / Outdoor category switch remains in normal flow, with Indoor active. The sticky shipping tab uses the same Canada-wide claim and cottage-country byline as `/tables`.

#### Product stages

1. **Portland Indoor** — “Home-court feel.”
2. **Whistler Indoor** — “For the serious rallies.”

Between the two models, the soft Tiger-orange playing-feel interlude reads:

- Eyebrow: **Why indoor?**
- Heading: **Keep it dry. Let it rip.**
- Body: “Indoor tables put playing feel first when the room stays dry. Portland is the easy home-court choice; Whistler is for players who notice the bounce—even when nobody is keeping score.”

Do not frame indoor tables as fragile or inferior. The choice is playing feel versus added environmental resilience.

### Gear categories

Status: implemented on `codex/gear-categories-west-coast-rally`.

The six retained legacy routes now use one shorter, shared Tiger shopping system:

- `/accessories/`
- `/accessories/paddles/`
- `/accessories/ping-pong-balls/`
- `/accessories/covers/`
- `/accessories/nets/`
- `/replacement-parts/`

The shared normal-flow switch links **All gear**, **Paddles**, **Balls**, **Covers**, **Nets**, and **Need a part?** On mobile it becomes one compact two-row segmented control with three equal choices per row. The final choice shortens visually to **Parts** while retaining its full accessible label; there is no horizontal scroller or oversized support banner.

The factual, non-sticky shipping band reads:

- **Over $100? Shipping’s on us.**
- **At $100 or under, it’s $15 across Canada.**

This wording deliberately preserves the exact V1 threshold: an order at exactly $100 still receives the $15 flat rate.

Product stages show the live price without the redundant **Available online** label. Hero media respects the source shape: lifestyle photography keeps the wider crop, while square product photography such as the Net & Post Set stays in a square, contained frame.

#### All Accessories

- Eyebrow: **All the other good stuff**
- Heading: **Everything around the table.**
- Body: “Paddles, balls, covers, nets—and a real person when you need the odd little part.”
- Hero media: real Table Cover and Net & Post Set imagery

The page makes the retained SEO duplication useful by leading with the categories not already exposed in the main navigation:

1. Covers — **Keep it covered.**
2. Nets — **Meet in the middle.**
3. Replacement Parts — **Find the odd little bit.**

This editorial chooser remains on desktop. It is removed below 900 pixels because the compact gear switch already exposes the same three routes and the actual Cover, Net, and Parts sections follow immediately.

The live Cover and Net products and a support-oriented parts panel appear before the second chapter:

- Eyebrow: **Also here for the rally**
- Heading: **Paddles and balls, obviously.**
- Body: “Because an Accessories page without paddles and balls would be a weird little page.”

Aqua, Vice, both six-packs, and the 140-pack all appear here. Aqua is intentionally restored to the broad Accessories order.

#### Paddles

- Eyebrow: **PingPong paddles**
- Heading: **Pick your paddle.**
- Body: “One is built for real-life chaos. One is made for young players finding their feel. Neither comes with a tournament speech.”

The decision shelf asks **Where will it play?**

- **Everywhere** — Aqua for patios, schools, rec rooms, shared spaces, and forgotten paddles.
- **Smaller hands** — Vice for kids and newer players who want approachable control.

The decision shelf is desktop-only. On mobile the compact category switch is followed directly by the Aqua and Vice product stages.

Product stories:

- **Aqua** — “Built for the paddle someone forgot outside.”
  - “Weather-resistant, ultra-durable, and ready for patios, schools, rec rooms, and whoever forgot it outside.”
  - Category price label: **Starting at $25.00**, reflecting Aqua’s package choices.
- **Vice** — “Small hands. Big rallies.”
  - “Vice is an easy first paddle for younger players, with a slimmer handle that is easier to hold. A proper paddle, minus the serious-paddle attitude.”

#### Balls

- Eyebrow: **PingPong balls**
- Heading: **You’re going to lose a few.**
- Body: “Under the couch. Behind the freezer. Somewhere in the yard. Start with six or stop counting at 140.”

The decision shelf asks **How many rematches?** Six is for topping up the drawer; 140 is for schools, community centres, and homes where six disappears by Tuesday. The colour note reads **White or orange? Pick your favourite.**

The decision shelf is desktop-only. On mobile the compact category switch is followed directly by the paired six-packs and the 140-pack.

The Orange and White six-packs share one visual stage but retain separate live prices, anchors, product destinations, and actions. The 140-pack receives its own moment:

- Descriptor: **Commit to the bit.**
- Body: “For busy rooms where rallies happen faster than ball rescues. Fewer emergency searches under the sofa.”

#### Covers

- Eyebrow: **Table covers**
- Heading: **Weather happens.**
- Body: “Rain, dust, leaves, and whatever just blew in sideways. Cover the table and get on with your day.”
- Media: existing amber-orange Table Cover artwork

Product story:

- Descriptor: **Ultra Protection.**
- Body: “Durable Oxford outdoor fabric, a snug fit, and a corded slide-buckle strap help keep the cover where you left it.”

Fit guidance states that the cover is designed for Tiger tables, fits most standard tables, and is not compatible with Plaza Outdoor. Uncertain customers are sent to Tiger before ordering.

#### Nets

- Eyebrow: **Nets and post sets**
- Heading: **Meet in the middle.**
- Body: “A table without a net is just a very specific dining table. Let’s fix that.”
- Media: real Net & Post Set photography

Product story:

- Descriptor: **Set it. Start the rally.**
- Body: “Turn a suitable tabletop into rally territory, or give another table a better net. It’s a little taste of Tiger quality without replacing the whole setup.”

The distinction panel makes clear that this set upgrades other tables or turns a suitable tabletop into a play space; it is not a replacement net for Tiger tables. Customers looking for a Tiger replacement net are sent to Replacement Parts without an inventory promise. No unavailable legacy nets are exposed.

#### Replacement Parts

This is a human service page rather than an empty catalog.

- Eyebrow: **Replacement parts**
- Heading: **Something went missing?**
- Body: “A wheel, a bracket, that one little bit with no obvious name—we’ll help figure it out.”
- Actions: **Call Tiger** and **Email the clues**
- Media: real Tiger net, wheel, and table-detail photography used as examples only

The guidance chapter asks for the product name, a table photo, a photo or description of the missing part, and an order reference when available. It links to `/contact#order-help-title`. There is no part catalog, search field, form, price, or inventory promise.

#### Copy governance

Canonical gear copy is typed with an internal-only status. Aqua and Cover wording is `approved`; Vice, Balls, and Net wording is `provisional` until the deeper product-story pass. The status never appears to customers.

---

## Aqua product page

### Hero purchase panel

Eyebrow:

> Tiger PingPong

Title:

> Aqua

One-line descriptor:

> Weather-resistant paddles for indoor and outdoor play.

Keep price, package choice, availability, shipping, and Add to Cart immediately visible. Do not put the full story above the purchase controls.

### Quick-fact strip

Eyebrow:

> Quick facts

Heading:

> Tough outside. Good anywhere.

Recommended four facts, subject to final product confirmation:

1. Weather resistant — Sun, rain, and snow
2. Textured surface — Consistent rebound
3. Comfort grip — Easy everyday control
4. Pack options — One, two, or four players

### Why We Made It band

Placement: immediately after quick facts.

Eyebrow:

> Why we made it

Heading:

> Because it rains. Duh.

Body:

> Kids leave paddles outside. Schools need gear that can take a beating. Nobody wants to rescue the equipment every time the forecast changes its mind. Aqua is weather-resistant, ultra-durable, and made for patios, parks, rec rooms, and every rally in between.

### Indoor-use story

Eyebrow:

> Good indoors too

Heading:

> Outdoor tough. Indoor welcome.

Body:

> Aqua’s durable build and injection-moulded textured surface make it a smart choice for schools, offices, camps, and shared spaces—anywhere paddles get dropped, passed around, or treated like community property.

### Feature section heading

> All the good parts, close up.

Recommended feature order:

1. Weather resistance
2. Textured playing surface and rebound
3. Comfort grip and control
4. High-use durability
5. Package and colour choices
6. Recyclable packaging

### Aqua FAQ

Publish now:

#### Can I use Aqua indoors?

> Absolutely. Aqua is made for indoor and outdoor recreational play. Its durable construction is especially useful in schools, offices, camps, rec rooms, and other shared spaces.

#### What comes with each package?

> Choose a single Coral Red paddle, a single Ocean Blue paddle, a two-paddle set with three balls, or a four-paddle set with three balls.

Hold until product facts are confirmed:

- Can Aqua stay outside permanently?
- How does Aqua compare with a wood-and-rubber paddle for spin and speed?
- What material is Aqua made from?
- What does Aqua weigh?
- Is Aqua covered by a warranty?
- Are the included balls standard or outdoor-weighted?

### Aqua mobile trims

Why heading:

> Because it rains.

Why body:

> Kids leave paddles outside. Schools need gear that lasts. Aqua is weather-resistant, ultra-durable, and ready for every rally in between.

Indoor heading:

> Tough outside. Smart inside.

---

## Portland Outdoor product page

### Hero purchase panel

Eyebrow:

> Tiger PingPong

Title:

> Portland Outdoor

One-line descriptor:

> A weatherproof 6mm resin table for patios, garages, and busy game rooms.

Keep colour choice, price, availability, free-table-shipping message, and Add to Cart immediately visible.

### Quick-fact strip

Eyebrow:

> Why this table

Heading:

> Why customers choose Portland.

Recommended four facts:

1. Playing surface — 6mm melamine resin
2. Made in — Germany
3. Tabletop warranty — 10 years
4. Table warranty — 3 years

### Why We Made It band

Placement: immediately after quick facts.

Eyebrow:

> Why we made it

Heading:

> Because outside is one of our rooms.

Body:

> We’re West Coasters. If we waited for perfect weather, we’d never get anything done. Portland was made for proper rallies on patios, in garages, and anywhere real life gets a little messy. Its weatherproof 6mm resin top gives you the freedom to play without treating the table like museum furniture.

### Indoor-use story

Placement: after the main feature carousel and before secondary details or comparison.

Eyebrow:

> Good indoors too

Heading:

> Outdoor works indoors.

Body:

> Kids, parties, damp basements, garages, rental properties—an outdoor top is the less-precious choice when your table is going to live an actual life. Portland costs more than the indoor model, but its weatherproof surface and 10-year tabletop warranty make a strong case for long-haul value.

CTA:

> Compare Every Tiger Table

Destination:

> The existing table comparison section on the product page

Optional supporting line, after care guidance is confirmed:

> Game night. Kids. Beer pong. Somebody’s going to spill something. Wipe it up and rally on.

### Feature section heading

Keep:

> All the good parts, close up.

Recommended feature order:

1. 6mm melamine resin surface and outdoor bounce
2. Welded steel frame
3. One-person opening and locking system
4. Fixed adjustable net
5. Wheels, levellers, and movement
6. Paddle and ball storage
7. Playback mode

### Portland FAQ

Publish now:

#### Can Portland Outdoor be used indoors?

> Yes. Its outdoor-ready surface also makes Portland a practical choice for garages, basements, schools, rentals, and high-use game rooms where added resilience matters more than tournament-style indoor bounce.

#### Can one person open and close it?

> Yes. The locking handle system is designed so one person can open, fold, and roll the table into storage.

#### What warranty does it include?

> Portland Outdoor includes a 10-year tabletop warranty and a three-year table warranty. Wearable items such as the net are excluded. Full warranty terms apply.

Hold until the current model is reconciled:

- Is the storefront selling Portland Outdoor V1, Gen 2, or a transition between them?
- Does the current model store four paddles and 18 balls or two paddles and nine balls?
- Do the current wheels lock?
- What assembly is required and how long should customers expect?
- How is the table delivered, and is it curbside?
- Can it remain outside year-round in every Canadian climate?
- Is a cover recommended or required?
- What cleaning guidance applies to food, sugary drinks, and alcohol?
- Which current image belongs to each colour and model generation?

### Portland mobile trims

Why heading:

> Because outside is one of our rooms.

Why body:

> We’re West Coasters. Portland was made for patios, garages, and anywhere real life gets a little messy.

Indoor heading:

> Outdoor works indoors.

Indoor body:

> A smart choice for kids, parties, garages, basements, rentals, and busy game rooms.

---

## Cart and checkout

Keep the existing cart reassurance:

> You’re so close to the next rally!

> One more step and we’ll take it from there.

Do not add the company story to the order summary or Stripe handoff.

Recommended empty-cart copy:

Heading:

> Nothing here yet.

Body:

> Let’s find your next rally.

CTA:

> Keep Shopping

Recommended checkout-error tone:

> We couldn’t get checkout started. Try again, or give us a call and we’ll help sort it out.

Error copy should stay calm and useful. Do not make jokes when money or an order feels uncertain.

---

## Footer

Add this beneath the Tiger logo:

> Born in Vancouver. Shipping rallies across Canada. Good gear, real help, no runaround.

Keep the existing navigation groups. Do not turn the footer into another About section.

---

## About page — implemented canonical story

Route:

> `/about`

Metadata:

- Title: `About Tiger PingPong | Raised on the West Coast`
- Description: `From questionable first tables and Vancouver game nights to German-made gear shipped across Canada: meet Tiger PingPong.`

Canonical source:

- Story wording and chapter structure: `apps/web/src/lib/tiger-story.ts`
- Cleared media provenance and delivery map: `data/media/about-story-image-map-v1.json`
- Dedicated responsive composition: `apps/web/src/app/about/page.module.css`

Implemented sequence:

1. Present-day Expo Outdoor hero — current gear, Vancouver, and the North Shore first.
2. The first serve — the questionable first table and Vancouver rain below the fold.
3. Vancouver shows up — events, people, UBC, and Whistler as real-life product testing.
4. Outdoor-minded interlude — why outdoor gear also earns its place inside.
5. The gear catches up — German-made tables and Tiger-owned custom moulds.
6. The names are a map — Expo, Whistler, and Portland as pieces of home and culture.
7. Pointed east — Pacific roots, Stampede Park, Ontario, and a growing Canadian map.
8. Closing promise — good gear, real Vancouver help, and no runaround.

Stable excerpt anchors:

- `/about#start`
- `/about#vancouver`
- `/about#built-better`
- `/about#names`
- `/about#across-canada`

Future homepage and product-page story excerpts should import or adapt this canonical wording instead of creating a second version of Tiger’s origin story. Those excerpts are explicitly outside the About-page implementation task.

House style: **PingPong is always one word**, including common-noun use. Existing technical route slugs and third-party asset identifiers do not need renaming.

---

## Contact page — implemented canonical support story

The Contact page should feel like reaching Tiger, not entering a support directory. Its canonical source is `tigerStory.contact`.

Implemented sequence:

1. Human-first hero — “Need a hand? We’ve got you.” with the `NIT-034` game-night connection photograph and immediate call/email actions.
2. Reasons to call — four direct routes covering product choice, existing orders, repairs/setup, and Canadian delivery questions.
3. Order help — the order reference, checkout email, product name, and an optional photograph under the stable `#order-help-title` anchor.
4. Closing promise — “Good gear. Real help. No runaround.” with the same working phone and email destinations.

The approved contact identity remains:

- `1-888-552-5259`
- `info@tigerpingpong.com`
- Vancouver, BC · Helping across Canada

Do not add a form, support hours, response-time guarantee, street address, or time-zone joke until those operational details are explicitly approved.

---

## Repetition rules

- “Vancouver born. Outdoor minded.” belongs on the homepage only.
- “Because it rains. Duh.” belongs on Aqua only.
- “Because outside is one of our rooms.” belongs on Portland only.
- “Good gear. Real help. No runaround.” may appear on the homepage, footer, and About page, but no more than once per page.
- “Born in Vancouver. Shipping rallies across Canada.” belongs in the footer and may close the About page.
- Do not place “Canadian company” in every product description. Use the global Why Tiger band and footer, then prove the claim with photographs and service details.
- Do not repeat the same indoor-use paragraph on the category page and product page. Category copy teaches the principle; product copy explains the specific benefit.
- Keep jokes out of technical specifications, warranty terms, shipping promises, return policies, errors involving payment, and order-status messaging.

## Photography assignments

### Homepage

- One recognizable Vancouver game-night image
- One Whistler or outdoor-festival image
- One school, university, community, or corporate event image

### Aqua

- Paddle on a real wet West Coast patio
- Paddle texture close-up
- Paddle in a school, camp, or community setting
- Coral Red and Ocean Blue together
- Two-pack and four-pack contents clearly shown

### Portland

- Current model in a real Vancouver-area outdoor setting
- Current model in a garage, basement, or indoor party setting
- One-person open/fold sequence
- Surface close-up
- Wheels crossing a realistic patio seam or threshold
- Folded table shown with useful scale
- Correct colour-specific images for every active variant

Lifestyle photography should feel observed, not staged like a tournament advertisement. Real people, imperfect rallies, recognizable places, and a little weather are assets.

## Facts required before final publication

### Aqua

- Material composition
- Weight and dimensions
- Outdoor storage limits
- Performance comparison or speed/spin/control evidence
- Warranty
- Care guidance
- Included ball specification

### Portland Outdoor

- Current model generation
- Current SKUs
- Correct price and channel presentation
- Storage capacity
- Wheel-lock specification
- Assembly requirement
- Delivery method
- Outdoor exposure and cover guidance
- Spill and cleaning guidance
- Correct current-model imagery

Do not strengthen claims beyond the verified product record. Personality should make the truth easier to remember, not replace it.
