// Specialized Translation "context agents" as presets (plan 4.5): a saved combination of language
// pair, domain (which picks the glossary and sentence memory) and tone. Agents have no free-text
// instructions; the server only accepts the fixed tone values (owner decision D10 is whether free
// text should ever be allowed). Up to 3 per user, kept on the device and synced with Cloud Sync
// (data/translationAgentSync.ts).
import { getStoredItem, setStoredItem } from './storageAdapter';
import { isSpecializedGlossaryDomain, type SpecializedGlossaryDomain } from './specializedGlossaryStore';

export const TRANSLATION_AGENT_STORAGE_KEY = 'dictionary-mobile.translation-agents.v1';
export const MAX_TRANSLATION_AGENTS = 3;
export const MAX_TRANSLATION_AGENT_NAME_CHARS = 40;
export const TRANSLATION_TONES = ['neutral', 'formal', 'plain'] as const;
export const TRANSLATION_AGENT_PAIRS = ['en-vi', 'vi-en'] as const;

export type TranslationTone = (typeof TRANSLATION_TONES)[number];
export type TranslationAgentPair = (typeof TRANSLATION_AGENT_PAIRS)[number];

export type TranslationAgentPreset = {
  // Set when the agent was deleted; kept so the deletion reaches other devices.
  deletedAt: string | null;
  domainId: SpecializedGlossaryDomain;
  id: string;
  name: string;
  pairId: TranslationAgentPair;
  // updatedAt of the version last exchanged with the cloud, or null if never synced.
  syncedAt: string | null;
  tone: TranslationTone;
  updatedAt: string;
};

export type TranslationAgentInput = Pick<TranslationAgentPreset, 'domainId' | 'name' | 'pairId' | 'tone'> & { id?: string };

export class TranslationAgentError extends Error {
  constructor(readonly code: 'agent_limit_reached' | 'agent_name_invalid' | 'agent_not_found') {
    super(code);
  }
}

export const isTranslationTone = (value: unknown): value is TranslationTone => TRANSLATION_TONES.includes(value as TranslationTone);
export const isTranslationAgentPair = (value: unknown): value is TranslationAgentPair =>
  TRANSLATION_AGENT_PAIRS.includes(value as TranslationAgentPair);

export function normalizeAgentPreset(value: unknown): TranslationAgentPreset | null {
  const row = (value ?? {}) as Partial<TranslationAgentPreset>;
  if (typeof row.id !== 'string' || !row.id || typeof row.name !== 'string' || typeof row.updatedAt !== 'string') return null;
  if (!isSpecializedGlossaryDomain(row.domainId) || !isTranslationAgentPair(row.pairId) || !isTranslationTone(row.tone)) return null;
  return {
    deletedAt: typeof row.deletedAt === 'string' ? row.deletedAt : null,
    domainId: row.domainId,
    id: row.id,
    name: row.name.slice(0, MAX_TRANSLATION_AGENT_NAME_CHARS),
    pairId: row.pairId,
    syncedAt: typeof row.syncedAt === 'string' ? row.syncedAt : null,
    tone: row.tone,
    updatedAt: row.updatedAt,
  };
}

const listeners = new Set<() => void>();

export function addTranslationAgentListener(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let queue: Promise<unknown> = Promise.resolve();
// Editor saves and sync results read-modify-write the same key; run them one at a time.
export function withTranslationAgents<T>(task: (agents: TranslationAgentPreset[]) => Promise<{ agents?: TranslationAgentPreset[]; result: T }>): Promise<T> {
  const run = queue.then(async () => {
    const agents = await readAgents();
    const { agents: next, result } = await task(agents);
    if (next) {
      await setStoredItem(TRANSLATION_AGENT_STORAGE_KEY, JSON.stringify(next));
      listeners.forEach((listener) => listener());
    }
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

async function readAgents(): Promise<TranslationAgentPreset[]> {
  try {
    const parsed = JSON.parse((await getStoredItem(TRANSLATION_AGENT_STORAGE_KEY)) ?? '[]') as unknown;
    return Array.isArray(parsed) ? parsed.map(normalizeAgentPreset).filter((agent): agent is TranslationAgentPreset => Boolean(agent)) : [];
  } catch {
    return [];
  }
}

// Active agents only, oldest first.
export async function loadTranslationAgents() {
  return withTranslationAgents(async (agents) => ({ result: agents.filter((agent) => !agent.deletedAt) }));
}

function nextTimestamp(previous: string | undefined, now: string) {
  // Strictly increasing per agent, so an edit is never mistaken for the synced version.
  return previous && now <= previous ? new Date(Date.parse(previous) + 1).toISOString() : now;
}

const createId = () => `agent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function saveTranslationAgent(input: TranslationAgentInput, now = new Date().toISOString()) {
  return withTranslationAgents(async (agents) => {
    const name = input.name.trim().replace(/\s+/g, ' ');
    if (!name || Array.from(name).length > MAX_TRANSLATION_AGENT_NAME_CHARS) throw new TranslationAgentError('agent_name_invalid');
    const existing = input.id ? agents.find((agent) => agent.id === input.id && !agent.deletedAt) : undefined;
    if (input.id && !existing) throw new TranslationAgentError('agent_not_found');
    if (!existing && agents.filter((agent) => !agent.deletedAt).length >= MAX_TRANSLATION_AGENTS) {
      throw new TranslationAgentError('agent_limit_reached');
    }
    const saved: TranslationAgentPreset = {
      deletedAt: null,
      domainId: input.domainId,
      id: existing?.id ?? createId(),
      name,
      pairId: input.pairId,
      syncedAt: existing?.syncedAt ?? null,
      tone: input.tone,
      updatedAt: nextTimestamp(existing?.updatedAt, now),
    };
    return { agents: existing ? agents.map((agent) => (agent.id === saved.id ? saved : agent)) : [...agents, saved], result: saved };
  });
}

export function deleteTranslationAgent(id: string, now = new Date().toISOString()) {
  return withTranslationAgents(async (agents) => {
    const existing = agents.find((agent) => agent.id === id && !agent.deletedAt);
    if (!existing) return { result: false };
    // Never-synced agents can simply disappear; synced ones leave a tombstone for other devices.
    const next = existing.syncedAt
      ? agents.map((agent) => (agent.id === id ? { ...agent, deletedAt: now, updatedAt: nextTimestamp(agent.updatedAt, now) } : agent))
      : agents.filter((agent) => agent.id !== id);
    return { agents: next, result: true };
  });
}
