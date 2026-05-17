import { describe, expect, it } from 'vitest';
import { isEnabledReaderImportFormat } from '../data/readerImport';

describe('native PDF gate', () => {
  it('disables PDF when running on native (android) even if READER_ENABLE_PDF=true', () => {
    process.env.READER_ENABLE_PDF = 'true';
    process.env.EXPO_OS = 'android';

    expect(isEnabledReaderImportFormat('pdf')).toBe(false);
  });
});
