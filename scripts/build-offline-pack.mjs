#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { createInterface } from 'node:readline';
import { gzipSync } from 'node:zlib';

const args = parseArgs(process.argv.slice(2));

if (!args.input || !args.lang || !args.source || !args.out) {
  console.error(
    'Usage: node scripts/build-offline-pack.mjs --input <jsonl> --lang <code> --source <name> --out <dir>'
      + ' [--source-url <url>] [--source-revision <dump date or id>] [--generated-at <ISO time>] [--limit <entries>]'
      + ' [--public-base-url <url prefix where the pack is hosted>]'
      + ' [--helper-input <jsonl> --helper-source <name>]  (related words only, e.g. from another Wiktionary edition)'
      + ' [--helper-examples [--helper-gloss-lang <code>]]  (also take helper example sentences for entries without native ones;'
      + ' their translations are marked with the helper edition language, default en)'
      + ' [--gloss-lang <code>]  (pair pack: --lang headwords defined in another language, e.g. --lang vi --gloss-lang fr)'
      + ' [--lemmas-only]  (skip inflected-form entries; the app resolves inflections with its morphology)'
      + ' [--rank-by richness]  (with --limit: keep the best-documented entries instead of the first ones in the dump)'
      + ' [--index-kanji-forms]  (Japanese: also index entries under the kanji spellings Wiktionary lists in `forms`)'
  );
  process.exit(1);
}

// A fixed --generated-at makes rebuilding the same dump byte-identical (same checksums).
const generatedAt = args.generatedAt ?? new Date().toISOString();
const limit = args.limit ? Number(args.limit) : Infinity;
if (args.rankBy !== undefined && args.rankBy !== 'richness') {
  console.error('--rank-by only supports "richness".');
  process.exit(1);
}
const rankByRichness = args.rankBy === 'richness';
// A pair pack (e.g. Vietnamese headwords with French definitions) records its definition language;
// a monolingual pack keeps the original manifest shape.
const glossLang = typeof args.glossLang === 'string' && args.glossLang !== args.lang ? args.glossLang : '';
if (args.glossLang === true) {
  console.error('--gloss-lang needs a language code.');
  process.exit(1);
}
const helperExamples = args.helperExamples === true;
const indexKanjiForms = args.indexKanjiForms === true;
const kanjiFormsById = new Map();
if (helperExamples && !(args.helperInput && args.helperSource)) {
  console.error('--helper-examples needs --helper-input and --helper-source.');
  process.exit(1);
}
// Example translations in a helper edition are written in that edition's language (English Wiktionary: English).
const helperGlossLang = typeof args.helperGlossLang === 'string' ? args.helperGlossLang : 'en';
const MAX_DEFINITIONS_PER_ENTRY = 16;
const MAX_EXAMPLES_PER_ENTRY = 8;
const MAX_RELATIONS = 24;
const MAX_TEXT_CHARS = 1_000;
// Only Vietnamese has a detector so far (the VI→FR pair pack). A gloss counts as Vietnamese when, outside
// parentheses, at least half of its words carry Vietnamese-only diacritics (hook, horn, breve, dot below,
// tilde, đ, or marks French never puts on that vowel) or are common Vietnamese function words.
const VIETNAMESE_FUNCTION_WORDS = new Set(['các', 'cho', 'có', 'của', 'cũng', 'dạng', 'được', 'khác', 'không', 'một', 'như', 'những', 'nói', 'tắt', 'trong', 'từ', 'và', 'với', 'xem']);
const VIETNAMESE_CROSS_REFERENCE = /^(xem|như|nói tắt|cũng (nói|viết|đọc|gọi))(\s|$)/iu;
const FRENCH_COMBINING_MARKS = { '\u0300': 'aeu', '\u0301': 'e', '\u0302': 'aeiou', '\u0308': 'eiuy', '\u0327': 'c' };
const entriesByKey = new Map();
const lemmasOnly = args.lemmasOnly === true;
const stats = { formOfEntriesSkipped: 0, mergedEntries: 0, otherLanguageSections: 0, scannedLines: 0, withoutDefinitions: 0, ...(glossLang ? { headwordLanguageGlossesDropped: 0 } : {}) };
// As in scripts/measure-kaikki-dump.mjs, an entry is a lemma if any sense is not a form-of sense.
// Entries without senses are left to the definitions check below.
const isLemmaEntry = (entry) => !(entry.senses ?? []).length
  || entry.senses.some((sense) => !sense.form_of && !(sense.tags ?? []).includes('form-of'));

