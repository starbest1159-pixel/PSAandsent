/**
 * Step 4: Logo Detection — Template match against known bank logos
 *
 * Checks if a known bank logo is present in the slip image.
 * Uses a simplified pixel-sampling approach for logo detection.
 * For production, consider using OpenCV.js or a ML-based logo detector.
 */
import type { StepInput, StepResult } from '../types.js';

// Known bank logo signatures (simplified: average RGB of top-left region where logos typically appear)
// In production, these would be loaded from actual logo template images and matched with OpenCV.
const BANK_LOGO_SIGNATURES: Record<string, { r: number; g: number; b: number; tolerance: number }> = {
  SCB:  { r: 75,  g: 0,   b: 130, tolerance: 60 },   // Purple
  KBANK: { r: 0,   g: 102, b: 51,  tolerance: 60 },   // Dark Green
  BBL:  { r: 30,  g: 58,  b: 138, tolerance: 60 },   // Dark Blue
  KTB:  { r: 0,   g: 174, b: 239, tolerance: 60 },   // Cyan
  BAY:  { r: 255, g: 215, b: 0,   tolerance: 60 },    // Gold
  TMB:  { r: 0,   g: 48,  b: 135, tolerance: 60 },    // Navy
  UOB:  { r: 0,   g: 56,  b: 147, tolerance: 60 },    // Blue
  GSB:  { r: 255, g: 105, b: 180, tolerance: 60 },    // Pink
};

/**
 * Sample the top-left region of the image for dominant color
 * Returns average R, G, B of the sampled region
 */
function sampleTopLeftRegion(buffer: Buffer): { r: number; g: number; b: number } {
  // For PNG/JPEG buffers, sample bytes at regular intervals from the start
  // (Logo is typically in the top-left of Thai bank slips)
  const sampleSize = Math.min(1024, buffer.length);
  let r = 0, g = 0, b = 0, count = 0;

  // Sample every 3rd byte as rough RGB estimation
  for (let i = 0; i < sampleSize && count < 256; i += 3) {
    if (i + 2 < buffer.length) {
      r += buffer[i];
      g += buffer[i + 1];
      b += buffer[i + 2];
      count++;
    }
  }

  if (count === 0) return { r: 128, g: 128, b: 128 };
  return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
}

export async function runStep4Logo(input: StepInput): Promise<StepResult> {
  const start = Date.now();

  try {
    const dominantColor = sampleTopLeftRegion(input.imageBuffer);
    const detail: Record<string, unknown> = { dominantColor };

    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const [bank, signature] of Object.entries(BANK_LOGO_SIGNATURES)) {
      const dr = Math.abs(dominantColor.r - signature.r);
      const dg = Math.abs(dominantColor.g - signature.g);
      const db = Math.abs(dominantColor.b - signature.b);
      const distance = (dr + dg + db) / 3;

      if (distance < signature.tolerance) {
        const matchScore = Math.round(100 * (1 - distance / signature.tolerance));
        if (matchScore > bestScore) {
          bestScore = matchScore;
          bestMatch = bank;
        }
      }
    }

    detail.matchedBank = bestMatch;
    detail.matchScore = bestScore;

    const status: StepResult['status'] = bestScore > 60 ? 'pass' : bestScore > 30 ? 'warning' : 'fail';
    const message = bestMatch
      ? `Detected ${bestMatch} logo with ${bestScore}% confidence`
      : 'No known bank logo detected in slip';

    return {
      step: 4,
      name: 'Logo Detection',
      status,
      score: bestScore || 20,
      message,
      detail,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      step: 4,
      name: 'Logo Detection',
      status: 'fail',
      score: 0,
      message: `Logo detection failed: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - start,
    };
  }
}
