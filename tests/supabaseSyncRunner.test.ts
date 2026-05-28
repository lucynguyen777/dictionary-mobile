import { describe, expect, it, vi } from 'vitest';

import {
  createSupabaseCloudSyncRunner,
  runSupabaseCloudSyncOnce,
} from '../data/supabaseSyncRunner';
import type {
  SupabaseSyncClientPort,
  SupabaseSyncDomain,
  SupabaseSyncLocalPort,
} from '../data/supabaseSyncClient';

const syncedAt = '2026-05-28T10:00:00.000Z';

describe('supabase cloud sync runner wiring', () => {
  it('stays unconfigured by default and does not open local SQLite', async () => {
    const openDatabase = vi.fn(async () => {
      throw new Error('local database should not open while sync is unconfigured');
    });

    await expect(runSupabaseCloudSyncOnce({ now: () => syncedAt, openDatabase })).resolves.toEqual({
      domains: [],
      reason: 'Missing createSupabaseAuthClient factory',
      status: 'unconfigured',
      syncedAt,
    });
    expect(openDatabase).not.toHaveBeenCalled();
  });

  it('runs injected client and local ports for the selected module domains only', async () => {
    const events: string[] = [];
    const runner = createSupabaseCloudSyncRunner({
      client: createFakeClient(events),
      domains: ['folders', 'tombstones'],
      local: createFakeLocal(events),
      now: () => syncedAt,
    });

    await expect(runner.runOnce()).resolves.toEqual({
      domains: [
        {
          dirtyRows: 0,
          domain: 'folders',
          pulledRows: 0,
          pushedRows: 0,
          status: 'synced',
        },
        {
          dirtyRows: 0,
          domain: 'tombstones',
          pulledRows: 0,
          pushedRows: 0,
          status: 'synced',
        },
      ],
      status: 'synced',
      syncedAt,
    });
    expect(events).toEqual([
      'availability',
      'cursor:folders',
      'pull:folders',
      'apply:folders',
      'dirty:folders',
      'record:folders',
      'cursor:tombstones',
      'pull:tombstones',
      'apply:tombstones',
      'dirty:tombstones',
      'record:tombstones',
    ]);
  });

  it('allows per-run domains and clock to override runner defaults', async () => {
    const events: string[] = [];
    const runner = createSupabaseCloudSyncRunner({
      client: createFakeClient(events),
      domains: ['folders'],
      local: createFakeLocal(events),
      now: () => 'default-clock',
    });

    await expect(
      runner.runOnce({
        domains: ['saved_words'],
        now: () => 'override-clock',
      })
    ).resolves.toMatchObject({
      domains: [
        {
          domain: 'saved_words',
          status: 'synced',
        },
      ],
      status: 'synced',
      syncedAt: 'override-clock',
    });
    expect(events).toContain('pull:saved_words');
    expect(events).not.toContain('pull:folders');
  });
});

function createFakeClient(events: string[]): SupabaseSyncClientPort {
  return {
    getAvailability: vi.fn(async () => {
      events.push('availability');
      return { status: 'configured' } as const;
    }),
    loadRemoteChanges: vi.fn(async (domain) => {
      events.push(`pull:${domain}`);
      return { nextCursor: `pull-${domain}`, rows: [] };
    }),
    pushLocalChanges: vi.fn(async (domain, rows) => {
      events.push(`push:${domain}`);
      return {
        nextCursor: `push-${domain}`,
        pushedRowIds: rows.map((row) => row.id),
      };
    }),
  };
}

function createFakeLocal(events: string[]): SupabaseSyncLocalPort {
  return {
    applyRemoteChanges: vi.fn(async (domain) => {
      events.push(`apply:${domain}`);
    }),
    loadDirtyRows: vi.fn(async (domain) => {
      events.push(`dirty:${domain}`);
      return [];
    }),
    loadDomainCursor: vi.fn(async (domain) => {
      events.push(`cursor:${domain}`);
      return null;
    }),
    markPushedRows: vi.fn(async (domain) => {
      events.push(`mark:${domain}`);
    }),
    recordDomainCursor: vi.fn(async (domain) => {
      events.push(`record:${domain}`);
    }),
  };
}
