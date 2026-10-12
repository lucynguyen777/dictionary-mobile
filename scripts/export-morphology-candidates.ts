// Prints, for every probe in a headword list, the lookup keys the app would try (the probe itself
// plus the app's morphology candidates). Feed the output to measure-kaikki-dump.mjs --candidates so
// inflected probes are scored the way the app resolves them.
//
//   npx vite-node scripts/export-morphology-candidates.ts -- --lang ru --probes data/headword-lists/russian-promotion-100.txt > tmp/ru-candidates.json
import { readFileSync } from 'node:fs';

import { getMorphologyCandidates } from '../data/morphology';

const argv = process.argv.slice(2).filter((value) => value !== '--');
const arg = (name: string) => argv[argv.indexOf(`--${name}`) + 1];
const lang = arg('lang');
const probes = readFileSync(arg('probes'), 'utf8')
  .split(/\r?\n/)
  .map((line) => line.split('|')[0].trim())
  .filter((word) => word && !word.startsWith('#'));

const candidates = Object.fromEntries(
  probes.map((probe) => [probe, [...new Set([probe, ...getMorphologyCandidates(lang, probe).map((candidate) => candidate.word)])]])
);
process.stdout.write(`${JSON.stringify(candidates, null, 2)}\n`);
