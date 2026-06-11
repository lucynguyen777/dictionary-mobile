#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const args = parseArgs(process.argv.slice(2));
const input = args.input ?? 'data/headword-lists/french-promotion-100.txt';
const languageCode = args.lang ?? 'fr';
const concurrency = Number(args.concurrency ?? 5);
const sourceUrl = `https://api.wiktapi.dev/v1/${languageCode}/word/{word}`;
const measuredAt = new Date().toISOString();

const probes = await readProbes(input);
const results = await mapConcurrent(probes, concurrency, measureProbe);
const resolved = results.filter((result) => result.resolved);
const inflected = results.filter((result) => result.kind === 'inflected');

const report = {
  attributedEntries: resolved.length,
  exampleCoveragePercent: percent(resolved.filter((result) => result.hasExamples).length, resolved.length),
  exactLookupPassPercent: percent(resolved.length, results.length),
  failedQueries: results.filter((result) => !result.resolved).map((result) => result.query),
  languageCode,
  measuredAt,
  morphologyPassPercent: percent(inflected.filter((result) => result.resolved).length, inflected.length),
  relatedWordsCoveragePercent: percent(resolved.filter((result) => result.hasRelatedWords).length, resolved.length),
  representativeHeadwords: results.length,
  sourceLicense: 'Wiktionary-derived CC BY-SA/GFDL; preserve attribution and source date',
  sourceUrl,
};

const output = args.output ?? `tmp/language-measurements/${languageCode}-${Date.now()}.json`;
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, `${JSON.stringify({ report, results }, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
console.log(`Detailed results: ${output}`);

async function measureProbe(probe) {
  const url = `https://api.wiktapi.dev/v1/${languageCode}/word/${encodeURIComponent(probe.query)}`;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'dictionary-mobile-corpus-measurement/1.0' } });
    if (!response.ok) return { ...probe, hasAttribution: false, hasExamples: false, hasRelatedWords: false, resolved: false };
    const payload = await response.json();
    const entries = Array.isArray(payload.entries) ? payload.entries : [];
    const senses = entries.flatMap((entry) => Array.isArray(entry.senses) ? entry.senses : []);
    return {
      ...probe,
      hasAttribution: entries.length > 0,
      hasExamples: senses.some((sense) => Array.isArray(sense.examples) && sense.examples.length > 0),
      hasRelatedWords: entries.some(hasRelatedWords),
      resolved: entries.length > 0,
    };
  } catch {
    return { ...probe, hasAttribution: false, hasExamples: false, hasRelatedWords: false, resolved: false };
  }
}

function hasRelatedWords(entry) {
  return ['synonyms', 'antonyms', 'derived', 'related', 'hypernyms', 'hyponyms']
    .some((key) => Array.isArray(entry[key]) && entry[key].length > 0);
}

async function readProbes(file) {
  const raw = await fs.readFile(file, 'utf8');
  return raw.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [query, partOfSpeech, kind] = line.split('|');
      return { kind, partOfSpeech, query };
    });
}

async function mapConcurrent(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await mapper(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

function percent(value, total) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    if (!rawArgs[index].startsWith('--')) continue;
    parsed[rawArgs[index].slice(2)] = rawArgs[index + 1];
    index += 1;
  }
  return parsed;
}
