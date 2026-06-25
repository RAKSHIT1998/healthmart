import { createWorker } from 'tesseract.js';
import { logger } from '../../config/logger';
import type { IOcrProvider, OcrResult } from './IOcrProvider';

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'tab',
  'cap',
  'mg',
  'ml',
  'dose',
  'daily',
  'twice',
  'once',
  'doctor',
  'patient',
  'name',
  'date',
  'age',
  'sex',
]);

/** Free, in-process OCR (no external account required). Swap for a cloud OCR provider via IOcrProvider if higher accuracy is needed later. */
export class TesseractOcrProvider implements IOcrProvider {
  async extractText(imageUrl: string): Promise<OcrResult> {
    const worker = await createWorker('eng');
    try {
      const {
        data: { text },
      } = await worker.recognize(imageUrl);

      const matchedTerms = Array.from(
        new Set(
          text
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((token) => token.length >= 3 && !STOPWORDS.has(token)),
        ),
      );

      return { rawText: text.trim(), matchedTerms };
    } catch (err) {
      logger.error({ err, imageUrl }, 'OCR extraction failed');
      return { rawText: '', matchedTerms: [] };
    } finally {
      await worker.terminate();
    }
  }
}
