import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { db } from '@psaipay/db';
import { webhookLogs, deposits, merchants } from '@psaipay/db';
import { eq } from 'drizzle-orm';

export const webhooksRouter = Router();

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// Auth-protected endpoints
webhooksRouter.get('/logs', requireAuth, async (_req, res) => {
  try {
    const data = await db.select().from(webhookLogs);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch webhook logs' });
  }
});

webhooksRouter.post('/test', requireAuth, async (req, res) => {
  const { url, event, payload, secret } = req.body;
  const body = JSON.stringify(payload || { event });
  const sig = signPayload(body, secret || process.env.WEBHOOK_SECRET || 'secret');
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-PSAiPay-Signature': sig },
      body,
    });
    const [log] = await db.insert(webhookLogs).values({
      event,
      url,
      payload: payload || { event },
      statusCode: r.status,
      success: r.ok,
      attempt: 1,
    }).returning();
    res.json(log);
  } catch (err) {
    const [log] = await db.insert(webhookLogs).values({
      event,
      url,
      payload: payload || { event },
      success: false,
      response: String(err),
      attempt: 1,
    }).returning();
    res.status(500).json(log);
  }
});

/**
 * POST /api/webhooks/promptpay-callback
 * Inbound receiver for PromptPay bank callbacks.
 * This endpoint is called by the bank/payment provider when a payment is completed.
 * It does NOT require admin auth — it uses signature verification instead.
 */
webhooksRouter.post('/promptpay-callback', async (req, res) => {
  const startTime = Date.now();
  try {
    const callbackSecret = process.env.PROMPTPAY_CALLBACK_SECRET || '';
    const signature = req.headers['x-promptpay-signature'] as string;
    const body = JSON.stringify(req.body);

    // Verify signature if secret is configured
    if (callbackSecret && signature) {
      const expectedSig = signPayload(body, callbackSecret);
      if (signature !== expectedSig) {
        await db.insert(webhookLogs).values({
          merchantId: null,
          event: 'promptpay_callback_invalid_sig',
          url: '/api/webhooks/promptpay-callback',
          payload: req.body,
          success: false,
          response: 'Invalid signature',
          attempt: 1,
        });
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { ref1, ref2, amount, transactionId, senderAccount, senderName, status } = req.body;

    // Find the deposit by ref1 (which matches the promptpayRef)
    let deposit = null;
    if (ref1) {
      const results = await db.select().from(deposits).where(eq(deposits.promptpayRef, ref1));
      deposit = results[0] || null;
    }

    if (!deposit) {
      await db.insert(webhookLogs).values({
        merchantId: null,
        event: 'promptpay_callback_no_deposit',
        url: '/api/webhooks/promptpay-callback',
        payload: req.body,
        success: false,
        response: `No deposit found for ref1: ${ref1}`,
        attempt: 1,
      });
      return res.status(200).json({ received: true, matched: false });
    }

    // Update deposit with callback data
    const callbackData = {
      ref1,
      ref2,
      amount,
      transactionId,
      senderAccount,
      senderName,
      status,
      receivedAt: new Date().toISOString(),
    };

    await db.update(deposits).set({
      status: status === 'success' ? 'completed' : 'failed',
      bankCallbackReceived: true,
      bankCallbackData: callbackData,
      updatedAt: new Date(),
    }).where(eq(deposits.id, deposit.id));

    // Log the callback
    await db.insert(webhookLogs).values({
      merchantId: deposit.merchantId,
      event: 'promptpay_callback',
      url: '/api/webhooks/promptpay-callback',
      payload: req.body,
      success: true,
      statusCode: 200,
      attempt: 1,
    });

    // Notify merchant via their webhook URL if configured
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, deposit.merchantId));
    if (merchant?.webhookUrl) {
      try {
        const merchantPayload = {
          event: 'payment.completed',
          depositId: deposit.id,
          amount: deposit.amount,
          ref1,
          ref2,
          transactionId,
          status: 'completed',
        };
        const merchantBody = JSON.stringify(merchantPayload);
        const merchantSig = merchant.webhookSecret
          ? signPayload(merchantBody, merchant.webhookSecret)
          : '';

        await fetch(merchant.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-PSAiPay-Signature': merchantSig,
          },
          body: merchantBody,
          signal: AbortSignal.timeout(10000),
        });
      } catch {
        // Merchant notification failure is non-critical
      }
    }

    res.status(200).json({ received: true, matched: true, depositId: deposit.id });
  } catch (err) {
    console.error('PromptPay callback error:', err);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});
