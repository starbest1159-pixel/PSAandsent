import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '@psaipay/db';
import { withdrawals } from '@psaipay/db';
import { eq } from 'drizzle-orm';

export const withdrawalsRouter = Router();
withdrawalsRouter.use(requireAuth);

const AUTO_APPROVE_LIMIT = parseFloat(process.env.AUTO_APPROVE_LIMIT || '5000');

withdrawalsRouter.get('/', async (_req, res) => {
  try {
    const data = await db.select().from(withdrawals);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

withdrawalsRouter.post('/', async (req, res) => {
  try {
    const w = { ...req.body, status: 'pending', autoApproved: false };
    if (parseFloat(w.amount) <= AUTO_APPROVE_LIMIT) {
      w.status = 'approved';
      w.autoApproved = true;
      w.approvedAt = new Date();
    }
    const [result] = await db.insert(withdrawals).values({
      merchantId: w.merchantId,
      amount: String(w.amount),
      bankCode: w.bankCode,
      accountNumber: w.accountNumber,
      accountName: w.accountName,
      status: w.status,
      autoApproved: w.autoApproved,
      approvedAt: w.approvedAt || null,
    }).returning();
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create withdrawal' });
  }
});

withdrawalsRouter.patch('/:id/approve', async (req, res) => {
  try {
    const [w] = await db.update(withdrawals).set({
      status: 'approved',
      approvedBy: 'admin',
      approvedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(withdrawals.id, req.params.id)).returning();
    if (!w) return res.status(404).json({ error: 'Not found' });
    res.json(w);
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

withdrawalsRouter.patch('/:id/reject', async (req, res) => {
  try {
    const [w] = await db.update(withdrawals).set({
      status: 'rejected',
      note: req.body.note,
      updatedAt: new Date(),
    }).where(eq(withdrawals.id, req.params.id)).returning();
    if (!w) return res.status(404).json({ error: 'Not found' });
    res.json(w);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
});
