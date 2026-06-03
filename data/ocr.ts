import {
  OcrEngine,
  OcrEngineResult,
  createDeterministicOcrResult,
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

export async function performOCR(imageUri: string, languageCode: string, engine?: OcrEngine): Promise<OcrEngineResult> {
  if (engine) return runOcrEngine(engine, { imageUri, languageCode });

  return createDeterministicOcrResult({ imageUri, languageCode });
}

export function createOcrLookupSuggestions(result: OcrEngineResult) {
  return extractOcrLookupCandidates({
    ...result,
    text: normalizeOcrText(result.text),
  });
}

export const unavailableNativeOcrEngine = createUnavailableNativeOcrEngine();

export type { OcrProviderId, OcrProviderRegistry, OcrProviderRegistryOptions } from './ocrProviderRegistry';
export { createOcrProviderRegistry, createRegistryFromProviders } from './ocrProviderRegistry';
