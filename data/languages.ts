export const languageOptions = [
  { code: 'en', label: 'English', hint: 'Ngôn ngữ gốc' },
  { code: 'vi', label: 'Tiếng Việt', hint: 'Dịch sang' },
  { code: 'fr', label: 'Français', hint: 'Sắp hỗ trợ' },
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
  return sourceCode === 'en' && targetCode === 'vi';
}

