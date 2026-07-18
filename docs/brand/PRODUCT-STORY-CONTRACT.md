# Tiger Product Story Contract

Version: 1.0
Effective: 2026-07-18

This contract governs every future product-page and category-story pass. Its job is to answer **Why did Tiger make this?** without inventing a fact or burying the purchase decision.

## The product-story promise

Every Tiger product should be understandable in three layers:

1. **Why it exists.** The human problem, use case, or moment.
2. **Why this one.** Who it suits and what trade-off it makes.
3. **What it is.** Verified specifications, options, compatibility, care, and warranty.

Tiger tells the layers in that order when storytelling. Checkout and safety-critical decisions may surface layer three sooner.

## No product story without a fact sheet

Before writing, create or update this internal brief:

```md
# <Product name> story brief

Status: discovery | provisional | owner-approved
Owner review date:
Live slug:
Active SKUs/options:

## Why Tiger made it

Owner's words:

## Customer and moment

Primary customer:
Primary setting:
Problem or frustration:
Why the next closest Tiger product is different:

## Verified facts

| Fact | Exact source | Last checked | Public wording allowed |
| ---- | ------------ | ------------ | ---------------------- |

## Unknown or conflicting

-

## Media

Current product image:
Real lifestyle image:
Detail image:
Incorrect or old imagery to exclude:

## Draft story

Eyebrow:
Descriptor:
Category story (maximum two sentences):
Why We Made It (55–75 words):
Secondary real-life story (35–55 words):
CTA:

## Owner decision

Approved wording:
Claims rejected:
Follow-up evidence needed:
```

An empty field is a research task, not an invitation to improvise.

## Discovery questions for Shawn

Ask for the decisions that cannot be inferred safely:

1. What annoyed you enough to make or carry this product?
2. Who did you picture using it?
3. Where does it usually live?
4. What happened with the earlier or obvious alternative?
5. What is the honest reason to choose this one over another Tiger product?
6. What is the honest reason **not** to choose it?
7. What customer question do you answer most often?
8. What detail are you proud of that a shopper would otherwise miss?
9. Is the name connected to a real place, person, moment, or joke?
10. Which current photos show the right product and use?

Do not turn discovery into a feature interrogation. Start with the human reason; verify the technical record separately.

## The approved category-stage formula

Each product stage includes:

- Product-mode eyebrow.
- Current catalog name.
- Live price or **Starting at** live price when options change the amount.
- Descriptor of roughly two to six words.
- One or two story sentences. Two is the absolute maximum.
- One direct **Meet…** or equivalent CTA.

Example:

> **Easygoing outdoor.**
>
> We made Expo for backyards that want more playing and less overthinking. It’s the easy yes when you want a real outdoor table and a good time.

The descriptor creates memory. The story makes a choice easier. Neither claims a technical advantage that has not been verified.

## The product-page sequence

Use this as the default shape; remove chapters that lack content rather than filling them with generic copy.

### 1. Purchase panel

- Exact current product name.
- Live price.
- Required options.
- Availability from live catalog.
- Current product image and gallery.
- Add-to-cart action.
- Immediate compatibility or package warning when needed.

Personality stays light here. The customer must understand what will enter the cart.

### 2. Quick facts

Three to five verified decision facts. No generic badges such as “high quality” or “premium.”

### 3. Why We Made It

Fifty-five to seventy-five words. Explain the real customer problem, Tiger's choice, and intended use.

### 4. A less-obvious real-life use

Thirty-five to fifty-five words. Examples include why outdoor works indoors, why a volume pack suits a community centre, or why a smaller handle changes the experience for a younger player.

### 5. Details and proof

Verified specifications, included items, options, construction, compatibility, care, assembly, warranty, and delivery. This section may be less playful because precision matters.

### 6. FAQ

Answer actual purchase questions. Never create a question only to repeat marketing copy.

### 7. Real help

When a decision remains uncertain, provide the working phone or email. Do not replace missing facts with “contact us”; fix the record where possible.

## Separate editorial truth from technical truth

Editorial truth:

> Made for shared spaces.

Technical truth, once verified:

> Exact top material, anchoring method, dimensions, safety standard, warranty, and maintenance requirements.

