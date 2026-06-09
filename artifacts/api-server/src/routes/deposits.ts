import { Router } from 'express';
import QRCode from 'qrcode';
import { requireAuth } from '../middleware/auth.js';
import { generatePromptPayQR } from '../lib/promptpay.js';
import { db } from '@psaipay/db';
import { deposits } from '@psaipay/db';
import { eq } from 'drizzle-orm';

export const depositsRouter = Router();
depositsRouter.use(requireAuth);

depositsRouter.get('/', async (_req, res) => {
  try {
    const data = await db.select().from(deposits);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

depositsRouter.post('/', async (req, res) => {
  try {
    const { merchantId, amount, promptpayId, ref1, ref2 } = req.body;
    const promptpayRef = crypto.randomUUID().slice(0, 8).toUpperCase();
    const qrPayload = generatePromptPayQR(
      promptpayId || '0000000000000',
      amount,
      undefined,
      ref1 || promptpayRef,
      ref2,
    );
    const qrImage = await QRCode.toDataURL(qrPayload);
    const [deposit] = await db.insert(deposits).values({
      merchantId,
      amount: String(amount),
      promptpayRef,
      qrPayload,
      status: 'pending',
      slipVerified: false,
      ref1: ref1 || promptpayRef,
      ref2: ref2 || null,
      bankCallbackReceived: false,
    }).returning();
    res.status(201).json({ ...deposit, qrImage });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create deposit' });
  }
});

depositsRouter.get('/:id', async (req, res) => {
  try {
    const [d] = await db.select().from(deposits).where(eq(deposits.id, req.params.id));
    if (!d) return res.status(404).json({ error: 'Not found' });
    res.json(d);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deposit' });
  }
});

depositsRouter.patch('/:id/status', async (req, res) => {
  try {
    const [d] = await db.update(deposits).set({ status: req.body.status, updatedAt: new Date() }).where(eq(deposits.id, req.params.id)).returning();
    if (!d) return res.status(404).json({ error: 'Not found' });
    res.json(d);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update deposit status' });
  }
});
