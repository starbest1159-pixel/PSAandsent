# Payment System Architecture

## Data Flow

```
1. DEPOSIT CREATION
   Admin → POST /api/deposits
     → Generate PromptPay QR with ref1/ref2 (tag 62)
     → Store in PostgreSQL (deposits table)
     → Return QR image + ref to dashboard

2. PAYMENT
   Payer → Scans QR with banking app
     → Bank processes payment
     → Bank sends callback → POST /api/webhooks/promptpay-callback
       → Verify HMAC-SHA256 signature
       → Match deposit by ref1
       → Update deposit: status=completed, bankCallbackReceived=true, bankCallbackData={...}
       → Forward to merchant webhook (if configured)

3. SLIP VERIFICATION
   Admin → POST /api/slip/verify (with imageBase64 + depositId)
     → Run 9-step verification pipeline:
       Step 1: OCR Extraction (Tesseract.js, Thai+English)
       Step 2: Bank Cross-Reference (callback + RPA check)
       Step 3: Duplicate Detection (SHA-256 + perceptual hash)
       Step 4: Logo Detection (bank color template matching)
       Step 5: Tamper Detection (ELA via sharp re-compression)
       Step 6: Amount Verification (OCR vs expected)
       Step 7: Datetime Verification (OCR vs deposit creation, 24h window)
       Step 8: Sender Verification (OCR account vs merchant)
       Step 9: PromptPay Ref (ref1/ref2 format + match)
     → Store hash + perceptualHash + ocrData + verificationReport + overallScore
     → If score >= 80: set deposit.slipVerified = true

4. WITHDRAWAL
   Admin → POST /api/withdrawals
     → If amount <= AUTO_APPROVE_LIMIT: auto-approve
     → Otherwise: requires manual approval
```

## Database Tables

```
merchants ─────────┐
  id (PK)           │
  name              │
  code (UNIQUE)     │
  promptpayId       ├──→ deposits.merchantId
  webhookUrl        ├──→ transactions.merchantId
  webhookSecret     ├──→ withdrawals.merchantId
  autoApproveLimit  ├──→ bank_connections.merchantId
  isActive           └──→ webhook_logs.merchantId

deposits
  id (PK)
  merchantId (FK → merchants)
  amount
  promptpayRef
  qrPayload
  ref1, ref2
  status (pending/completed/failed)
  slipVerified
  slipHash
  bankCallbackReceived
  bankCallbackData (jsonb)
  rpaVerifiedAt

slip_hashes
  id (PK)
  hash (UNIQUE)
  depositId
  perceptualHash
  ocrData (jsonb)
  verificationReport (jsonb)
  overallScore

transactions
  id (PK)
  merchantId (FK)
  type, status, amount, reference
  metadata (jsonb)

withdrawals
  id (PK)
  merchantId (FK)
  amount, bankCode, accountNumber
  status, autoApproved, approvedBy

bot_jobs
  id (PK)
  botId, type (rpa_poll, balance_check, etc.)
  status, payload (jsonb), result (jsonb)

risk_rules, ledger_entries, bank_connections,
webhook_logs, settings
```

## API Authentication Flow

```
1. POST /api/auth/login { username, password }
   → bcrypt.compare(password, ADMIN_PASSWORD_HASH)
   → jwt.sign({ username, role }, JWT_SECRET, { expiresIn })
   → Return { token }

2. Subsequent requests:
   Authorization: Bearer <token>
   → jwt.verify(token, JWT_SECRET)
   → Attach user to request context
```

## Webhook Signature Flow

```
1. Outbound (test):
   POST /api/webhooks/test { url, event, payload, secret }
   → HMAC-SHA256(payload, secret)
   → Send to merchant URL with X-PSAiPay-Signature header

2. Inbound (PromptPay callback):
   POST /api/webhooks/promptpay-callback
   → Verify X-PromptPay-Signature header
   → Process payment, update deposit
   → Forward to merchant webhook (if configured)
```
