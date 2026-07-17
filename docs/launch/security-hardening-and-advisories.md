# Security Hardening and Advisory Disposition

Date reviewed: 2026-07-16

## Production dependency gate

`pnpm audit --prod --audit-level high` must report zero high and zero critical advisories. The release candidate currently has two moderate advisories:

| Dependency path                          | Advisory applicability                                                                                                                                     | Disposition                                                                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `postcss 8.4.31` through Next `15.5.18`  | The issue concerns unsafe CSS stringification. This repository builds trusted, static CSS and does not accept customer-controlled CSS for stringification. | Accept for this candidate with dependency owner monitoring. Upgrade when Next’s supported dependency resolves it or if untrusted CSS is introduced. |
| `qs 6.14.2` through Nest/Express `5.2.1` | The issue concerns a resource-exhaustion pattern in `qs.stringify` with comma-array options. Application code does not call that API/pattern.              | Accept for this candidate with dependency owner monitoring. Upgrade promptly when the upstream Nest/Express tree resolves it.                       |

If either applicability statement changes, the advisory must be reopened. Every new high/critical is a stop condition.

## CSP staged hardening

Content Security Policy remains deferred because this storefront currently uses Next runtime assets, hosted Stripe Checkout navigation, Cloudinary media, and sourced fallback media. A launch policy must be tested in report-only mode across home, category, product gallery, cart, checkout redirect/cancel/success, policy pages, and protected staff routes. It must not use `unsafe-eval`; any `unsafe-inline` allowance requires documented justification and owner acceptance. CSP is not to be activated as an untested cutover edit.

Risk owner: [enter name]

Acceptance or remediation reference: [enter reference]

## HSTS post-SSL procedure

Do not activate HSTS during repository remediation. After DNS settles, verify valid certificates and HTTPS behavior for every intended apex and `www` hostname, confirm no HTTP-only subdomain is in scope, and confirm the rollback decision. Start with `Strict-Transport-Security: max-age=300`, observe, then increase deliberately. Add `includeSubDomains` only after every subdomain is confirmed HTTPS-capable. Add `preload` only through a separate owner-approved procedure because it is difficult to reverse.

HSTS owner: [enter name]

SSL evidence: [enter reference]

Rollback acceptance: [enter decision]
