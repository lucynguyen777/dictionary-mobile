import { describe, expect, it, vi } from 'vitest';

import { runSupabaseSyncManualSmoke } from '../data/supabaseSyncSmokeHarness';
import type {
  SupabaseSyncClientPort,
  SupabaseSyncLocalPort,
} from '../data/supabaseSyncClient';

describe('runSupabaseSyncManualSmoke', () => {
  it('skips by default without opening local storage or creating a client', async () => {
    const client = createFakeClient([]);
    const local = createFakeLocal([]);

    await expect(runSupabaseSyncManualSmoke({ client, local })).resolves.toEqual({
      reason: 'Manual Supabase cloud sync smoke is disabled.',
      status: 'skipped',
    });
    expect(client.getAvailability).not.toHaveBeenCalled();
    expect(local.loadDomainCursor).not.toHaveBeenCalled();
  });

  it('skips when enabled without an injected Supabase client boundary', async () => {
    const openDatabase = vi.fn(async () => {
      throw new Error('should not open SQLite without a client boundary');
    });

    await expect(runSupabaseSyncManualSmoke({ enabled: true, openDatabase })).resolves.toEqual({
      reason: 'Manual Supabase cloud sync smoke requires an injected Supabase client factory or client port.',
      status: 'skipped',
    });
    expect(openDatabase).not.toHaveBeenCalled();
  });

  it('runs the guarded sync runner when explicitly enabled with injected ports', async () => {
    const events: string[] = [];

    await expect(
      runSupabaseSyncManualSmoke({
        client: createFakeClient(events),
        domains: ['folders'],
        enabled: true,
        local: createFakeLocal(events),
        now: () => '2026-05-28T10:00:00.000Z',
      })
    ).resolves.toEqual({
      result: {
        domains: [
          {
            dirtyRows: 0,
            domain: 'folders',
            pulledRows: 0,
            pushedRows: 0,
            status: 'synced',
          },
        ],
        status: 'synced',
        syncedAt: '2026-05-28T10:00:00.000Z',
      },
      status: 'ran',
    });
    expect(events).toEqual(['availability', 'cursor:folders', 'pull:folders', 'apply:folders', 'dirty:folders', 'record:folders']);
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
      return { nextCursor: null, rows: [] };
    }),
    pushLocalChanges: vi.fn(async (domain, rows) => {
      events.push(`push:${domain}`);
      return { nextCursor: null, pushedRowIds: rows.map((row) => row.id) };
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
