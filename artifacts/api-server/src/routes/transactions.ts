import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '@psaipay/db';
import { transactions } from '@psaipay/db';
import { eq, and, SQL } from 'drizzle-orm';

export const transactionsRouter = Router();
transactionsRouter.use(requireAuth);

transactionsRouter.get('/', async (req, res) => {
  try {
    const { status, type, merchantId } = req.query as Record<string, string>;
    const conditions: SQL[] = [];
    if (status) conditions.push(eq(transactions.status, status));
    if (type) conditions.push(eq(transactions.type, type));
    if (merchantId) conditions.push(eq(transactions.merchantId, merchantId));

    const data = conditions.length
      ? await db.select().from(transactions).where(and(...conditions))
      : await db.select().from(transactions);
    res.json({ data, total: data.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

transactionsRouter.get('/:id', async (req, res) => {
  try {
    const [t] = await db.select().from(transactions).where(eq(transactions.id, req.params.id));
    if (!t) return res.status(404).json({ error: 'Not found' });
    res.json(t);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});
