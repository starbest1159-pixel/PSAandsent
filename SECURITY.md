# Security Policy

## Current Security Posture

PSAiPay implements the following security measures:

### Authentication & Authorization
- **Admin credentials**: Stored as bcrypt hash (cost factor 12). The `ADMIN_PASSWORD_HASH` env var is required — no plaintext fallback exists.
- **JWT tokens**: Signed with `JWT_SECRET` env var (required at startup). No hardcoded fallback.
- **Token expiry**: Configurable via `JWT_EXPIRES_IN` (default: 8 hours).
- **Rate limiting**: Login endpoint limited to 10 requests per minute per IP.

### API Security
- **CORS**: Strictly enforced via `CORS_ORIGIN` env var. No wildcard (`*`) allowed.
- **Helmet**: Security headers applied to all responses (X-Content-Type-Options, X-Frame-Options, etc.).
- **Input validation**: Request body size limited to 10MB.
- **Webhook signatures**: HMAC-SHA256 signature verification on inbound PromptPay callbacks.

### Data Protection
- **Database**: All data persisted in PostgreSQL. No in-memory stores.
- **Slip images**: Processed in memory, not stored on disk. Only hashes and extracted OCR data are persisted.
- **Secrets**: All secrets (JWT_SECRET, ADMIN_PASSWORD_HASH, WEBHOOK_SECRET, PROMPTPAY_CALLBACK_SECRET) are read from environment variables, never committed to code.
- **No hardcoded credentials**: App refuses to start if required env vars are missing.

### Fixed Issues
- ~~Plaintext password fallback (ADMIN_PASSWORD env var with 'admin123' default)~~ → Removed
- ~~Hardcoded JWT_SECRET fallback ('secret')~~ → Removed; app exits if missing
- ~~Wildcard CORS ('*')~~ → Replaced with required CORS_ORIGIN env var
- ~~No rate limiting on login~~ → Added express-rate-limit (10 req/min)
- ~~Deprecated `crypto` npm package~~ → Removed (Node.js built-in)

## Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Single admin user | Medium | Add multi-user auth with role-based access in future iteration |
| No HTTPS termination in app | Low | Use reverse proxy (nginx/Caddy) with TLS in production |
| No CSRF protection | Low | API is token-based (JWT in Authorization header), not cookie-based |
| No audit logging | Medium | Add request logging middleware in future iteration |
| Base64 slip upload | Low | Consider multipart upload for large images |
| No database connection pooling | Medium | Configure postgres.js pool size for production |
| No automated dependency scanning | Medium | Add `pnpm audit` to CI pipeline |

## Environment Variables (All Required for Production)

```bash
JWT_SECRET=               # Minimum 32 characters, random
ADMIN_PASSWORD_HASH=       # bcrypt hash (generate with bcryptjs)
CORS_ORIGIN=               # Dashboard URL (e.g., https://admin.psaipay.com)
DATABASE_URL=              # PostgreSQL connection string
PROMPTPAY_CALLBACK_SECRET= # Secret for bank callback verification
WEBHOOK_SECRET=            # Secret for merchant webhook signing
```

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately to the development team. Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
