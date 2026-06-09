# Project Overview

PSAiPay is a PromptPay-first payment management platform for the Thai market. This document reflects the actual implementation status of each module.

## Module Status

| Module | Status | Notes |
|--------|--------|-------|
| **Express API Server** | Functional | 14 route modules, all connected to PostgreSQL via Drizzle ORM |
| **React Dashboard** | Functional | 14 pages, Ant Design UI, TanStack Query |
| **Authentication** | Secure | JWT + bcrypt, no plaintext fallbacks, rate-limited login |
| **PromptPay QR Generation** | Functional | Supports ref1/ref2 bill payment fields (tag 62) |
| **Deposit Management** | Functional | QR generation, status tracking, bank callback integration |
| **Withdrawal Management** | Functional | Auto-approve under configurable limit |
| **Slip Verification** | Partial → Advanced | 9-step pipeline: OCR, bank cross-ref, duplicate, logo, tamper (ELA), amount, datetime, sender, PromptPay ref |
| **Bank Callback** | Functional | POST /api/webhooks/promptpay-callback with signature verification |
| **RPA Bot Integration** | Basic | Bot job queue with rpa_poll job type |
| **Risk Rules** | Basic | CRUD for risk rules, analysis endpoint |
| **Ledger** | Basic | Double-entry ledger CRUD |
| **Settings** | Functional | Key-value settings persisted in PostgreSQL |
| **Webhook Logging** | Functional | Outbound test + inbound callback logging |
| **Bank Connections** | Basic | CRUD for merchant bank accounts |
| **CORS Security** | Secure | Enforced via CORS_ORIGIN env var |
| **Rate Limiting** | Secure | Login endpoint: 10 req/min |

## Implementation Gaps

| Gap | Priority | Effort |
|-----|----------|--------|
| No database migrations (drizzle-kit push only) | Medium | Low |
| No unit/integration tests | High | Medium |
| No email/SMS notifications | Medium | Medium |
| No multi-user auth (single admin only) | Medium | High |
| No PromptPay sandbox integration testing | High | Low |
| No file upload for slip images (base64 only) | Low | Low |
| Logo detection uses color sampling (not OpenCV) | Low | Medium |
| Perceptual hash uses simple average-hash (not DCT) | Low | Medium |
| No dashboard authentication refresh flow | Low | Low |
| No merchant-facing API (admin-only) | Medium | High |

## Fixed Issues

- Removed plaintext password fallback (ADMIN_PASSWORD env var)
- Removed hardcoded JWT_SECRET fallback ('secret')
- Added rate limiting on login endpoint
- Changed CORS from wildcard to required env var
- Removed deprecated `crypto` npm package (Node.js built-in)
- Removed unused `jsqr` npm package from dashboard
- Removed unused Redis from docker-compose.yml
- Replaced all 14 in-memory stores with PostgreSQL queries via Drizzle ORM
- Added Drizzle client in lib/db/src/client.ts
