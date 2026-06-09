# Architecture

PSAiPay is an Express monolith API + React SPA admin dashboard backed by PostgreSQL via Drizzle ORM.

## System Overview

```
┌──────────────────────────┐
│   React SPA Dashboard    │  Vite + Ant Design + TanStack Query
│   (port 5173)            │
└────────────┬─────────────┘
             │ HTTPS (CORS_ORIGIN enforced)
             │
┌────────────▼─────────────┐
│   Express API Server     │  TypeScript ESM, port 4000
│   (artifacts/api-server) │  Helmet, rate limiting, JWT auth
└────────────┬─────────────┘
             │
     ┌───────┴───────┐
     │               │
┌────▼────┐  ┌───────▼──────┐
│ Drizzle │  │  External     │
│ ORM     │  │  Integrations │
│ (@psai  │  │  - PromptPay  │
│  pay/db)│  │  - Bank APIs  │
└────┬────┘  └──────────────┘
     │
┌────▼────┐
│PostgreSQL│  Docker Compose (port 5432)
│   16     │
└─────────┘
```

## Monorepo Structure

```
psaipay/
├── artifacts/
│   ├── api-server/         Express API (TypeScript ESM)
│   │   ├── src/routes/     14 route modules (merchants, deposits, slip, etc.)
│   │   ├── src/middleware/  JWT auth, rate limiting
│   │   ├── src/lib/        PromptPay QR generator, 9-step slip verifier
│   │   └── package.json    @psaipay/db workspace dep
│   └── psai-dashboard/     React SPA
│       ├── src/pages/      14 page components (Dashboard, SlipVerify, etc.)
│       ├── src/lib/api.ts  Axios API client
│       └── package.json    No unused deps (jsqr removed)
├── lib/
│   └── db/                 Drizzle ORM package (@psaipay/db)
│       ├── src/client.ts   Postgres.js + Drizzle client
│       ├── src/schema/     11 table schemas (merchants, deposits, slip_hashes, etc.)
│       └── package.json    drizzle-orm + postgres
├── docker-compose.yml      PostgreSQL 16 only (Redis removed)
├── pnpm-workspace.yaml     artifacts/* + lib/*
└── turbo.json              Turborepo config
```

## Data Flow: Deposit → QR → Callback → Slip Verify

```
1. Admin creates deposit (POST /api/deposits)
   → Generates PromptPay QR with ref1/ref2 (tag 62)
   → Stores in PostgreSQL via Drizzle

2. Payer scans QR with banking app
   → Bank sends callback to POST /api/webhooks/promptpay-callback
   → Updates deposit: bankCallbackReceived=true, bankCallbackData={...}

3. Admin uploads slip image (POST /api/slip/verify)
   → Runs 9-step verification pipeline
   → SHA-256 dedup check against slip_hashes table
   → OCR extraction, amount matching, tamper detection, etc.
   → Stores perceptualHash, ocrData, verificationReport, overallScore

4. If overallScore >= 80: deposit.slipVerified = true
```

## Authentication

- Single admin user defined by env vars (ADMIN_USERNAME, ADMIN_PASSWORD_HASH)
- JWT tokens issued on login (HS256, configurable expiry)
- No plaintext password fallback — ADMIN_PASSWORD_HASH is required
- Login endpoint rate-limited to 10 requests/minute
- JWT_SECRET is required — no hardcoded fallback

## Security Measures

| Measure | Implementation |
|---------|---------------|
| CORS | Enforced via CORS_ORIGIN env var (no wildcard) |
| Rate limiting | express-rate-limit on /api/auth/login |
| Helmet | Security headers on all responses |
| Password hashing | bcryptjs (cost factor 12) |
| JWT | HS256 with required JWT_SECRET |
| Webhook signatures | HMAC-SHA256 verification |
| Startup validation | App exits if required env vars are missing |

## Database Schema

11 tables managed by Drizzle ORM:

| Table | Purpose |
|-------|---------|
| merchants | Merchant accounts with PromptPay IDs |
| transactions | Transaction records with merchant FK |
| deposits | Deposit records with ref1/ref2, bank callback data, RPA fields |
| withdrawals | Withdrawal requests with auto-approve logic |
| risk_rules | Risk rule configuration |
| ledger_entries | Double-entry ledger |
| bot_jobs | RPA polling and bot job queue |
| bank_connections | Merchant bank account connections |
| webhook_logs | Webhook delivery logs |
| settings | Key-value system settings |
| slip_hashes | Slip dedup + verification results (perceptualHash, ocrData, verificationReport, overallScore) |
