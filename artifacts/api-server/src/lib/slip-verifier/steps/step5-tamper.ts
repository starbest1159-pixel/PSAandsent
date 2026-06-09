/**
 * Step 5: Tamper Detection — Error Level Analysis (ELA) via sharp
 *
 * Re-compresses the image at a known JPEG quality and compares with the original.
 * Regions that were edited/modified will show different error levels.
 */
import sharp from 'sharp';
import type { StepInput, StepResult } from '../types.js';

const ELA_QUALITY = 75;
const ELA_THRESHOLD = 30; // Pixel intensity difference threshold
const ELA_RATIO_THRESHOLD = 0.15; // 15% of pixels showing high error = suspicious

export async function runStep5Tamper(input: StepInput): Promise<StepResult> {
  const start = Date.now();

  try {
    // Get original image as raw pixels
    const originalMeta = await sharp(input.imageBuffer).metadata();
    const originalRaw = await sharp(input.imageBuffer)
      .resize(512, 512, { fit: 'inside' })
      .raw()
      .toBuffer();

    // Re-compress at known quality
    const recompressed = await sharp(input.imageBuffer)
      .resize(512, 512, { fit: 'inside' })
      .jpeg({ quality: ELA_QUALITY })
      .toBuffer();

    const recompressedRaw = await sharp(recompressed)
      .raw()
      .toBuffer();

    // Compare pixel-by-pixel
    const len = Math.min(originalRaw.length, recompressedRaw.length);
    let highErrorPixels = 0;
    let totalPixels = 0;
    let maxDiff = 0;
    let sumDiff = 0;

    for (let i = 0; i < len; i++) {
      const diff = Math.abs(originalRaw[i] - recompressedRaw[i]);
      sumDiff += diff;
      if (diff > ELA_THRESHOLD) {
        highErrorPixels++;
      }
      if (diff > maxDiff) maxDiff = diff;
      totalPixels++;
    }

    const highErrorRatio = totalPixels > 0 ? highErrorPixels / totalPixels : 0;
    const avgDiff = totalPixels > 0 ? sumDiff / totalPixels : 0;

    const detail: Record<string, unknown> = {
      highErrorRatio: Math.round(highErrorRatio * 10000) / 100,
      avgDiff: Math.round(avgDiff * 100) / 100,
      maxDiff,
      elaQuality: ELA_QUALITY,
    };

    // Score: lower highErrorRatio = better (more authentic)
    let score: number;
    let status: StepResult['status'];
    let message: string;

    if (highErrorRatio < 0.05) {
      // Less than 5% high-error pixels — likely authentic
      score = 90;
      status = 'pass';
      message = 'ELA shows minimal anomalies — slip appears authentic';
    } else if (highErrorRatio < ELA_RATIO_THRESHOLD) {
      score = 60;
      status = 'warning';
      message = `ELA shows moderate anomalies (${(highErrorRatio * 100).toFixed(1)}% high-error pixels) — possible minor edits`;
    } else {
      score = Math.max(0, Math.round(100 * (1 - highErrorRatio)));
      status = 'fail';
      message = `ELA shows significant anomalies (${(highErrorRatio * 100).toFixed(1)}% high-error pixels) — slip may be tampered`;
    }

    return {
      step: 5,
      name: 'Tamper Detection (ELA)',
      status,
      score,
      message,
      detail,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      step: 5,
      name: 'Tamper Detection (ELA)',
      status: 'fail',
      score: 0,
      message: `ELA failed: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - start,
    };
  }
}
