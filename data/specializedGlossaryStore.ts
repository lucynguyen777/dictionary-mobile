// Glossaries for Specialized Translation, one text per domain. They live on the device and are sent
// with each translation request; with Cloud Sync on they are also mirrored to the account
// (data/specializedGlossarySync.ts), so each record tracks when it changed and when it last synced.
import { getStoredItem, removeStoredItem, setStoredItem } from './storageAdapter';

export const SPECIALIZED_GLOSSARY_STORAGE_KEY = 'dictionary-mobile.specialized-glossary.v2';
export const LEGACY_SPECIALIZED_GLOSSARY_STORAGE_KEY = 'dictionary-mobile.specialized-glossary.v1';
export const SPECIALIZED_GLOSSARY_MAX_CHARS = 60_000;
export const SPECIALIZED_GLOSSARY_DOMAINS = ['general', 'medical', 'legal', 'tech', 'academic'] as const;

export type SpecializedGlossaryDomain = (typeof SPECIALIZED_GLOSSARY_DOMAINS)[number];
export type SpecializedGlossaries = Record<string, string>;
export type SpecializedGlossaryRecord = {
  text: string;
  // Local change time; equals syncedAt right after a push or pull.
  updatedAt: string;
  // updatedAt of the version last exchanged with the cloud, or null if never synced.
  syncedAt: string | null;
};
export type SpecializedGlossaryRecords = Partial<Record<SpecializedGlossaryDomain, SpecializedGlossaryRecord>>;

export function isSpecializedGlossaryDomain(value: unknown): value is SpecializedGlossaryDomain {
  return SPECIALIZED_GLOSSARY_DOMAINS.includes(value as SpecializedGlossaryDomain);
}

export type DomainTextStore = {
  addListener: (listener: () => void) => () => void;
  applySynced: (domainId: SpecializedGlossaryDomain, expectedUpdatedAt: string | null, record: SpecializedGlossaryRecord) => Promise<boolean>;
  loadRecords: () => Promise<SpecializedGlossaryRecords>;
  loadTexts: () => Promise<SpecializedGlossaries>;
  saveText: (domainId: string, text: string, now?: string) => Promise<SpecializedGlossaries>;
};

function parseRecords(raw: string | null): SpecializedGlossaryRecords | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const records: SpecializedGlossaryRecords = {};
    for (const [domain, value] of Object.entries(parsed as Record<string, unknown>)) {
      const record = value as Partial<SpecializedGlossaryRecord> | null;
      if (!isSpecializedGlossaryDomain(domain) || !record || typeof record.text !== 'string' || typeof record.updatedAt !== 'string') continue;
      records[domain] = {
        syncedAt: typeof record.syncedAt === 'string' ? record.syncedAt : null,
        text: record.text,
        updatedAt: record.updatedAt,
      };
    }
    return records;
  } catch {
    return {};
  }
}

// v1 stored plain text per domain; it becomes unsynced records so the next sync uploads it.
async function readLegacyRecords(legacyKey: string, now: string): Promise<SpecializedGlossaryRecords> {
  try {
    const parsed = JSON.parse((await getStoredItem(legacyKey)) ?? '{}') as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const records: SpecializedGlossaryRecords = {};
    for (const [domain, text] of Object.entries(parsed as Record<string, unknown>)) {
      if (isSpecializedGlossaryDomain(domain) && typeof text === 'string') {
        records[domain] = { syncedAt: null, text, updatedAt: now };
      }
    }
    return records;
  } catch {
    return {};
  }
}

const toTexts = (records: SpecializedGlossaryRecords) =>
  Object.fromEntries(Object.entries(records).map(([domain, record]) => [domain, record!.text])) as SpecializedGlossaries;

// One text per domain with sync timestamps. Used for glossaries and for sentence memory
// (data/specializedSentenceStore.ts).
export function createDomainTextStore({ legacyKey, maxChars, storageKey }: { legacyKey?: string; maxChars: number; storageKey: string }): DomainTextStore {
  const listeners = new Set<() => void>();

  // Saves from the editor and sync results both read-modify-write the same key; run them one at a time.
  let queue: Promise<unknown> = Promise.resolve();
  function serialized<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  }

  async function readRecords(): Promise<SpecializedGlossaryRecords> {
    const current = parseRecords(await getStoredItem(storageKey));
    if (current) return current;
    if (!legacyKey) return {};
    const legacy = await readLegacyRecords(legacyKey, new Date().toISOString());
    if (Object.keys(legacy).length) {
      await setStoredItem(storageKey, JSON.stringify(legacy));
      await removeStoredItem(legacyKey);
    }
    return legacy;
  }

  async function writeRecords(records: SpecializedGlossaryRecords) {
    await setStoredItem(storageKey, JSON.stringify(records));
    listeners.forEach((listener) => listener());
  }

  const loadRecords = () => serialized(readRecords);

  return {
    addListener(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    // Writes a sync result only if the text was not edited meanwhile (its updatedAt is unchanged).
    applySynced(domainId, expectedUpdatedAt, record) {
      return serialized(async () => {
        const records = await readRecords();
        if ((records[domainId]?.updatedAt ?? null) !== expectedUpdatedAt) return false;
        records[domainId] = { ...record, text: record.text.slice(0, maxChars) };
        await writeRecords(records);
        return true;
      });
    },
    loadRecords,
    async loadTexts() {
      return toTexts(await loadRecords());
    },
    saveText(domainId, text, now = new Date().toISOString()) {
      return serialized(async () => {
        const records = await readRecords();
        if (isSpecializedGlossaryDomain(domainId)) {
          const previous = records[domainId];
          // Keep timestamps strictly increasing so an edit is never mistaken for the synced version.
          const updatedAt = previous && now <= previous.updatedAt ? new Date(Date.parse(previous.updatedAt) + 1).toISOString() : now;
          records[domainId] = { syncedAt: previous?.syncedAt ?? null, text: text.slice(0, maxChars), updatedAt };
          await writeRecords(records);
        }
        return toTexts(records);
      });
    },
  };
}

export const specializedGlossaryStore = createDomainTextStore({
  legacyKey: LEGACY_SPECIALIZED_GLOSSARY_STORAGE_KEY,
  maxChars: SPECIALIZED_GLOSSARY_MAX_CHARS,
  storageKey: SPECIALIZED_GLOSSARY_STORAGE_KEY,
});

export const addSpecializedGlossaryListener = specializedGlossaryStore.addListener;
export const loadSpecializedGlossaryRecords = specializedGlossaryStore.loadRecords;
export const loadSpecializedGlossaries = specializedGlossaryStore.loadTexts;
export const saveSpecializedGlossary = specializedGlossaryStore.saveText;
export const applySyncedGlossary = specializedGlossaryStore.applySynced;
