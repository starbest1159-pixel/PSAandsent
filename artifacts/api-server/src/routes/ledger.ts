import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '@psaipay/db';
import { ledgerEntries } from '@psaipay/db';

export const ledgerRouter = Router();
ledgerRouter.use(requireAuth);

ledgerRouter.get('/', async (_req, res) => {
  try {
    const data = await db.select().from(ledgerEntries);
    res.json({ data, total: data.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ledger entries' });
  }
});

ledgerRouter.post('/', async (req, res) => {
  try {
    const [e] = await db.insert(ledgerEntries).values({
      transactionId: req.body.transactionId,
      accountDebit: req.body.accountDebit,
      accountCredit: req.body.accountCredit,
      amount: String(req.body.amount),
      currency: req.body.currency || 'THB',
      description: req.body.description,
    }).returning();
    res.status(201).json(e);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create ledger entry' });
  }
});