const reader = createInterface({
  crlfDelay: Infinity,
  input: createReadStream(args.input, { encoding: 'utf8' }),
});

for await (const line of reader) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  stats.scannedLines += 1;
  const rawEntry = JSON.parse(trimmed);
  // Wiktextract dumps mix language sections; a French word on English Wiktionary must not enter an English pack.
  if (typeof rawEntry.lang_code === 'string' && rawEntry.lang_code !== args.lang) {
    stats.otherLanguageSections += 1;
    continue;
  }
  // Japanese Wiktionary also writes kanji spellings as their own form-of entries (飲む → のむ). Those
  // become kanji aliases of the kana lemma instead of separate entries.
  if (indexKanjiForms) {
    const spelling = getString(rawEntry.word);
    const lemmas = (rawEntry.senses ?? []).flatMap((sense) => (Array.isArray(sense.form_of) ? sense.form_of : [])).map((item) => getString(item?.word)).filter(Boolean);
    if (spelling && lemmas.length && !isLemmaEntry(rawEntry)) {
      for (const lemma of lemmas) {
        const lemmaId = `${args.lang}:${normalizeLookupKey(lemma)}`;
        kanjiFormsById.set(lemmaId, unique([...(kanjiFormsById.get(lemmaId) ?? []), spelling]));
      }
    }
  }
  if (lemmasOnly && !isLemmaEntry(rawEntry)) {
    stats.formOfEntriesSkipped += 1;
    continue;
  }
  const normalizedEntry = normalizeEntry(rawEntry, args.lang, args.source, args.sourceUrl, generatedAt);
  if (!normalizedEntry) {
    stats.withoutDefinitions += 1;
    continue;
  }
  if (indexKanjiForms) {
    const kanji = (Array.isArray(rawEntry.forms) ? rawEntry.forms : [])
      .filter((form) => Array.isArray(form?.tags) && form.tags.includes('kanji'))
      .map((form) => getString(form.form))
      .filter((form) => form && form !== normalizedEntry.word);
    if (kanji.length) kanjiFormsById.set(normalizedEntry.id, unique([...(kanjiFormsById.get(normalizedEntry.id) ?? []), ...kanji]));
  }
  const existing = entriesByKey.get(normalizedEntry.id);
  if (existing) {
    mergeEntry(existing, normalizedEntry);
    stats.mergedEntries += 1;
  } else if (rankByRichness || entriesByKey.size < limit) {
    entriesByKey.set(normalizedEntry.id, normalizedEntry);
  }
}

// Helper source: only synonyms/antonyms (and, with --helper-examples, example sentences) of headwords
// already in the pack are taken, never definitions, and the helper is credited in each enriched entry's attribution.
if (args.helperInput && args.helperSource) {
  stats.helperEnrichedEntries = 0;
  const relatedCredit = `related words also from ${args.helperSource} (CC-BY-SA-4.0/GFDL)`;
  const examplesCredit = `examples also from ${args.helperSource} (CC-BY-SA-4.0/GFDL)`;
  // Helper examples only fill entries that have no example sentence of their own.
  const withoutNativeExamples = new Set(helperExamples ? [...entriesByKey.values()].filter((entry) => !entry.examples.length) : []);
  if (helperExamples) stats.helperExampleEntries = 0;
  const helperReader = createInterface({ crlfDelay: Infinity, input: createReadStream(args.helperInput, { encoding: 'utf8' }) });
  for await (const line of helperReader) {
    if (!line.trim()) continue;
    const helperEntry = JSON.parse(line);
    if (typeof helperEntry.lang_code === 'string' && helperEntry.lang_code !== args.lang) continue;
    const target = entriesByKey.get(`${args.lang}:${normalizeLookupKey(getString(helperEntry.word))}`);
    if (!target) continue;
    const relations = normalizeRelations(helperEntry);
    const before = target.relations.synonyms.length + target.relations.antonyms.length;
    target.relations = {
      antonyms: unique([...target.relations.antonyms, ...relations.antonyms]),
      synonyms: unique([...target.relations.synonyms, ...relations.synonyms]),
    };
    if (target.relations.synonyms.length + target.relations.antonyms.length > before && !target.attribution.includes(relatedCredit)) {
      target.attribution = `${target.attribution}; ${relatedCredit}`;
      stats.helperEnrichedEntries += 1;
    }
    if (withoutNativeExamples.has(target) && target.examples.length < MAX_EXAMPLES_PER_ENTRY) {
      const examples = normalizeExamples(helperEntry)
        .slice(0, MAX_EXAMPLES_PER_ENTRY - target.examples.length)
        .map((example) => ({
          ...example,
          helperSource: args.helperSource,
          ...(example.translation ? { translationLanguage: helperGlossLang } : {}),
        }));
      if (examples.length) {
        target.examples.push(...examples);
        if (!target.attribution.includes(examplesCredit)) {
          target.attribution = `${target.attribution}; ${examplesCredit}`;
          stats.helperExampleEntries += 1;
        }
      }
    }
  }
}

