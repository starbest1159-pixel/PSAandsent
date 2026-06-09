import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '@psaipay/db';
import { merchants } from '@psaipay/db';
import { eq } from 'drizzle-orm';

export const merchantsRouter = Router();
merchantsRouter.use(requireAuth);

merchantsRouter.get('/', async (_req, res) => {
  try {
    const data = await db.select().from(merchants);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch merchants' });
  }
});

merchantsRouter.post('/', async (req, res) => {
  try {
    const [m] = await db.insert(merchants).values(req.body).returning();
    res.status(201).json(m);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create merchant' });
  }
});

merchantsRouter.get('/:id', async (req, res) => {
  try {
    const [m] = await db.select().from(merchants).where(eq(merchants.id, req.params.id));
    if (!m) return res.status(404).json({ error: 'Not found' });
    res.json(m);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch merchant' });
  }
});

merchantsRouter.put('/:id', async (req, res) => {
  try {
    const [m] = await db.update(merchants).set({ ...req.body, updatedAt: new Date() }).where(eq(merchants.id, req.params.id)).returning();
    if (!m) return res.status(404).json({ error: 'Not found' });
    res.json(m);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update merchant' });
  }
});

merchantsRouter.delete('/:id', async (req, res) => {
  try {
    const [m] = await db.delete(merchants).where(eq(merchants.id, req.params.id)).returning();
    if (!m) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete merchant' });
  }
});
