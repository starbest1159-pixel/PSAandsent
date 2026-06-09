import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '@psaipay/db';
import { bankConnections } from '@psaipay/db';
import { eq } from 'drizzle-orm';

export const banksRouter = Router();
banksRouter.use(requireAuth);

const THAI_BANKS = [
  { code: 'BBL', name: 'Bangkok Bank', color: '#1E3A8A' },
  { code: 'KBANK', name: 'Kasikorn Bank', color: '#006633' },
  { code: 'KTB', name: 'Krungthai Bank', color: '#00AEEF' },
  { code: 'BAY', name: 'Bank of Ayudhya', color: '#FFD700' },
  { code: 'SCB', name: 'Siam Commercial Bank', color: '#4B0082' },
  { code: 'TMB', name: 'TMBThanachart Bank', color: '#003087' },
  { code: 'UOB', name: 'United Overseas Bank', color: '#003893' },
  { code: 'GSB', name: 'Government Savings Bank', color: '#FF69B4' },
];

banksRouter.get('/list', (_req, res) => res.json(THAI_BANKS));

banksRouter.get('/connections', async (_req, res) => {
  try {
    const data = await db.select().from(bankConnections);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bank connections' });
  }
});

banksRouter.post('/connections', async (req, res) => {
  try {
    const [c] = await db.insert(bankConnections).values({
      merchantId: req.body.merchantId,
      bankCode: req.body.bankCode,
      accountNumber: req.body.accountNumber,
      accountName: req.body.accountName,
      isActive: true,
    }).returning();
    res.status(201).json(c);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create bank connection' });
  }
});

banksRouter.delete('/connections/:id', async (req, res) => {
  try {
    const [c] = await db.delete(bankConnections).where(eq(bankConnections.id, req.params.id)).returning();
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete bank connection' });
  }
});
