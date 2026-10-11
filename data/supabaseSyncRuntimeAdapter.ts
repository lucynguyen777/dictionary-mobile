import type { SupabaseAuthClientResult } from './supabaseAuthClient';
import type {
  SupabaseSyncAvailability,
  SupabaseSyncClientPort,
  SupabaseSyncCursor,
  SupabaseSyncDirtyRow,
  SupabaseSyncDomain,
  SupabaseSyncRemoteChange,
} from './supabaseSyncClient';

export const SUPABASE_SYNC_TABLE_BY_DOMAIN: Record<SupabaseSyncDomain, string> = {
  flashcards: 'flashcards',
  folders: 'library_folders',
  profile: 'user_profiles',
  reader_documents: 'reader_documents',
  reader_settings: 'reader_settings',
  saved_word_folders: 'saved_word_folders',
  saved_words: 'saved_words',
  search_history: 'search_history',
  tombstones: 'deleted_entities',
};

const PULL_PAGE_SIZE = 500;
const PUSH_CHUNK_SIZE = 200;

type SupabaseQueryResult<TRow> = {
  data: TRow[] | null;
  error: { message: string } | null;
};

type SupabaseMutationResult<TRow> = {
  data: TRow[] | null;
  error: { message: string } | null;
};

export type SupabaseSyncRuntimeClient = {
  auth: {
    getSession: () => Promise<{
      data: {
        session: {
          user: {
            id: string;
          };
        } | null;
      };
      error: { message: string } | null;
    }>;
  };
  from: (table: string) => {
    select: (columns?: string) => {
      gte: (column: string, value: string) => {
        order: (column: string, options?: { ascending?: boolean }) => {
          limit: (count: number) => PromiseLike<SupabaseQueryResult<Record<string, unknown>>>;
        };
      };
      order: (column: string, options?: { ascending?: boolean }) => {
        limit: (count: number) => PromiseLike<SupabaseQueryResult<Record<string, unknown>>>;
      };
    };
    upsert: (
      rows: Record<string, unknown>[],
      options?: { onConflict?: string }
    ) => PromiseLike<SupabaseMutationResult<Record<string, unknown>>>;
  };
};

export type CreateSupabaseSyncRuntimeClient = () => SupabaseAuthClientResult<SupabaseSyncRuntimeClient>;

export type CreateSupabaseSyncRuntimeAdapterOptions = {
  createClient?: CreateSupabaseSyncRuntimeClient;
  isOnline?: () => boolean;
};

export function createSupabaseSyncRuntimeAdapter({
  createClient = createMissingRuntimeClient,
  isOnline = defaultIsOnline,
}: CreateSupabaseSyncRuntimeAdapterOptions = {}): SupabaseSyncClientPort {
  let cachedClient: SupabaseSyncRuntimeClient | null = null;
  let cachedUserId: string | null = null;

  async function requireConfiguredClient() {
    if (cachedClient && cachedUserId) {
      return { client: cachedClient, userId: cachedUserId };
    }

    const result = createClient();
    if (result.status === 'unconfigured') {
      throw new SupabaseSyncUnavailableError({
        reason: `Missing ${result.config.missingKeys.join(', ')}`,
        status: 'unconfigured',
      });
    }

    const { data, error } = await result.client.auth.getSession();
    if (error) {
      throw new SupabaseSyncUnavailableError({
        reason: error.message,
        status: 'signed-out',
      });
    }

    if (!data.session) {
      throw new SupabaseSyncUnavailableError({
        reason: 'No Supabase session.',
        status: 'signed-out',
      });
    }

    cachedClient = result.client;
    cachedUserId = data.session.user.id;

    return { client: cachedClient, userId: cachedUserId };
  }

  return {
    async getAvailability(): Promise<SupabaseSyncAvailability> {
      if (!isOnline()) {
        return { status: 'offline', reason: 'Network is offline.' };
      }

      try {
        await requireConfiguredClient();
        return { status: 'configured' };
      } catch (error) {
        if (error instanceof SupabaseSyncUnavailableError) {
          return error.availability;
        }

        return {
          reason: error instanceof Error ? error.message : String(error),
          status: 'signed-out',
        };
      }
    },

    // Pages by the server-assigned synced_at. The cursor is inclusive (gte) so rows sharing a timestamp
    // are never skipped; re-delivered rows are idempotent for the local port.
    async loadRemoteChanges(domain: SupabaseSyncDomain, cursor: SupabaseSyncCursor | null) {
      const { client } = await requireConfiguredClient();
      const table = SUPABASE_SYNC_TABLE_BY_DOMAIN[domain];
      const rowsByKey = new Map<string, Record<string, unknown>>();
      let since = cursor?.lastPullCursor ?? null;

      for (;;) {
        const query = client.from(table).select('*');
        const result = since
          ? await query.gte('synced_at', since).order('synced_at', { ascending: true }).limit(PULL_PAGE_SIZE)
          : await query.order('synced_at', { ascending: true }).limit(PULL_PAGE_SIZE);
        if (result.error) throw new Error(result.error.message);

        const page = result.data ?? [];
        for (const row of page) rowsByKey.set(getRemoteRowKey(domain, row), row);

        const lastSyncedAt = getSyncedAt(page.at(-1));
        // Stop on a short page, or when a full page cannot advance the cursor (all rows share one timestamp).
        if (page.length < PULL_PAGE_SIZE || !lastSyncedAt || lastSyncedAt === since) break;
        since = lastSyncedAt;
      }

      const rows = Array.from(rowsByKey.values());
      const latest = rows.reduce<string | null>((max, row) => {
        const syncedAt = getSyncedAt(row);
        return syncedAt && (!max || syncedAt > max) ? syncedAt : max;
      }, cursor?.lastPullCursor ?? null);

      return {
        nextCursor: latest,
        rows: rows.map((row) => mapRemoteChange(domain, row)),
      };
    },

    async pushLocalChanges(domain: SupabaseSyncDomain, rows: SupabaseSyncDirtyRow[]) {
      if (rows.length === 0) {
        return { nextCursor: null, pushedRowIds: [] };
      }

      const { client, userId } = await requireConfiguredClient();
      const table = SUPABASE_SYNC_TABLE_BY_DOMAIN[domain];
      const pushedRowIds: string[] = [];

      for (let start = 0; start < rows.length; start += PUSH_CHUNK_SIZE) {
        const chunk = rows.slice(start, start + PUSH_CHUNK_SIZE);
        const remoteRows = chunk.map((row) => {
          // synced_at is server-owned; never send a client value for it.
          const { synced_at: _ignored, ...remoteRow } = row.remoteRow;
          return { ...remoteRow, user_id: userId };
        });
        const result = await client.from(table).upsert(remoteRows, { onConflict: getUpsertConflictTarget(domain) });
        if (result.error) throw new Error(result.error.message);
        pushedRowIds.push(...chunk.map((row) => row.id));
      }

      return {
        nextCursor: getLatestLocalChangeAt(rows),
        pushedRowIds,
      };
    },
  };
}

