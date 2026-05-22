const LANGUAGE_LOCALES: Record<string, string> = {
  kk: 'kk-KZ',
  tr: 'tr-TR',
};

export function normalizeLookupInput(value: string, languageCode = '') {
  const trimmedValue = value.trim().normalize('NFC');
  const locale = LANGUAGE_LOCALES[languageCode];

  return locale ? trimmedValue.toLocaleLowerCase(locale) : trimmedValue.toLocaleLowerCase();
}