Both matter. The first creates meaning; the second enables a safe purchase. Do not let either impersonate the other.

## Product differentiation rules

When two products sit close together:

- State the setting, user, or trade-off that changes the decision.
- Do not define the lower-priced product as “the cheap one.”
- Do not define the higher-priced product as “premium” without explaining and sourcing the difference.
- Do not rank a model by tournament status if the customer is choosing for a home, school, or community space.
- Include the honest “choose the other one if…” signal in detailed guidance when it prevents a bad purchase.

## Naming stories

Only use a product-name origin if Shawn has locked it in [FACTS-AND-CLAIMS.md](./FACTS-AND-CLAIMS.md).

Approved map:

- Expo → Expo 86, Vancouver.
- Whistler → West Coast place and identity.
- Portland → rainy patios, independent spirit, brewery culture.

A clever name explanation invented after the fact is still invented.

## Copy statuses in code

Typed story content may use:

- `approved` — owner-approved or fully sourced for the current scope.
- `provisional` — useful draft awaiting deeper product discovery.

The status is internal and never shown to a customer. It must still affect contributor behaviour: provisional copy may be refined or contained, but not spread to metadata, campaigns, packaging, or new routes as though it were locked.

If a product claim is materially uncertain, use a pending state in documentation and do not publish it merely because TypeScript requires a string.

## Media contract for products

- Confirm the image is the current model and correct option.
- Prefer a real current lifestyle image plus exact product imagery.
- Preserve product logos, shape, construction, and colour.
- Do not generate included items, feature callouts, labels, or packaging text.
- Do not crop out a detail that affects the purchase decision.
- Match frame shape to source shape and never upscale a low-resolution source into a hero.
- Record old-model and incorrect-colour exclusions in the product brief.

## Existing category stories

These examples are canonical at version 1.0. Their factual limits remain in [FACTS-AND-CLAIMS.md](./FACTS-AND-CLAIMS.md).

| Product           | Descriptor                                       | Story status                                             |
| ----------------- | ------------------------------------------------ | -------------------------------------------------------- |
| Expo Outdoor      | **Easygoing outdoor.**                           | Approved                                                 |
| Portland Indoor   | **Home-court feel.**                             | Approved                                                 |
| Portland Outdoor  | **Tough outside. Smart inside.**                 | Approved                                                 |
| Whistler Indoor   | **For the serious rallies.**                     | Approved                                                 |
| Plaza Outdoor     | **Made for shared spaces.**                      | Approved                                                 |
| Aqua Paddle       | **Built for the paddle someone forgot outside.** | Approved for current category copy; deeper facts pending |
| Vice Paddle       | **Small hands. Big rallies.**                    | Provisional                                              |
| 140-pack balls    | **Commit to the bit.**                           | Provisional                                              |
| Tiger Table Cover | **Ultra Protection.**                            | Approved                                                 |
| Net & Post Set    | **Set it. Start the rally.**                     | Approved after compatibility correction                  |

## Product-story rejection list

Reject a draft if it:

- Invents a material, measurement, performance rating, certification, warranty, origin, compatibility, or included item.
- Reads like a tournament catalog when the product is for real-life recreational use.
- Calls a product premium, professional, ultra-durable, weatherproof, or lifetime without exact support.
- Uses a price as the entire reason the model exists.
- Gives two Tiger products the same reason to exist.
- Requires more than two sentences on a category stage.
- Uses a joke where the customer needs a safety, fit, shipping, or warranty answer.
- Hides an important limitation because it weakens the pitch.

## Approval checklist

- [ ] Shawn's reason for the product is recorded or the story is explicitly provisional.
- [ ] Every technical claim has an exact source.
- [ ] Unknowns are listed.
- [ ] Product, customer, setting, problem, and trade-off are distinct.
- [ ] Category descriptor is memorable but not inflated.
- [ ] Category story is no more than two sentences.
- [ ] Product-page story and category story do not repeat verbatim.
- [ ] Live price and availability remain live.
- [ ] Current product and lifestyle media are correct.
- [ ] Compatibility, care, warranty, shipping, and included items are precise or absent.
- [ ] Copy status is recorded in the typed story source.
- [ ] Shawn approved promotion from provisional to approved.
