const device = vi.hoisted(() => ({ storage: new Map<string, string>() }));
vi.mock('../data/storageAdapter', () => ({
  getStoredItem: async (key: string) => device.storage.get(key) ?? null,
  removeStoredItem: async (key: string) => {
    device.storage.delete(key);
  },
  setStoredItem: async (key: string, value: string) => {
    device.storage.set(key, value);
  },
}));

import type { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  TRANSLATION_AGENT_STORAGE_KEY,
  deleteTranslationAgent,
  loadTranslationAgents,
  saveTranslationAgent,
} from '../data/translationAgentPresets';
import { createSupabaseAgentRemote, syncTranslationAgents, type TranslationAgentRemote } from '../data/translationAgentSync';
import { createPgliteQueryClient } from './helpers/pgliteQueryBuilder';
import { createAuthUser, createSupabaseTestDatabase } from './helpers/supabaseTestDatabase';

const ALICE = '00000000-0000-4000-8000-0000000000d1';
const BOB = '00000000-0000-4000-8000-0000000000d2';

async function on<T>(storage: Map<string, string>, run: () => Promise<T>) {
  device.storage = storage;
  return run();
}

const medical = { domainId: 'medical' as const, name: 'Hồ sơ bệnh án', pairId: 'en-vi' as const, tone: 'formal' as const };

describe('translation agent presets', () => {
  it('saves up to three agents with a name, updates and deletes them', async () => {
    await on(new Map(), async () => {
      const first = await saveTranslationAgent(medical, '2026-10-11T08:00:00.000Z');
      await saveTranslationAgent({ ...medical, name: 'Hợp đồng', domainId: 'legal' });
      await saveTranslationAgent({ ...medical, name: 'Tài liệu IT', domainId: 'tech', tone: 'plain' });
      await expect(saveTranslationAgent({ ...medical, name: 'Thứ tư' })).rejects.toMatchObject({ code: 'agent_limit_reached' });
      await expect(saveTranslationAgent({ ...medical, name: '   ' })).rejects.toMatchObject({ code: 'agent_name_invalid' });
      await expect(saveTranslationAgent({ ...medical, name: 'x'.repeat(41) })).rejects.toMatchObject({ code: 'agent_name_invalid' });

      const updated = await saveTranslationAgent({ ...medical, id: first.id, tone: 'neutral' }, '2026-10-11T07:00:00.000Z');
      expect(updated.tone).toBe('neutral');
      // A clock running backwards still produces a newer version.
      expect(Date.parse(updated.updatedAt)).toBeGreaterThan(Date.parse(first.updatedAt));

      expect(await deleteTranslationAgent(first.id)).toBe(true);
      expect((await loadTranslationAgents()).map((agent) => agent.name)).toEqual(['Hợp đồng', 'Tài liệu IT']);
      // Never synced, so nothing is kept for it.
      expect(device.storage.get(TRANSLATION_AGENT_STORAGE_KEY)).not.toContain(first.id);
      await expect(saveTranslationAgent({ ...medical, name: 'Thứ ba' })).resolves.toMatchObject({ name: 'Thứ ba' });
    });
  });

  it('drops malformed stored rows', async () => {
    const storage = new Map([[TRANSLATION_AGENT_STORAGE_KEY, JSON.stringify([{ id: 'a', name: 'x', tone: 'shouty' }, 'junk'])]]);
    expect(await on(storage, loadTranslationAgents)).toEqual([]);
  });
});

describe('translation agent sync (Postgres + RLS)', () => {
  let db: PGlite;
  const remoteFor = (userId: string) => createSupabaseAgentRemote(createPgliteQueryClient(db, userId));

  beforeAll(async () => {
    db = await createSupabaseTestDatabase();
    await createAuthUser(db, ALICE);
    await createAuthUser(db, BOB);
  }, 60_000);

  it('syncs creations, edits and deletions between devices, per account', async () => {
    const phone = new Map<string, string>();
    const laptop = new Map<string, string>();
    const agent = await on(phone, () => saveTranslationAgent(medical, '2026-10-11T09:00:00.000Z'));
    expect(await on(phone, () => syncTranslationAgents(remoteFor(ALICE)))).toEqual({ pulled: [], pushed: [agent.id] });

    const row = await db.query('select system_instruction, retrieval_settings, active from public.translation_context_agents where user_id = $1', [ALICE]);
    expect(row.rows).toEqual([{ active: true, retrieval_settings: { kind: 'preset', pairId: 'en-vi', tone: 'formal' }, system_instruction: null }]);

    expect(await on(laptop, () => syncTranslationAgents(remoteFor(ALICE)))).toEqual({ pulled: [agent.id], pushed: [] });
    expect(await on(laptop, loadTranslationAgents)).toMatchObject([{ domainId: 'medical', name: 'Hồ sơ bệnh án', tone: 'formal' }]);
    expect(await on(phone, () => syncTranslationAgents(remoteFor(ALICE)))).toEqual({ pulled: [], pushed: [] });

    // The later edit wins on both devices.
    await on(phone, () => saveTranslationAgent({ ...medical, id: agent.id, tone: 'plain' }, '2026-10-11T10:00:00.000Z'));
    await on(laptop, () => saveTranslationAgent({ ...medical, id: agent.id, name: 'Bệnh án' }, '2026-10-11T10:05:00.000Z'));
    await on(phone, () => syncTranslationAgents(remoteFor(ALICE)));
    expect(await on(laptop, () => syncTranslationAgents(remoteFor(ALICE)))).toEqual({ pulled: [], pushed: [agent.id] });
    expect(await on(phone, () => syncTranslationAgents(remoteFor(ALICE)))).toEqual({ pulled: [agent.id], pushed: [] });
    expect(await on(phone, loadTranslationAgents)).toMatchObject([{ name: 'Bệnh án', tone: 'formal' }]);

    // Deleting on one device removes it on the other.
    await on(laptop, () => deleteTranslationAgent(agent.id, '2026-10-11T11:00:00.000Z'));
    await on(laptop, () => syncTranslationAgents(remoteFor(ALICE)));
    await on(phone, () => syncTranslationAgents(remoteFor(ALICE)));
    expect(await on(phone, loadTranslationAgents)).toEqual([]);

    const bobDevice = new Map<string, string>();
    expect(await on(bobDevice, () => syncTranslationAgents(remoteFor(BOB)))).toEqual({ pulled: [], pushed: [] });
  });

  it('does not mark an agent synced when it was edited during the upload', async () => {
    const tablet = new Map<string, string>();
    const agent = await on(tablet, () => saveTranslationAgent({ ...medical, name: 'Luận văn', domainId: 'academic' }, '2026-10-11T12:00:00.000Z'));
    const real = remoteFor(BOB);
    const racing: TranslationAgentRemote = {
      ...real,
      async upsertAgent(row) {
        await real.upsertAgent(row);
        await saveTranslationAgent({ ...medical, domainId: 'academic', id: agent.id, name: 'Luận án' }, '2026-10-11T12:00:05.000Z');
      },
    };
    expect(await on(tablet, () => syncTranslationAgents(racing))).toEqual({ pulled: [], pushed: [] });
    expect(await on(tablet, () => syncTranslationAgents(real))).toEqual({ pulled: [], pushed: [agent.id] });
    expect(await on(new Map(), async () => {
      await syncTranslationAgents(remoteFor(BOB));
      return (await loadTranslationAgents()).map((item) => item.name);
    })).toEqual(['Luận án']);
  });
});
