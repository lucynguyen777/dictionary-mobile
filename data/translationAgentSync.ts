// Mirrors translation agent presets to `translation_context_agents` (migration 002/006, owner RLS).
// Each agent resolves by last writer wins on updated_at; deletions travel as deleted_at. Presets are
// stored in retrieval_settings; system_instruction stays empty (no free-text instructions, D10).
import {
  normalizeAgentPreset,
  withTranslationAgents,
  type TranslationAgentPreset,
} from './translationAgentPresets';

export type RemoteTranslationAgent = Omit<TranslationAgentPreset, 'syncedAt'>;

export type TranslationAgentRemote = {
  listAgents: () => Promise<RemoteTranslationAgent[]>;
  upsertAgent: (agent: RemoteTranslationAgent) => Promise<void>;
};

export type TranslationAgentSyncResult = { pulled: string[]; pushed: string[] };

const later = (a: string, b: string) => Date.parse(a) > Date.parse(b);
const isDirty = (agent: TranslationAgentPreset) => agent.syncedAt !== agent.updatedAt;

export async function syncTranslationAgents(remote: TranslationAgentRemote): Promise<TranslationAgentSyncResult> {
  const [remoteAgents, snapshot] = await Promise.all([
    remote.listAgents(),
    withTranslationAgents(async (agents) => ({ result: agents })),
  ]);
  const remoteById = new Map(remoteAgents.map((agent) => [agent.id, agent]));
  const localById = new Map(snapshot.map((agent) => [agent.id, agent]));

  const toPull = remoteAgents.filter((row) => {
    const local = localById.get(row.id);
    if (!local) return !row.deletedAt;
    if (isDirty(local)) return later(row.updatedAt, local.updatedAt);
    return !local.syncedAt || later(row.updatedAt, local.syncedAt);
  });
  const pulledIds = new Set(toPull.map((row) => row.id));
  const toPush = snapshot.filter((agent) => {
    if (!isDirty(agent) || pulledIds.has(agent.id)) return false;
    const row = remoteById.get(agent.id);
    return !row || !later(row.updatedAt, agent.updatedAt);
  });

  for (const agent of toPush) {
    const { syncedAt: _syncedAt, ...row } = agent;
    await remote.upsertAgent(row);
  }

  // Applied only where the agent was not edited while the sync ran.
  return withTranslationAgents(async (agents) => {
    const result: TranslationAgentSyncResult = { pulled: [], pushed: [] };
    const byId = new Map(agents.map((agent) => [agent.id, agent]));
    for (const agent of toPush) {
      const current = byId.get(agent.id);
      if (current && current.updatedAt === agent.updatedAt) {
        byId.set(agent.id, { ...current, syncedAt: agent.updatedAt });
        result.pushed.push(agent.id);
      }
    }
    for (const row of toPull) {
      const current = byId.get(row.id);
      if ((current?.updatedAt ?? null) !== (localById.get(row.id)?.updatedAt ?? null)) continue;
      byId.set(row.id, { ...row, syncedAt: row.updatedAt });
      result.pulled.push(row.id);
    }
    const order = [...agents.map((agent) => agent.id), ...toPull.map((row) => row.id).filter((id) => !agents.some((agent) => agent.id === id))];
    return { agents: order.map((id) => byId.get(id)!), result };
  });
}

export type AgentSupabaseClient = {
  auth: { getSession: () => Promise<{ data: { session: { user: { id: string } } | null } }> };
  from: (table: string) => any;
};

type AgentRow = {
  deleted_at: string | null;
  domain_id: string;
  id: string;
  name: string;
  retrieval_settings: { kind?: string; pairId?: string; tone?: string } | null;
  updated_at: string;
};

export function createSupabaseAgentRemote(client: AgentSupabaseClient): TranslationAgentRemote {
  return {
    async listAgents() {
      const { data, error } = await client
        .from('translation_context_agents')
        .select('id, name, domain_id, retrieval_settings, updated_at, deleted_at');
      if (error) throw new Error('agent_sync_list_failed');
      return ((data ?? []) as AgentRow[])
        .filter((row) => row.retrieval_settings?.kind === 'preset')
        .map((row) => normalizeAgentPreset({
          deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : null,
          domainId: row.domain_id,
          id: row.id,
          name: row.name,
          pairId: row.retrieval_settings?.pairId,
          tone: row.retrieval_settings?.tone,
          updatedAt: new Date(row.updated_at).toISOString(),
        }))
        .filter((agent): agent is TranslationAgentPreset => Boolean(agent))
        .map(({ syncedAt: _syncedAt, ...agent }) => agent);
    },

    async upsertAgent(agent) {
      const { data } = await client.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) throw new Error('agent_sync_signed_out');
      const { error } = await client.from('translation_context_agents').upsert([{
        active: !agent.deletedAt,
        deleted_at: agent.deletedAt,
        domain_id: agent.domainId,
        id: agent.id,
        name: agent.name,
        retrieval_settings: { kind: 'preset', pairId: agent.pairId, tone: agent.tone },
        system_instruction: null,
        updated_at: agent.updatedAt,
        user_id: userId,
      }], { onConflict: 'user_id,id' });
      if (error) throw new Error('agent_sync_push_failed');
    },
  };
}

export async function syncTranslationAgentsWithSharedClient() {
  const { getSharedSupabaseAuthClient } = await import('./supabaseAuthClient');
  const auth = getSharedSupabaseAuthClient();
  if (auth.status !== 'configured') return null;
  return syncTranslationAgents(createSupabaseAgentRemote(auth.client as unknown as AgentSupabaseClient));
}