// Without a licensed frequency list, how well Wiktionary documents a word is the available proxy for
// how common it is: senses, examples, related words, pronunciation and etymology.
function richness(entry) {
  return entry.definitions.length * 2
    + Math.min(entry.examples.length, 8)
    + Math.min(entry.relations.synonyms.length + entry.relations.antonyms.length, 8)
    + (entry.ipa ? 2 : 0)
    + (entry.audio.length ? 2 : 0)
    + (entry.etymology ? 1 : 0);
}

let selected = [...entriesByKey.values()];
if (rankByRichness && selected.length > limit) {
  stats.droppedByRank = selected.length - limit;
  selected = selected
    .map((entry) => ({ entry, score: richness(entry) }))
    .sort((a, b) => b.score - a.score || (a.entry.normalizedWord < b.entry.normalizedWord ? -1 : 1))
    .slice(0, limit)
    .map(({ entry }) => entry);
}

// Japanese Wiktionary keys many words by their kana reading and lists the kanji spelling in `forms`
// (みず → 水). Learners look words up in kanji, so each selected entry is also stored under its kanji
// spellings, unless the pack already has an entry for that spelling. The alias keeps the kana
// headword in `word`, so the result still shows the reading.
if (indexKanjiForms) {
  stats.kanjiAliasEntries = 0;
  const taken = new Set(selected.map((entry) => entry.id));
  for (const entry of [...selected]) {
    for (const form of kanjiFormsById.get(entry.id) ?? []) {
      const id = `${args.lang}:${normalizeLookupKey(form)}`;
      if (taken.has(id)) continue;
      taken.add(id);
      selected.push({ ...entry, id, normalizedWord: normalizeLookupKey(form) });
      stats.kanjiAliasEntries += 1;
    }
  }
}

const entries = selected
  .map(capEntry)
  .sort((a, b) => (a.normalizedWord < b.normalizedWord ? -1 : a.normalizedWord > b.normalizedWord ? 1 : 0));

mkdirSync(args.out, { recursive: true });

const helperSources = args.helperSource
  ? [
      { name: args.helperSource, use: 'related-words' },
      ...(helperExamples ? [{ name: args.helperSource, translationLanguage: helperGlossLang, use: 'examples' }] : []),
    ]
  : [];
const manifest = {
  entryCount: entries.length,
  generatedAt,
  ...(glossLang ? { glossLangCode: glossLang } : {}),
  input: basename(args.input),
  langCode: args.lang,
  license: 'CC-BY-SA-4.0/GFDL',
  packId: glossLang ? `${args.source}-${args.lang}-${glossLang}-offline-pack-v1` : `${args.source}-${args.lang}-offline-pack-v1`,
  schemaVersion: 1,
  sourceName: args.source,
  sourceUrl: args.sourceUrl ?? '',
  sourceRevision: args.sourceRevision ?? '',
  ...(helperSources.length ? { helperSources } : {}),
};

const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
// mtime 0 in the gzip header keeps the archive reproducible.
const entriesBytes = gzipSync(JSON.stringify(entries), { level: 9 });
entriesBytes.writeUInt32LE(0, 4);
writeFileSync(join(args.out, 'manifest.json'), manifestBytes);
writeFileSync(join(args.out, 'entries.json.gz'), entriesBytes);

// The app verifies downloads against these MD5s (OfflinePackDownloadSource in data/offlineDictionaryPacks.ts).
const baseUrl = (args.publicBaseUrl ?? '').replace(/\/+$/, '');
const downloadSource = {
  entriesMd5: md5(entriesBytes),
  entriesUrl: `${baseUrl}/entries.json.gz`,
  entryCount: entries.length,
  manifestMd5: md5(manifestBytes),
  manifestUrl: `${baseUrl}/manifest.json`,
};
writeFileSync(join(args.out, 'download-source.json'), `${JSON.stringify(downloadSource, null, 2)}\n`);
writeFileSync(join(args.out, 'build-report.json'), `${JSON.stringify({ ...stats, entryCount: entries.length, packId: manifest.packId }, null, 2)}\n`);

