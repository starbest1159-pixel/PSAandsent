/**
 * Slip Verification Pipeline — runs all 9 steps and aggregates results
 */
import crypto from 'crypto';
import type { StepInput, VerificationReport, OcrExtractedData } from './types.js';
import { runStep1Ocr } from './steps/step1-ocr.js';
import { runStep2BankCrossref } from './steps/step2-bank-crossref.js';
import { runStep3Duplicate, computePerceptualHash } from './steps/step3-duplicate.js';
import { runStep4Logo } from './steps/step4-logo.js';
import { runStep5Tamper } from './steps/step5-tamper.js';
import { runStep6Amount } from './steps/step6-amount.js';
import { runStep7Datetime } from './steps/step7-datetime.js';
import { runStep8Sender } from './steps/step8-sender.js';
import { runStep9PromptPayRef } from './steps/step9-promptpay-ref.js';

// Step weights for overall score calculation
const STEP_WEIGHTS: Record<number, number> = {
  1: 10,  // OCR
  2: 15,  // Bank cross-ref
  3: 10,  // Duplicate detection
  4: 5,   // Logo
  5: 15,  // Tamper detection
  6: 20,  // Amount
  7: 10,  // Datetime
  8: 5,   // Sender
  9: 10,  // PromptPay ref
};

export async function verifySlip(input: StepInput): Promise<VerificationReport> {
  // Step 1: OCR — extract text data first (other steps depend on it)
  const { result: step1, ocrData } = await runStep1Ocr(input);

  // Steps 2-9 can run in parallel, but we run sequentially for reliability
  const step2 = await runStep2BankCrossref(input);
  const step3 = await runStep3Duplicate(input);
  const step4 = await runStep4Logo(input);
  const step5 = await runStep5Tamper(input);
  const step6 = await runStep6Amount(input, ocrData);
  const step7 = await runStep7Datetime(input, ocrData);
  const step8 = await runStep8Sender(input, ocrData);
  const step9 = await runStep9PromptPayRef(input, ocrData);

  const steps = [step1, step2, step3, step4, step5, step6, step7, step8, step9];

  // Compute weighted overall score
  let totalWeight = 0;
  let weightedSum = 0;
  for (const step of steps) {
    const weight = STEP_WEIGHTS[step.step] || 10;
    weightedSum += step.score * weight;
    totalWeight += weight;
  }
  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  // Determine overall status
  let overallStatus: VerificationReport['overallStatus'];
  if (overallScore >= 80) {
    overallStatus = 'pass';
  } else if (overallScore >= 50) {
    overallStatus = 'warning';
  } else {
    overallStatus = 'fail';
  }

  // Extract perceptual hash from step 3 detail
  const perceptualHash = (step3.detail?.perceptualHash as string) || computePerceptualHash(input.imageBuffer);

  return {
    overallScore,
    overallStatus,
    steps,
    ocrData,
    pixelHash: input.pixelHash,
    perceptualHash,
    verifiedAt: new Date().toISOString(),
  };
}
