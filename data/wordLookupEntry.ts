// Builds the entry the Word screen shows from local, API and bilingual lookup results (pure, no UI).
import { DictionaryEntry, dictionaryEntries } from './dictionary';
import { getLiveConjugation } from './conjugationDisplay';
import { type ApiBilingualMeaningResult, type ApiMeaningResult, isBlockedBilingualDictionaryPair } from './dictionaryApi';
import { buildLocalFixtureFallback, formatEtymologyWithAttribution, resolveEtymologyDisplay } from './etymologyAdapter';
import type { LanguageOption } from './languages';

function getEtymologyForEntry(
  localEntry: DictionaryEntry | undefined,
  apiMeaning: ApiMeaningResult | null,
  canUseSourceDictionaryApi: boolean,
  isBilingualLookup: boolean,
  sourceLanguageLabel: string,
  targetLanguageLabel: string
): string {
  if (!isBilingualLookup && apiMeaning?.etymology) {
    return `${apiMeaning.etymology.text}\n\n${apiMeaning.etymology.attribution}`;
  }

  return formatEtymologyWithAttribution(
    resolveEtymologyDisplay({
      localEtymology: localEntry?.etymology,
      sourceLanguageLabel,
      targetLanguageLabel,
      isBilingualLookup,
      hasConfiguredSource: canUseSourceDictionaryApi,
      sourceName: getEtymologySourceName(apiMeaning, sourceLanguageLabel),
    })
  );
}


export function mergeLookupEntry(
  localEntry: DictionaryEntry | undefined,
  selectedWord: string,
  apiBilingualMeaning: ApiBilingualMeaningResult | null,
  apiMeaning: ApiMeaningResult | null,
  canUseSourceDictionaryApi: boolean,
  hasLocalDictionarySource: boolean,
  isBilingualSourceBlocked: boolean,
  sourceLanguageLabel: string,
  targetLanguageLabel: string
): DictionaryEntry {
  const fallbackEntry = localEntry ?? dictionaryEntries[0];
  const hasLocalEntry = Boolean(localEntry);
  const liveConjugation = getLiveConjugation(apiMeaning?.forms);
  const apiDefinitions = apiMeaning?.definitions.map((definition) => ({
    partOfSpeech: definition.partOfSpeech,
    meaning: definition.meaning,
    vietnamese: '',
    examples: definition.examples,
    domain: definition.domain,
    gender: definition.gender,
    level: definition.level,
  }));
  const bilingualDefinitions = apiBilingualMeaning?.definitions.map((definition) => ({
    partOfSpeech: definition.partOfSpeech,
    meaning: definition.meaning,
    vietnamese: definition.meaning,
    examples: definition.examples,
    domain: definition.domain,
    gender: definition.gender,
    level: definition.level,
  }));

  if (isBilingualSourceBlocked) {
    return createDictionaryUnavailableEntry(
      selectedWord,
      hasLocalDictionarySource,
      sourceLanguageLabel,
      targetLanguageLabel,
      `Chưa chọn nguồn dữ liệu từ điển ${sourceLanguageLabel} sang ${targetLanguageLabel} đủ tin cậy.`
    );
  }

  if (apiBilingualMeaning?.definitions.length) {
    return {
      ...fallbackEntry,
      word: apiBilingualMeaning.word,
      ipa: apiBilingualMeaning.ipa || apiMeaning?.ipa || (hasLocalEntry ? fallbackEntry.ipa : ''),
      audio: apiBilingualMeaning.audio || apiMeaning?.audio || (hasLocalEntry ? fallbackEntry.audio : ''),
      level: hasLocalEntry ? fallbackEntry.level : 'EN-VI',
      topic: 'Bilingual dictionary',
      vietnamese: apiBilingualMeaning.definitions[0]?.meaning ?? fallbackEntry.vietnamese,
      shortDefinition: apiBilingualMeaning.definitions[0]?.meaning ?? fallbackEntry.shortDefinition,
      definitions: bilingualDefinitions ?? [],
      synonyms: hasLocalEntry ? fallbackEntry.synonyms : [],
      antonyms: hasLocalEntry ? fallbackEntry.antonyms : [],
      collocations: hasLocalEntry ? fallbackEntry.collocations : [],
      idioms: hasLocalEntry ? fallbackEntry.idioms : [],
      conjugation: hasLocalEntry ? fallbackEntry.conjugation : [],
      etymology: getEtymologyForEntry(
        localEntry,
        apiMeaning,
        canUseSourceDictionaryApi,
        true,
        sourceLanguageLabel,
        targetLanguageLabel
      ),
      pronunciationTips: hasLocalEntry ? fallbackEntry.pronunciationTips : [],
    };
  }

  if (!hasLocalEntry) {
    if (!canUseSourceDictionaryApi && !apiMeaning) {
      return createDictionaryUnavailableEntry(selectedWord, hasLocalDictionarySource, sourceLanguageLabel, targetLanguageLabel);
    }

    return {
      word: apiMeaning?.word ?? selectedWord,
      ipa: apiMeaning?.ipa ?? '',
      audio: apiMeaning?.audio ?? '',
      level: sourceLanguageLabel,
      topic: 'Online dictionary',
      vietnamese: apiDefinitions?.[0]?.meaning ?? 'Chưa có nghĩa đích',
      shortDefinition: apiDefinitions?.[0]?.meaning ?? 'Live dictionary lookup.',
      definitions: apiDefinitions?.length
        ? apiDefinitions
        : [
            {
              partOfSpeech: 'lookup',
              meaning: 'Live dictionary data will appear here when available.',
              vietnamese: 'Dữ liệu tra cứu trực tuyến sẽ hiển thị khi có kết quả.',
              examples: [],
            },
          ],
      synonyms: [],
      antonyms: [],
      collocations: [],
      idioms: [],
      conjugation: liveConjugation?.rows ?? [],
      conjugationAttribution: liveConjugation?.attribution,
      etymology: getEtymologyForEntry(
        undefined,
        apiMeaning,
        canUseSourceDictionaryApi,
        false,
        sourceLanguageLabel,
        targetLanguageLabel
      ),
      pronunciationTips: [],
    };
  }

  return {
    ...fallbackEntry,
    word: apiMeaning?.word ?? selectedWord,
    ipa: apiMeaning?.ipa || fallbackEntry.ipa,
    audio: apiMeaning?.audio || fallbackEntry.audio,
    level: fallbackEntry.level,
    topic: fallbackEntry.topic,
    vietnamese: fallbackEntry.vietnamese,
    shortDefinition: apiDefinitions?.[0]?.meaning ?? fallbackEntry.shortDefinition,
    definitions: fallbackEntry.definitions,
    conjugation: liveConjugation?.rows ?? fallbackEntry.conjugation,
    conjugationAttribution: liveConjugation?.attribution,
    etymology: getEtymologyForEntry(
      localEntry,
      apiMeaning,
      canUseSourceDictionaryApi,
      false,
      sourceLanguageLabel,
      targetLanguageLabel
    ),
  };
}

