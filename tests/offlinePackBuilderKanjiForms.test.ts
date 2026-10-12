import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { expect, test } from 'vitest';

// Japanese Wiktionary keys many words by kana and writes the kanji spelling either in `forms` or as a
// separate form-of entry; --index-kanji-forms makes both spellings find the kana lemma.
const dir = 'tmp/offline-packs/test-builder-kanji-forms';

test('--index-kanji-forms stores kana lemmas under their kanji spellings', () => {
  rmSync(dir, { force: true, recursive: true });
  mkdirSync(dir, { recursive: true });
  const lines = [
    { forms: [{ form: '水', tags: ['kanji'] }, { form: 'みづ', raw_tags: ['歴史的仮名遣い'] }], lang_code: 'ja', pos: 'noun', senses: [{ glosses: ['無色透明の液体。'] }], word: 'みず' },
    { lang_code: 'ja', pos: 'verb', senses: [{ glosses: ['液体を口から体に入れる。'] }], word: 'のむ' },
    { lang_code: 'ja', pos: 'character', senses: [{ form_of: [{ word: 'のむ' }], glosses: ['のむの漢字表記。'] }], word: '飲む' },
    // A kanji spelling that already has its own entry keeps it.
    { forms: [{ form: '本', tags: ['kanji'] }], lang_code: 'ja', pos: 'noun', senses: [{ glosses: ['ALIAS MUST NOT REPLACE'] }], word: 'ほん' },
    { lang_code: 'ja', pos: 'noun', senses: [{ glosses: ['書物。'] }], word: '本' },
  ];
  writeFileSync(`${dir}/ja.jsonl`, `${lines.map((line) => JSON.stringify(line)).join('\n')}\n`);
  const build = (out: string, extra: string[]) => {
    execFileSync('node', ['scripts/build-offline-pack.mjs', '--generated-at', '2026-10-13T00:00:00.000Z', '--input', `${dir}/ja.jsonl`, '--lang', 'ja', '--source', 'jawiktionary', '--lemmas-only', '--out', out, ...extra], { stdio: 'pipe' });
    return JSON.parse(gunzipSync(readFileSync(`${out}/entries.json.gz`)).toString('utf8')) as { definitions: { gloss: string }[]; id: string; normalizedWord: string; word: string }[];
  };

  expect(build(`${dir}/plain`, []).map((entry) => entry.normalizedWord).sort()).toEqual(['のむ', 'ほん', 'みず', '本']);

  const entries = build(`${dir}/kanji`, ['--index-kanji-forms']);
  const byKey = new Map(entries.map((entry) => [entry.normalizedWord, entry]));
  expect(byKey.get('水')).toMatchObject({ id: 'ja:水', word: 'みず' });
  expect(byKey.get('飲む')).toMatchObject({ id: 'ja:飲む', word: 'のむ' });
  expect(byKey.get('本')?.definitions[0].gloss).toBe('書物。');
  expect(entries).toHaveLength(6);
  expect(JSON.parse(readFileSync(`${dir}/kanji/build-report.json`, 'utf8')).kanjiAliasEntries).toBe(2);
});
