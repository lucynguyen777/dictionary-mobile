export const languageOptions = [
  { code: 'en', label: 'English', hint: 'Dictionary/API' },
  { code: 'vi', label: 'Tiếng Việt', hint: 'Dictionary/API' },
  { code: 'fr', label: 'Français', hint: 'Wiktionary preview' },
  { code: 'ja', label: '日本語', hint: 'Sắp hỗ trợ' },
  { code: 'ko', label: '한국어', hint: 'Sắp hỗ trợ' },
];

export type LanguageOption = (typeof languageOptions)[number];
export type LanguageCode = LanguageOption['code'];

export function getLanguageByCode(code: string | undefined, fallbackCode: LanguageCode) {
  return languageOptions.find((language) => language.code === code) ?? getFallbackLanguage(fallbackCode);
}

export function getFallbackLanguage(code: LanguageCode) {
  return languageOptions.find((language) => language.code === code) ?? languageOptions[0];
}

export function getAlternativeLanguage(excludedCode: string) {
  return languageOptions.find((language) => language.code !== excludedCode) ?? languageOptions[0];
}

export function isEnglishDictionaryPair(sourceCode: string, targetCode: string) {
  const pair = `${sourceCode}->${targetCode}`;

  return ['en->en', 'en->vi', 'vi->en'].includes(pair);
}

export function isSameLanguagePair(sourceCode: string, targetCode: string) {
  return sourceCode === targetCode;
}

export function isTranslationComingSoonPair(sourceCode: string, targetCode: string) {
  if (isSameLanguagePair(sourceCode, targetCode)) return false;

  return !isEnglishDictionaryPair(sourceCode, targetCode);
}
