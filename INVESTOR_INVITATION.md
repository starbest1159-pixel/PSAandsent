# Investor Invitation

Dear Investor / Partner,

We would like to introduce you to PSAiPay — a PromptPay-first payment management platform built for the Thai market.

## What We Built

PSAiPay is a production-grade payment processing system that handles the full lifecycle of Thai digital payments:

- **PromptPay QR Generation** with bill payment reference fields (ref1/ref2)
- **Bank Callback Integration** — real-time payment confirmation from banks
- **9-Step Slip Verification Pipeline** — OCR, duplicate detection, tamper analysis, amount verification, and more
- **Merchant Management** — multi-merchant support with webhook notifications
- **Admin Dashboard** — React SPA with real-time KPIs, deposit/withdrawal management, and risk rules
- **RPA Bot Integration** — automated bank account verification

## Technical Capabilities

| Capability | Implementation |
|-----------|---------------|
| Backend | Express 5 + TypeScript (ESM) |
| Database | PostgreSQL 16 + Drizzle ORM |
| Frontend | React 18 + Ant Design + TanStack Query |
| OCR | Tesseract.js (Thai + English) |
| Image Analysis | sharp (Error Level Analysis for tamper detection) |
| Security | JWT + bcrypt, rate limiting, CORS enforcement, HMAC-SHA256 webhook signatures |
| Architecture | Monorepo (pnpm workspaces + Turborepo) |

## Security Posture

- No plaintext passwords — bcrypt-only authentication
- No hardcoded secrets — all credentials from environment variables
- CORS strictly enforced — no wildcards
- Rate-limited login — brute-force protection
- Startup validation — app refuses to run with missing secrets
- Webhook signature verification on all inbound callbacks

## Differentiators

1. **Slip Verification Pipeline**: 9-step verification with OCR, tamper detection (ELA), and bank cross-referencing — significantly more robust than simple hash-based deduplication
2. **PromptPay Native**: Full support for bill payment fields (tag 62) with ref1/ref2, bank callbacks, and RPA verification
3. **Real Database**: All data persisted in PostgreSQL via Drizzle ORM — no in-memory stores that lose data on restart
4. **Thai Market Focus**: Built specifically for PromptPay, Thai bank integrations, and Thai slip formats

## Current Status

The platform is feature-complete for internal admin use. Key areas for expansion:

- Multi-user authentication with role-based access
- Merchant-facing API (self-service portal)
- Automated notification system (email/SMS)
- Production deployment with TLS and monitoring
- Integration with bank sandbox environments for testing

## Contact

If you are interested in a demo, partnership, or investment discussion, please reach out to the development team.

Best regards,
The PSAiPay Development Team
