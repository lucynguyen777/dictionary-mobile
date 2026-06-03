import { OcrEngine, createDeterministicOcrResult, createUnavailableNativeOcrEngine } from './ocrEngine';
import { ChandraOcrClient, createChandraOCRProvider } from './providers/ChandraOCRProvider';
import { MLKitRecognizer, createMLKitOCRProvider } from './providers/MLKitOCRProvider';

export type OcrProviderId = 'mlkit' | 'chandra' | 'deterministic-fixture' | 'native-ocr-unavailable';

export type OcrProviderRegistry = {
  list: () => OcrEngine[];
  get: (id: OcrProviderId | string) => OcrEngine | null;
  select: (id?: OcrProviderId | string | null) => OcrEngine;
};

export type OcrProviderRegistryOptions = {
  mlkitRecognizer?: MLKitRecognizer;
  chandraClient?: ChandraOcrClient;
  defaultProviderId?: OcrProviderId;
};

export function createOcrProviderRegistry(options: OcrProviderRegistryOptions = {}): OcrProviderRegistry {
  const providers = [
    createMLKitOCRProvider(options.mlkitRecognizer),
    createChandraOCRProvider(options.chandraClient),
    createDeterministicFixtureProvider(),
    createUnavailableNativeOcrEngine(),
  ];

  return createRegistryFromProviders(providers, options.defaultProviderId ?? 'mlkit');
}

export function createRegistryFromProviders(
  providers: OcrEngine[],
  defaultProviderId: OcrProviderId | string
): OcrProviderRegistry {
  const providerMap = new Map(providers.map((provider) => [provider.id, provider]));
  const fallback = providerMap.get(defaultProviderId) ?? providerMap.get('native-ocr-unavailable') ?? providers[0];

  return {
    list: () => [...providers],
    get: (id) => providerMap.get(id) ?? null,
    select: (id) => (id ? providerMap.get(id) ?? fallback : fallback),
  };
}

function createDeterministicFixtureProvider(): OcrEngine {
  return {
    id: 'deterministic-fixture',
    label: 'Deterministic OCR fixture',
    isAvailable: () => true,
    recognizeText: async ({ imageUri, languageCode }) => createDeterministicOcrResult({ imageUri, languageCode }),
  };
}
