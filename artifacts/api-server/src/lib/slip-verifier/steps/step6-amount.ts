/**
 * Step 6: Amount Verification — Compare OCR amount with expected deposit amount
 */
import type { StepInput, StepResult, OcrExtractedData } from '../types.js';

export async function runStep6Amount(input: StepInput, ocrData: OcrExtractedData | null): Promise<StepResult> {
  const start = Date.now();

  if (!ocrData || !ocrData.amount) {
    return {
      step: 6,
      name: 'Amount Verification',
      status: 'warning',
      score: 30,
      message: 'OCR did not extract an amount — cannot verify',
      durationMs: Date.now() - start,
    };
  }

  if (!input.expectedAmount) {
    return {
      step: 6,
      name: 'Amount Verification',
      status: 'skipped',
      score: 50,
      message: 'No expected amount provided for comparison',
      durationMs: Date.now() - start,
    };
  }

  const ocrAmount = parseFloat(ocrData.amount);
  const expected = input.expectedAmount;

  if (isNaN(ocrAmount)) {
    return {
      step: 6,
      name: 'Amount Verification',
      status: 'fail',
      score: 0,
      message: `OCR amount "${ocrData.amount}" is not a valid number`,
      durationMs: Date.now() - start,
    };
  }

  const diff = Math.abs(ocrAmount - expected);
  const diffPercent = expected > 0 ? (diff / expected) * 100 : 100;

  const detail: Record<string, unknown> = {
    ocrAmount,
    expectedAmount: expected,
    diff,
    diffPercent: Math.round(diffPercent * 100) / 100,
  };

  if (diff === 0) {
    return {
      step: 6,
      name: 'Amount Verification',
      status: 'pass',
      score: 100,
      message: `OCR amount ${ocrAmount} matches expected ${expected}`,
      detail,
      durationMs: Date.now() - start,
    };
  } else if (diffPercent < 1) {
    return {
      step: 6,
      name: 'Amount Verification',
      status: 'pass',
      score: 90,
      message: `OCR amount ${ocrAmount} is within 1% of expected ${expected}`,
      detail,
      durationMs: Date.now() - start,
    };
  } else if (diffPercent < 5) {
    return {
      step: 6,
      name: 'Amount Verification',
      status: 'warning',
      score: 60,
      message: `OCR amount ${ocrAmount} differs from expected ${expected} by ${diffPercent.toFixed(1)}%`,
      detail,
      durationMs: Date.now() - start,
    };
  } else {
    return {
      step: 6,
      name: 'Amount Verification',
      status: 'fail',
      score: Math.max(0, Math.round(100 - diffPercent * 2)),
      message: `OCR amount ${ocrAmount} significantly differs from expected ${expected} (${diffPercent.toFixed(1)}%)`,
      detail,
      durationMs: Date.now() - start,
    };
  }
}
