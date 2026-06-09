# User Guide

## Login

1. Navigate to the dashboard URL (e.g., `https://admin.psaipay.com`)
2. Enter your admin username (default: `admin`) and password
3. You will receive a JWT token valid for 8 hours (configurable)
4. If you see "Too many login attempts", wait 1 minute (rate limit: 10/min)

## Dashboard Pages

### Dashboard (Home)
- **KPIs**: Total deposits, total withdrawals, pending withdrawals, active merchants — all pulled from PostgreSQL
- **Volume Chart**: 7-day deposit/withdrawal volume
- **Activity Feed**: Recent deposits and withdrawals

### Merchants
- View all merchants in a table
- Create new merchants with PromptPay ID and webhook URL
- Edit merchant details
- Delete merchants

### Deposits
- View all deposits with status (pending/completed/failed)
- Create new deposit: enter merchant, amount, PromptPay ID, and optional ref1/ref2
- The system generates a PromptPay QR code with bill payment fields
- Update deposit status

### Withdrawals
- View all withdrawal requests
- Create new withdrawals (auto-approved if under the configured limit)
- Manually approve or reject pending withdrawals

### Slip Verification
- Upload a payment slip image (drag-and-drop or click)
- The system runs a 9-step verification pipeline:
  1. **OCR Extraction** — Tesseract.js reads Thai/English text
  2. **Bank Cross-Reference** — Checks for bank callback / RPA verification
  3. **Duplicate Detection** — SHA-256 pixel hash + perceptual hash
  4. **Logo Detection** — Matches bank logo colors
  5. **Tamper Detection** — Error Level Analysis (ELA)
  6. **Amount Verification** — OCR amount vs expected deposit amount
  7. **Datetime Verification** — OCR datetime vs deposit creation time
  8. **Sender Verification** — OCR sender account vs merchant account
  9. **PromptPay Ref** — Validates ref1/ref2 format and match
- Results show per-step pass/fail badges with scores and an overall score gauge

### QR Generator
- Generate PromptPay QR codes for any amount and PromptPay ID
- Supports ref1/ref2 bill payment fields

### Transactions
- View all transactions with filters by status, type, and merchant

### Ledger
- View and create double-entry ledger entries

### Risk Rules
- Manage risk rules (amount thresholds, velocity limits)
- View risk analysis

### Bot Status
- Monitor bot job queue
- Create RPA polling jobs for bank account verification

### Bank Connect
- View Thai bank list
- Manage merchant bank account connections

### Webhook Logs
- View webhook delivery logs
- Test outbound webhooks with custom payloads

### Settings
- View and update system settings (webhook URL, auto-approve limit, PromptPay ID, etc.)

## PromptPay Callback

When a bank confirms a payment, it sends a callback to:
```
POST /api/webhooks/promptpay-callback
```

This endpoint:
1. Verifies the callback signature (if PROMPTPAY_CALLBACK_SECRET is set)
2. Matches the deposit by ref1
3. Updates the deposit with callback data (amount, sender, transaction ID)
4. Marks the deposit as completed
5. Forwards the notification to the merchant's webhook URL (if configured)

## Environment Setup

### Generate Admin Password Hash
```bash
node -e "console.log(require('bcryptjs').hashSync('your-secure-password', 12))"
# Output: $2a$12$... (set this as ADMIN_PASSWORD_HASH)
```

### Required .env File
```
DATABASE_URL=postgresql://psaipay:psaipay_secret@localhost:5432/psaipay
JWT_SECRET=your-random-secret-at-least-32-characters
ADMIN_PASSWORD_HASH=$2a$12$...
CORS_ORIGIN=http://localhost:5173
```

### Start the Stack
```bash
docker compose up -d          # Start PostgreSQL
cd artifacts/api-server && pnpm dev   # Start API (port 4000)
cd artifacts/psai-dashboard && pnpm dev  # Start dashboard (port 5173)
```