console.log(`Built offline pack ${manifest.packId} with ${entries.length} entries (${stats.mergedEntries} merged, ${stats.otherLanguageSections} other-language sections skipped).`);

function md5(bytes) {
  return createHash('md5').update(bytes).digest('hex');
}

// Wiktextract emits one record per part of speech; the app looks words up by headword.
function mergeEntry(target, extra) {
  const partsOfSpeech = new Set([target.partOfSpeech, extra.partOfSpeech].flatMap((value) => value.split(', ')).filter(Boolean));
  target.partOfSpeech = [...partsOfSpeech].join(', ');
  target.definitions.push(...extra.definitions);
  target.examples.push(...extra.examples);
  target.audio = unique([...target.audio, ...extra.audio]);
  target.ipa = target.ipa || extra.ipa;
  target.etymology = target.etymology || extra.etymology;
  target.relations = {
    antonyms: unique([...target.relations.antonyms, ...extra.relations.antonyms]),
    synonyms: unique([...target.relations.synonyms, ...extra.relations.synonyms]),
  };
}

function capEntry(entry) {
  const clip = (value) => (value.length > MAX_TEXT_CHARS ? `${value.slice(0, MAX_TEXT_CHARS - 1)}…` : value);
  const seenGlosses = new Set();
  return {
    ...entry,
    definitions: entry.definitions
      .filter((definition) => !seenGlosses.has(definition.gloss) && seenGlosses.add(definition.gloss))
      .slice(0, MAX_DEFINITIONS_PER_ENTRY)
      .map((definition) => ({ ...definition, gloss: clip(definition.gloss) })),
    etymology: clip(entry.etymology),
    examples: entry.examples.slice(0, MAX_EXAMPLES_PER_ENTRY).map((example) => ({
      ...example,
      source: clip(example.source),
      ...(example.translation ? { translation: clip(example.translation) } : {}),
    })),
    relations: {
      antonyms: entry.relations.antonyms.slice(0, MAX_RELATIONS),
      synonyms: entry.relations.synonyms.slice(0, MAX_RELATIONS),
    },
  };
}

function unique(values) {
  return [...new Set(values)];
}

function normalizeEntry(rawEntry, langCode, sourceName, sourceUrl, updatedAt) {
  const word = getString(rawEntry.word);
  if (!word) return null;

  const allDefinitions = normalizeDefinitions(rawEntry);
  // In a pair pack, senses glossed in the headword language (e.g. Vietnamese cross-references such as
  // "Nói tắt của nha_lại." in French Wiktionary) are not definitions in the gloss language: drop them.
  const definitions = glossLang ? allDefinitions.filter((definition) => !isHeadwordLanguageGloss(definition.gloss, langCode)) : allDefinitions;
  if (glossLang) stats.headwordLanguageGlossesDropped += allDefinitions.length - definitions.length;
  if (!definitions.length) return null;

  return {
    attribution: `Source: ${sourceName} (CC-BY-SA-4.0/GFDL)`,
    audio: normalizeAudio(rawEntry),
    definitions,
    // English-edition dumps use etymology_text; other editions (e.g. French) use an etymology_texts array.
    etymology: getString(rawEntry.etymology_text)
      || (Array.isArray(rawEntry.etymology_texts) ? rawEntry.etymology_texts.map(getString).filter(Boolean).join(' ') : '')
      || getString(rawEntry.etymology)
      || '',
    examples: glossLang
      ? normalizeExamples(rawEntry).map((example) => (example.translation ? { ...example, translationLanguage: glossLang } : example))
      : normalizeExamples(rawEntry),
    ...(glossLang ? { glossLangCode: glossLang } : {}),
    id: `${langCode}:${normalizeLookupKey(word)}`,
    ipa: normalizeIpa(rawEntry),
    langCode,
    license: 'CC-BY-SA-4.0/GFDL',
    normalizedWord: normalizeLookupKey(word),
    partOfSpeech: getString(rawEntry.pos),
    relations: normalizeRelations(rawEntry),
    sourceName,
    sourceUrl: sourceUrl ?? '',
    updatedAt,
    word,
  };
}

