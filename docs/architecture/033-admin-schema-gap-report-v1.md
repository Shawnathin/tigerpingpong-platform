# 033 Admin Schema Gap Report V1

This report compares the current schema to the smaller V1 admin staff-panel goal:

Staff can review orders, see payment status, check basic product/inventory information, and eventually make simple edits without needing BigCommerce for every small task.

No production migrations were created in this PR.

## Summary

Current schema already supports:

- catalog read visibility
- product variants
- product media
- order and order item review
- Stripe checkout/payment references on orders
- minimal Stripe webhook event receipt tracking

Current schema does not yet support:

- admin users/sessions/roles
- real inventory counts
- inventory adjustment history
- order notes
- fulfillment records
- audit logs
- settings persistence
- admin import batches/rows
- richer webhook diagnostics

## Gap Matrix

| Gap | Needed table/model | Why it is needed | V1 requires it? | Can it wait? | Migration risk | Suggested phase |
| --- | --- | --- | --- | --- | --- | --- |
| Admin users / roles / sessions | `admin_users`, `admin_roles`, `admin_sessions` or an external auth mapping | Needed for named staff access, role-specific permissions, and session management. Current backend admin foundation reuses the internal token only. | Not for this PR. Needed before real admin UI launch if multiple staff will use it. | Yes, for foundation PR. | Medium. Auth touches every admin route and needs careful secret/session handling. | Phase 2: simple admin identity before write actions. |
| Product variants | Existing `ProductVariant`, `ProductOption`, `ProductOptionValue`, `ProductVariantOptionValue` | Variant visibility already exists for read use. Future edits may need stronger constraints and UI-safe validation. | Read visibility exists now. Full variant manager not required for V1 launch. | Yes. | Low for read use; medium for edit workflows. | Phase 2/3: narrow variant visibility first, then targeted edits only if needed. |
| Product images | Existing `ProductMedia` | Staff need to see whether a product has usable public media. Full media manager is out of scope. | Basic visibility exists now. | Full image editor can wait. | Low for read use; medium for upload/edit workflow. | Phase 2: image status visibility in UI. Phase 3: controlled media edit if approved. |
| Inventory items | `inventory_items` | Needed for on-hand/reserved/available counts by product or variant. Current schema has no inventory truth. | Needed for real inventory visibility, but not for this foundation PR. | Short wait only. This is one of the smallest useful next steps. | Medium. Requires deciding product-vs-variant grain and backfill defaults. | Phase 2: simple inventory table. |
| Inventory adjustments | `inventory_adjustments` | Needed for safe staff count changes and history. | Needed before any inventory write endpoint. | Yes, until inventory writes are approved. | Medium. Must preserve auditability and avoid silent count drift. | Phase 2: adjustment ledger paired with inventory table. |
| Order notes | `order_notes` | Needed for staff support notes without changing payment truth or order status. | Useful early, not required for this foundation PR. | Yes. | Low/medium. Needs staff identity or token actor label plus audit trail. | Phase 2: first safe order write after audit planning. |
| Order fulfillments | `order_fulfillments` | Needed for tracking fulfillment state, carrier, tracking, and shipped timestamps. | Not required for launch foundation. | Yes. | Medium/high. Fulfillment state can affect customer expectations and operations. | Phase 3: after staff notes and inventory visibility. |
| Admin import batches | `admin_import_batches` | Needed for CSV import previews/commits with review state. | Not required for small V1 admin. Advanced CSV import is deferred. | Yes. | Medium/high. Imports can mutate many catalog rows. | Later phase only after simple product edits are proven. |
| Admin import rows | `admin_import_rows` | Needed for row-level import validation, errors, and commit tracking. | Not required for small V1 admin. | Yes. | Medium/high. Must be tied to import batch and audit model. | Later phase with import batches. |
| Audit log | `audit_log` | Needed before admin write endpoints so staff changes can be reviewed. | Not required for read-only foundation, required before writes. | Short wait only. | Medium. Needs actor, action, target, before/after payload shape, and retention choices. | Phase 2: add before product/inventory/order write endpoints. |
| Settings | `settings` | Needed for editable operational settings. Current settings endpoint uses safe constants/env presence checks. | Not required for read-only foundation. | Yes. | Medium. Must separate public values from secrets and avoid checkout misconfiguration. | Phase 3: after audit log and clear settings ownership. |
| Webhook events | Existing `StripeWebhookEvent`; possible future `webhook_events` | Existing table records Stripe event ID, type, created time, and processed time. It does not store order linkage, result reason, payload metadata, delivery attempts, or manual-review reasons. | Minimal health visibility exists now. Rich diagnostics can wait. | Yes. | Medium. Payload storage and PII/security decisions matter. | Phase 2/3: extend diagnostics only if operationally needed. |

## Recommended Smallest Next Schema Step

For the corrected V1 scope, the smallest useful next schema step is:

1. `audit_log`
2. `inventory_items`
3. `inventory_adjustments`

That unlocks safe inventory visibility and simple count adjustments without building a broad ecommerce backend platform.

## Explicitly Deferred

- complex role matrix
- full product editor
- full variant manager
- advanced CSV import system
- advanced customer CRM
- refund controls
- fulfillment automation
- purchase orders
- ERP/warehouse features
- advanced reporting
- marketing tools

## Migration Rule

Do not implement these migrations until the target write workflow is approved. The current PR documents the gaps only.
