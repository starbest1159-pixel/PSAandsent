/**
 * Step 9: PromptPay Ref Validation — Validate ref1/ref2 format + cross-check with deposit
 */
import type { StepInput, StepResult, OcrExtractedData } from '../types.js';

// PromptPay ref1 is typically a date-based string like "00210123456701" or numeric
// PromptPay ref2 is typically a short numeric string
const REF1_PATTERN = /^\d{10,20}$/;
const REF2_PATTERN = /^\d{1,20}$/;

export async function runStep9PromptPayRef(input: StepInput, ocrData: OcrExtractedData | null): Promise<StepResult> {
  const start = Date.now();

  const detail: Record<string, unknown> = {
    ocrRef1: ocrData?.ref1,
    ocrRef2: ocrData?.ref2,
    expectedRef1: input.expectedRef1,
    expectedRef2: input.expectedRef2,
  };

  const hasOcrRef1 = ocrData?.ref1 && REF1_PATTERN.test(ocrData.ref1);
  const hasOcrRef2 = ocrData?.ref2 && REF2_PATTERN.test(ocrData.ref2);

  // If no refs extracted at all
  if (!ocrData?.ref1 && !ocrData?.ref2) {
    return {
      step: 9,
      name: 'PromptPay Ref Validation',
      status: 'warning',
      score: 30,
      message: 'OCR did not extract any PromptPay reference numbers',
      detail,
      durationMs: Date.now() - start,
    };
  }

  let score = 0;
  let matchMessages: string[] = [];

  // Validate ref1 format
  if (hasOcrRef1) {
    score += 25;
    matchMessages.push('ref1 format valid');
  } else if (ocrData?.ref1) {
    matchMessages.push('ref1 format unexpected');
  }

  // Validate ref2 format
  if (hasOcrRef2) {
    score += 25;
    matchMessages.push('ref2 format valid');
  } else if (ocrData?.ref2) {
    matchMessages.push('ref2 format unexpected');
  }

  // Cross-check with expected refs from deposit
  if (input.expectedRef1 && ocrData?.ref1) {
    if (ocrData.ref1 === input.expectedRef1) {
      score += 25;
      matchMessages.push('ref1 matches deposit');
    } else {
      matchMessages.push('ref1 does not match deposit');
    }
  }

  if (input.expectedRef2 && ocrData?.ref2) {
    if (ocrData.ref2 === input.expectedRef2) {
      score += 25;
      matchMessages.push('ref2 matches deposit');
    } else {
      matchMessages.push('ref2 does not match deposit');
    }
  }

  // If no expected refs, give partial credit for having valid formats
  if (!input.expectedRef1 && !input.expectedRef2 && (hasOcrRef1 || hasOcrRef2)) {
    score = Math.max(score, 50);
  }

  const status: StepResult['status'] = score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail';
  const message = `PromptPay ref check: ${matchMessages.join('; ')}`;

  return {
    step: 9,
    name: 'PromptPay Ref Validation',
    status,
    score,
    message,
    detail,
    durationMs: Date.now() - start,
  };
}
