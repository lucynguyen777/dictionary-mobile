#!/usr/bin/env node
// Source-gate probe for Wiktionary editions without a Kaikki/Wiktextract extraction (plan 6.6).
// Fetches the probe pages' wikitext through the MediaWiki API (50 titles per request) and reports,
// for the target-language section only: probes found, with definitions, with examples and with
// related words. Nothing from the pages is stored; only the summary is written.
//
//   node scripts/measure-wiktionary-api.mjs --site eu.wiktionary.org --probes data/headword-lists/basque-promotion-100.txt \
//     --section '\{\{-eu-\}\}' --next-section '\{\{-[a-z-]+-\}\}' --relations 'Sinonimoak|Antonimoak' [--output <json>]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, value, index, all) => (value.startsWith('--') ? [...pairs, [value.slice(2), all[index + 1]]] : pairs), [])
);
if (!args.site || !args.probes || !args.section || !args['next-section'] || !args.relations) {
  console.error('Usage: node scripts/measure-wiktionary-api.mjs --site <host> --probes <list> --section <regex> --next-section <regex> --relations <heading regex> [--output <json>]');
  process.exit(1);
}

const USER_AGENT = 'dictionary-mobile-measurement/1.0 (+https://github.com/lucynguyen777/dictionary-mobile)';
const probes = readFileSync(args.probes, 'utf8')
  .split(/\r?\n/)
  .filter((line) => line.trim() && !line.startsWith('#'))
  .map((line) => line.split('|')[0].trim().normalize('NFC'));
const sectionStart = new RegExp(args.section);
const nextSection = new RegExp(args['next-section'], 'g');
const relationsHeading = new RegExp(`^=+\\s*(?:\\{\\{)?(?:${args.relations})(?:\\}\\})?\\s*=+\\s*$`, 'i');

function analyzeSection(wikitext) {
  const start = wikitext.search(sectionStart);
  if (start < 0) return null;
  const rest = wikitext.slice(start + 1);
  nextSection.lastIndex = 0;
  const next = nextSection.exec(rest);
  const lines = (next ? rest.slice(0, next.index) : rest).split('\n');
  let inRelations = false;
  let relations = 0;
  let definitions = 0;
  let examples = 0;
  for (const line of lines) {
    if (/^=+.*=+\s*$/.test(line.trim())) {
      inRelations = relationsHeading.test(line.trim());
      continue;
    }
    if (/^#[^*:#]/.test(line) && line.slice(1).trim()) definitions += 1;
    else if (/^#[*:]/.test(line) && line.slice(2).trim()) examples += 1;
    else if (inRelations && /^[*:]/.test(line) && /\[\[|\{\{/.test(line)) relations += 1;
  }
  return { definitions, examples, relations };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Wikimedia throttles bursts (429 or a plain-text notice); back off and retry.
async function fetchJson(url) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const body = await response.text();
    if (response.ok) {
      try {
        return JSON.parse(body);
      } catch {
        // Throttle notice instead of JSON.
      }
    }
    await sleep(5_000 * 2 ** attempt);
  }
  throw new Error(`API request kept failing: ${url}`);
}

// Small batches: full page content is large and the API would otherwise continue the result.
async function fetchBatch(titles) {
  const pages = [];
  const aliases = new Map();
  let next = {};
  do {
    const url = new URL(`https://${args.site}/w/api.php`);
    url.search = new URLSearchParams({
      action: 'query', format: 'json', formatversion: '2', prop: 'revisions', redirects: '1',
      rvprop: 'content', rvslots: 'main', titles: titles.join('|'), ...next,
    }).toString();
    const data = await fetchJson(url);
    for (const step of [...(data.query?.normalized ?? []), ...(data.query?.redirects ?? [])]) aliases.set(step.to, step.from);
    pages.push(...(data.query?.pages ?? []));
    next = data.continue ?? null;
    await sleep(1_000);
  } while (next);
  return { aliases, pages };
}

const results = new Map();
for (let index = 0; index < probes.length; index += 10) {
  const { aliases, pages } = await fetchBatch(probes.slice(index, index + 10));
  for (const page of pages) {
    const wikitext = page.revisions?.[0]?.slots?.main?.content;
    if (!wikitext && !page.missing) continue;
    let title = page.title;
    while (aliases.has(title)) title = aliases.get(title);
    results.set(title.normalize('NFC'), wikitext ? analyzeSection(wikitext) ?? 'no-section' : null);
  }
}
const unresolved = probes.filter((probe) => !results.has(probe));
if (unresolved.length) throw new Error(`No API answer for: ${unresolved.join(', ')}`);

const found = probes.filter((probe) => results.get(probe) && results.get(probe) !== 'no-section');
const percent = (count) => Math.round((count / probes.length) * 1000) / 10;
const ofFound = (count) => (found.length ? Math.round((count / found.length) * 1000) / 10 : 0);
const withDefinitions = found.filter((probe) => results.get(probe).definitions > 0);
const withExamples = found.filter((probe) => results.get(probe).examples > 0);
const withRelations = found.filter((probe) => results.get(probe).relations > 0);
const summary = {
  measuredAt: new Date().toISOString(),
  missingPages: probes.filter((probe) => results.get(probe) === null),
  pagesWithoutLanguageSection: probes.filter((probe) => results.get(probe) === 'no-section'),
  probeExactPercent: percent(found.length),
  probeExamplesPercent: ofFound(withExamples.length),
  probeRelatedWordsPercent: ofFound(withRelations.length),
  probeWithDefinitionsPercent: percent(withDefinitions.length),
  probes: probes.length,
  probesFound: found.length,
  probesWithoutDefinitions: found.filter((probe) => results.get(probe).definitions === 0),
  site: args.site,
};
const json = `${JSON.stringify(summary, null, 2)}\n`;
if (args.output) {
  mkdirSync(dirname(args.output), { recursive: true });
  writeFileSync(args.output, json);
}
process.stdout.write(json);
