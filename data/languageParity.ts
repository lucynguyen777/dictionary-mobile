import { languageOptions, type LanguageCode } from './languages';

export type LanguageParityStatus = 'production-parity' | 'monolingual-preview' | 'source-gated';

export type LanguageParityRow = {
  code: LanguageCode | string;
  label: string;
  status: LanguageParityStatus;
  blocker: string;
};

const productionParityLanguages = new Set<LanguageCode>(['en', 'vi']);

export function getLanguageParityRows(): LanguageParityRow[] {
  const languageRows = languageOptions.map((language) => {
    if (productionParityLanguages.has(language.code)) {
      return {
        code: language.code,
        label: language.label,
        status: 'production-parity' as const,
        blocker: 'Needs ongoing corpus/offline-pack growth.',
      };
    }

    if (language.dictionaryStatus === 'unavailable') {
      return {
        code: language.code,
        label: language.label,
        status: 'source-gated' as const,
        blocker: 'Needs approved legal dictionary source and representative samples.',
      };
    }

    return {
      code: language.code,
      label: language.label,
      status: 'monolingual-preview' as const,
      blocker: 'Small Wiktionary/local fixture preview; needs Anh-Viet parity coverage.',
    };
  });

  return [
    ...languageRows,
    {
      code: 'fr->vi',
      label: 'French to Vietnamese',
      status: 'production-parity',
      blocker: 'Needs larger coverage and offline packaging path.',
    },
    {
      code: 'vi->fr',
      label: 'Vietnamese to French',
      status: 'source-gated',
      blocker: 'No approved lexical dictionary source; machine translation is not dictionary data.',
    },
  ];
}
