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
    code: 'es',
    label: 'Español',
    hint: 'Wiktionary preview',
    family: 'indo-european',
    script: 'latin',
    writingDirection: 'ltr',
    adapterKey: 'es',
    dictionaryStatus: 'monolingual',
  },
  {
    code: 'ms',
    label: 'Bahasa Melayu',
    hint: 'Wiktionary preview',
    family: 'austronesian',
    script: 'latin',
    writingDirection: 'ltr',
    adapterKey: 'ms',
    dictionaryStatus: 'monolingual',
  },
  {
    code: 'sw',
    label: 'Kiswahili',
    hint: 'Sắp hỗ trợ',
    family: 'niger-congo',
    script: 'latin',
    writingDirection: 'ltr',
    adapterKey: undefined,
    dictionaryStatus: 'unavailable',
  },
  {
    code: 'hi',
    label: 'हिन्दी',
    hint: 'Sắp hỗ trợ',
    family: 'indo-european',
    script: 'devanagari',
    writingDirection: 'ltr',
    adapterKey: undefined,
    dictionaryStatus: 'unavailable',
  },
  {
    code: 'zh',
    label: '中文',
    hint: 'Sắp hỗ trợ',
    family: 'sino-tibetan',
    script: 'han',
    writingDirection: 'ltr',
    adapterKey: undefined,
    dictionaryStatus: 'unavailable',
  },
  {
    code: 'yue',
    label: '廣東話 (Cantonese)',
    hint: 'Sắp hỗ trợ',
    family: 'sino-tibetan',
    script: 'han',
    writingDirection: 'ltr',
    adapterKey: undefined,
    dictionaryStatus: 'unavailable',
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
  {
    code: 'ar',
    label: 'العربية (Arabic)',
    hint: 'RTL smoke test',
    family: 'afroasiatic',
    script: 'arabic',
    writingDirection: 'rtl',
    adapterKey: undefined,
    dictionaryStatus: 'monolingual',
  },
  {
    code: 'he',
    label: 'עברית (Hebrew)',
    hint: 'RTL smoke test',
    family: 'afroasiatic',
    script: 'hebrew',
    writingDirection: 'rtl',
    adapterKey: undefined,
    dictionaryStatus: 'monolingual',
  },
];

export type LanguageOption = (typeof languageOptions)[number];
export type LanguageCode = LanguageOption['code'];

export const supportedBilingualDictionaryPairs = ['en->vi', 'vi->en', 'fr->vi'] as const;
export const blockedBilingualDictionaryPairs = ['vi->fr'] as const;

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
  const pair = getLanguagePairKey(sourceCode, targetCode);

  return supportedBilingualDictionaryPairs.includes(pair as (typeof supportedBilingualDictionaryPairs)[number]);
}

export function isBlockedBilingualDictionaryPair(sourceCode: string, targetCode: string) {
  const pair = getLanguagePairKey(sourceCode, targetCode);

  return blockedBilingualDictionaryPairs.includes(pair as (typeof blockedBilingualDictionaryPairs)[number]);
}

export function isSameLanguagePair(sourceCode: string, targetCode: string) {
  return sourceCode === targetCode;
}

export function isTranslationComingSoonPair(sourceCode: string, targetCode: string) {
  if (isSameLanguagePair(sourceCode, targetCode)) return false;

  return !isSupportedBilingualDictionaryPair(sourceCode, targetCode);
}

export function getLanguagePairKey(sourceCode: string, targetCode: string) {
  return `${sourceCode}->${targetCode}`;
}
