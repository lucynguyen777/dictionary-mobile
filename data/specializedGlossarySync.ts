// Mirrors Specialized Translation glossaries to the account (tables from migration 002, owner RLS).
// Each domain glossary is one `user_glossaries` row plus its `user_glossary_entries`; conflicts are
// resolved per glossary by last writer wins on updated_at. Only valid "term → translation" lines
// travel, so comments and unreadable lines stay on the device that wrote them.
import { parseGlossaryText, type GlossaryTerm } from './glossaryMatching';
import {
  SPECIALIZED_GLOSSARY_DOMAINS,
  applySyncedGlossary,
  isSpecializedGlossaryDomain,
  loadSpecializedGlossaryRecords,
  type SpecializedGlossaryDomain,
} from './specializedGlossaryStore';

const GLOSSARY_ID_PREFIX = 'specialized-';

const DOMAIN_NAMES: Record<SpecializedGlossaryDomain, string> = {
  academic: 'Học thuật',
  general: 'Chung',
  legal: 'Pháp lý',
  medical: 'Y khoa',
  tech: 'CNTT',
};

export type RemoteGlossarySummary = { domainId: SpecializedGlossaryDomain; updatedAt: string };

export type SpecializedGlossaryRemote = {
  listGlossaries: () => Promise<RemoteGlossarySummary[]>;
  loadTerms: (domainId: SpecializedGlossaryDomain) => Promise<GlossaryTerm[]>;
  replaceGlossary: (domainId: SpecializedGlossaryDomain, terms: GlossaryTerm[], updatedAt: string) => Promise<void>;
};

export type SpecializedGlossarySyncResult = {
  pulled: SpecializedGlossaryDomain[];
  pushed: SpecializedGlossaryDomain[];
};

const later = (a: string, b: string) => Date.parse(a) > Date.parse(b);

export async function syncSpecializedGlossaries(remote: SpecializedGlossaryRemote): Promise<SpecializedGlossarySyncResult> {
  const result: SpecializedGlossarySyncResult = { pulled: [], pushed: [] };
  const [records, remoteList] = await Promise.all([loadSpecializedGlossaryRecords(), remote.listGlossaries()]);
  const remoteByDomain = new Map(remoteList.map((summary) => [summary.domainId, summary]));

  for (const domainId of SPECIALIZED_GLOSSARY_DOMAINS) {
    const local = records[domainId];
    const remoteSummary = remoteByDomain.get(domainId);
    const localDirty = Boolean(local && local.syncedAt !== local.updatedAt);
    const remoteChanged = Boolean(remoteSummary && (!local?.syncedAt || later(remoteSummary.updatedAt, local.syncedAt)));

    const shouldPull = remoteChanged && (!localDirty || !local || later(remoteSummary!.updatedAt, local.updatedAt));
    if (shouldPull) {
      const terms = await remote.loadTerms(domainId);
      const text = terms.map((term) => `${term.sourceTerm} → ${term.targetTerm}`).join('\n');
      const applied = await applySyncedGlossary(domainId, local?.updatedAt ?? null, {
        syncedAt: remoteSummary!.updatedAt,
        text,
        updatedAt: remoteSummary!.updatedAt,
      });
      if (applied) result.pulled.push(domainId);
      continue;
    }

    if (localDirty && local) {
      await remote.replaceGlossary(domainId, parseGlossaryText(local.text).terms, local.updatedAt);
      // Marks the pushed version as synced unless the user edited again while it uploaded.
      const applied = await applySyncedGlossary(domainId, local.updatedAt, { ...local, syncedAt: local.updatedAt });
      if (applied) result.pushed.push(domainId);
    }
  }

  return result;
}

// The supabase-js calls the sync makes; satisfied by the shared app client.
export type GlossarySupabaseClient = {
  auth: { getSession: () => Promise<{ data: { session: { user: { id: string } } | null } }> };
  from: (table: string) => any;
};

function entryId(glossaryId: string, sourceTerm: string) {
  return `${glossaryId}:${sourceTerm.toLocaleLowerCase()}`;
}

function throwOnError<T extends { error: { message?: string } | null }>(result: T, code: string): T {
  if (result.error) throw new Error(code);
  return result;
}