function normalizeDefinitions(rawEntry) {
  const senses = Array.isArray(rawEntry.senses) ? rawEntry.senses : [];

  return senses
    .flatMap((sense) => {
      const glosses = Array.isArray(sense.glosses) ? sense.glosses : [];
      return glosses.map((gloss) => ({
        gloss: getString(gloss),
        tags: Array.isArray(sense.tags) ? sense.tags.filter(Boolean) : [],
        topics: Array.isArray(sense.topics) ? sense.topics.filter(Boolean) : [],
      }));
    })
    .filter((definition) => definition.gloss);
}

function isVietnameseToken(token) {
  const lower = token.toLocaleLowerCase();
  if (VIETNAMESE_FUNCTION_WORDS.has(lower) || lower.includes('đ')) return true;
  const decomposed = lower.normalize('NFD');
  for (let index = 1; index < decomposed.length; index += 1) {
    const mark = decomposed[index];
    if (!/[\u0300-\u036f]/.test(mark)) continue;
    const base = decomposed[index - 1];
    if (/[\u0300-\u036f]/.test(base) || !(FRENCH_COMBINING_MARKS[mark] ?? '').includes(base)) return true;
  }
  return false;
}

function isHeadwordLanguageGloss(gloss, langCode) {
  if (langCode !== 'vi') return false;
  // Vietnamese cross-references: "Xem …" (see), "Như …" (same as), "Nói tắt của …" (short for), "Cũng nói/viết …".
  if (VIETNAMESE_CROSS_REFERENCE.test(gloss.trim())) return true;
  const words = (text) => text.split(/[^\p{L}_]+/u).filter(Boolean);
  // Parenthesised Vietnamese labels inside a French gloss do not count, unless the gloss is only a parenthesis.
  const outside = words(gloss.replace(/\([^)]*\)/g, ' '));
  const tokens = outside.length ? outside : words(gloss);
  if (!tokens.length) return false;
  return tokens.filter(isVietnameseToken).length / tokens.length >= 0.5;
}

function normalizeAudio(rawEntry) {
  const sounds = Array.isArray(rawEntry.sounds) ? rawEntry.sounds : [];

  // Wiktextract's `audio` is a bare Commons file name; only the URLs are playable. MP3 first: iOS cannot play Ogg.
  return unique(sounds
    .map((sound) => [sound.mp3_url, sound.ogg_url, sound.audio].map(getString).find((value) => /^https:\/\//.test(value)) ?? '')
    .filter(Boolean));
}

function normalizeExamples(rawEntry) {
  const senses = Array.isArray(rawEntry.senses) ? rawEntry.senses : [];

  return senses
    .flatMap((sense) => (Array.isArray(sense.examples) ? sense.examples : []))
    .map((example) => {
      if (typeof example === 'string') return { source: example };
      const translation = getString(example.translation) || getString(example.english);
      return translation ? { source: getString(example.text), translation } : { source: getString(example.text) };
    })
    .filter((example) => example.source);
}

function normalizeRelations(rawEntry) {
  const senses = Array.isArray(rawEntry.senses) ? rawEntry.senses : [];
  return {
    antonyms: unique(normalizeLinkage([...(rawEntry.antonyms ?? []), ...senses.flatMap((sense) => sense.antonyms ?? [])])),
    synonyms: unique(normalizeLinkage([...(rawEntry.synonyms ?? []), ...senses.flatMap((sense) => sense.synonyms ?? [])])),
  };
}

function normalizeLinkage(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => (typeof item === 'string' ? item : getString(item.word)))
    .filter(Boolean);
}

function normalizeIpa(rawEntry) {
  const sounds = Array.isArray(rawEntry.sounds) ? rawEntry.sounds : [];
  const ipa = sounds.map((sound) => getString(sound.ipa)).find(Boolean) ?? '';

  // French Wiktionary writes phonemic transcriptions as \a.kœj\; show them in the usual /a.kœj/ form.
  return /^\\[^\\]+\\$/.test(ipa) ? `/${ipa.slice(1, -1)}/` : ipa;
}

function normalizeLookupKey(value) {
  return value.trim().toLocaleLowerCase();
}

function getString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseArgs(rawArgs) {
  const parsed = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (!arg.startsWith('--')) continue;

    const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = rawArgs[index + 1];
    // Flags without a value (e.g. --lemmas-only) do not consume the next option.
    if (value === undefined || value.startsWith('--')) {
      parsed[key] = true;
      continue;
    }
    parsed[key] = value;
    index += 1;
  }

  return parsed;
}
