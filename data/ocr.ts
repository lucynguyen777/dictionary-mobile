import {
  OcrEngine,
  OcrEngineResult,
  createUnavailableNativeOcrEngine,
  extractOcrLookupCandidates,
  normalizeOcrText,
  runOcrEngine,
} from './ocrEngine';

export type { OcrBoundingBox, OcrEngine, OcrEngineResult, OcrTextBlock, OcrTextLine } from './ocrEngine';
export {
  OcrEngineUnavailableError,
  createDeterministicOcrResult,
  createUnavailableNativeOcrEngine,
  extractOcrLookupCandidates,
  normalizeOcrText,
  runOcrEngine,
} from './ocrEngine';

export const unavailableNativeOcrEngine = createUnavailableNativeOcrEngine();

// Without a real engine this throws OcrEngineUnavailableError; fixture text is for tests only
// (pass createDeterministicOcrResult through an explicit engine there).
export async function performOCR(
  imageUri: string,
  languageCode: string,
  engine: OcrEngine = unavailableNativeOcrEngine
): Promise<OcrEngineResult> {
  return runOcrEngine(engine, { imageUri, languageCode });
}

export function createOcrLookupSuggestions(result: OcrEngineResult) {
  return extractOcrLookupCandidates({
    ...result,
    text: normalizeOcrText(result.text),
  });
}

export type { OcrProviderId, OcrProviderRegistry, OcrProviderRegistryOptions } from './ocrProviderRegistry';
export { createOcrProviderRegistry, createRegistryFromProviders } from './ocrProviderRegistry';
