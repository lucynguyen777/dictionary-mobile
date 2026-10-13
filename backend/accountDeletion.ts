import type { SupabaseClient } from '@supabase/supabase-js';

// Account deletion (plan 2.6). Owner decision D3 (2026-10-13): scheduled deletion with a 30-day grace period.
// ACCOUNT_DELETION_MODE can still override it:
// - unset or "scheduled": a request is recorded and purged after ACCOUNT_DELETION_GRACE_DAYS (default 30);
//   the user can cancel until then. Purging runs daily from the Vercel cron (/admin/purge-account-deletions),
// - "immediate": the auth user is deleted at once; every user table cascades,
// - "off": deletion is not offered (the app says so).
// Without a Supabase service-role client there is no store, and the app reports deletion as unavailable.
export type AccountDeletionMode = 'immediate' | 'scheduled';

export type AccountDeletionConfig =
  | { mode: AccountDeletionMode; graceDays: number }
  | { mode: null; graceDays: number };

export type AccountDeletionStore = {
  cancelScheduled: (userId: string) => Promise<void>;
  deleteNow: (userId: string) => Promise<void>;
  getScheduled: (userId: string) => Promise<{ purgeAfter: string } | null>;
  purgeDue: () => Promise<number>;
  schedule: (userId: string, purgeAfter: string) => Promise<void>;
};

export function readAccountDeletionConfig(env: Record<string, string | undefined>): AccountDeletionConfig {
  const rawMode = env.ACCOUNT_DELETION_MODE?.trim();
  const graceDays = Number(env.ACCOUNT_DELETION_GRACE_DAYS ?? 30);
  return {
    graceDays: Number.isInteger(graceDays) && graceDays >= 1 && graceDays <= 90 ? graceDays : 30,
    mode: rawMode === 'off' ? null : rawMode === 'immediate' ? 'immediate' : 'scheduled',
  };
}

export type AccountDeletionResult =
  | { status: 'deleted' }
  | { purgeAfter: string; status: 'scheduled' };

export async function requestAccountDeletion(
  config: AccountDeletionConfig,
  store: AccountDeletionStore | undefined,
  userId: string,
  body: unknown,
  now = new Date()
): Promise<AccountDeletionResult> {
  if (!config.mode || !store) throw new Error('account_deletion_unconfigured');
  // The client must send an explicit confirmation, so a stray request cannot delete an account.
  if ((body as { confirm?: unknown } | null)?.confirm !== 'DELETE') throw new Error('account_deletion_unconfirmed');

  if (config.mode === 'immediate') {
    await store.deleteNow(userId);
    return { status: 'deleted' };
  }
  const existing = await store.getScheduled(userId);
  if (existing) return { purgeAfter: existing.purgeAfter, status: 'scheduled' };
  const purgeAfter = new Date(now.getTime() + config.graceDays * 24 * 60 * 60 * 1000).toISOString();
  await store.schedule(userId, purgeAfter);
  return { purgeAfter, status: 'scheduled' };
}

export function createSupabaseAccountDeletionStore(client: SupabaseClient): AccountDeletionStore {
  return {
    async cancelScheduled(userId) {
      const { error } = await client.from('account_deletion_requests').delete().eq('user_id', userId);
      if (error) throw new Error('account_deletion_failed');
    },
    async deleteNow(userId) {
      const { error } = await client.auth.admin.deleteUser(userId);
      if (error) throw new Error('account_deletion_failed');
    },
    async getScheduled(userId) {
      const { data, error } = await client.from('account_deletion_requests').select('purge_after').eq('user_id', userId).maybeSingle();
      if (error) throw new Error('account_deletion_failed');
      return data ? { purgeAfter: new Date((data as { purge_after: string }).purge_after).toISOString() } : null;
    },
    async purgeDue() {
      const { data, error } = await client.rpc('purge_due_account_deletions');
      if (error) throw new Error('account_deletion_failed');
      return Number(data ?? 0);
    },
    async schedule(userId, purgeAfter) {
      const { error } = await client
        .from('account_deletion_requests')
        .upsert([{ purge_after: purgeAfter, user_id: userId }], { onConflict: 'user_id' });
      if (error) throw new Error('account_deletion_failed');
    },
  };
}
