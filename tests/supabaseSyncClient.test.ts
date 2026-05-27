import { describe, expect, it, vi } from 'vitest';

import {
  runSupabaseSyncOnce,
  type SupabaseSyncClientPort,
  type SupabaseSyncDomain,
  type SupabaseSyncLocalPort,
} from '../data/supabaseSyncClient';

const syncedAt = '2026-05-27T10:00:00.000Z';

describe('runSupabaseSyncOnce', () => {
  it('pulls remote changes before pushing local dirty rows in deterministic domain order', async () => {
    const events: string[] = [];
    const client = createFakeClient(events);
    const local = createFakeLocal(events, {
      folders: [{ id: 'folder-dirty', table: 'library_folders', localChangeAt: '2026-05-27T09:00:00.000Z' }],
      tombstones: [{ id: 'folder-old', table: 'deleted_entities', localChangeAt: '2026-05-27T09:05:00.000Z' }],
    });

    const result = await runSupabaseSyncOnce({
      client,
      domains: ['folders', 'tombstones'],
      local,
      now: () => syncedAt,
    });

    expect(result.status).toBe('synced');
    expect(result.domains).toEqual([
      { dirtyRows: 1, domain: 'folders', pulledRows: 1, pushedRows: 1, status: 'synced' },
      { dirtyRows: 1, domain: 'tombstones', pulledRows: 1, pushedRows: 1, status: 'synced' },
    ]);
    expect(events).toEqual([
      'availability',
      'load-cursor:folders',
      'pull:folders:cursor-folders',
      'apply:folders:remote-folders',
      'dirty:folders',
      'push:folders:folder-dirty',
      'mark:folders:folder-dirty',
      'cursor:folders:next-pull-folders:next-push-folders',
      'load-cursor:tombstones',
      'pull:tombstones:cursor-tombstones',
      'apply:tombstones:remote-tombstones',
      'dirty:tombstones',
      'push:tombstones:folder-old',
      'mark:tombstones:folder-old',
      'cursor:tombstones:next-pull-tombstones:next-push-tombstones',
    ]);
  });

  it('returns unavailable states without touching local data', async () => {
    const events: string[] = [];
    const local = createFakeLocal(events);

    const result = await runSupabaseSyncOnce({
      client: {
        ...createFakeClient(events),
        getAvailability: vi.fn(async () => ({ status: 'signed-out', reason: 'No Supabase session.' } as const)),
      },
      local,
      now: () => syncedAt,
    });

    expect(result).toEqual({
      domains: [],
      reason: 'No Supabase session.',
      status: 'signed-out',
      syncedAt,
    });
    expect(events).toEqual([]);
  });

  it('keeps dirty rows unmarked when push fails so retry can replay them', async () => {
    const events: string[] = [];
    const client = createFakeClient(events, { failPushDomain: 'saved_words' });
    const local = createFakeLocal(events, {
      saved_words: [{ id: 'word-dirty', table: 'saved_words', localChangeAt: '2026-05-27T09:10:00.000Z' }],
    });

    const result = await runSupabaseSyncOnce({
      client,
      domains: ['saved_words'],
      local,
      now: () => syncedAt,
    });

    expect(result).toMatchObject({
      domains: [
        {
          dirtyRows: 1,
          domain: 'saved_words',
          error: 'fake push failure for saved_words',
          pulledRows: 1,
          pushedRows: 0,
          status: 'failed',
        },
      ],
      error: 'fake push failure for saved_words',
      status: 'failed',
      syncedAt,
    });
    expect(events).toEqual([
      'availability',
      'load-cursor:saved_words',
      'pull:saved_words:cursor-saved_words',
      'apply:saved_words:remote-saved_words',
      'dirty:saved_words',
      'push:saved_words:word-dirty',
    ]);
    expect(local.markPushedRows).not.toHaveBeenCalled();
    expect(local.recordDomainCursor).not.toHaveBeenCalled();
  });

  it('records pull cursors even when a domain has no local dirty rows', async () => {
    const events: string[] = [];
    const result = await runSupabaseSyncOnce({
      client: createFakeClient(events),
      domains: ['reader_settings'],
      local: createFakeLocal(events),
      now: () => syncedAt,
    });

    expect(result).toEqual({
      domains: [
        {
          dirtyRows: 0,
          domain: 'reader_settings',
          pulledRows: 1,
          pushedRows: 0,
          status: 'synced',
        },
      ],
      status: 'synced',
      syncedAt,
    });
    expect(events).toContain('cursor:reader_settings:next-pull-reader_settings:cursor-push-reader_settings');
    expect(events).not.toContain('push:reader_settings:');
  });
});

function createFakeClient(
  events: string[],
  options: { failPushDomain?: SupabaseSyncDomain } = {}
): SupabaseSyncClientPort {
  return {
    getAvailability: vi.fn(async () => {
      events.push('availability');
      return { status: 'configured' } as const;
    }),
    loadRemoteChanges: vi.fn(async (domain, cursor) => {
      events.push(`pull:${domain}:${cursor?.lastPullCursor ?? 'none'}`);
      return {
        nextCursor: `next-pull-${domain}`,
        rows: [{ id: `remote-${domain}`, table: String(domain), version: 2 }],
      };
    }),
    pushLocalChanges: vi.fn(async (domain, rows) => {
      events.push(`push:${domain}:${rows.map((row) => row.id).join(',')}`);
      if (options.failPushDomain === domain) throw new Error(`fake push failure for ${domain}`);

      return {
        nextCursor: `next-push-${domain}`,
        pushedRowIds: rows.map((row) => row.id),
      };
    }),
  };
}

function createFakeLocal(
  events: string[],
  dirtyRows: Partial<Record<SupabaseSyncDomain, { id: string; table: string; localChangeAt: string }[]>> = {}
): SupabaseSyncLocalPort {
  return {
    applyRemoteChanges: vi.fn(async (domain, rows) => {
      events.push(`apply:${domain}:${rows.map((row) => row.id).join(',')}`);
    }),
    loadDirtyRows: vi.fn(async (domain) => {
      events.push(`dirty:${domain}`);
      return dirtyRows[domain] ?? [];
    }),
    loadDomainCursor: vi.fn(async (domain) => {
      events.push(`load-cursor:${domain}`);
      return {
        lastPullCursor: `cursor-${domain}`,
        lastPushCursor: `cursor-push-${domain}`,
        lastSuccessfulSyncAt: null,
      };
    }),
    markPushedRows: vi.fn(async (domain, rowIds) => {
      events.push(`mark:${domain}:${rowIds.join(',')}`);
    }),
    recordDomainCursor: vi.fn(async (domain, cursor) => {
      events.push(`cursor:${domain}:${cursor.lastPullCursor}:${cursor.lastPushCursor}`);
    }),
  };
}
