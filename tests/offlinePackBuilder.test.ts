import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
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

describe('build-offline-pack pipeline guarantees', () => {
  const dir = 'tmp/offline-packs/test-builder-pipeline';
  const input = `${dir}/dump.jsonl`;

  function build(out: string, extra: string[] = []) {
    execFileSync('node', [
      'scripts/build-offline-pack.mjs',
      '--input', input,
      '--lang', 'en',
      '--source', 'enwiktionary',
      '--source-revision', '2026-10-01',
      '--generated-at', '2026-10-11T00:00:00.000Z',
      '--public-base-url', 'https://cdn.example/packs/en/',
      '--out', out,
      ...extra,
    ]);
    return {
      entries: JSON.parse(gunzipSync(readFileSync(`${out}/entries.json.gz`)).toString('utf8')) as Record<string, any>[],
      manifest: JSON.parse(readFileSync(`${out}/manifest.json`, 'utf8')),
      report: JSON.parse(readFileSync(`${out}/build-report.json`, 'utf8')),
      source: JSON.parse(readFileSync(`${out}/download-source.json`, 'utf8')),
    };
  }

  function writeDump() {
    rmSync(dir, { force: true, recursive: true });
    mkdirSync(dir, { recursive: true });
    const lines = [
      { lang_code: 'en', pos: 'noun', senses: [{ glosses: ['A tool for driving nails.'] }], sounds: [{ ipa: '/ˈhæm.ə/' }], word: 'hammer' },
      { lang_code: 'en', pos: 'verb', senses: [{ examples: [{ text: 'Hammer it in.' }], glosses: ['To strike with a hammer.'] }], synonyms: [{ word: 'pound' }], word: 'Hammer' },
      { lang_code: 'fr', pos: 'noun', senses: [{ glosses: ['bread (French section)'] }], word: 'pain' },
      { lang_code: 'en', pos: 'noun', senses: [{ glosses: ['Suffering.'] }], word: 'pain' },
      { lang_code: 'en', pos: 'noun', senses: [], word: 'empty' },
      { lang_code: 'en', pos: 'noun', senses: Array.from({ length: 30 }, (_, index) => ({ glosses: [`Sense ${index} ${'x'.repeat(index === 0 ? 2_000 : 1)}`] })), word: 'set' },
    ];
    writeFileSync(input, `${lines.map((line) => JSON.stringify(line)).join('\n')}\n`);
  }

  it('keeps only the requested language section and merges parts of speech per headword', () => {
    writeDump();
    const { entries, manifest, report } = build(`${dir}/out-a`);

    expect(entries.map((entry) => entry.normalizedWord)).toEqual(['hammer', 'pain', 'set']);
    const hammer = entries[0];
    expect(hammer.partOfSpeech).toBe('noun, verb');
    expect(hammer.definitions.map((definition: { gloss: string }) => definition.gloss)).toEqual(['A tool for driving nails.', 'To strike with a hammer.']);
    expect(hammer.relations.synonyms).toEqual(['pound']);
    expect(hammer.examples).toEqual([{ source: 'Hammer it in.' }]);
    expect(entries[1].definitions[0].gloss).toBe('Suffering.');
    expect(manifest).toMatchObject({ entryCount: 3, sourceRevision: '2026-10-01' });
    expect(report).toMatchObject({ mergedEntries: 1, otherLanguageSections: 1, withoutDefinitions: 1 });
  });

  it('caps oversized entries so one headword cannot bloat the pack', () => {
    writeDump();
    const set = build(`${dir}/out-a`).entries.find((entry) => entry.word === 'set')!;
    expect(set.definitions).toHaveLength(16);
    expect(set.definitions[0].gloss.length).toBe(1_000);
  });

  it('is reproducible and publishes checksums the app can verify', () => {
    writeDump();
    const first = build(`${dir}/out-a`);
    const second = build(`${dir}/out-b`);
    const md5 = (path: string) => createHash('md5').update(readFileSync(path)).digest('hex');

    expect(second.source).toEqual(first.source);
    expect(first.source).toEqual({
      entriesMd5: md5(`${dir}/out-a/entries.json.gz`),
      entriesUrl: 'https://cdn.example/packs/en/entries.json.gz',
      entryCount: 3,
      manifestMd5: md5(`${dir}/out-a/manifest.json`),
      manifestUrl: 'https://cdn.example/packs/en/manifest.json',
    });
  });

  it('stores playable audio URLs, preferring MP3, never bare file names', () => {
    rmSync(dir, { force: true, recursive: true });
    mkdirSync(dir, { recursive: true });
    writeFileSync(input, `${JSON.stringify({
      lang_code: 'en',
      senses: [{ glosses: ['A greeting.'] }],
      sounds: [
        { ipa: '\\a.lo\\' },
        { audio: 'En-us-hello.ogg', mp3_url: 'https://upload.wikimedia.org/hello.mp3', ogg_url: 'https://upload.wikimedia.org/hello.ogg' },
        { audio: 'LL-hello.wav' },
        { audio: 'Other.ogg', ogg_url: 'https://upload.wikimedia.org/other.ogg' },
      ],
      word: 'hello',
    })}\n`);
    const [hello] = build(`${dir}/out-audio`).entries;
    expect(hello.audio).toEqual(['https://upload.wikimedia.org/hello.mp3', 'https://upload.wikimedia.org/other.ogg']);
    expect(hello.ipa).toBe('/a.lo/');
  });

  it('takes only related words from a helper source and credits it', () => {
    writeDump();
    const helper = `${dir}/helper.jsonl`;
    writeFileSync(helper, [
      { lang_code: 'en', senses: [{ glosses: ['HELPER DEFINITION MUST NOT APPEAR'] }], synonyms: [{ word: 'mallet' }], word: 'hammer' },
      { lang_code: 'en', senses: [{ glosses: ['x'] }], synonyms: [{ word: 'zzz' }], word: 'not-in-pack' },
      { lang_code: 'fr', senses: [{ glosses: ['x'] }], synonyms: [{ word: 'baguette' }], word: 'pain' },
    ].map((line) => JSON.stringify(line)).join('\n'));

    const { entries, manifest, report } = build(`${dir}/out-helper`, ['--helper-input', helper, '--helper-source', 'helperwiktionary']);
    const hammer = entries.find((entry) => entry.word === 'hammer')!;
    expect(hammer.relations.synonyms).toEqual(['pound', 'mallet']);
    expect(hammer.attribution).toContain('related words also from helperwiktionary');
    expect(JSON.stringify(entries)).not.toContain('HELPER DEFINITION');
    expect(entries.find((entry) => entry.word === 'pain')!.relations.synonyms).toEqual([]);
    expect(entries.map((entry) => entry.word)).not.toContain('not-in-pack');
    expect(manifest.helperSources).toEqual([{ name: 'helperwiktionary', use: 'related-words' }]);
    expect(report.helperEnrichedEntries).toBe(1);
  });

  it('skips inflected-form entries with --lemmas-only, even placed before other options', () => {
    writeDump();
    const formOf = { lang_code: 'en', pos: 'verb', senses: [{ form_of: [{ word: 'hammer' }], glosses: ['past tense of hammer'], tags: ['form-of'] }], word: 'hammered' };
    writeFileSync(input, `${readFileSync(input, 'utf8')}${JSON.stringify(formOf)}\n`);
    expect(build(`${dir}/out-d`).entries.map((entry) => entry.word)).toContain('hammered');

    const lemmas = build(`${dir}/out-e`, ['--lemmas-only', '--limit', '10']);
    expect(lemmas.entries.map((entry) => entry.word)).toEqual(['hammer', 'pain', 'set']);
    expect(lemmas.report.formOfEntriesSkipped).toBe(1);
  });

  it('keeps the best-documented entries when ranking by richness', () => {
    writeDump();
    const ranked = build(`${dir}/out-f`, ['--limit', '2', '--rank-by', 'richness']);
    expect(ranked.entries.map((entry) => entry.word)).toEqual(['hammer', 'set']);
    expect(ranked.report.droppedByRank).toBe(1);
  });

  it('honours an entry limit', () => {
    writeDump();
    expect(build(`${dir}/out-c`, ['--limit', '2']).entries.map((entry) => entry.word)).toEqual(['hammer', 'pain']);
  });
});
