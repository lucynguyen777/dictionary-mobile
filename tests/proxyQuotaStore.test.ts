import type { PGlite } from '@electric-sql/pglite';
import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';

import type { BackendProxyLimits } from '../backend/proxyConfig';
import { createSupabaseQuotaStore } from '../backend/supabaseQuotaStore';
import { asRole, createAuthUser, createSupabaseTestDatabase } from './helpers/supabaseTestDatabase';

const ALICE = '00000000-0000-4000-8000-0000000000a1';
const BOB = '00000000-0000-4000-8000-0000000000b1';

const LIMITS: BackendProxyLimits = {
  dailyAiRequestLimitPerUser: 3,
  dailyPronunciationLimitPerUser: 20,
  dailyTranslationCharacterLimitPerUser: 100,
  maxGlossaryEntries: 1_000,
  maxTextInputChars: 5_000,
  monthlyCharacterLimitPerUser: 250,
  proxyLogRetentionDays: 30,
};

let db: PGlite;

// Runs a committed statement as the service role, the way the Vercel proxy reaches Postgres.
function asServiceRole<T>(run: (tx: Pick<PGlite, 'query'>) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role service_role');
    return run(tx);
  }) as Promise<T>;
}

// The two PostgREST calls the store makes, executed against PGlite.
function createServiceClient() {
  return {
    from(table: string) {
      const filters: Array<{ column: string; values: unknown[] }> = [];
      let columns = '*';
      const builder = {
        eq(column: string, value: unknown) {
          filters.push({ column, values: [value] });
          return builder;
        },
        in(column: string, values: unknown[]) {
          filters.push({ column, values });
          return builder;
        },
        select(selected: string) {
          columns = selected;
          return builder;
        },
        then(resolve: (value: { data: unknown[]; error: null }) => void, reject: (error: unknown) => void) {
          const params: unknown[] = [];
          const where = filters.map(({ column, values }) => {
            const placeholders = values.map((value) => {
              params.push(value);
              return `$${params.length}`;
            });
            return `${column} in (${placeholders.join(', ')})`;
          });
          return asServiceRole((tx) => tx.query(`select ${columns} from public.${table} where ${where.join(' and ')}`, params))
            .then((result) => resolve({ data: result.rows as unknown[], error: null }), reject);
        },
      };
      return builder;
    },
    async rpc(name: string, args: Record<string, unknown>) {
      const keys = Object.keys(args);
      try {
        const result = await asServiceRole((tx) =>
          tx.query(
            `select * from public.${name}(${keys.map((key, index) => `${key} => $${index + 1}`).join(', ')})`,
            keys.map((key) => args[key])
          )
        );
        return { data: result.rows, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
  } as unknown as SupabaseClient;
}

beforeAll(async () => {
  db = await createSupabaseTestDatabase();
  await createAuthUser(db, ALICE);
  await createAuthUser(db, BOB);
}, 60_000);

describe('consume_proxy_quota permissions', () => {
  it('cannot be called by app users, so quota cannot be reset or forged from the client', async () => {
    await asRole(db, 'authenticated', ALICE, async (tx) => {
      await expect(tx.query(
        `select * from public.consume_proxy_quota($1, 'ai-chat', -100, '2026-10-11', 3, '2026-10', 93)`,
        [ALICE]
      )).rejects.toThrow(/permission denied/);
    });
  });

  it('lets owners read only their own counters and never write them', async () => {
    const store = createSupabaseQuotaStore(createServiceClient(), LIMITS);
    await store.checkQuota(BOB, 'translation', 10, new Date('2026-10-11T08:00:00Z'));

    await asRole(db, 'authenticated', ALICE, async (tx) => {
      expect((await tx.query('select * from public.proxy_quota_counters where user_id = $1', [BOB])).rows).toEqual([]);
      await tx.exec('savepoint denied');
      await expect(tx.query('update public.proxy_quota_counters set used = 0')).rejects.toThrow(/permission denied/);
      await tx.exec('rollback to savepoint denied');
    });
    await asRole(db, 'authenticated', BOB, async (tx) => {
      expect((await tx.query('select period from public.proxy_quota_counters where user_id = $1', [BOB])).rows).toHaveLength(2);
    });
  });
});

describe('createSupabaseQuotaStore', () => {
  it('counts across store instances, as separate serverless instances would', async () => {
    const now = new Date('2026-10-11T09:00:00Z');
    const first = createSupabaseQuotaStore(createServiceClient(), LIMITS);
    const second = createSupabaseQuotaStore(createServiceClient(), LIMITS);

    expect(await first.checkQuota(ALICE, 'ai-chat', 1, now)).toMatchObject({ ok: true, remainingDaily: 2 });
    expect(await second.checkQuota(ALICE, 'ai-chat', 1, now)).toMatchObject({ ok: true, remainingDaily: 1 });
    expect(await first.checkQuota(ALICE, 'ai-chat', 1, now)).toMatchObject({ ok: true, remainingDaily: 0 });
    expect(await second.checkQuota(ALICE, 'ai-chat', 1, now)).toMatchObject({
      error: { code: 'quota_exceeded', resetTime: Date.parse('2026-10-12T00:00:00Z') },
      ok: false,
      status: 429,
    });
    expect(await first.getState(ALICE, 'ai-chat', now)).toEqual({ daily: 3, dailyLimit: 3, monthly: 3, monthlyLimit: 93 });
  });

  it('never lets concurrent requests overshoot the limit', async () => {
    const now = new Date('2026-10-12T09:00:00Z');
    const store = createSupabaseQuotaStore(createServiceClient(), LIMITS);
    const results = await Promise.all(Array.from({ length: 10 }, () => store.checkQuota(BOB, 'ai-chat', 1, now)));

    expect(results.filter((result) => result.ok)).toHaveLength(3);
    expect(await store.getState(BOB, 'ai-chat', now)).toMatchObject({ daily: 3 });
  });

  it('rejects a request that would cross the limit without consuming any of it', async () => {
    const now = new Date('2026-10-13T09:00:00Z');
    const store = createSupabaseQuotaStore(createServiceClient(), LIMITS);

    expect(await store.checkQuota(ALICE, 'translation', 90, now)).toMatchObject({ ok: true });
    expect(await store.checkQuota(ALICE, 'translation', 20, now)).toMatchObject({ ok: false });
    expect(await store.checkQuota(ALICE, 'translation', 10, now)).toMatchObject({ ok: true, remainingDaily: 0 });
  });

  it('starts a fresh day but keeps the month, and reports a reached monthly limit', async () => {
    const store = createSupabaseQuotaStore(createServiceClient(), LIMITS);
    // 2026-10-13 already used 100 translation characters above; the monthly cap is 250.
    expect(await store.checkQuota(ALICE, 'translation', 100, new Date('2026-10-14T09:00:00Z'))).toMatchObject({ ok: true });
    expect(await store.checkQuota(ALICE, 'translation', 60, new Date('2026-10-15T09:00:00Z'))).toMatchObject({
      error: { message: expect.stringContaining('Monthly'), resetTime: Date.parse('2026-11-01T00:00:00Z') },
      ok: false,
    });
    expect(await store.getState(ALICE, 'translation', new Date('2026-10-15T09:00:00Z')))
      .toEqual({ daily: 0, dailyLimit: 100, monthly: 200, monthlyLimit: 250 });
    expect(await store.checkQuota(ALICE, 'translation', 60, new Date('2026-11-01T00:00:00Z'))).toMatchObject({ ok: true });
  });

  it('falls back to the in-memory tracker only while migration 011 is missing', async () => {
    const missingDb = await createSupabaseTestDatabase();
    try {
      await missingDb.exec('drop function public.consume_proxy_quota(uuid, text, bigint, text, bigint, text, bigint)');
      const missingFunction = {
        rpc: async (name: string) => {
          try {
            await missingDb.query(`select * from public.${name}()`);
            return { data: [], error: null };
          } catch (error) {
            return { data: null, error: { code: (error as { code?: string }).code, message: 'missing' } };
          }
        },
      } as unknown as SupabaseClient;
      const { QuotaTracker } = await import('../backend/quotaTracker');
      const store = createSupabaseQuotaStore(missingFunction, LIMITS, new QuotaTracker(LIMITS));
      const now = new Date('2026-10-20T09:00:00Z');

      expect(await store.checkQuota(ALICE, 'ai-chat', 1, now)).toMatchObject({ ok: true, remainingDaily: 2 });
      await expect(createSupabaseQuotaStore(missingFunction, LIMITS).checkQuota(ALICE, 'ai-chat', 1, now))
        .rejects.toThrow('quota_storage_failed');
    } finally {
      await missingDb.close();
    }
  }, 60_000);

  it('throws when storage fails so the proxy can fail closed', async () => {
    const broken = { rpc: async () => ({ data: null, error: { message: 'connection refused' } }) } as unknown as SupabaseClient;
    const { QuotaTracker } = await import('../backend/quotaTracker');
    await expect(createSupabaseQuotaStore(broken, LIMITS, new QuotaTracker(LIMITS)).checkQuota(ALICE, 'ai-chat', 1))
      .rejects.toThrow('quota_storage_failed');
  });
});
