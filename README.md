# PSAiPay

A PromptPay-first payment management platform with slip verification, merchant management, and an admin dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API Server | Express 5 + TypeScript (ESM) |
| Dashboard | React 18 + Vite + Ant Design + TanStack Query |
| Database | PostgreSQL 16 + Drizzle ORM |
| Monorepo | pnpm workspaces + Turborepo |
| OCR | Tesseract.js |
| Image Analysis | sharp (ELA tamper detection) |

## Project Structure

```
artifacts/
  api-server/          Express API (port 4000)
  psai-dashboard/      React SPA (port 5173)
lib/
  db/                  Drizzle ORM schemas + client (@psaipay/db)
docs/
  payment-system/      Payment architecture docs
  DEVELOPMENT-ROADMAP.md
docker-compose.yml     PostgreSQL 16
```

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
docker compose up -d postgres

# 3. Run database migrations (drizzle-kit)
cd lib/db && pnpm drizzle-kit push

# 4. Create admin password hash
node -e "console.log(require('bcryptjs').hashSync('your-password', 12))"

# 5. Configure environment variables
cp .env.example .env
# Edit .env with your values (see below)

# 6. Start API server
cd artifacts/api-server && pnpm dev

# 7. Start dashboard
cd artifacts/psai-dashboard && pnpm dev
```

## Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://psaipay:psaipay_secret@localhost:5432/psaipay

# Authentication (REQUIRED — app will not start without these)
JWT_SECRET=your-random-jwt-secret-at-least-32-chars
ADMIN_PASSWORD_HASH=$2a$12$...   # Generate with bcryptjs
ADMIN_USERNAME=admin              # Optional, defaults to 'admin'

# CORS (REQUIRED)
CORS_ORIGIN=https://your-dashboard-domain.com

# Optional
PORT=4000
JWT_EXPIRES_IN=8h
AUTO_APPROVE_LIMIT=5000
WEBHOOK_SECRET=your-webhook-secret
PROMPTPAY_CALLBACK_SECRET=your-callback-secret
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | No | Login (rate-limited: 10/min) |
| POST | /api/auth/logout | No | Logout |
| GET/POST | /api/merchants | Yes | Merchant CRUD |
| GET/POST | /api/transactions | Yes | Transaction queries |
| GET/POST | /api/deposits | Yes | Deposit management + QR generation |
| GET/POST | /api/withdrawals | Yes | Withdrawal management + auto-approve |
| GET/POST/PUT/DELETE | /api/risk/rules | Yes | Risk rule management |
| GET/POST | /api/ledger | Yes | Ledger entries |
| GET | /api/dashboard/kpis | Yes | Dashboard KPIs (from DB) |
| GET | /api/dashboard/volume | Yes | 7-day volume chart |
| GET | /api/dashboard/activity | Yes | Recent activity feed |
| GET/POST | /api/bot/jobs | Yes | Bot job management (incl. RPA polling) |
| POST | /api/qr/generate | Yes | Generate PromptPay QR |
| POST | /api/slip/verify | Yes | 9-step slip verification pipeline |
| GET/POST/DELETE | /api/banks/connections | Yes | Bank connection management |
| GET/POST | /api/webhooks/logs | Yes | Webhook log management |
| POST | /api/webhooks/promptpay-callback | No* | PromptPay bank callback receiver |
| GET/PATCH | /api/settings | Yes | System settings |
| GET | /health | No | Health check |

*PromptPay callback uses signature verification, not admin auth.

## Slip Verification Pipeline

The `/api/slip/verify` endpoint runs a 9-step verification pipeline:

1. **OCR Extraction** — Tesseract.js (Thai + English)
2. **Bank Cross-Reference** — Checks for bank callback / RPA verification
3. **Duplicate Detection** — SHA-256 pixel hash + perceptual hash
4. **Logo Detection** — Template matching against bank logos
5. **Tamper Detection** — Error Level Analysis (ELA) via sharp
6. **Amount Verification** — OCR amount vs expected deposit amount
7. **Datetime Verification** — OCR datetime vs deposit creation (24h window)
8. **Sender Verification** — OCR sender account vs merchant account
9. **PromptPay Ref Validation** — ref1/ref2 format + cross-check

Each step returns a pass/fail/warning status and score (0-100). The overall score is weighted across all steps.

## License

Private — All rights reserved.
