const storage = vi.hoisted(() => new Map<string, string>());
vi.mock('../data/storageAdapter', () => ({
  getStoredItem: async (key: string) => storage.get(key) ?? null,
  setStoredItem: async (key: string, value: string) => {
    storage.set(key, value);
  },
}));

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SPECIALIZED_GLOSSARY_MAX_CHARS,
  SPECIALIZED_GLOSSARY_STORAGE_KEY,
  loadSpecializedGlossaries,
  saveSpecializedGlossary,
} from '../data/specializedGlossaryStore';

beforeEach(() => storage.clear());

describe('specializedGlossaryStore', () => {
  it('keeps one glossary per domain', async () => {
    await saveSpecializedGlossary('medical', 'MRI → cộng hưởng từ');
    await saveSpecializedGlossary('legal', 'tort → sai phạm dân sự');
    expect(await loadSpecializedGlossaries()).toEqual({ legal: 'tort → sai phạm dân sự', medical: 'MRI → cộng hưởng từ' });
  });

  it('recovers from corrupt or foreign data', async () => {
    storage.set(SPECIALIZED_GLOSSARY_STORAGE_KEY, '{not json');
    expect(await loadSpecializedGlossaries()).toEqual({});
    storage.set(SPECIALIZED_GLOSSARY_STORAGE_KEY, JSON.stringify({ medical: 42, tech: 'API → giao diện lập trình' }));
    expect(await loadSpecializedGlossaries()).toEqual({ tech: 'API → giao diện lập trình' });
  });

  it('caps stored text size', async () => {
    await saveSpecializedGlossary('general', 'x'.repeat(SPECIALIZED_GLOSSARY_MAX_CHARS + 10));
    expect((await loadSpecializedGlossaries()).general).toHaveLength(SPECIALIZED_GLOSSARY_MAX_CHARS);
  });
});
