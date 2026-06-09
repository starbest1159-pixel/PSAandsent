/**
 * Step 8: Sender Verification — Compare OCR sender with merchant's known account
 */
import type { StepInput, StepResult, OcrExtractedData } from '../types.js';

export async function runStep8Sender(input: StepInput, ocrData: OcrExtractedData | null): Promise<StepResult> {
  const start = Date.now();

  if (!ocrData) {
    return {
      step: 8,
      name: 'Sender Verification',
      status: 'warning',
      score: 30,
      message: 'No OCR data available for sender verification',
      durationMs: Date.now() - start,
    };
  }

  const detail: Record<string, unknown> = {
    ocrSenderName: ocrData.senderName,
    ocrSenderAccount: ocrData.senderAccount,
    merchantAccountId: input.merchantAccountId,
  };

  // If no merchant account ID to compare against, skip
  if (!input.merchantAccountId) {
    return {
      step: 8,
      name: 'Sender Verification',
      status: 'skipped',
      score: 50,
      message: 'No merchant account ID provided for comparison',
      detail,
      durationMs: Date.now() - start,
    };
  }

  // Check if OCR extracted a sender account
  if (!ocrData.senderAccount) {
    return {
      step: 8,
      name: 'Sender Verification',
      status: 'warning',
      score: 30,
      message: 'OCR did not extract a sender account number',
      detail,
      durationMs: Date.now() - start,
    };
  }

  // Normalize both for comparison (remove dashes, spaces)
  const normalize = (s: string) => s.replace(/[-\s]/g, '');
  const ocrAccount = normalize(ocrData.senderAccount);
  const merchantAccount = normalize(input.merchantAccountId);

  if (ocrAccount === merchantAccount) {
    return {
      step: 8,
      name: 'Sender Verification',
      status: 'pass',
      score: 100,
      message: `OCR sender account matches merchant account`,
      detail,
      durationMs: Date.now() - start,
    };
  }

  // Partial match (last 4 digits)
  if (ocrAccount.length >= 4 && merchantAccount.length >= 4) {
    const ocrLast4 = ocrAccount.slice(-4);
    const merchantLast4 = merchantAccount.slice(-4);
    if (ocrLast4 === merchantLast4) {
      return {
        step: 8,
        name: 'Sender Verification',
        status: 'pass',
        score: 80,
        message: `OCR sender account last 4 digits match merchant account`,
        detail,
        durationMs: Date.now() - start,
      };
    }
  }

  return {
    step: 8,
    name: 'Sender Verification',
    status: 'fail',
    score: 10,
    message: `OCR sender account does not match merchant account`,
    detail,
    durationMs: Date.now() - start,
  };
}
