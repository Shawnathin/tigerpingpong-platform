# Tiger Facts and Claims Register

Version: 1.0
Effective: 2026-07-18
Owner: Shawn Cleve

This file governs what Tiger may state as fact. It is intentionally stricter than the voice guide.

## Status key

| Status                 | Meaning                                                   | Public use                                                                                |
| ---------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Locked — owner**     | Shawn explicitly approved the fact or positioning         | Yes, within the stated scope                                                              |
| **Verified — primary** | Confirmed by a first-party or authoritative public source | Yes, cite when context requires                                                           |
| **Live catalog**       | Owned by current API/database content                     | Read at render or transaction time; never hardcode                                        |
| **Provisional**        | Useful draft story based on incomplete product discovery  | May remain where already approved for preview; do not strengthen or spread without review |
| **Revalidate**         | Approved but operationally or temporally changeable       | Confirm before launch-critical or durable use                                             |
| **Pending owner**      | Plausible or discussed, but not locked                    | Do not publish as fact                                                                    |
| **Prohibited**         | Incorrect, misleading, rejected, or unsupported           | Never publish                                                                             |

## Source precedence

1. Shawn's latest explicit written decision.
2. Locked rows in this register.
3. Live catalog for price and availability.
4. Current product record, manual, packaging, or verified manufacturer document.
5. Canonical typed copy in `apps/web/src/lib/tiger-story.ts`.
6. Legacy Tiger site as a research lead.

Competitor sites are never evidence for Tiger product claims.

## Brand identity and operations

| Claim                                                                                 | Status             | Scope and evidence                                                                                                                                      |
| ------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The registered brand spelling is **Tiger PingPong**.                                  | **Locked — owner** | Use in all new brand references.                                                                                                                        |
| **PingPong** is one word even as a common noun.                                       | **Locked — owner** | Applies to headings, body, metadata, alternatives, and editorial labels. Preserve technical URLs and exact third-party text where necessary.            |
| Vancouver is Tiger's home court and the team is based in Vancouver.                   | **Locked — owner** | Core brand identity.                                                                                                                                    |
| Tiger has been helping people play and shipping across Canada for more than 15 years. | **Locked — owner** | Do not describe national reach as new. Do not derive an exact founding year until confirmed.                                                            |
| Tiger is a Canadian PingPong company.                                                 | **Locked — owner** | Safe identity statement.                                                                                                                                |
| “Canada's PingPong company” is approved positioning.                                  | **Locked — owner** | Treat as a brand line, not proof of market share, size, or category leadership.                                                                         |
| All current employees live in Vancouver.                                              | **Revalidate**     | Owner-supplied operational fact. Confirm before every new durable use because staffing can change. Prefer “real help from Vancouver” in evergreen copy. |
| Customers can call or email a real Tiger person in Vancouver who knows the gear.      | **Revalidate**     | Approved service promise. Do not add support hours, guaranteed response time, or guaranteed resolution.                                                 |
| Phone: `1-888-552-5259`.                                                              | **Revalidate**     | Current approved customer contact.                                                                                                                      |
| Email: `info@tigerpingpong.com`.                                                      | **Revalidate**     | Current approved customer contact.                                                                                                                      |
| Tiger is owned by Home Billiards.                                                     | **Locked — owner** | Corporate fact. Keep Home Billiards out of the primary Tiger narrative unless a task needs ownership disclosure or cross-brand context.                 |

## History and community proof

| Claim                                                                                                                                                                            | Status             | Scope and evidence                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Tiger's first table had skinny legs, questionable construction, and was not good enough.                                                                                         | **Locked — owner** | Tiger owns the choice. Tell it with affection and honesty.                                                                           |
| The first table was taken to Chinatown nights, rainy street festivals, driveways, and packed rooms.                                                                              | **Locked — owner** | Supported by the owner's archive and approved About story.                                                                           |
| Tiger has hosted or supplied play at Food Cart Fest, Science World, the Shipyards, Vancouver and Whistler events, schools, universities, community spaces, and corporate events. | **Locked — owner** | Use specific names with cleared real photography where possible. Avoid implying formal sponsorship or exclusivity unless documented. |
| Tiger gear has appeared at UBC, on a Royal Caribbean ship, at Stampede Park, and during cross-Canada travel.                                                                     | **Locked — owner** | Owner-supplied and represented in cleared archive selections. Do not invent dates, contracts, or scope.                              |
| Tiger is in every university, every school, every city, or every park in BC.                                                                                                     | **Prohibited**     | The owner's discovery language expressed scale and pride, not a verified universal inventory. Convert it into specific proof.        |
| Tiger “won BC” or owns the province/territory.                                                                                                                                   | **Prohibited**     | Cocky and unsupported.                                                                                                               |
| The first table was bad because of its country of origin.                                                                                                                        | **Prohibited**     | Country stays unstated. Tiger owns the product decision.                                                                             |
| Formal founding date and dated corporate timeline.                                                                                                                               | **Pending owner**  | Use “more than 15 years” until exact history is documented.                                                                          |

