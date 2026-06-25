export interface OcrResult {
  rawText: string;
  /** Lowercased tokens >= 3 chars, used for naive medicine-name matching against the catalog. */
  matchedTerms: string[];
}

export interface IOcrProvider {
  extractText(imageUrl: string): Promise<OcrResult>;
}
