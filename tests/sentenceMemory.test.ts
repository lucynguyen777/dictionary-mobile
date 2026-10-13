import { describe, expect, it } from 'vitest';

import { parseSentenceMemoryText, selectSimilarSentencePairs, sentenceTokens } from '../data/sentenceMemory';

const memory = parseSentenceMemoryText([
  'The patient was discharged from the hospital. → Bệnh nhân đã được xuất viện.',
  'The patient has a fever. → Bệnh nhân bị sốt.',
  'Take the medicine twice a day. → Uống thuốc hai lần mỗi ngày.',
  'The contract is terminated. → Hợp đồng bị chấm dứt.',
  'not a pair',
].join('\n'));

describe('sentence memory', () => {
  it('parses pairs like glossary lines and reports unreadable lines', () => {
    expect(memory.pairs).toHaveLength(4);
    expect(memory.pairs[0]).toEqual({ source: 'The patient was discharged from the hospital.', target: 'Bệnh nhân đã được xuất viện.' });
    expect(memory.invalidLines).toEqual([5]);
  });

  it('picks the pairs closest to a sentence of the text, best first', () => {
    const similar = selectSimilarSentencePairs('Yesterday the patient was discharged. She has no fever now.', memory.pairs);
    expect(similar.map((pair) => pair.target)).toEqual(['Bệnh nhân đã được xuất viện.', 'Bệnh nhân bị sốt.']);
  });

  it('ignores pairs that share only common words', () => {
    expect(selectSimilarSentencePairs('The weather is nice.', memory.pairs)).toEqual([]);
    expect(selectSimilarSentencePairs('', memory.pairs)).toEqual([]);
    expect(selectSimilarSentencePairs('The patient was discharged.', [])).toEqual([]);
  });

  it('respects the limit and skips duplicate sources', () => {
    const pairs = Array.from({ length: 8 }, (_, index) => ({ source: `invoice number ${index} overdue`, target: `hóa đơn ${index}` }));
    pairs.push({ ...pairs[0] });
    expect(selectSimilarSentencePairs('invoice number 3 overdue', pairs)).toHaveLength(5);
    expect(selectSimilarSentencePairs('invoice number 3 overdue', pairs, { limit: 2 })[0].target).toBe('hóa đơn 3');
  });

  it('uses character bigrams for scripts without spaces', () => {
    expect(sentenceTokens('病人出院')).toEqual(new Set(['病人', '人出', '出院']));
    const pairs = [{ source: '病人已经出院了', target: 'The patient has been discharged.' }, { source: '合同终止', target: 'The contract ends.' }];
    expect(selectSimilarSentencePairs('病人明天出院', pairs).map((pair) => pair.target)).toEqual(['The patient has been discharged.']);
  });
});
