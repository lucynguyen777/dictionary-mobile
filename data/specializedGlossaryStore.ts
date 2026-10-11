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

const listeners = new Set<() => void>();

export function addSpecializedGlossaryListener(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Saves from the editor and sync results both read-modify-write the same key; run them one at a time.
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

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
async function readLegacyRecords(now: string): Promise<SpecializedGlossaryRecords> {
  try {
    const parsed = JSON.parse((await getStoredItem(LEGACY_SPECIALIZED_GLOSSARY_STORAGE_KEY)) ?? '{}') as unknown;
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

async function readRecords(): Promise<SpecializedGlossaryRecords> {
  const current = parseRecords(await getStoredItem(SPECIALIZED_GLOSSARY_STORAGE_KEY));
  if (current) return current;
  const legacy = await readLegacyRecords(new Date().toISOString());
  if (Object.keys(legacy).length) {
    await setStoredItem(SPECIALIZED_GLOSSARY_STORAGE_KEY, JSON.stringify(legacy));
    await removeStoredItem(LEGACY_SPECIALIZED_GLOSSARY_STORAGE_KEY);
  }
  return legacy;
}

async function writeRecords(records: SpecializedGlossaryRecords) {
  await setStoredItem(SPECIALIZED_GLOSSARY_STORAGE_KEY, JSON.stringify(records));
  listeners.forEach((listener) => listener());
}

export function loadSpecializedGlossaryRecords(): Promise<SpecializedGlossaryRecords> {
  return serialized(readRecords);
}

export async function loadSpecializedGlossaries(): Promise<SpecializedGlossaries> {
  const records = await loadSpecializedGlossaryRecords();
  return Object.fromEntries(Object.entries(records).map(([domain, record]) => [domain, record!.text]));
}

export function saveSpecializedGlossary(domainId: string, text: string, now = new Date().toISOString()) {
  return serialized(async () => {
    const records = await readRecords();
    if (isSpecializedGlossaryDomain(domainId)) {
      const previous = records[domainId];
      // Keep timestamps strictly increasing so an edit is never mistaken for the synced version.
      const updatedAt = previous && now <= previous.updatedAt ? new Date(Date.parse(previous.updatedAt) + 1).toISOString() : now;
      records[domainId] = { syncedAt: previous?.syncedAt ?? null, text: text.slice(0, SPECIALIZED_GLOSSARY_MAX_CHARS), updatedAt };
      await writeRecords(records);
    }
    return Object.fromEntries(Object.entries(records).map(([domain, record]) => [domain, record!.text])) as SpecializedGlossaries;
  });
}

// Writes a sync result only if the glossary was not edited meanwhile (its updatedAt is unchanged).
export function applySyncedGlossary(
  domainId: SpecializedGlossaryDomain,
  expectedUpdatedAt: string | null,
  record: SpecializedGlossaryRecord
) {
  return serialized(async () => {
    const records = await readRecords();
    if ((records[domainId]?.updatedAt ?? null) !== expectedUpdatedAt) return false;
    records[domainId] = { ...record, text: record.text.slice(0, SPECIALIZED_GLOSSARY_MAX_CHARS) };
    await writeRecords(records);
    return true;
  });
}
