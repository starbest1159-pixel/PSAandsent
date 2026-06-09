/**
 * Step 1: OCR — Extract text from the slip image using Tesseract.js
 */
import Tesseract from 'tesseract.js';
import type { StepInput, StepResult, OcrExtractedData } from '../types.js';

// Thai bank slip regex patterns
const AMOUNT_PATTERN = /(\d{1,3}(?:,\d{3})*\.\d{2})\s*บาท/;          // e.g. "1,500.00 บาท"
const AMOUNT_PATTERN_EN = /(\d{1,3}(?:,\d{3})*\.\d{2})\s*THB/i;     // e.g. "1,500.00 THB"
const DATE_PATTERN = /(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\s+(\d{1,2}:\d{2}(?::\d{2})?)/;
const SENDER_PATTERN = /จาก\s*[:：]?\s*(.+?)(?:\n|$)/;
const SENDER_ACCOUNT_PATTERN = /เลขบัญชี\s*[:：]?\s*(\d{3}-\d-\d{5}-\d|\d{10,13})/;
const REF1_PATTERN = /ref\s*1\s*[:：]?\s*(\S+)/i;
const REF2_PATTERN = /ref\s*2\s*[:：]?\s*(\S+)/i;
const BANK_NAMES = ['BBL', 'KBANK', 'KTB', 'BAY', 'SCB', 'TMB', 'UOB', 'GSB',
  'Bangkok Bank', 'Kasikorn', 'Krungthai', 'Ayudhya', 'Siam Commercial', 'TMBThanachart'];

export async function runStep1Ocr(input: StepInput): Promise<{ result: StepResult; ocrData: OcrExtractedData }> {
  const start = Date.now();

  try {
    const { data } = await Tesseract.recognize(input.imageBuffer, 'tha+eng', {
      logger: () => {},
    });

    const text: string = data.text || '';
    const confidence = data.confidence || 0;

    const ocrData: OcrExtractedData = {
      amount: extractAmount(text),
      datetime: extractDatetime(text),
      senderName: extractSender(text),
      senderAccount: extractSenderAccount(text),
      ref1: extractRef(text, REF1_PATTERN),
      ref2: extractRef(text, REF2_PATTERN),
      bankName: extractBankName(text),
      rawText: text,
      confidence,
    };

    const status = confidence > 60 ? 'pass' : confidence > 30 ? 'warning' : 'fail';
    const score = Math.round(confidence);

    return {
      result: {
        step: 1,
        name: 'OCR Extraction',
        status,
        score,
        message: `Extracted text with ${confidence.toFixed(1)}% confidence. Amount: ${ocrData.amount || 'N/A'}, Date: ${ocrData.datetime || 'N/A'}`,
        detail: { ocrData: { ...ocrData, rawText: undefined } },
        durationMs: Date.now() - start,
      },
      ocrData,
    };
  } catch (err) {
    return {
      result: {
        step: 1,
        name: 'OCR Extraction',
        status: 'fail',
        score: 0,
        message: `OCR failed: ${err instanceof Error ? err.message : String(err)}`,
        durationMs: Date.now() - start,
      },
      ocrData: {
        amount: null, datetime: null, senderName: null, senderAccount: null,
        ref1: null, ref2: null, bankName: null, rawText: '', confidence: 0,
      },
    };
  }
}

function extractAmount(text: string): string | null {
  const m = text.match(AMOUNT_PATTERN) || text.match(AMOUNT_PATTERN_EN);
  return m ? m[1].replace(/,/g, '') : null;
}

function extractDatetime(text: string): string | null {
  const m = text.match(DATE_PATTERN);
  return m ? m[0] : null;
}

function extractSender(text: string): string | null {
  const m = text.match(SENDER_PATTERN);
  return m ? m[1].trim() : null;
}

function extractSenderAccount(text: string): string | null {
  const m = text.match(SENDER_ACCOUNT_PATTERN);
  return m ? m[1] : null;
}

function extractRef(text: string, pattern: RegExp): string | null {
  const m = text.match(pattern);
  return m ? m[1] : null;
}

function extractBankName(text: string): string | null {
  for (const name of BANK_NAMES) {
    if (text.toLowerCase().includes(name.toLowerCase())) return name;
  }
  return null;
}