## Manufacturing and product-development claims

| Claim                                                                             | Status             | Scope and evidence                                                                                        |
| --------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| Every current Tiger table is made in Germany.                                     | **Locked — owner** | “Current” is important. Revalidate when catalog or suppliers change.                                      |
| Tiger designs and owns custom moulds for its injection-moulded gear.              | **Locked — owner** | Specialist manufacturing partners operate production. Do not imply Tiger owns the factories.              |
| Tiger searched the globe for better manufacturing partners after the early table. | **Locked — owner** | Approved narrative. Avoid unsupported claims about how many factories, countries, or years were involved. |
| All Tiger products are made in Canada.                                            | **Prohibited**     | Incorrect. Tiger is Canadian; manufacturing origin varies.                                                |
| Tiger directly manufactures every product.                                        | **Prohibited**     | Tiger works with specialist partners.                                                                     |

## Product-name origins

| Claim                                                                                            | Status                                 | Scope and evidence                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expo is named for Expo 86 in Vancouver.                                                          | **Locked — owner**                     | Core name story.                                                                                                                                                                 |
| Expo refers to “Expo 68.”                                                                        | **Prohibited**                         | Incorrect owner slip, explicitly corrected to Expo 86.                                                                                                                           |
| Expo 86's official theme was “Transportation and Communication: World in Motion—World in Touch.” | **Verified — primary**                 | [Museum of Vancouver collection record](https://openmovportal.ca/argus/final/ViewRecord.aspx?record=56b52774-76ff-47c0-ad90-13cf9b703b10&template=Object). Keep quotation exact. |
| Whistler is named for the West Coast place and landscape that forms part of Tiger's identity.    | **Locked — owner**                     | Do not invent a more complicated origin.                                                                                                                                         |
| Portland reflects rainy patios, independent spirit, and brewery culture.                         | **Locked — owner**                     | Contextual product-name story. Do not let brewery become the default example on every customer page.                                                                             |
| Aqua's deep blue, water shimmer, Tiger scratches, and Canada Place sails are a visual direction. | **Locked — owner, creative direction** | This approves an art direction, not a historical logo, name, or colour-origin claim.                                                                                             |
| Aqua was named because Tiger preferred the French word.                                          | **Pending owner**                      | Discussed as a playful possibility, not locked history. Do not publish until confirmed.                                                                                          |
| Shawn's same-coloured bike is part of Aqua's public origin story.                                | **Pending owner**                      | Personal inspiration was discussed, but not approved as customer-facing backstory.                                                                                               |
| Any other product name has a geographic or personal origin.                                      | **Pending owner**                      | Research with Shawn before writing.                                                                                                                                              |

## Outdoor and indoor education

| Claim                                                                                                                                                        | Status             | Scope and evidence                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------- |
| Tiger is outdoor-minded because the people behind it are outdoor people from the West Coast.                                                                 | **Locked — owner** | Brand rationale.                                                                                          |
| Outdoor equipment can make sense indoors where moisture, changing conditions, kids, parties, hard use, spilled drinks, or shared rooms are part of the plan. | **Locked — owner** | Category education, not a universal product guarantee. Pair with product-specific compatibility and care. |
| An outdoor table always lasts longer than an indoor table in every setting.                                                                                  | **Prohibited**     | Overbroad and unsupported.                                                                                |
| An outdoor table is impossible to damage, waterproof under all storage conditions, or a one-time lifetime purchase.                                          | **Prohibited**     | Requires product-specific evidence and limits.                                                            |
| Indoor tables belong in dry, controlled rooms and prioritize playing feel.                                                                                   | **Locked — owner** | General category guidance. Product-specific limits still govern.                                          |

## Commerce and shipping

| Claim                                                                             | Status                                     | Scope and evidence                                                                                                                                                                                         |
| --------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tiger ships to Canada only in V1.                                                 | **Locked — owner / commerce**              | Canonical rule in `AGENTS.md`.                                                                                                                                                                             |
| Orders over `$100 CAD` ship free across Canada.                                   | **Locked — owner / commerce**              | Exact threshold.                                                                                                                                                                                           |
| Orders at `$100 CAD` or under receive `$15 CAD` flat-rate shipping.               | **Locked — owner / commerce**              | Exactly `$100.00 CAD` is not free.                                                                                                                                                                         |
| “Over $100? Shipping's on us. At $100 or under, it's $15 across Canada.”          | **Locked — owner**                         | Approved gear-category expression of the exact rule.                                                                                                                                                       |
| Every table ships free across Canada.                                             | **Revalidate before custom-domain launch** | Owner-approved storefront message used on the table pages, with the byline “Yes, even to cottage country.” It is a product-specific shipping promise and must be confirmed against checkout before launch. |
| Any delivery date, transit time, freight service level, or remote-area exception. | **Pending owner / operations**             | Do not invent. Confirm from the current shipping implementation and operator.                                                                                                                              |
| Product price, compare-at price, currency, and availability.                      | **Live catalog**                           | Never freeze in brand copy. Backend remains transaction truth.                                                                                                                                             |

