#!/usr/bin/env node
// Streams a Kaikki/Wiktextract JSONL dump once and reports production-gate metrics for one language:
// headword count, probe coverage (exact headword or listed inflected form), examples and related words.
// Nothing from the dump is stored; only the summary is written.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, value, index, all) => (value.startsWith('--') ? [...pairs, [value.slice(2), all[index + 1]]] : pairs), [])
);
if (!args.url || !args.lang || !args.probes) {
  console.error('Usage: node scripts/measure-kaikki-dump.mjs --url <jsonl url> --lang <code> --probes <headword list> [--output <json>]');
  process.exit(1);
}

const normalize = (word) => word.trim().normalize('NFC').toLocaleLowerCase();
// Probe lists use "word|pos|kind" lines (see data/headword-lists/); only the word is matched.
const probes = readFileSync(args.probes, 'utf8')
  .split(/\r?\n/)
  .map((line) => line.split('|')[0].trim())
  .filter((word) => word && !word.startsWith('#'));
const probeKeys = new Set(probes.map(normalize));
const exactHits = new Set();
const formHits = new Set();
const headwords = new Set();
const withExamples = new Set();
const withRelations = new Set();
const lemmas = new Set();
const lemmaExamples = new Set();
const lemmaRelations = new Set();
const probeExamples = new Set();
const probeRelations = new Set();
let lines = 0;
let otherLanguages = 0;

const hasRelations = (entry) => ['synonyms', 'antonyms'].some((key) =>
  (Array.isArray(entry[key]) && entry[key].length) || (entry.senses ?? []).some((sense) => Array.isArray(sense[key]) && sense[key].length)
);

const response = await fetch(args.url, { headers: { 'User-Agent': 'dictionary-mobile-measurement/1.0 (+https://github.com/lucynguyen777/dictionary-mobile)' } });
if (!response.ok || !response.body) throw new Error(`Dump request failed: ${response.status}`);
const reader = createInterface({ crlfDelay: Infinity, input: Readable.fromWeb(response.body) });

for await (const line of reader) {
  lines += 1;
  if (lines % 200_000 === 0) console.error(`… ${lines.toLocaleString()} lines, ${headwords.size.toLocaleString()} headwords`);
  let entry;
  try {
    entry = JSON.parse(line);
  } catch {
    continue;
  }
  if (entry.lang_code !== args.lang || typeof entry.word !== 'string') {
    otherLanguages += 1;
    continue;
  }
  if (!(entry.senses ?? []).some((sense) => (sense.glosses ?? []).some((gloss) => typeof gloss === 'string' && gloss.trim()))) continue;
  const key = normalize(entry.word);
  headwords.add(key);
  if ((entry.senses ?? []).some((sense) => Array.isArray(sense.examples) && sense.examples.length)) withExamples.add(key);
  if (hasRelations(entry)) withRelations.add(key);
  const hasExamples = (entry.senses ?? []).some((sense) => Array.isArray(sense.examples) && sense.examples.length);
  // Inflected-form pages ("plural of …") carry no examples or relations by design; gates count lemmas.
  const isLemma = (entry.senses ?? []).some((sense) => !sense.form_of && !(sense.tags ?? []).includes('form-of'));
  if (isLemma) {
    lemmas.add(key);
    if (hasExamples) lemmaExamples.add(key);
    if (hasRelations(entry)) lemmaRelations.add(key);
  }
  if (probeKeys.has(key)) {
    exactHits.add(key);
    if (hasExamples) probeExamples.add(key);
    if (hasRelations(entry)) probeRelations.add(key);
  }
  for (const form of entry.forms ?? []) {
    if (typeof form.form === 'string' && probeKeys.has(normalize(form.form))) formHits.add(normalize(form.form));
  }
}

const percent = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);
const summary = {
  examplesPercent: percent(withExamples.size, headwords.size),
  headwords: headwords.size,
  lemmaExamplesPercent: percent(lemmaExamples.size, lemmas.size),
  lemmaRelatedWordsPercent: percent(lemmaRelations.size, lemmas.size),
  lemmas: lemmas.size,
  probeExamplesPercent: percent(probeExamples.size, exactHits.size),
  probeRelatedWordsPercent: percent(probeRelations.size, exactHits.size),
  lang: args.lang,
  linesScanned: lines,
  measuredAt: new Date().toISOString(),
  missingProbes: probes.filter((probe) => !exactHits.has(normalize(probe)) && !formHits.has(normalize(probe))),
  otherLanguageLines: otherLanguages,
  probeCoveragePercent: percent(new Set([...exactHits, ...formHits]).size, probeKeys.size),
  probeExactPercent: percent(exactHits.size, probeKeys.size),
  probes: probeKeys.size,
  relatedWordsPercent: percent(withRelations.size, headwords.size),
  sourceLastModified: response.headers.get('last-modified') ?? '',
  url: args.url,
};
const output = args.output ?? `tmp/language-measurements/${args.lang}-dump-${Date.now()}.json`;
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ ...summary, missingProbes: summary.missingProbes.slice(0, 20) }, null, 2));
