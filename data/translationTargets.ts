// App language codes mapped to DeepL target codes. Languages DeepL cannot translate into are absent,
// so the UI hides the translate action instead of offering a request that will fail.
const DEEPL_TARGET_BY_LANGUAGE: Record<string, string> = {
  ar: 'AR',
  de: 'DE',
  en: 'EN-US',
  es: 'ES',
  et: 'ET',
  fi: 'FI',
  fr: 'FR',
  he: 'HE',
  hu: 'HU',
  id: 'ID',
  it: 'IT',
  ja: 'JA',
  ko: 'KO',
  pt: 'PT-BR',
  ru: 'RU',
  tr: 'TR',
  uk: 'UK',
  vi: 'VI',
  zh: 'ZH-HANS',
};

export function toDeepLTargetLanguage(languageCode: string) {
  return DEEPL_TARGET_BY_LANGUAGE[languageCode.toLowerCase()] ?? null;
}

// Bilingual lookups translate into the chosen target; monolingual lookups translate into the learner's
// native language. Returns null when there is nothing useful or supported to translate into.
export function getDefinitionTranslationTarget(sourceLang: string, targetLang: string, nativeLang = 'vi') {
  const target = sourceLang !== targetLang ? targetLang : nativeLang;
  if (target === sourceLang) return null;
  return toDeepLTargetLanguage(target);
}

// DeepL source codes are unregioned (EN, PT, ZH); omit the hint for unsupported sources and let DeepL detect.
export function toDeepLSourceLanguage(languageCode: string) {
  return toDeepLTargetLanguage(languageCode)?.split('-')[0];
}
