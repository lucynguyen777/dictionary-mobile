import { getLanguageByCode, languageOptions, type LanguageCode } from './languages';
import { findLocalDictionaryEntry, normalizeLookupTerm } from './localLexicon';

export type LookupLanguageDetection = {
  languageCode: LanguageCode;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
};

const scriptRules: { code: LanguageCode; pattern: RegExp; reason: string }[] = [
  { code: 'ar', pattern: /[\u0600-\u06FF]/u, reason: 'Arabic script' },
  { code: 'he', pattern: /[\u0590-\u05FF]/u, reason: 'Hebrew script' },
  { code: 'hi', pattern: /[\u0900-\u097F]/u, reason: 'Devanagari script' },
  { code: 'ja', pattern: /[\u3040-\u30FF]/u, reason: 'Kana script' },
  { code: 'zh', pattern: /[\u4E00-\u9FFF]/u, reason: 'Han script' },
  { code: 'ko', pattern: /[\uAC00-\uD7AF]/u, reason: 'Hangul script' },
  { code: 'my', pattern: /[\u1000-\u109F]/u, reason: 'Burmese script' },
  { code: 'bo', pattern: /[\u0F00-\u0FFF]/u, reason: 'Tibetan script' },
  { code: 'ta', pattern: /[\u0B80-\u0BFF]/u, reason: 'Tamil script' },
  { code: 'te', pattern: /[\u0C00-\u0C7F]/u, reason: 'Telugu script' },
  { code: 'kn', pattern: /[\u0C80-\u0CFF]/u, reason: 'Kannada script' },
  { code: 'ml', pattern: /[\u0D00-\u0D7F]/u, reason: 'Malayalam script' },
];

const latinExactMatchOrder: LanguageCode[] = ['en', 'vi', 'fr', 'es', 'de', 'it', 'pt', 'tr', 'fi', 'hu', 'et'];

export function detectLookupSourceLanguage(
  input: string,
  currentSourceLang: LanguageCode = 'en'
): LookupLanguageDetection {
  const query = input.trim();
  if (!query) {
    return { languageCode: currentSourceLang, confidence: 'low', reason: 'empty input' };
  }

  const scriptMatch = scriptRules.find((rule) => rule.pattern.test(query));
  if (scriptMatch) {
    return { languageCode: scriptMatch.code, confidence: 'high', reason: scriptMatch.reason };
  }

  if (/[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/iu.test(query)) {
    return { languageCode: 'vi', confidence: 'high', reason: 'Vietnamese diacritics' };
  }

  const normalizedQuery = normalizeLookupTerm(query);
  const exactCurrentEntry = findLocalDictionaryEntry(currentSourceLang, normalizedQuery);
  if (exactCurrentEntry) {
    return { languageCode: currentSourceLang, confidence: 'medium', reason: 'current dictionary exact match' };
  }

  const exactMatches = latinExactMatchOrder
    .filter((code) => code !== currentSourceLang)
    .filter((code) => getLanguageByCode(code, currentSourceLang).dictionaryStatus !== 'unavailable')
    .filter((code) => findLocalDictionaryEntry(code, normalizedQuery));

  if (exactMatches.length === 1) {
    return { languageCode: exactMatches[0], confidence: 'medium', reason: 'local dictionary exact match' };
  }

  return {
    languageCode: currentSourceLang,
    confidence: 'low',
    reason: languageOptions.some((language) => language.code === currentSourceLang) ? 'manual source kept' : 'fallback source kept',
  };
}
