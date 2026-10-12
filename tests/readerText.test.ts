import { describe, expect, it } from 'vitest';

import {
  buildTokenSentenceMap,
  groupReaderParagraphs,
  isReaderWordToken,
  splitReaderSentences,
  tokenizeReaderText,
} from '../data/readerText';

const text = 'First line here.  Second sentence!\n\nNew paragraph starts.';

describe('tokenizeReaderText', () => {
  it('keeps line breaks so paragraphs survive, while collapsing repeated spaces', () => {
    const tokens = tokenizeReaderText(text);
    expect(tokens.join('')).toBe('First line here. Second sentence!\nNew paragraph starts.');
    expect(tokens.filter((token) => token.includes('\n'))).toEqual(['\n']);
  });

  it('marks only word tokens as tappable', () => {
    expect(isReaderWordToken('fox')).toBe(true);
    expect(isReaderWordToken('. ')).toBe(false);
  });
});

describe('buildTokenSentenceMap', () => {
  it('keeps token and sentence indexes aligned across sentence boundaries', () => {
    const tokens = tokenizeReaderText(text);
    const sentences = splitReaderSentences(text);
    const map = buildTokenSentenceMap(tokens, sentences.length);

    expect(sentences).toHaveLength(3);
    expect(map).toHaveLength(tokens.length);
    expect(map[tokens.indexOf('First')]).toBe(0);
    expect(map[tokens.indexOf('Second')]).toBe(1);
    expect(map[tokens.indexOf('New')]).toBe(2);
    expect(map[tokens.lastIndexOf('starts')]).toBe(2);
  });
});

describe('groupReaderParagraphs', () => {
  it('splits paragraphs at line breaks and records which sentences each contains', () => {
    const tokens = tokenizeReaderText(text);
    const map = buildTokenSentenceMap(tokens, splitReaderSentences(text).length);
    const paragraphs = groupReaderParagraphs(tokens, map);

    expect(paragraphs).toHaveLength(2);
    expect(tokens.slice(paragraphs[0].start, paragraphs[0].end + 1).join('')).toBe('First line here. Second sentence!\n');
    expect(tokens.slice(paragraphs[1].start, paragraphs[1].end + 1).join('')).toBe('New paragraph starts.');
    expect([...paragraphs[0].sentenceIndexes]).toEqual([0, 1]);
    expect([...paragraphs[1].sentenceIndexes]).toEqual([2]);
  });
});
