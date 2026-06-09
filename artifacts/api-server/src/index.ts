import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.js';
import { merchantsRouter } from './routes/merchants.js';
import { transactionsRouter } from './routes/transactions.js';
import { depositsRouter } from './routes/deposits.js';
import { withdrawalsRouter } from './routes/withdrawals.js';
import { riskRouter } from './routes/risk.js';
import { ledgerRouter } from './routes/ledger.js';
import { dashboardRouter } from './routes/dashboard.js';
import { botRouter } from './routes/bot.js';
import { qrRouter } from './routes/qr.js';
import { slipRouter } from './routes/slip.js';
import { banksRouter } from './routes/banks.js';
import { webhooksRouter } from './routes/webhooks.js';
import { settingsRouter } from './routes/settings.js';

// Validate required env vars at startup
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET env var is required');
  process.exit(1);
}
if (!process.env.ADMIN_PASSWORD_HASH) {
  console.error('FATAL: ADMIN_PASSWORD_HASH env var is required');
  process.exit(1);
}
if (!process.env.CORS_ORIGIN) {
  console.error('FATAL: CORS_ORIGIN env var is required (e.g. https://dashboard.psaipay.com)');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Rate limit login endpoint to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

app.use('/api/auth', authRouter);
app.use('/api/merchants', merchantsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/deposits', depositsRouter);
app.use('/api/withdrawals', withdrawalsRouter);
app.use('/api/risk', riskRouter);
app.use('/api/ledger', ledgerRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/bot', botRouter);
app.use('/api/qr', qrRouter);
app.use('/api/slip', slipRouter);
app.use('/api/banks', banksRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/settings', settingsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));

app.listen(PORT, () => {
  console.log(`PSAiPay API running on port ${PORT}`);
});

export default app;