export function getRouteParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getEtymologySourceName(apiMeaning: ApiMeaningResult | null, sourceLanguageLabel: string) {
  const sourceName = apiMeaning?.source.split(' · ')[0];
  if (sourceName?.toLocaleLowerCase().includes('wiktionary')) {
    return sourceName;
  }

  return `${sourceLanguageLabel} Wiktionary`;
}

export function getBilingualDictionaryUnavailableMessage(sourceLanguage: LanguageOption, targetLanguage: LanguageOption) {
  if (isBlockedBilingualDictionaryPair(sourceLanguage.code, targetLanguage.code)) {
    return `Cập nhật trong phiên bản sau: cần nguồn dữ liệu từ điển ${sourceLanguage.label} → ${targetLanguage.label} đủ tin cậy.`;
  }

  return `Cập nhật trong phiên bản sau: chưa có nguồn dữ liệu từ điển ${sourceLanguage.label} sang ${targetLanguage.label} đủ tin cậy.`;
}

function createDictionaryUnavailableEntry(
  word: string,
  hasLocalDictionarySource: boolean,
  sourceLanguageLabel: string,
  targetLanguageLabel: string,
  customMessage?: string
): DictionaryEntry {
  const sourceMessage = customMessage ?? (hasLocalDictionarySource
    ? `Chưa có mục từ local cho "${word}".`
    : `Dữ liệu từ điển ${sourceLanguageLabel} chưa được bật.`);

  return {
    word,
    ipa: '',
    audio: '',
    level: hasLocalDictionarySource ? 'Local' : 'Soon',
    topic: hasLocalDictionarySource ? 'Từ điển' : 'Cần nguồn dữ liệu',
    vietnamese: `${sourceLanguageLabel} sang ${targetLanguageLabel}`,
    shortDefinition: sourceMessage,
    definitions: [
      {
        partOfSpeech: 'trạng thái từ điển',
        meaning: sourceMessage,
        vietnamese: 'Cần bổ sung dataset hoặc API hợp pháp để tra cứu đầy đủ ngôn ngữ này.',
        examples: [],
        domain: 'Hệ thống',
        level: hasLocalDictionarySource ? 'Preview' : 'Cập nhật sau',
      },
    ],
    synonyms: [],
    antonyms: [],
    collocations: [],
    idioms: [],
    conjugation: [],
    etymology: formatEtymologyWithAttribution(buildLocalFixtureFallback()),
    pronunciationTips: [],
  };
}
