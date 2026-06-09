import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '@psaipay/db';
import { deposits, withdrawals, merchants, transactions } from '@psaipay/db';
import { eq, sql, and, gte } from 'drizzle-orm';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get('/kpis', async (_req, res) => {
  try {
    const [depositResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}::numeric), 0)` }).from(deposits).where(eq(deposits.status, 'completed'));
    const [withdrawalResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}::numeric), 0)` }).from(withdrawals).where(eq(withdrawals.status, 'approved'));
    const [pendingResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(withdrawals).where(eq(withdrawals.status, 'pending'));
    const [merchantResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(merchants).where(eq(merchants.isActive, true));

    res.json({
      totalDeposits: parseFloat(depositResult?.total || '0'),
      totalWithdrawals: parseFloat(withdrawalResult?.total || '0'),
      pendingWithdrawals: pendingResult?.count || 0,
      activeMerchants: merchantResult?.count || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

dashboardRouter.get('/volume', async (_req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const depositVolumes = await db
      .select({
        date: sql<string>`DATE(${deposits.createdAt})`,
        total: sql<string>`COALESCE(SUM(${deposits.amount}::numeric), 0)`,
      })
      .from(deposits)
      .where(gte(deposits.createdAt, sevenDaysAgo))
      .groupBy(sql`DATE(${deposits.createdAt})`)
      .orderBy(sql`DATE(${deposits.createdAt})`);

    const withdrawalVolumes = await db
      .select({
        date: sql<string>`DATE(${withdrawals.createdAt})`,
        total: sql<string>`COALESCE(SUM(${withdrawals.amount}::numeric), 0)`,
      })
      .from(withdrawals)
      .where(gte(withdrawals.createdAt, sevenDaysAgo))
      .groupBy(sql`DATE(${withdrawals.createdAt})`)
      .orderBy(sql`DATE(${withdrawals.createdAt})`);

    // Merge into day buckets
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });

    const result = days.map(date => {
      const dep = depositVolumes.find(v => v.date === date);
      const wit = withdrawalVolumes.find(v => v.date === date);
      return {
        date,
        deposits: parseFloat(dep?.total || '0'),
        withdrawals: parseFloat(wit?.total || '0'),
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch volume data' });
  }
});

dashboardRouter.get('/activity', async (_req, res) => {
  try {
    const recentDeposits = await db.select().from(deposits).orderBy(sql`${deposits.createdAt} DESC`).limit(5);
    const recentWithdrawals = await db.select().from(withdrawals).orderBy(sql`${withdrawals.createdAt} DESC`).limit(5);

    const activity = [
      ...recentDeposits.map(d => ({ id: d.id, type: 'deposit', amount: parseFloat(d.amount), status: d.status, time: d.createdAt })),
      ...recentWithdrawals.map(w => ({ id: w.id, type: 'withdrawal', amount: parseFloat(w.amount), status: w.status, time: w.createdAt })),
    ].sort((a, b) => (b.time?.getTime?.() || 0) - (a.time?.getTime?.() || 0)).slice(0, 10);

    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});
