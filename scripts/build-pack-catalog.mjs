#!/usr/bin/env node
// Builds catalog.json for hosted offline packs from build-offline-pack.mjs output folders.
// Upload each pack folder next to catalog.json; URLs are relative to the catalog.
//
//   node scripts/build-pack-catalog.mjs --out tmp/offline-packs/catalog.json tmp/offline-packs/en-v1 tmp/offline-packs/fr-v1
import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
if (outIndex === -1 || !args[outIndex + 1]) {
  console.error('Usage: node scripts/build-pack-catalog.mjs --out <catalog.json> <pack dir> [<pack dir> ...]');
  process.exit(1);
}
const out = args[outIndex + 1];
const packDirs = args.filter((_, index) => index !== outIndex && index !== outIndex + 1);
if (!packDirs.length) {
  console.error('Pass at least one pack folder.');
  process.exit(1);
}

const md5 = (path) => createHash('md5').update(readFileSync(path)).digest('hex');
const urlFor = (path) => relative(dirname(out), path).split('\\').join('/');

const packs = packDirs.map((dir) => {
  const manifestPath = join(dir, 'manifest.json');
  const entriesPath = join(dir, 'entries.json.gz');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.license !== 'CC-BY-SA-4.0/GFDL' || !manifest.sourceName || !manifest.entryCount) {
    throw new Error(`${basename(dir)}: manifest needs license, sourceName and entryCount.`);
  }
  return {
    attribution: `Source: ${manifest.sourceName} via Kaikki/Wiktextract (${manifest.license})`,
    compressedSizeBytes: statSync(entriesPath).size,
    entriesMd5: md5(entriesPath),
    entriesUrl: urlFor(entriesPath),
    entryCount: manifest.entryCount,
    id: manifest.packId,
    languageCode: manifest.langCode,
    license: manifest.license,
    manifestMd5: md5(manifestPath),
    manifestUrl: urlFor(manifestPath),
    sourceName: manifest.sourceName,
    sourceRevision: manifest.sourceRevision ?? '',
  };
});

writeFileSync(out, `${JSON.stringify({ packs, schemaVersion: 1 }, null, 2)}\n`);
console.log(`Wrote ${out} with ${packs.length} pack(s).`);