export function createSupabaseGlossaryRemote(client: GlossarySupabaseClient): SpecializedGlossaryRemote {
  const requireUserId = async () => {
    const { data } = await client.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) throw new Error('glossary_sync_signed_out');
    return userId;
  };

  const listGlossaries = async (): Promise<RemoteGlossarySummary[]> => {
    const { data } = throwOnError(
      await client.from('user_glossaries').select('id, updated_at').like('id', `${GLOSSARY_ID_PREFIX}%`).is('deleted_at', null),
      'glossary_sync_list_failed'
    );
    return ((data ?? []) as { id: string; updated_at: string }[])
      .map((row) => ({ domainId: row.id.slice(GLOSSARY_ID_PREFIX.length), updatedAt: new Date(row.updated_at).toISOString() }))
      .filter((row): row is RemoteGlossarySummary => isSpecializedGlossaryDomain(row.domainId));
  };

  return {
    listGlossaries,

    async loadTerms(domainId) {
      const { data } = throwOnError(
        await client
          .from('user_glossary_entries')
          .select('source_term, target_term')
          .eq('glossary_id', `${GLOSSARY_ID_PREFIX}${domainId}`)
          .is('deleted_at', null)
          .order('source_term', { ascending: true }),
        'glossary_sync_entries_failed'
      );
      return ((data ?? []) as { source_term: string; target_term: string }[])
        .map((row) => ({ sourceTerm: row.source_term, targetTerm: row.target_term }));
    },

    // Entries are written before the glossary row, so a sync interrupted halfway leaves the old
    // updated_at in place and the upload is simply repeated next time.
    async replaceGlossary(domainId, terms, updatedAt) {
      const userId = await requireUserId();
      const glossaryId = `${GLOSSARY_ID_PREFIX}${domainId}`;
      const glossaryRow = {
        domain_id: domainId,
        entry_count: terms.length,
        id: glossaryId,
        name: DOMAIN_NAMES[domainId],
        provider: 'openai',
        source_lang: 'EN',
        target_lang: 'VI',
        user_id: userId,
      };
      const isNewGlossary = !(await listGlossaries()).some((summary) => summary.domainId === domainId);
      if (isNewGlossary) {
        // Entries reference the glossary, so it must exist first; the old updated_at marks it unsynced.
        throwOnError(
          await client.from('user_glossaries').upsert([{ ...glossaryRow, updated_at: new Date(0).toISOString() }], { onConflict: 'user_id,id' }),
          'glossary_sync_push_failed'
        );
      }
      const entries = terms.map((term) => ({
        glossary_id: glossaryId,
        id: entryId(glossaryId, term.sourceTerm),
        source_term: term.sourceTerm,
        target_term: term.targetTerm,
        updated_at: updatedAt,
        user_id: userId,
      }));
      for (let index = 0; index < entries.length; index += 200) {
        throwOnError(
          await client.from('user_glossary_entries').upsert(entries.slice(index, index + 200), { onConflict: 'user_id,id' }),
          'glossary_sync_push_failed'
        );
      }
      const { data: existing } = throwOnError(
        await client.from('user_glossary_entries').select('id').eq('glossary_id', glossaryId),
        'glossary_sync_push_failed'
      );
      const keep = new Set(entries.map((entry) => entry.id));
      const stale = ((existing ?? []) as { id: string }[]).map((row) => row.id).filter((id) => !keep.has(id));
      for (let index = 0; index < stale.length; index += 200) {
        throwOnError(
          await client.from('user_glossary_entries').delete().eq('glossary_id', glossaryId).in('id', stale.slice(index, index + 200)),
          'glossary_sync_push_failed'
        );
      }
      throwOnError(
        await client.from('user_glossaries').upsert([{ ...glossaryRow, updated_at: updatedAt }], { onConflict: 'user_id,id' }),
        'glossary_sync_push_failed'
      );
    },
  };
}

// Runs glossary sync with the app's signed-in Supabase client; skipped when auth is not configured.
export async function syncSpecializedGlossariesWithSharedClient() {
  const { getSharedSupabaseAuthClient } = await import('./supabaseAuthClient');
  const auth = getSharedSupabaseAuthClient();
  if (auth.status !== 'configured') return null;
  return syncSpecializedGlossaries(createSupabaseGlossaryRemote(auth.client as unknown as GlossarySupabaseClient));
}
