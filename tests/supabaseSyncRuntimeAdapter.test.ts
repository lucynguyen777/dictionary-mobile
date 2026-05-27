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

  it('loads remote rows from the mapped table with last pull cursor filtering', async () => {
    const client = createFakeSupabaseClient({
      rowsByTable: {
        library_folders: [
          {
            deleted_at: null,
            id: 'folder-remote',
            updated_at: '2026-05-27T10:10:00.000Z',
            version: 2,
          },
        ],
      },
    });
    const adapter = createSupabaseSyncRuntimeAdapter({
      createClient: () => ({
        client,
        config: { publishableKey: 'key', status: 'configured', url: 'https://example.supabase.co' },
        status: 'configured',
        storageKind: 'memory',
      }),
    });

    await expect(
      adapter.loadRemoteChanges('folders', {
        lastPullCursor: '2026-05-27T10:00:00.000Z',
        lastPushCursor: null,
        lastSuccessfulSyncAt: null,
      })
    ).resolves.toEqual({
      nextCursor: '2026-05-27T10:10:00.000Z',
      rows: [
        {
          deletedAt: null,
          id: 'folder-remote',
          table: '',
          version: 2,
        },
      ],
    });
    expect(client.events).toEqual([
      'session',
      'from:library_folders',
      'select:library_folders:*',
      'gt:library_folders:updated_at:2026-05-27T10:00:00.000Z',
      'order:library_folders:updated_at:true',
    ]);
  });

  it('upserts local dirty rows with authenticated user id and domain conflict targets', async () => {
    const client = createFakeSupabaseClient({
      mutationRows: [{ id: 'word-1', updated_at: '2026-05-27T11:00:00.000Z' }],
    });
    const adapter = createSupabaseSyncRuntimeAdapter({
      createClient: () => ({
        client,
        config: { publishableKey: 'key', status: 'configured', url: 'https://example.supabase.co' },
        status: 'configured',
        storageKind: 'memory',
      }),
    });

    await expect(
      adapter.pushLocalChanges('saved_words', [
        {
          id: 'word-1',
          localChangeAt: '2026-05-27T10:55:00.000Z',
          remoteRow: { id: 'word-1', updated_at: '2026-05-27T10:55:00.000Z', word: 'hello' },
          table: 'saved_words',
        },
      ])
    ).resolves.toEqual({
      nextCursor: '2026-05-27T11:00:00.000Z',
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

function createFakeSupabaseClient({
  mutationRows = [],
  rowsByTable = {},
  session = { user: { id: userId } },
}: {
  mutationRows?: Record<string, unknown>[];
  rowsByTable?: Record<string, Record<string, unknown>[]>;
  session?: { user: { id: string } } | null;
} = {}) {
  const events: string[] = [];
  const upserts: { options?: { onConflict?: string }; rows: Record<string, unknown>[]; table: string }[] = [];

  return {
    auth: {
      getSession: vi.fn(async () => {
        events.push('session');
        return {
          data: { session },
          error: null,
        };
      }),
    },
    events,
    from: (table: string) => {
      events.push(`from:${table}`);
      return {
        select: (columns = '*') => {
          events.push(`select:${table}:${columns}`);
          return {
            gt: (column: string, value: string) => {
              events.push(`gt:${table}:${column}:${value}`);
              return {
                order: async (columnName: string, options?: { ascending?: boolean }) => {
                  events.push(`order:${table}:${columnName}:${String(options?.ascending)}`);
                  return {
                    data: rowsByTable[table] ?? [],
                    error: null,
                  };
                },
              };
            },
            order: async (columnName: string, options?: { ascending?: boolean }) => {
              events.push(`order:${table}:${columnName}:${String(options?.ascending)}`);
              return {
                data: rowsByTable[table] ?? [],
                error: null,
              };
            },
          };
        },
        upsert: async (rows: Record<string, unknown>[], options?: { onConflict?: string }) => {
          upserts.push({ options, rows, table });
          return {
            data: mutationRows,
            error: null,
          };
        },
      };
    },
    upserts,
  } satisfies SupabaseSyncRuntimeClient & {
    events: string[];
    upserts: { options?: { onConflict?: string }; rows: Record<string, unknown>[]; table: string }[];
  };
}
