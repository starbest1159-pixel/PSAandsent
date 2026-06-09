import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '@psaipay/db';
import { botJobs } from '@psaipay/db';
import { eq } from 'drizzle-orm';

export const botRouter = Router();
botRouter.use(requireAuth);

botRouter.get('/status', async (_req, res) => {
  try {
    // Get distinct bot IDs and their latest job status
    const jobs = await db.select().from(botJobs);
    const botIds = [...new Set(jobs.map(j => j.botId))];
    const bots = botIds.map(botId => {
      const botJobs_list = jobs.filter(j => j.botId === botId);
      const lastJob = botJobs_list[botJobs_list.length - 1];
      return {
        id: botId,
        status: lastJob?.status || 'idle',
        lastSeen: lastJob?.completedAt || lastJob?.startedAt,
        jobsCompleted: botJobs_list.filter(j => j.status === 'completed').length,
      };
    });
    res.json(bots);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bot status' });
  }
});

botRouter.get('/jobs', async (_req, res) => {
  try {
    const data = await db.select().from(botJobs);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bot jobs' });
  }
});

botRouter.post('/jobs', async (req, res) => {
  try {
    const validTypes = ['rpa_poll', 'balance_check', 'transaction_sync', 'deposit_verify'];
    const jobType = req.body.type;
    if (!validTypes.includes(jobType)) {
      return res.status(400).json({ error: `Invalid job type. Valid types: ${validTypes.join(', ')}` });
    }
    const [j] = await db.insert(botJobs).values({
      botId: req.body.botId,
      type: jobType,
      status: 'queued',
      payload: req.body.payload,
    }).returning();
    res.status(201).json(j);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create bot job' });
  }
});
