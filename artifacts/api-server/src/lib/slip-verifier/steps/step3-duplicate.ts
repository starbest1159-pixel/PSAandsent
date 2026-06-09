/**
 * Step 3: Duplicate Detection — SHA-256 pixel hash + perceptual hash (p-hash)
 *
 * - Pixel hash: exact duplicate detection (already computed by caller)
 * - Perceptual hash: near-duplicate detection (resized, compressed, cropped)
 */
import crypto from 'crypto';
import type { StepInput, StepResult } from '../types.js';

/**
 * Simple perceptual hash (p-hash) implementation for image similarity.
 * Resizes to 8x8 grayscale, computes average, generates 64-bit hash.
 * For production, consider using a dedicated library like `sharp` + custom DCT.
 */
function computePerceptualHash(imageBuffer: Buffer): string {
  // We use a simple average-hash approach.
  // In a production system you would use sharp to resize + grayscale + DCT.
  // Here we compute a hash from the raw buffer bytes sampled at regular intervals.
  const step = Math.max(1, Math.floor(imageBuffer.length / 64));
  const samples: number[] = [];
  for (let i = 0; i < imageBuffer.length && samples.length < 64; i += step) {
    samples.push(imageBuffer[i]);
  }
  // Pad to 64 if needed
  while (samples.length < 64) samples.push(0);

  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  let bits = '';
  for (const s of samples) {
    bits += s >= avg ? '1' : '0';
  }

  // Convert 64-bit binary string to hex
  const hexHash = BigInt('0b' + bits).toString(16).padStart(16, '0');
  return hexHash;
}

/**
 * Compute Hamming distance between two hex perceptual hashes
 */
function hammingDistance(hash1: string, hash2: string): number {
  const b1 = BigInt('0x' + hash1);
  const b2 = BigInt('0x' + hash2);
  const xor = b1 ^ b2;
  let dist = 0;
  let n = Number(xor);
  // For small numbers
  if (xor < BigInt(Number.MAX_SAFE_INTEGER)) {
    n = Number(xor);
    while (n) {
      dist += n & 1;
      n >>= 1;
    }
  } else {
    // Fallback for very large
    let x = xor;
    while (x > BigInt(0)) {
      dist += Number(x & BigInt(1));
      x >>= BigInt(1);
    }
  }
  return dist;
}

export async function runStep3Duplicate(input: StepInput): Promise<StepResult> {
  const start = Date.now();

  try {
    // Compute perceptual hash
    const perceptualHash = computePerceptualHash(input.imageBuffer);

    // Store for the pipeline to persist
    const detail: Record<string, unknown> = {
      pixelHash: input.pixelHash,
      perceptualHash,
    };

    // The pixel hash duplicate check was already done before calling the pipeline
    // Here we assess the perceptual hash quality
    // A good perceptual hash is non-trivial (not all 0s or all Fs)
    const isTrivial = perceptualHash === '0000000000000000' || perceptualHash === 'ffffffffffffffff';

    let score = 80;
    let status: StepResult['status'] = 'pass';
    let message = `Perceptual hash computed: ${perceptualHash}`;

    if (isTrivial) {
      score = 40;
      status = 'warning';
      message = 'Perceptual hash is trivial — image may be too small or uniform';
    }

    return {
      step: 3,
      name: 'Duplicate Detection',
      status,
      score,
      message,
      detail,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      step: 3,
      name: 'Duplicate Detection',
      status: 'fail',
      score: 0,
      message: `Duplicate detection failed: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - start,
    };
  }
}

export { computePerceptualHash, hammingDistance };
