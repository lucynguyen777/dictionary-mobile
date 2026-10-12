#!/usr/bin/env node
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';

const args = parseArgs(process.argv.slice(2));
const languageCode = args.lang ?? 'fr';
// --headwords <file> keeps only entries whose headword or listed inflected form is in the file
// ("word" or "word|pos|kind" lines), e.g. to build a probe-scoped smoke pack from a full dump.
const normalizeKey = (word) => word.trim().normalize('NFC').toLocaleLowerCase();
const headwordFilter = args.headwords
  ? new Set(readFileSync(args.headwords, 'utf8').split(/\r?\n/).map((line) => line.split('|')[0].trim()).filter((word) => word && !word.startsWith('#')).map(normalizeKey))
  : null;
const limit = Number(args.limit ?? (headwordFilter ? Infinity : 5_000));
const output = args.output ?? `tmp/language-candidates/${languageCode}-kaikki-${limit}.jsonl`;
const metadataOutput = args.metadata ?? `${output}.metadata.json`;
const sourceUrl = args.sourceUrl ?? 'https://kaikki.org/dictionary/French/kaikki.org-dictionary-French.jsonl';
const definitionLanguageCode = args.definitionLang;
if (!definitionLanguageCode) {
  throw new Error('Missing --definition-lang. Corpus candidates must declare the language used by their definitions.');
}
if (definitionLanguageCode !== languageCode && args.allowBilingual !== 'true') {
  throw new Error(`Rejected non-monolingual candidate: target=${languageCode}, definitions=${definitionLanguageCode}.`);
}
const response = await fetch(sourceUrl, { headers: { 'User-Agent': 'dictionary-mobile-corpus-candidate/1.0 (+https://github.com/lucynguyen777/dictionary-mobile)' } });
if (!response.ok || !response.body) throw new Error(`Candidate source failed: ${response.status} ${response.statusText}`);

mkdirSync(dirname(output), { recursive: true });
const writer = createWriteStream(output, { encoding: 'utf8' });
const reader = createInterface({ input: Readable.fromWeb(response.body), crlfDelay: Infinity });
let accepted = 0;
let scanned = 0;
for await (const line of reader) {
  scanned += 1;
  const entry = parseEntry(line);
  if (!isCandidateEntry(entry, languageCode)) continue;
  if (headwordFilter && !matchesHeadwords(entry)) continue;
  writer.write(`${JSON.stringify(entry)}\n`);
  accepted += 1;
  if (accepted >= limit) {
    reader.close();
    break;
  }
}
writer.end();
await new Promise((resolve, reject) => {
  writer.on('finish', resolve);
  writer.on('error', reject);
});

const metadata = {
  acceptedEntries: accepted,
  definitionLanguageCode,
  extractedAt: new Date().toISOString(),
  license: 'CC-BY-SA-4.0/GFDL',
  headwordsFile: args.headwords ?? null,
  requestedLimit: Number.isFinite(limit) ? limit : null,
  scannedRows: scanned,
  sourceLastModified: response.headers.get('last-modified') ?? '',
  sourceUrl,
};
writeFileSync(metadataOutput, `${JSON.stringify(metadata, null, 2)}\n`);
console.log(JSON.stringify(metadata, null, 2));

function isCandidateEntry(entry, expectedLanguageCode) {
  if (!entry || entry.lang_code !== expectedLanguageCode || typeof entry.word !== 'string') return false;
  return Array.isArray(entry.senses) && entry.senses.some((sense) =>
    Array.isArray(sense.glosses) && sense.glosses.some((gloss) => typeof gloss === 'string' && gloss.trim())
  );
}
function matchesHeadwords(entry) {
  return headwordFilter.has(normalizeKey(entry.word))
    || (entry.forms ?? []).some((form) => typeof form.form === 'string' && headwordFilter.has(normalizeKey(form.form)));
}
function parseEntry(line) {
  try { return JSON.parse(line); } catch { return null; }
}
function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    if (!rawArgs[index].startsWith('--')) continue;
    const key = rawArgs[index].slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    parsed[key] = rawArgs[index + 1];
    index += 1;
  }
  return parsed;
}
