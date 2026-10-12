// How an example's translation is labelled on the Meaning tab. Packs may carry example translations in a
// language other than the one the reader looks words up into: Japanese entries take example sentences from
// English Wiktionary with English translations (decision D12). Those are shown as an English aid, marked
// as English and credited, never presented as a translation into the lookup's target language.
import type { BilingualExample } from './dictionary';

const LANGUAGE_NAMES_VI: Record<string, string> = {
  en: 'tiếng Anh',
  fr: 'tiếng Pháp',
  ja: 'tiếng Nhật',
  vi: 'tiếng Việt',
};

// Wiktionary editions used as helper sources, named for the credit line.
const EDITION_NAMES_VI: Record<string, string> = {
  enwiktionary: 'Wiktionary tiếng Anh',
  frwiktionary: 'Wiktionary tiếng Pháp',
  jawiktionary: 'Wiktionary tiếng Nhật',
};

export type ExampleTranslationLabel = {
  // Accessibility text for the translation line when it is labelled.
  accessibilityLabel: string | null;
  // Short badge shown before the translation text, e.g. "EN · ". Null when no badge is needed.
  badge: string | null;
  // Caption under the example, e.g. "Bản dịch tiếng Anh · ví dụ từ Wiktionary tiếng Anh".
  caption: string | null;
};

export function getEditionDisplayName(edition: string) {
  return EDITION_NAMES_VI[edition] ?? edition;
}

export function getExampleTranslationLabel(example: BilingualExample, targetLanguageCode: string): ExampleTranslationLabel {
  const helperCredit = example.helperSource ? `ví dụ từ ${getEditionDisplayName(example.helperSource)}` : null;
  const language = example.translation ? example.translationLanguage : undefined;

  // Translations already in the lookup's target language (or legacy unmarked ones) need no badge.
  if (!language || language === targetLanguageCode) {
    return {
      accessibilityLabel: null,
      badge: null,
      caption: helperCredit ? capitalize(helperCredit) : null,
    };
  }

  const languageName = LANGUAGE_NAMES_VI[language] ?? language.toUpperCase();
  const translationNote = `Bản dịch ${languageName}`;
  return {
    accessibilityLabel: `${translationNote}: ${example.translation}`,
    badge: `${language.toUpperCase()} · `,
    caption: helperCredit ? `${translationNote} · ${helperCredit}` : translationNote,
  };
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase('vi') + value.slice(1);
}
