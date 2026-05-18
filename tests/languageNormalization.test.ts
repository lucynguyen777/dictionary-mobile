import { describe, expect, it } from 'vitest';

import { normalizeLookupInput } from '../data/languageNormalization';

describe('languageNormalization', () => {
  it('normalizes Turkish dotted and dotless I with Turkish locale rules', () => {
    expect(normalizeLookupInput('IŞIK', 'tr')).toBe('ışık');
    expect(normalizeLookupInput('İSTANBUL', 'tr')).toBe('istanbul');
  });

  it('preserves Turkish lowercase words after trimming and NFC normalization', () => {
    expect(normalizeLookupInput('  ışık  ', 'tr')).toBe('ışık');
    expect(normalizeLookupInput('I\u0307stanbul', 'tr')).toBe('istanbul');
  });

  it('keeps existing default locale-agnostic behavior for other languages', () => {
    expect(normalizeLookupInput('  HELLO  ', 'en')).toBe('hello');
  });
});
