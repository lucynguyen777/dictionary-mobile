#!/usr/bin/env node

import { createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { createInterface } from 'node:readline';
import { gzipSync } from 'node:zlib';

const args = parseArgs(process.argv.slice(2));

if (!args.input || !args.lang || !args.source || !args.out) {
  console.error('Usage: node scripts/build-offline-pack.mjs --input <jsonl> --lang <code> --source <name> --out <dir> [--source-url <url>]');
  process.exit(1);
}

const generatedAt = new Date().toISOString();
const entries = [];

const reader = createInterface({
  crlfDelay: Infinity,
  input: createReadStream(args.input, { encoding: 'utf8' }),
});

for await (const line of reader) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  const rawEntry = JSON.parse(trimmed);
  const normalizedEntry = normalizeEntry(rawEntry, args.lang, args.source, args.sourceUrl, generatedAt);
  if (normalizedEntry) {
    entries.push(normalizedEntry);
  }
}

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
};

writeFileSync(join(args.out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(join(args.out, 'entries.json.gz'), gzipSync(JSON.stringify(entries)));

console.log(`Built offline pack ${manifest.packId} with ${entries.length} entries.`);

function normalizeEntry(rawEntry, langCode, sourceName, sourceUrl, updatedAt) {
  const word = getString(rawEntry.word);
  if (!word) return null;

  const definitions = normalizeDefinitions(rawEntry);
  if (!definitions.length) return null;

  return {
    attribution: `Source: ${sourceName} (CC-BY-SA-4.0/GFDL)`,
    audio: normalizeAudio(rawEntry),
    definitions,
    etymology: getString(rawEntry.etymology_text) || getString(rawEntry.etymology) || '',
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

  return sounds
    .map((sound) => getString(sound.audio) || getString(sound.mp3_url) || getString(sound.ogg_url))
    .filter(Boolean);
}

function normalizeExamples(rawEntry) {
  const senses = Array.isArray(rawEntry.senses) ? rawEntry.senses : [];

  return senses
    .flatMap((sense) => (Array.isArray(sense.examples) ? sense.examples : []))
    .map((example) => {
      if (typeof example === 'string') return { source: example };
      return {
        source: getString(example.text),
        translation: getString(example.translation) || getString(example.english),
      };
    })
    .filter((example) => example.source);
}

function normalizeRelations(rawEntry) {
  const senses = Array.isArray(rawEntry.senses) ? rawEntry.senses : [];
  return {
    antonyms: normalizeLinkage([...(rawEntry.antonyms ?? []), ...senses.flatMap((sense) => sense.antonyms ?? [])]),
    synonyms: normalizeLinkage([...(rawEntry.synonyms ?? []), ...senses.flatMap((sense) => sense.synonyms ?? [])]),
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
  const ipa = sounds.map((sound) => getString(sound.ipa)).find(Boolean);

  return ipa ?? '';
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
