import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

// Decision D12: Japanese entries may take example sentences from English Wiktionary (credited, English
// translation marked as English). Decision D13: VI->FR pair pack from French Wiktionary's Vietnamese section.
const dir = 'tmp/offline-packs/test-builder-d12-d13';

function run(args: string[]) {
  return execFileSync('node', ['scripts/build-offline-pack.mjs', '--generated-at', '2026-10-12T00:00:00.000Z', ...args], { stdio: 'pipe' });
}

function read(out: string) {
  return {
    entries: JSON.parse(gunzipSync(readFileSync(`${out}/entries.json.gz`)).toString('utf8')) as Record<string, any>[],
    manifest: JSON.parse(readFileSync(`${out}/manifest.json`, 'utf8')),
    report: JSON.parse(readFileSync(`${out}/build-report.json`, 'utf8')),
  };
}

function writeJsonl(path: string, lines: object[]) {
  writeFileSync(path, `${lines.map((line) => JSON.stringify(line)).join('\n')}\n`);
}

function writeJapaneseDumps() {
  rmSync(dir, { force: true, recursive: true });
  mkdirSync(dir, { recursive: true });
  writeJsonl(`${dir}/ja.jsonl`, [
    { lang_code: 'ja', pos: 'noun', senses: [{ glosses: ['住むための建物。'] }], word: '家' },
    { lang_code: 'ja', pos: 'noun', senses: [{ examples: [{ text: '本を読む。' }], glosses: ['書物。'] }], word: '本' },
    { lang_code: 'ja', pos: 'noun', senses: [{ glosses: ['空から降る水。'] }], word: '雨' },
  ]);
  writeJsonl(`${dir}/helper.jsonl`, [
    {
      lang_code: 'ja',
      senses: [{
        examples: Array.from({ length: 10 }, (_, index) => ({ english: `This is house ${index}.`, text: `これは家${index}です。` })),
        glosses: ['HELPER DEFINITION MUST NOT APPEAR'],
      }],
      synonyms: [{ word: '住宅' }],
      word: '家',
    },
    { lang_code: 'ja', senses: [{ examples: [{ english: 'I read a book.', text: '本を読みます。' }], glosses: ['book'] }], word: '本' },
    { lang_code: 'ja', senses: [{ examples: [{ text: '雨が降る。' }], glosses: ['rain'] }], word: '雨' },
    { lang_code: 'en', senses: [{ examples: [{ text: 'not Japanese' }], glosses: ['x'] }], word: '雨' },
  ]);
}

describe('build-offline-pack --helper-examples (D12)', () => {
  const base = () => ['--input', `${dir}/ja.jsonl`, '--lang', 'ja', '--source', 'jawiktionary', '--helper-input', `${dir}/helper.jsonl`, '--helper-source', 'enwiktionary'];

  it('takes no helper examples without the opt-in flag', () => {
    writeJapaneseDumps();
    run([...base(), '--out', `${dir}/no-flag`]);
    const { entries, manifest } = read(`${dir}/no-flag`);
    expect(entries.find((entry) => entry.word === '家')!.examples).toEqual([]);
    expect(manifest.helperSources).toEqual([{ name: 'enwiktionary', use: 'related-words' }]);
  });

  it('fills only entries without native examples, marks them, caps them and credits the helper', () => {
    writeJapaneseDumps();
    run([...base(), '--helper-examples', '--out', `${dir}/flag`]);
    const { entries, manifest, report } = read(`${dir}/flag`);
    const house = entries.find((entry) => entry.word === '家')!;
    const book = entries.find((entry) => entry.word === '本')!;
    const rain = entries.find((entry) => entry.word === '雨')!;

    expect(house.examples).toHaveLength(8);
    expect(house.examples[0]).toEqual({ helperSource: 'enwiktionary', source: 'これは家0です。', translation: 'This is house 0.', translationLanguage: 'en' });
    expect(house.attribution).toBe(
      'Source: jawiktionary (CC-BY-SA-4.0/GFDL); related words also from enwiktionary (CC-BY-SA-4.0/GFDL); examples also from enwiktionary (CC-BY-SA-4.0/GFDL)'
    );
    expect(house.definitions.map((definition: { gloss: string }) => definition.gloss)).toEqual(['住むための建物。']);
    // Native examples win: no helper sentence is mixed in.
    expect(book.examples).toEqual([{ source: '本を読む。' }]);
    expect(book.attribution).not.toContain('examples also from');
    // A helper example without a translation carries no language marker; other-language sections are ignored.
    expect(rain.examples).toEqual([{ helperSource: 'enwiktionary', source: '雨が降る。' }]);
    expect(JSON.stringify(entries)).not.toContain('HELPER DEFINITION');
    expect(manifest.helperSources).toEqual([
      { name: 'enwiktionary', use: 'related-words' },
      { name: 'enwiktionary', translationLanguage: 'en', use: 'examples' },
    ]);
    expect(report.helperExampleEntries).toBe(2);
  });

  it('refuses --helper-examples without a helper source', () => {
    writeJapaneseDumps();
    expect(() => run(['--input', `${dir}/ja.jsonl`, '--lang', 'ja', '--source', 'jawiktionary', '--helper-examples', '--out', `${dir}/bad`])).toThrow();
  });

  it('keeps monolingual pack ids and manifests unchanged without --gloss-lang', () => {
    writeJapaneseDumps();
    run(['--input', `${dir}/ja.jsonl`, '--lang', 'ja', '--source', 'jawiktionary', '--out', `${dir}/mono`]);
    const { entries, manifest } = read(`${dir}/mono`);
    expect(manifest.packId).toBe('jawiktionary-ja-offline-pack-v1');
    expect(manifest).not.toHaveProperty('glossLangCode');
    expect(entries.every((entry) => !('glossLangCode' in entry))).toBe(true);
  });
});

