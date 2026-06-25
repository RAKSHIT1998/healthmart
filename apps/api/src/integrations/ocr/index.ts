import { TesseractOcrProvider } from './TesseractOcrProvider';
import type { IOcrProvider } from './IOcrProvider';

export * from './IOcrProvider';

export function getOcrProvider(): IOcrProvider {
  return new TesseractOcrProvider();
}
