/** Shared types for the 9-step slip verification pipeline */

export interface OcrExtractedData {
  amount: string | null;
  datetime: string | null;
  senderName: string | null;
  senderAccount: string | null;
  ref1: string | null;
  ref2: string | null;
  bankName: string | null;
  rawText: string;
  confidence: number;
}

export interface StepInput {
  /** Base64-encoded slip image */
  imageBase64: string;
  /** Buffer of the decoded image */
  imageBuffer: Buffer;
  /** Expected deposit amount (from the deposit record) */
  expectedAmount: number | null;
  /** Deposit creation timestamp */
  depositCreatedAt: Date | null;
  /** Merchant's known PromptPay/account ID */
  merchantAccountId: string | null;
  /** PromptPay ref from the deposit */
  expectedRef1: string | null;
  expectedRef2: string | null;
  /** Whether a bank callback was received for this deposit */
  bankCallbackReceived: boolean;
  /** Data from the bank callback */
  bankCallbackData: Record<string, unknown> | null;
  /** Whether RPA verified this deposit */
  rpaVerified: boolean;
  /** SHA-256 hash of the image pixels */
  pixelHash: string;
}

export type StepStatus = 'pass' | 'fail' | 'warning' | 'skipped';

export interface StepResult {
  /** Which step this is (1-9) */
  step: number;
  /** Human-readable step name */
  name: string;
  /** Pass / fail / warning / skipped */
  status: StepStatus;
  /** Score 0-100 for this step */
  score: number;
  /** Human-readable explanation */
  message: string;
  /** Arbitrary detail for the UI */
  detail?: Record<string, unknown>;
  /** Duration in ms */
  durationMs: number;
}

export interface VerificationReport {
  /** Overall score 0-100 */
  overallScore: number;
  /** Overall pass/fail */
  overallStatus: StepStatus;
  /** Per-step results */
  steps: StepResult[];
  /** OCR data extracted from the slip */
  ocrData: OcrExtractedData | null;
  /** SHA-256 pixel hash */
  pixelHash: string;
  /** Perceptual hash */
  perceptualHash: string;
  /** Timestamp */
  verifiedAt: string;
}
