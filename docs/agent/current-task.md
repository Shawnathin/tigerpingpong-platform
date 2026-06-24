# Current Task

## Active task

TigerPingPong.ca cutover planning: produce a precise production readiness proof plan for domain cutover.

## Current task card

TigerPingPong.ca cutover environment readiness

## Why this task exists now

A launch decision requires a clean answer on blockers before domain launch, not only app-level capability.

## What must happen next

1. Finalize domain/canonical decision and who owns DNS + Render domain mapping.
2. Confirm production env names/ownership for web, API, Stripe, Supabase, and Cloudinary in a cutover contract.
3. Execute final read-only proof on final domain: home/category/product/cart/checkout/session/webhook/admin and mobile smoke.

## Status update

- Launch readiness review confirmed and documented blockers were operational rather than code.
- Created `docs/launch/cutover-environment-readiness.md` with exact cutover proof contract and go/no-go checks.
