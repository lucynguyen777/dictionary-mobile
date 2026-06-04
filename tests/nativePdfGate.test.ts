import { afterEach, describe, expect, it } from 'vitest';
import { isEnabledReaderImportFormat } from '../data/readerImport';

const originalReaderEnablePdf = process.env.EXPO_PUBLIC_READER_ENABLE_PDF;
const originalExpoOs = process.env.EXPO_OS;

afterEach(() => {
  restoreEnv('EXPO_PUBLIC_READER_ENABLE_PDF', originalReaderEnablePdf);
  restoreEnv('EXPO_OS', originalExpoOs);
});

describe('native PDF gate', () => {
  it('disables PDF when running on native (android) even if the public web gate is true', () => {
    process.env.EXPO_PUBLIC_READER_ENABLE_PDF = 'true';
    process.env.EXPO_OS = 'android';

    expect(isEnabledReaderImportFormat('pdf')).toBe(false);
  });
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
