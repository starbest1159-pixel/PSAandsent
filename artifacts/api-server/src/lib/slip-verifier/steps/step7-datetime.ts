/**
 * Step 7: Datetime Verification — Compare OCR datetime with deposit creation
 *
 * Checks if the payment datetime on the slip is within a reasonable window
 * of when the deposit was created (default: 24 hours).
 */
import type { StepInput, StepResult, OcrExtractedData } from '../types.js';

const MAX_HOURS_DIFF = 24;

function parseThaiDatetime(dtStr: string | null): Date | null {
  if (!dtStr) return null;

  // Try common formats: DD/MM/YYYY HH:mm, DD-MM-YYYY HH:mm, etc.
  const m = dtStr.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;

  let year = parseInt(m[3]);
  if (year < 100) year += 2000;
  // Thai Buddhist calendar (e.g., 2569 → 2026)
  if (year > 2400) year -= 543;

  const month = parseInt(m[2]) - 1;
  const day = parseInt(m[1]);
  const hour = parseInt(m[4]);
  const min = parseInt(m[5]);
  const sec = m[6] ? parseInt(m[6]) : 0;

  return new Date(year, month, day, hour, min, sec);
}

export async function runStep7Datetime(input: StepInput, ocrData: OcrExtractedData | null): Promise<StepResult> {
  const start = Date.now();

  if (!ocrData || !ocrData.datetime) {
    return {
      step: 7,
      name: 'Datetime Verification',
      status: 'warning',
      score: 30,
      message: 'OCR did not extract a datetime — cannot verify',
      durationMs: Date.now() - start,
    };
  }

  if (!input.depositCreatedAt) {
    return {
      step: 7,
      name: 'Datetime Verification',
      status: 'skipped',
      score: 50,
      message: 'No deposit creation timestamp provided for comparison',
      durationMs: Date.now() - start,
    };
  }

  const slipDate = parseThaiDatetime(ocrData.datetime);
  if (!slipDate) {
    return {
      step: 7,
      name: 'Datetime Verification',
      status: 'fail',
      score: 20,
      message: `Could not parse OCR datetime: "${ocrData.datetime}"`,
      durationMs: Date.now() - start,
    };
  }

  const depositDate = new Date(input.depositCreatedAt);
  const diffMs = Math.abs(slipDate.getTime() - depositDate.getTime());
  const diffHours = diffMs / (1000 * 60 * 60);

  const detail: Record<string, unknown> = {
    slipDatetime: slipDate.toISOString(),
    depositCreatedAt: depositDate.toISOString(),
    diffHours: Math.round(diffHours * 100) / 100,
  };

  if (diffHours <= 1) {
    return {
      step: 7,
      name: 'Datetime Verification',
      status: 'pass',
      score: 100,
      message: `Slip datetime is within 1 hour of deposit creation (${diffHours.toFixed(2)}h)`,
      detail,
      durationMs: Date.now() - start,
    };
  } else if (diffHours <= MAX_HOURS_DIFF) {
    const score = Math.round(100 * (1 - diffHours / MAX_HOURS_DIFF));
    return {
      step: 7,
      name: 'Datetime Verification',
      status: 'pass',
      score,
      message: `Slip datetime is within ${MAX_HOURS_DIFF}h window of deposit (${diffHours.toFixed(2)}h difference)`,
      detail,
      durationMs: Date.now() - start,
    };
  } else {
    return {
      step: 7,
      name: 'Datetime Verification',
      status: 'fail',
      score: 0,
      message: `Slip datetime is ${diffHours.toFixed(1)}h from deposit — exceeds ${MAX_HOURS_DIFF}h window`,
      detail,
      durationMs: Date.now() - start,
    };
  }
}
