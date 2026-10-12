const storage = vi.hoisted(() => new Map<string, string>());
vi.mock('../data/storageAdapter', () => ({
  getStoredItem: async (key: string) => storage.get(key) ?? null,
  removeStoredItem: async (key: string) => {
    storage.delete(key);
  },
  setStoredItem: async (key: string, value: string) => {
    storage.set(key, value);
  },
}));

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  LEGACY_SPECIALIZED_GLOSSARY_STORAGE_KEY,
  SPECIALIZED_GLOSSARY_MAX_CHARS,
  SPECIALIZED_GLOSSARY_STORAGE_KEY,
  applySyncedGlossary,
  loadSpecializedGlossaries,
  loadSpecializedGlossaryRecords,
  saveSpecializedGlossary,
} from '../data/specializedGlossaryStore';

beforeEach(() => storage.clear());

describe('specializedGlossaryStore', () => {
  it('keeps one glossary per domain', async () => {
    await saveSpecializedGlossary('medical', 'MRI → cộng hưởng từ');
    await saveSpecializedGlossary('legal', 'tort → sai phạm dân sự');
    expect(await loadSpecializedGlossaries()).toEqual({ legal: 'tort → sai phạm dân sự', medical: 'MRI → cộng hưởng từ' });
  });

  it('recovers from corrupt data and migrates the previous format', async () => {
    storage.set(SPECIALIZED_GLOSSARY_STORAGE_KEY, '{not json');
    expect(await loadSpecializedGlossaries()).toEqual({});
    storage.clear();
    storage.set(LEGACY_SPECIALIZED_GLOSSARY_STORAGE_KEY, JSON.stringify({ medical: 42, tech: 'API → giao diện lập trình', unknown: 'x' }));
    expect(await loadSpecializedGlossaries()).toEqual({ tech: 'API → giao diện lập trình' });
    expect(storage.has(LEGACY_SPECIALIZED_GLOSSARY_STORAGE_KEY)).toBe(false);
  });

  it('keeps edit times increasing and remembers the synced version', async () => {
    await saveSpecializedGlossary('medical', 'a → b', '2026-10-11T10:00:00.000Z');
    await saveSpecializedGlossary('medical', 'a → c', '2026-10-11T09:00:00.000Z');
    const record = (await loadSpecializedGlossaryRecords()).medical!;
    expect(record).toEqual({ syncedAt: null, text: 'a → c', updatedAt: '2026-10-11T10:00:00.001Z' });
    expect(await applySyncedGlossary('medical', 'stale', { ...record, syncedAt: record.updatedAt })).toBe(false);
    expect(await applySyncedGlossary('medical', record.updatedAt, { ...record, syncedAt: record.updatedAt })).toBe(true);
  });

  it('caps stored text size', async () => {
    await saveSpecializedGlossary('general', 'x'.repeat(SPECIALIZED_GLOSSARY_MAX_CHARS + 10));
    expect((await loadSpecializedGlossaries()).general).toHaveLength(SPECIALIZED_GLOSSARY_MAX_CHARS);
  });
});
