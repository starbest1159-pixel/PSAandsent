/**
 * Step 2: Bank Cross-Reference — Check PromptPay callback / RPA match
 *
 * Verifies that the deposit was confirmed by an external source:
 * - A bank callback (webhook) was received for this deposit
 * - An RPA bot verified the transaction
 */
import type { StepInput, StepResult } from '../types.js';

export async function runStep2BankCrossref(input: StepInput): Promise<StepResult> {
  const start = Date.now();

  let score = 0;
  let status: StepResult['status'] = 'fail';
  let message = '';
  const detail: Record<string, unknown> = {};

  // Check if bank callback was received
  if (input.bankCallbackReceived && input.bankCallbackData) {
    detail.callbackReceived = true;
    detail.callbackData = input.bankCallbackData;
    score += 50;
  }

  // Check if RPA verified
  if (input.rpaVerified) {
    detail.rpaVerified = true;
    score += 50;
  }

  if (score >= 100) {
    status = 'pass';
    message = 'Bank callback received and RPA verified — strong cross-reference';
  } else if (score >= 50) {
    status = 'warning';
    message = input.bankCallbackReceived
      ? 'Bank callback received but RPA not yet verified'
      : 'RPA verified but no bank callback received';
  } else {
    status = 'warning'; // Not a hard fail — may be manual verification
    message = 'No bank callback or RPA verification found for this deposit';
  }

  return {
    step: 2,
    name: 'Bank Cross-Reference',
    status,
    score,
    message,
    detail,
    durationMs: Date.now() - start,
  };
}
