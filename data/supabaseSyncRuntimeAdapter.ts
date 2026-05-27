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
      gt: (column: string, value: string) => {
        order: (column: string, options?: { ascending?: boolean }) => Promise<SupabaseQueryResult<Record<string, unknown>>>;
      };
      order: (column: string, options?: { ascending?: boolean }) => Promise<SupabaseQueryResult<Record<string, unknown>>>;
    };
    upsert: (
      rows: Record<string, unknown>[],
      options?: { onConflict?: string }
    ) => Promise<SupabaseMutationResult<Record<string, unknown>>>;
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

    async loadRemoteChanges(domain: SupabaseSyncDomain, cursor: SupabaseSyncCursor | null) {
      const { client } = await requireConfiguredClient();
      const table = SUPABASE_SYNC_TABLE_BY_DOMAIN[domain];
      const query = client.from(table).select('*');
      const result = cursor?.lastPullCursor
        ? await query.gt('updated_at', cursor.lastPullCursor).order('updated_at', { ascending: true })
        : await query.order('updated_at', { ascending: true });

      if (result.error) throw new Error(result.error.message);

      const rows = (result.data ?? []).map(mapRemoteChange);
      return {
        nextCursor: getLastUpdatedAt(result.data),
        rows,
      };
    },

    async pushLocalChanges(domain: SupabaseSyncDomain, rows: SupabaseSyncDirtyRow[]) {
      if (rows.length === 0) {
        return { nextCursor: null, pushedRowIds: [] };
      }

      const { client, userId } = await requireConfiguredClient();
      const table = SUPABASE_SYNC_TABLE_BY_DOMAIN[domain];
      const remoteRows = rows.map((row) => ({
        ...(row.remoteRow ?? { id: row.id }),
        user_id: userId,
      }));
      const result = await client.from(table).upsert(remoteRows, { onConflict: getUpsertConflictTarget(domain) });

      if (result.error) throw new Error(result.error.message);

      return {
        nextCursor: getLastUpdatedAt(result.data) ?? getLatestLocalChangeAt(rows),
        pushedRowIds: rows.map((row) => row.id),
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

function mapRemoteChange(row: Record<string, unknown>): SupabaseSyncRemoteChange {
  return {
    deletedAt: typeof row.deleted_at === 'string' ? row.deleted_at : null,
    id: getRemoteRowId(row),
    table: typeof row.table === 'string' ? row.table : '',
    version: typeof row.version === 'number' ? row.version : undefined,
  };
}

function getRemoteRowId(row: Record<string, unknown>) {
  if (typeof row.id === 'string') return row.id;

  const entityType = typeof row.entity_type === 'string' ? row.entity_type : '';
  const entityId = typeof row.entity_id === 'string' ? row.entity_id : '';
  if (entityType && entityId) return `${entityType}:${entityId}`;

  if (typeof row.user_id === 'string') return row.user_id;

  return '';
}

function getLastUpdatedAt(rows: Record<string, unknown>[] | null) {
  const updatedAt = rows?.at(-1)?.updated_at;
  return typeof updatedAt === 'string' ? updatedAt : null;
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

function createMissingRuntimeClient(): SupabaseAuthClientResult<SupabaseSyncRuntimeClient> {
  return {
    config: {
      missingKeys: ['createSupabaseAuthClient factory'],
      status: 'unconfigured',
    },
    status: 'unconfigured',
  };
}
