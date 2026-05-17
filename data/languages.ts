// Language options with lightweight metadata used for adapter selection and UI hints.
export const languageOptions = [
  {
    code: 'en',
    label: 'English',
    hint: 'Dictionary/API',
    family: 'indo-european',
    script: 'latin',
    writingDirection: 'ltr',
    adapterKey: 'en',
    dictionaryStatus: 'monolingual',
  },
  {
    code: 'vi',
    label: 'Tiếng Việt',
    hint: 'Dictionary/API',
    family: 'austroasiatic',
    script: 'latin',
    writingDirection: 'ltr',
    adapterKey: 'vi',
    dictionaryStatus: 'monolingual',
  },
  {
    code: 'fr',
    label: 'Français',
    hint: 'Wiktionary preview',
    family: 'indo-european',
    script: 'latin',
    writingDirection: 'ltr',
    adapterKey: 'fr',
    dictionaryStatus: 'monolingual',
  },
  {
    code: 'ja',
    label: '日本語',
    hint: 'Sắp hỗ trợ',
    family: 'japonic',
    script: 'kanji-kana',
    writingDirection: 'ltr',
    adapterKey: 'ja',
    dictionaryStatus: 'coming-soon',
  },
  {
    code: 'ko',
    label: '한국어',
    hint: 'Sắp hỗ trợ',
    family: 'koreanic',
    script: 'hangul',
    writingDirection: 'ltr',
    adapterKey: 'ko',
    dictionaryStatus: 'coming-soon',
  },
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

export function isSupportedBilingualDictionaryPair(sourceCode: string, targetCode: string) {
  const pair = `${sourceCode}->${targetCode}`;

  return ['en->vi', 'vi->en', 'fr->vi'].includes(pair);
}

export function isSameLanguagePair(sourceCode: string, targetCode: string) {
  return sourceCode === targetCode;
}

export function isTranslationComingSoonPair(sourceCode: string, targetCode: string) {
  if (isSameLanguagePair(sourceCode, targetCode)) return false;

  return !isSupportedBilingualDictionaryPair(sourceCode, targetCode);
}