class SupabaseSyncUnavailableError extends Error {
  readonly availability: Extract<SupabaseSyncAvailability, { status: 'signed-out' | 'unconfigured' }>;

  constructor(availability: Extract<SupabaseSyncAvailability, { status: 'signed-out' | 'unconfigured' }>) {
    super(availability.reason);
    this.availability = availability;
  }
}

function mapRemoteChange(domain: SupabaseSyncDomain, row: Record<string, unknown>): SupabaseSyncRemoteChange {
  return {
    deletedAt: typeof row.deleted_at === 'string' ? row.deleted_at : null,
    id: getRemoteRowKey(domain, row),
    row,
    table: SUPABASE_SYNC_TABLE_BY_DOMAIN[domain],
    version: typeof row.version === 'number' ? row.version : undefined,
  };
}

function getRemoteRowKey(domain: SupabaseSyncDomain, row: Record<string, unknown>) {
  switch (domain) {
    case 'profile':
    case 'reader_settings':
      return String(row.user_id ?? '');
    case 'saved_word_folders':
      return `${String(row.word_id ?? '')}:${String(row.folder_id ?? '')}`;
    case 'tombstones':
      return `${String(row.entity_type ?? '')}:${String(row.entity_id ?? '')}`;
    default:
      return String(row.id ?? '');
  }
}

// PostgREST returns timestamptz as ISO strings; tests may hand back Date objects.
function getSyncedAt(row: Record<string, unknown> | undefined) {
  const value = row?.synced_at;
  if (value instanceof Date) return value.toISOString();
  return typeof value === 'string' ? value : null;
}

function getLatestLocalChangeAt(rows: SupabaseSyncDirtyRow[]) {
  return rows.reduce<string | null>((latest, row) => {
    if (!latest || row.localChangeAt > latest) return row.localChangeAt;
    return latest;
  }, null);
}

function getUpsertConflictTarget(domain: SupabaseSyncDomain) {
  switch (domain) {
    case 'profile':
    case 'reader_settings':
      return 'user_id';
    case 'saved_word_folders':
      return 'user_id,word_id,folder_id';
    case 'tombstones':
      return 'user_id,entity_type,entity_id';
    default:
      return 'user_id,id';
  }
}

function defaultIsOnline() {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

// Callers pass the app's shared client (see supabaseSyncLifecycle); this module stays free of React Native imports.
function createMissingRuntimeClient(): SupabaseAuthClientResult<SupabaseSyncRuntimeClient> {
  return {
    config: {
      missingKeys: ['createSupabaseAuthClient factory'],
      status: 'unconfigured',
    },
    status: 'unconfigured',
  };
}
