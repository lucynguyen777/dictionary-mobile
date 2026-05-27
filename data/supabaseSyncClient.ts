export const SUPABASE_SYNC_DOMAIN_ORDER = [
  'profile',
  'folders',
  'saved_words',
  'saved_word_folders',
  'flashcards',
  'reader_documents',
  'reader_settings',
  'search_history',
  'tombstones',
] as const;

export type SupabaseSyncDomain = (typeof SUPABASE_SYNC_DOMAIN_ORDER)[number];

export type SupabaseSyncAvailability =
  | { status: 'configured' }
  | { status: 'offline'; reason: string }
  | { status: 'signed-out'; reason: string }
  | { status: 'unconfigured'; reason: string };

export type SupabaseSyncCursor = {
  lastPullCursor: string | null;
  lastPushCursor: string | null;
  lastSuccessfulSyncAt: string | null;
};

export type SupabaseSyncRemoteChange = {
  id: string;
  table: string;
  deletedAt?: string | null;
  version?: number;
};

export type SupabaseSyncDirtyRow = {
  id: string;
  remoteRow?: Record<string, unknown>;
  table: string;
  localChangeAt: string;
};

export type SupabaseSyncClientPort = {
  getAvailability: () => Promise<SupabaseSyncAvailability>;
  loadRemoteChanges: (
    domain: SupabaseSyncDomain,
    cursor: SupabaseSyncCursor | null
  ) => Promise<{ nextCursor: string | null; rows: SupabaseSyncRemoteChange[] }>;
  pushLocalChanges: (
    domain: SupabaseSyncDomain,
    rows: SupabaseSyncDirtyRow[]
  ) => Promise<{ nextCursor: string | null; pushedRowIds: string[] }>;
};

export type SupabaseSyncLocalPort = {
  applyRemoteChanges: (domain: SupabaseSyncDomain, rows: SupabaseSyncRemoteChange[]) => Promise<void>;
  loadDirtyRows: (domain: SupabaseSyncDomain) => Promise<SupabaseSyncDirtyRow[]>;
  loadDomainCursor: (domain: SupabaseSyncDomain) => Promise<SupabaseSyncCursor | null>;
  markPushedRows: (domain: SupabaseSyncDomain, rowIds: string[], pushedAt: string) => Promise<void>;
  recordDomainCursor: (domain: SupabaseSyncDomain, cursor: SupabaseSyncCursor) => Promise<void>;
};

export type SupabaseSyncDomainResult =
  | {
      dirtyRows: number;
      domain: SupabaseSyncDomain;
      pushedRows: number;
      pulledRows: number;
      status: 'synced';
    }
  | {
      dirtyRows: number;
      domain: SupabaseSyncDomain;
      error: string;
      pushedRows: number;
      pulledRows: number;
      status: 'failed';
    };

export type SupabaseSyncRunResult =
  | {
      domains: SupabaseSyncDomainResult[];
      status: 'synced';
      syncedAt: string;
    }
  | {
      domains: SupabaseSyncDomainResult[];
      error: string;
      status: 'failed';
      syncedAt: string;
    }
  | {
      domains: [];
      reason: string;
      status: 'offline' | 'signed-out' | 'unconfigured';
      syncedAt: string;
    };

export type RunSupabaseSyncOnceOptions = {
  client: SupabaseSyncClientPort;
  domains?: readonly SupabaseSyncDomain[];
  local: SupabaseSyncLocalPort;
  now?: () => string;
};

export async function runSupabaseSyncOnce({
  client,
  domains = SUPABASE_SYNC_DOMAIN_ORDER,
  local,
  now = () => new Date().toISOString(),
}: RunSupabaseSyncOnceOptions): Promise<SupabaseSyncRunResult> {
  const syncedAt = now();
  const availability = await client.getAvailability();

  if (availability.status !== 'configured') {
    return {
      domains: [],
      reason: availability.reason,
      status: availability.status,
      syncedAt,
    };
  }

  const results: SupabaseSyncDomainResult[] = [];

  for (const domain of domains) {
    let dirtyRows = 0;
    let pulledRows = 0;
    let pushedRows = 0;

    try {
      const cursor = await local.loadDomainCursor(domain);
      const remote = await client.loadRemoteChanges(domain, cursor);
      pulledRows = remote.rows.length;

      await local.applyRemoteChanges(domain, remote.rows);

      const dirty = await local.loadDirtyRows(domain);
      dirtyRows = dirty.length;

      const pushed = dirty.length > 0
        ? await client.pushLocalChanges(domain, dirty)
        : { nextCursor: cursor?.lastPushCursor ?? null, pushedRowIds: [] };
      pushedRows = pushed.pushedRowIds.length;

      if (pushed.pushedRowIds.length > 0) {
        await local.markPushedRows(domain, pushed.pushedRowIds, syncedAt);
      }

      await local.recordDomainCursor(domain, {
        lastPullCursor: remote.nextCursor,
        lastPushCursor: pushed.nextCursor,
        lastSuccessfulSyncAt: syncedAt,
      });

      results.push({
        dirtyRows,
        domain,
        pulledRows,
        pushedRows,
        status: 'synced',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        dirtyRows,
        domain,
        error: message,
        pulledRows,
        pushedRows,
        status: 'failed',
      });

      return {
        domains: results,
        error: message,
        status: 'failed',
        syncedAt,
      };
    }
  }

  return {
    domains: results,
    status: 'synced',
    syncedAt,
  };
}