describe('build-offline-pack --gloss-lang (D13 VI->FR pair pack)', () => {
  it('records the definition language and drops Vietnamese-glossed cross-reference senses', () => {
    rmSync(dir, { force: true, recursive: true });
    mkdirSync(dir, { recursive: true });
    writeJsonl(`${dir}/vi-fr.jsonl`, [
      {
        lang_code: 'vi',
        pos: 'noun',
        senses: [
          { examples: [{ text: 'nhà gạch', translation: 'Maison en briques' }], glosses: ['Maison; demeure; habitation.'] },
          { glosses: ['Xem nhà ăn; nhà bếp; nhà xe.'] },
          { glosses: ['Famille (xem gia đình).'] },
        ],
        word: 'nhà',
      },
      { lang_code: 'vi', pos: 'noun', senses: [{ glosses: ['Nói tắt của nha_lại.'] }, { glosses: ['Như nha_môn.'] }], word: 'nha' },
      { lang_code: 'vi', pos: 'adverb', senses: [{ glosses: ['Là ; là-bas.'] }], word: 'kia' },
      { lang_code: 'vi', pos: 'noun', senses: [{ glosses: ['(bảy)'] }], word: '𬙞' },
      { lang_code: 'fr', pos: 'noun', senses: [{ glosses: ['Section française'] }], word: 'maison' },
    ]);

    run([
      '--input', `${dir}/vi-fr.jsonl`, '--lang', 'vi', '--gloss-lang', 'fr', '--source', 'frwiktionary',
      '--source-url', 'https://kaikki.org/frwiktionary/Vietnamien/kaikki.org-dictionary-Vietnamien.jsonl', '--out', `${dir}/pair`,
    ]);
    const { entries, manifest, report } = read(`${dir}/pair`);

    expect(manifest).toMatchObject({ glossLangCode: 'fr', langCode: 'vi', license: 'CC-BY-SA-4.0/GFDL', packId: 'frwiktionary-vi-fr-offline-pack-v1' });
    expect(entries.map((entry) => entry.word)).toEqual(['kia', 'nhà']);
    const house = entries.find((entry) => entry.word === 'nhà')!;
    expect(house.glossLangCode).toBe('fr');
    expect(house.attribution).toBe('Source: frwiktionary (CC-BY-SA-4.0/GFDL)');
    // French glosses that cite Vietnamese words stay; cross-references in Vietnamese go.
    expect(house.definitions.map((definition: { gloss: string }) => definition.gloss)).toEqual(['Maison; demeure; habitation.', 'Famille (xem gia đình).']);
    expect(house.examples).toEqual([{ source: 'nhà gạch', translation: 'Maison en briques', translationLanguage: 'fr' }]);
    expect(entries.find((entry) => entry.word === 'kia')!.definitions[0].gloss).toBe('Là ; là-bas.');
    expect(report).toMatchObject({ headwordLanguageGlossesDropped: 4, otherLanguageSections: 1, withoutDefinitions: 2 });
  });
});
