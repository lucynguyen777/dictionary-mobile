import { expect, test } from 'vitest';

import { safeExternalUrl } from '@/data/legalLinks';

test('legal pages open only over HTTPS', () => {
  expect(safeExternalUrl('https://example.com/privacy')).toBe('https://example.com/privacy');
  expect(safeExternalUrl('http://example.com/privacy')).toBeNull();
  expect(safeExternalUrl('javascript:alert(1)')).toBeNull();
  expect(safeExternalUrl('')).toBeNull();
});
