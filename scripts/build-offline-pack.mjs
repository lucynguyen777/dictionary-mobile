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
  );
  process.exit(1);
}

// A fixed --generated-at makes rebuilding the same dump byte-identical (same checksums).
const generatedAt = args.generatedAt ?? new Date().toISOString();
const limit = args.limit ? Number(args.limit) : Infinity;
const MAX_DEFINITIONS_PER_ENTRY = 16;
const MAX_EXAMPLES_PER_ENTRY = 8;
const MAX_RELATIONS = 24;
const MAX_TEXT_CHARS = 1_000;
const entriesByKey = new Map();
const stats = { mergedEntries: 0, otherLanguageSections: 0, scannedLines: 0, withoutDefinitions: 0 };

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
  const normalizedEntry = normalizeEntry(rawEntry, args.lang, args.source, args.sourceUrl, generatedAt);
  if (!normalizedEntry) {
    stats.withoutDefinitions += 1;
    continue;
  }
  const existing = entriesByKey.get(normalizedEntry.id);
  if (existing) {
    mergeEntry(existing, normalizedEntry);
    stats.mergedEntries += 1;
  } else if (entriesByKey.size < limit) {
    entriesByKey.set(normalizedEntry.id, normalizedEntry);
  }
}

// Helper source: only synonyms/antonyms of headwords already in the pack are taken, never definitions,
// and the helper is credited in each enriched entry's attribution.
if (args.helperInput && args.helperSource) {
  stats.helperEnrichedEntries = 0;
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
    if (target.relations.synonyms.length + target.relations.antonyms.length > before && !target.attribution.includes(args.helperSource)) {
      target.attribution = `${target.attribution}; related words also from ${args.helperSource} (CC-BY-SA-4.0/GFDL)`;
      stats.helperEnrichedEntries += 1;
    }
  }
}

const entries = [...entriesByKey.values()]
  .map(capEntry)
  .sort((a, b) => (a.normalizedWord < b.normalizedWord ? -1 : a.normalizedWord > b.normalizedWord ? 1 : 0));

mkdirSync(args.out, { recursive: true });

const manifest = {
  entryCount: entries.length,
  generatedAt,
  input: basename(args.input),
  langCode: args.lang,
  license: 'CC-BY-SA-4.0/GFDL',
  packId: `${args.source}-${args.lang}-offline-pack-v1`,
  schemaVersion: 1,
  sourceName: args.source,
  sourceUrl: args.sourceUrl ?? '',
  sourceRevision: args.sourceRevision ?? '',
  ...(args.helperSource ? { helperSources: [{ name: args.helperSource, use: 'related-words' }] } : {}),
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

  const definitions = normalizeDefinitions(rawEntry);
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
    examples: normalizeExamples(rawEntry),
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
    parsed[key] = rawArgs[index + 1];
    index += 1;
  }

  return parsed;
}
