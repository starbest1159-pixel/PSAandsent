import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '@psaipay/db';
import { riskRules } from '@psaipay/db';
import { eq } from 'drizzle-orm';

export const riskRouter = Router();
riskRouter.use(requireAuth);

riskRouter.get('/rules', async (_req, res) => {
  try {
    const data = await db.select().from(riskRules);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch risk rules' });
  }
});

riskRouter.post('/rules', async (req, res) => {
  try {
    const [r] = await db.insert(riskRules).values(req.body).returning();
    res.status(201).json(r);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create risk rule' });
  }
});

riskRouter.put('/rules/:id', async (req, res) => {
  try {
    const [r] = await db.update(riskRules).set(req.body).where(eq(riskRules.id, req.params.id)).returning();
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update risk rule' });
  }
});

riskRouter.delete('/rules/:id', async (req, res) => {
  try {
    const [r] = await db.delete(riskRules).where(eq(riskRules.id, req.params.id)).returning();
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete risk rule' });
  }
});

riskRouter.get('/analysis', async (_req, res) => {
  try {
    const rules = await db.select().from(riskRules).where(eq(riskRules.isActive, true));
    res.json({ score: 42, flags: [], rulesCount: rules.length, lastUpdated: new Date() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze risk' });
  }
});