## Current product-story claims

These entries govern category-level storytelling. They do not replace product specifications.

| Product or category | Claim                                                                                                                    | Status                                        | Notes                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Expo Outdoor        | **Easygoing outdoor.** Made for backyards that want more playing and less overthinking.                                  | **Locked — owner**                            | Current approved category story.                                                                                                            |
| Portland Indoor     | **Home-court feel.** For basements, rec rooms, and community centres that see plenty of rallies and little rain.         | **Locked — owner**                            | Current approved category story.                                                                                                            |
| Portland Outdoor    | **Tough outside. Smart inside.** For patios, garages, and busy rooms where real life happens.                            | **Locked — owner**                            | Do not convert “tough” into an unqualified damage or weather guarantee.                                                                     |
| Whistler Indoor     | **For the serious rallies.** For players who notice the bounce without extra attitude.                                   | **Locked — owner**                            | Editorial positioning, not a formal performance rating.                                                                                     |
| Plaza Outdoor       | **Made for shared spaces.** For parks, campuses, and community centres.                                                  | **Locked — owner**                            | Avoid vandalism, safety, or certification claims until verified.                                                                            |
| Aqua Paddle         | Weather-resistant, ultra-durable, and ready for patios, schools, rec rooms, and forgotten paddles.                       | **Locked — owner for current editorial copy** | Material, dimensions, outdoor-storage limits, performance ratings, warranty, care, and included ball remain unconfirmed. Do not strengthen. |
| Aqua category price | **Starting at** the live base price.                                                                                     | **Locked — owner**                            | Required because package options change the price. Value comes from live catalog.                                                           |
| Vice Paddle         | Smaller handle, approachable for younger or newer players.                                                               | **Provisional**                               | Confirm dimensions, intended ages, control/performance, package contents, and final reason-to-exist before the product-page pass.           |
| Six-pack balls      | Drawer/garage top-up story.                                                                                              | **Provisional**                               | Do not infer star rating, material, diameter, performance, or certification from legacy names alone.                                        |
| 140-pack balls      | High-volume choice for busy rooms, schools, and community centres.                                                       | **Provisional**                               | Confirm exact product specifications before the product-page pass.                                                                          |
| Tiger Table Cover   | Durable Oxford outdoor fabric, snug fit, and corded slide-buckle strap.                                                  | **Locked — sourced product copy**             | Designed for Tiger tables and most standard tables; not compatible with Plaza Outdoor. Recheck source record if product changes.            |
| Net & Post Set      | Turns a suitable tabletop into rally territory or upgrades another table's net.                                          | **Locked — owner correction**                 | It is **not** a replacement net for Tiger tables. Tiger replacement nets belong in Replacement Parts when available; do not promise stock.  |
| Replacement Parts   | Tiger will help identify the odd little part from product name, photos, description, and order reference when available. | **Locked — owner**                            | Service path only. No public part catalog, inventory, price, or availability promise.                                                       |

## Facts still required before deeper product publication

### Aqua

- Material composition.
- Weight and dimensions.
- Outdoor storage and exposure limits.
- Verified speed, spin, control, or performance evidence.
- Warranty.
- Care guidance.
- Included ball specification and package contents.

### Portland Outdoor

- Current model generation and active SKUs.
- Current colour and channel presentation.
- Storage capacity.
- Wheel-lock specification.
- Assembly requirement.
- Delivery method.
- Outdoor exposure and cover guidance.
- Spill and cleaning guidance.
- Correct current-model image for each active variant.

### Every remaining product

- Why Tiger made it, in Shawn's words.
- Primary customer and use context.
- Verified product record, manual, or packaging evidence.
- Compatibility, care, warranty, and included-item limits.
- Correct current imagery.

## Claims Tiger must not improvise

Do not publish a new statement about any of the following without a named source and status update:

- Best, first, largest, leading, number one, most durable, tournament grade, professional grade, or lifetime.
- Warranty length or coverage.
- Waterproofing, weatherproofing, UV resistance, corrosion resistance, or storage limits.
- Material, construction, dimensions, weight, bounce, speed, spin, control, safety, or certification.
- Country of origin beyond the locked current-table statement.
- Customer, school, university, event, cruise line, or city partnership terms.
- Inventory, replacement-part availability, response time, delivery date, or service hours.
- Reviews, endorsements, market share, awards, or comparative superiority.

Personality makes a verified truth easier to remember. It never fills a missing field.
