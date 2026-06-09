import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { db } from '@psaipay/db';
import { slipHashes, deposits } from '@psaipay/db';
import { eq } from 'drizzle-orm';
import { verifySlip } from '../lib/slip-verifier/index.js';
import type { StepInput } from '../lib/slip-verifier/types.js';

export const slipRouter = Router();
slipRouter.use(requireAuth);

slipRouter.post('/verify', async (req, res) => {
  try {
    const { imageBase64, depositId } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    // Decode base64 image
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Compute SHA-256 pixel hash for deduplication
    const pixelHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');

    // Check for exact duplicate
    const [existing] = await db.select().from(slipHashes).where(eq(slipHashes.hash, pixelHash));
    if (existing) {
      return res.status(409).json({ error: 'Duplicate slip', hash: pixelHash });
    }

    // Load deposit data if depositId provided
    let expectedAmount: number | null = null;
    let depositCreatedAt: Date | null = null;
    let merchantAccountId: string | null = null;
    let expectedRef1: string | null = null;
    let expectedRef2: string | null = null;
    let bankCallbackReceived = false;
    let bankCallbackData: Record<string, unknown> | null = null;
    let rpaVerified = false;

    if (depositId) {
      const [deposit] = await db.select().from(deposits).where(eq(deposits.id, depositId));
      if (deposit) {
        expectedAmount = parseFloat(deposit.amount);
        depositCreatedAt = deposit.createdAt || null;
        expectedRef1 = (deposit as any).ref1 || deposit.promptpayRef || null;
        expectedRef2 = (deposit as any).ref2 || null;
        bankCallbackReceived = (deposit as any).bankCallbackReceived || false;
        bankCallbackData = (deposit as any).bankCallbackData || null;
        rpaVerified = (deposit as any).rpaVerifiedAt != null;
        // Get merchant's PromptPay ID
        const { merchants } = await import('@psaipay/db');
        const [merchant] = await db.select().from(merchants).where(eq(merchants.id, deposit.merchantId));
        if (merchant) {
          merchantAccountId = merchant.promptpayId || null;
        }
      }
    }

    // Build pipeline input
    const stepInput: StepInput = {
      imageBase64,
      imageBuffer,
      expectedAmount,
      depositCreatedAt,
      merchantAccountId,
      expectedRef1,
      expectedRef2,
      bankCallbackReceived,
      bankCallbackData,
      rpaVerified,
      pixelHash,
    };

    // Run the full 9-step verification pipeline
    const report = await verifySlip(stepInput);

    // Store hash and verification results
    await db.insert(slipHashes).values({
      hash: pixelHash,
      depositId: depositId || null,
      perceptualHash: report.perceptualHash,
      ocrData: report.ocrData as any,
      verificationReport: report as any,
      overallScore: report.overallScore,
    });

    // Update deposit if verification passed
    if (depositId && report.overallStatus === 'pass') {
      await db.update(deposits).set({
        slipVerified: true,
        slipHash: pixelHash,
        updatedAt: new Date(),
      }).where(eq(deposits.id, depositId));
    }

    res.json({
      valid: report.overallStatus !== 'fail',
      hash: pixelHash,
      overallScore: report.overallScore,
      overallStatus: report.overallStatus,
      steps: report.steps.map(s => ({
        step: s.step,
        name: s.name,
        status: s.status,
        score: s.score,
        message: s.message,
        durationMs: s.durationMs,
      })),
      verifiedAt: report.verifiedAt,
    });
  } catch (err) {
    console.error('Slip verification error:', err);
    res.status(500).json({ error: 'Slip verification failed' });
  }
});
