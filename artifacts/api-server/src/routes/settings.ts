import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '@psaipay/db';
import { settings } from '@psaipay/db';
import { eq } from 'drizzle-orm';

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

settingsRouter.get('/', async (_req, res) => {
  try {
    const data = await db.select().from(settings);
    // Convert array of {key, value} to object
    const store: Record<string, string | null> = {};
    for (const row of data) {
      store[row.key] = row.value;
    }
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

settingsRouter.patch('/', async (req, res) => {
  try {
    const updates = req.body;
    const results: Record<string, string | null> = {};

    for (const [key, value] of Object.entries(updates)) {
      const existing = await db.select().from(settings).where(eq(settings.key, key));
      if (existing.length > 0) {
        await db.update(settings).set({ value: String(value), updatedAt: new Date() }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value: String(value) });
      }
      results[key] = String(value);
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});
