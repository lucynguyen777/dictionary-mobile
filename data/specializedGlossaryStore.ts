// Glossaries for Specialized Translation stay on the device (one text per domain) and are sent
// with each translation request; nothing is stored server-side.
import { getStoredItem, setStoredItem } from './storageAdapter';

export const SPECIALIZED_GLOSSARY_STORAGE_KEY = 'dictionary-mobile.specialized-glossary.v1';
export const SPECIALIZED_GLOSSARY_MAX_CHARS = 60_000;

export type SpecializedGlossaries = Record<string, string>;

export async function loadSpecializedGlossaries(): Promise<SpecializedGlossaries> {
  try {
    const parsed = JSON.parse((await getStoredItem(SPECIALIZED_GLOSSARY_STORAGE_KEY)) ?? '{}') as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    );
  } catch {
    return {};
  }
}

export async function saveSpecializedGlossary(domainId: string, text: string) {
  const glossaries = await loadSpecializedGlossaries();
  glossaries[domainId] = text.slice(0, SPECIALIZED_GLOSSARY_MAX_CHARS);
  await setStoredItem(SPECIALIZED_GLOSSARY_STORAGE_KEY, JSON.stringify(glossaries));
  return glossaries;
}
