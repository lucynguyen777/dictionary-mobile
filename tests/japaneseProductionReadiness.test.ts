import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fetchMonolingualMeaning, fetchRelatedWords } from '../data/dictionaryApi';
import { getHelperSourceGate, languageProductionRoadmap } from '../data/languageProductionRoadmap';
import { evaluateLanguagePromotion, japanesePromotionMeasurement } from '../data/languagePromotionGate';
import { getMorphologyCandidates } from '../data/morphology';

describe('Japanese production readiness', () => {
  it('resolves bounded verified ichidan forms and inflected related words', async () => {
    expect(words('食べました')).toContain('食べる');
    expect(words('食べません')).toContain('食べる');
    expect(words('たべれば')).toContain('たべる');

    await expect(fetchMonolingualMeaning('食べました', 'ja')).resolves.toMatchObject({ word: '食べる' });

    const relations = await fetchRelatedWords('食べた', 'ja');
    expect(relations.synonyms).toContain('食す');
  });

  it('records native-source form-of and fallback boundaries', () => {
    const audit = readFileSync(resolve(process.cwd(), 'docs/japanese-production-source-audit.md'), 'utf8');

    expect(audit).toContain('viable native-definition raw-dump source');
    expect(audit).toContain('English definitions are ineligible for Japanese monolingual production definitions');
    expect(audit).toContain('form-of relationships');
    expect(audit).toContain('Kept broad godan conjugation expansion');
  });
});

describe('Japanese source gates with D12 helper examples', () => {
  it('passes the example gate only with English Wiktionary examples as a credited helper', () => {
    expect(getHelperSourceGate('ja', 'examples')).toMatchObject({
      decision: expect.stringContaining('D12'),
      helperSource: 'enwiktionary',
      nativePercent: 36.7,
      passesNatively: false,
      passesWithHelper: true,
      threshold: 40,
      translationLanguage: 'en',
      withHelperPercent: 86,
    });
    expect(getHelperSourceGate('ja', 'related-words')).toMatchObject({ passesNatively: false, passesWithHelper: true });
  });

  it('clears the source gates but keeps pack and UI smoke pending, so Japanese is not promoted', () => {
    const { blockers, canPromote } = evaluateLanguagePromotion(japanesePromotionMeasurement);
    expect(blockers).not.toContain('examples');
    expect(blockers).not.toContain('related-words');
    expect(blockers).not.toContain('exact-lookup');
    expect(blockers).toEqual(['offline-pack-size', 'offline-pack-smoke', 'ui-smoke']);
    expect(canPromote).toBe(false);
    expect(languageProductionRoadmap.find((target) => target.code === 'ja')).toMatchObject({ state: 'preview-promotion' });
    expect(languageProductionRoadmap.find((target) => target.code === 'ja')?.sourcePlan).toContain('D12, approved 2026-10-12');
  });

  it('records the measured 86% figure in the source measurements', () => {
    const measurements = readFileSync(resolve(process.cwd(), 'docs/native-wiktionary-source-measurements.md'), 'utf8');
    expect(measurements).toContain('86% with enwiktionary examples');
  });
});

function words(input: string) {
  return getMorphologyCandidates('ja', input).map((candidate) => candidate.word);
}
