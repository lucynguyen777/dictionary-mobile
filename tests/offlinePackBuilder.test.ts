import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const inputDir = 'tmp/offline-packs/test-builder-input';
const outputDir = 'tmp/offline-packs/test-builder-output';
const inputPath = `${inputDir}/sample.jsonl`;

describe('build-offline-pack script', () => {
  it('normalizes a small Kaikki JSONL sample into manifest and gzipped entries', () => {
    rmSync(outputDir, { force: true, recursive: true });
    mkdirSync(inputDir, { recursive: true });

    writeFileSync(
      inputPath,
      `${JSON.stringify({
        word: 'Book',
        pos: 'noun',
        sounds: [{ ipa: '/bʊk/', audio: 'book.mp3' }],
        senses: [
          {
            examples: [{ text: 'I read a book.', translation: 'Tôi đọc một cuốn sách.' }],
            glosses: ['A set of written or printed pages.'],
            tags: ['countable'],
            topics: ['education'],
          },
        ],
        synonyms: [{ word: 'volume' }],
      })}\n`
    );

    execFileSync('node', [
      'scripts/build-offline-pack.mjs',
      '--input',
      inputPath,
      '--lang',
      'en',
      '--source',
      'enwiktionary',
      '--source-url',
      'https://kaikki.org/dictionary/rawdata.html',
      '--out',
      outputDir,
    ]);

    expect(existsSync(`${outputDir}/manifest.json`)).toBe(true);
    expect(existsSync(`${outputDir}/entries.json.gz`)).toBe(true);

    const manifest = JSON.parse(readFileSync(`${outputDir}/manifest.json`, 'utf8')) as {
      entryCount: number;
      langCode: string;
      license: string;
      sourceName: string;
    };
    const entries = JSON.parse(gunzipSync(readFileSync(`${outputDir}/entries.json.gz`)).toString('utf8')) as {
      attribution: string;
      definitions: { gloss: string; tags: string[]; topics: string[] }[];
      examples: { source: string; translation?: string }[];
      id: string;
      ipa: string;
      normalizedWord: string;
      relations: { synonyms: string[] };
      word: string;
    }[];

    expect(manifest).toMatchObject({
      entryCount: 1,
      langCode: 'en',
      license: 'CC-BY-SA-4.0/GFDL',
      sourceName: 'enwiktionary',
    });
    expect(entries[0]).toMatchObject({
      attribution: 'Source: enwiktionary (CC-BY-SA-4.0/GFDL)',
      id: 'en:book',
      ipa: '/bʊk/',
      normalizedWord: 'book',
      word: 'Book',
    });
    expect(entries[0].definitions[0]).toEqual({
      gloss: 'A set of written or printed pages.',
      tags: ['countable'],
      topics: ['education'],
    });
    expect(entries[0].examples[0]).toEqual({
      source: 'I read a book.',
      translation: 'Tôi đọc một cuốn sách.',
    });
    expect(entries[0].relations.synonyms).toEqual(['volume']);
  });
});
