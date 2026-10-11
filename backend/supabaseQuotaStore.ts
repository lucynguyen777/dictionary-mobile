import type { SupabaseClient } from '@supabase/supabase-js';

import type { BackendProxyLimits } from './proxyConfig';
import {
  getDailyWindow,
  getMonthlyWindow,
  getQuotaLimits,
  quotaExceeded,
  type QuotaCheckResult,
  type QuotaFeature,
  type QuotaStore,
  type QuotaUsage,
} from './quotaTracker';

type ConsumeRow = { allowed: boolean; daily_used: number | string; exceeded: 'daily' | 'monthly' | null; monthly_used: number | string };

// PostgREST / Postgres codes for "function or table does not exist": migration 011 is not applied yet.
const MISSING_SCHEMA_CODES = new Set(['PGRST202', 'PGRST205', '42883', '42P01']);

function isMissingSchema(error: unknown) {
  return MISSING_SCHEMA_CODES.has(String((error as { code?: unknown } | null)?.code ?? ''));
}

// Quota counters in Postgres (migration 011), shared by every serverless instance.
// Needs the service-role client: the consume function is not executable by app users.
// Until the migration is applied, `fallback` (the in-memory tracker) keeps the previous behavior;
// any other storage error throws so the proxy fails closed.
export function createSupabaseQuotaStore(client: SupabaseClient, limits: BackendProxyLimits, fallback?: QuotaStore): QuotaStore {
  return {
    async checkQuota(userId: string, feature: QuotaFeature, incrementBy: number, now = new Date()): Promise<QuotaCheckResult> {
      const day = getDailyWindow(now);
      const month = getMonthlyWindow(now);
      const { dailyLimit, monthlyLimit } = getQuotaLimits(limits, feature);
      const { data, error } = await client.rpc('consume_proxy_quota', {
        p_amount: incrementBy,
        p_daily_limit: dailyLimit,
        p_day_key: day.key,
        p_feature: feature,
        p_month_key: month.key,
        p_monthly_limit: monthlyLimit,
        p_user_id: userId,
      });
      if (error && fallback && isMissingSchema(error)) return fallback.checkQuota(userId, feature, incrementBy, now);
      const row = (Array.isArray(data) ? data[0] : data) as ConsumeRow | null;
      if (error || !row) throw new Error('quota_storage_failed');

      if (!row.allowed) {
        return row.exceeded === 'monthly'
          ? quotaExceeded(feature, 'Monthly', month.resetsAt)
          : quotaExceeded(feature, 'Daily', day.resetsAt);
      }
      return {
        ok: true,
        remainingDaily: dailyLimit - Number(row.daily_used),
        remainingMonthly: monthlyLimit - Number(row.monthly_used),
      };
    },

    async getState(userId: string, feature: QuotaFeature, now = new Date()): Promise<QuotaUsage> {
      const day = getDailyWindow(now);
      const month = getMonthlyWindow(now);
      const { data, error } = await client
        .from('proxy_quota_counters')
        .select('period, period_key, used')
        .eq('user_id', userId)
        .eq('feature', feature)
        .in('period_key', [day.key, month.key]);
      if (error && fallback && isMissingSchema(error)) return fallback.getState(userId, feature, now);
      if (error) throw new Error('quota_storage_failed');

      const rows = (data ?? []) as Array<{ period: string; period_key: string; used: number | string }>;
      const usedFor = (period: 'day' | 'month', key: string) =>
        Number(rows.find((row) => row.period === period && row.period_key === key)?.used ?? 0);
      return {
        daily: usedFor('day', day.key),
        monthly: usedFor('month', month.key),
        ...getQuotaLimits(limits, feature),
      };
    },
  };
}
