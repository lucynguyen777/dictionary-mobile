import { describe, expect, it, vi } from 'vitest';

import {
  createSupabaseSyncRuntimeAdapter,
  SUPABASE_SYNC_TABLE_BY_DOMAIN,
  type SupabaseSyncRuntimeClient,
} from '../data/supabaseSyncRuntimeAdapter';

const userId = '00000000-0000-0000-0000-000000000001';

describe('createSupabaseSyncRuntimeAdapter', () => {
  it('reports unconfigured and offline states before querying sync tables', async () => {
    const unconfigured = createSupabaseSyncRuntimeAdapter({
      createClient: () => ({
        config: { missingKeys: ['EXPO_PUBLIC_SUPABASE_URL'], status: 'unconfigured' },
        status: 'unconfigured',
      }),
    });
    const offline = createSupabaseSyncRuntimeAdapter({
      createClient: () => {
        throw new Error('should not create client while offline');
      },
      isOnline: () => false,
    });

    await expect(unconfigured.getAvailability()).resolves.toEqual({
      reason: 'Missing EXPO_PUBLIC_SUPABASE_URL',
      status: 'unconfigured',
    });
    await expect(offline.getAvailability()).resolves.toEqual({
      reason: 'Network is offline.',
      status: 'offline',
    });
  });

  it('reports signed-out state when no Supabase session exists', async () => {
    const adapter = createSupabaseSyncRuntimeAdapter({
      createClient: () => ({
        client: createFakeSupabaseClient({ session: null }),
        config: { publishableKey: 'key', status: 'configured', url: 'https://example.supabase.co' },
        status: 'configured',
        storageKind: 'memory',
      }),
    });

    await expect(adapter.getAvailability()).resolves.toEqual({
      reason: 'No Supabase session.',
      status: 'signed-out',
    });
  });

  it('pulls by the server synced_at cursor and returns full rows', async () => {
    const remote = { deleted_at: null, id: 'folder-remote', synced_at: '2026-05-27T10:10:00.000Z', updated_at: '2026-05-27T09:00:00.000Z', version: 2 };
    const client = createFakeSupabaseClient({ rowsByTable: { library_folders: [remote] } });
    const adapter = createAdapter(client);

    await expect(
      adapter.loadRemoteChanges('folders', {
        lastPullCursor: '2026-05-27T10:00:00.000Z',
        lastPushCursor: null,
        lastSuccessfulSyncAt: null,
      })
    ).resolves.toEqual({
      nextCursor: '2026-05-27T10:10:00.000Z',
      rows: [{ deletedAt: null, id: 'folder-remote', row: remote, table: 'library_folders', version: 2 }],
    });
    expect(client.events).toEqual([
      'session',
      'from:library_folders',
      'select:library_folders:*',
      'gte:library_folders:synced_at:2026-05-27T10:00:00.000Z',
      'order:library_folders:synced_at:true',
      'limit:library_folders:500',
    ]);
  });

  it('keeps paging while full pages advance the cursor and de-duplicates overlap', async () => {
    const page1 = Array.from({ length: 500 }, (_, index) => ({ id: `w${index}`, synced_at: `2026-05-27T10:${String(index % 60).padStart(2, '0')}:00.000Z` }))
      .sort((a, b) => a.synced_at.localeCompare(b.synced_at));
    const last = page1.at(-1)!;
    const page2 = [last, { id: 'w-final', synced_at: '2026-05-27T11:00:00.000Z' }];
    const client = createFakeSupabaseClient({ pages: { saved_words: [page1, page2] } });

    const result = await createAdapter(client).loadRemoteChanges('saved_words', null);

    expect(result.rows).toHaveLength(501);
    expect(result.nextCursor).toBe('2026-05-27T11:00:00.000Z');
    expect(client.events.filter((event) => event.startsWith('gte:'))).toEqual([`gte:saved_words:synced_at:${last.synced_at}`]);
  });

  it('upserts local dirty rows with authenticated user id and domain conflict targets', async () => {
    const client = createFakeSupabaseClient();
    const adapter = createAdapter(client);

    await expect(
      adapter.pushLocalChanges('saved_words', [
        {
          id: 'word-1',
          localChangeAt: '2026-05-27T10:55:00.000Z',
          remoteRow: { id: 'word-1', synced_at: 'client-value', updated_at: '2026-05-27T10:55:00.000Z', user_id: 'spoofed', word: 'hello' },
          table: 'saved_words',
        },
      ])
    ).resolves.toEqual({
      nextCursor: '2026-05-27T10:55:00.000Z',
      pushedRowIds: ['word-1'],
    });
    expect(client.upserts).toEqual([
      {
        options: { onConflict: 'user_id,id' },
        rows: [{ id: 'word-1', updated_at: '2026-05-27T10:55:00.000Z', user_id: userId, word: 'hello' }],
        table: 'saved_words',
      },
    ]);
  });

  it('keeps table and conflict mapping explicit for singleton, join, and tombstone domains', () => {
    expect(SUPABASE_SYNC_TABLE_BY_DOMAIN).toMatchObject({
      profile: 'user_profiles',
      saved_word_folders: 'saved_word_folders',
      tombstones: 'deleted_entities',
    });
  });
});

function createAdapter(client: ReturnType<typeof createFakeSupabaseClient>) {
  return createSupabaseSyncRuntimeAdapter({
    createClient: () => ({
      client,
      config: { publishableKey: 'key', status: 'configured', url: 'https://example.supabase.co' },
      status: 'configured',
      storageKind: 'memory',
    }),
  });
}

function createFakeSupabaseClient({
  pages = {},
  rowsByTable = {},
  session = { user: { id: userId } },
}: {
  pages?: Record<string, Record<string, unknown>[][]>;
  rowsByTable?: Record<string, Record<string, unknown>[]>;
  session?: { user: { id: string } } | null;
} = {}) {
  const events: string[] = [];
  const upserts: { options?: { onConflict?: string }; rows: Record<string, unknown>[]; table: string }[] = [];
  const pageCursor: Record<string, number> = {};

  const nextPage = (table: string) => {
    if (pages[table]) {
      const index = pageCursor[table] ?? 0;
      pageCursor[table] = index + 1;
      return pages[table][index] ?? [];
    }
    return rowsByTable[table] ?? [];
  };

  const ordered = (table: string) => ({
    limit: async (count: number) => {
      events.push(`limit:${table}:${count}`);
      return { data: nextPage(table), error: null };
    },
  });

  return {
    auth: {
      getSession: vi.fn(async () => {
        events.push('session');
        return { data: { session }, error: null };
      }),
    },
    events,
    from: (table: string) => {
      events.push(`from:${table}`);
      return {
        select: (columns = '*') => {
          events.push(`select:${table}:${columns}`);
          return {
            gte: (column: string, value: string) => {
              events.push(`gte:${table}:${column}:${value}`);
              return {
                order: (columnName: string, options?: { ascending?: boolean }) => {
                  events.push(`order:${table}:${columnName}:${String(options?.ascending)}`);
                  return ordered(table);
                },
              };
            },
            order: (columnName: string, options?: { ascending?: boolean }) => {
              events.push(`order:${table}:${columnName}:${String(options?.ascending)}`);
              return ordered(table);
            },
          };
        },
        upsert: async (rows: Record<string, unknown>[], options?: { onConflict?: string }) => {
          upserts.push({ options, rows, table });
          return { data: [], error: null };
        },
      };
    },
    upserts,
  } satisfies SupabaseSyncRuntimeClient & {
    events: string[];
    upserts: { options?: { onConflict?: string }; rows: Record<string, unknown>[]; table: string }[];
  };
}
