import type { BackendProxyLimits } from './proxyConfig';

export type QuotaFeature = 'translation' | 'ai-chat' | 'pronunciation';

export type QuotaCheckResult =
  | {
      ok: true;
      remainingDaily: number;
      remainingMonthly: number;
    }
  | {
      error: {
        code: 'quota_exceeded';
        message: string;
        resetTime: number; // epoch ms when the exceeded limit resets
      };
      ok: false;
      status: 429;
    };

export type QuotaUsage = {
  daily: number;
  dailyLimit: number;
  monthly: number;
  monthlyLimit: number;
};

// Implemented in memory (QuotaTracker, local dev and tests) and in Postgres
// (backend/supabaseQuotaStore.ts, used on Vercel where instances do not share memory).
export interface QuotaStore {
  checkQuota(userId: string, feature: QuotaFeature, incrementBy: number, now?: Date): QuotaCheckResult | Promise<QuotaCheckResult>;
  getState(userId: string, feature: QuotaFeature, now?: Date): QuotaUsage | Promise<QuotaUsage>;
}

// In-memory only: resets on serverless cold starts and is per instance.
export type QuotaState = {
  daily: number;
  dailyKey: string; // UTC yyyy-mm-dd
  monthly: number;
  monthlyKey: string; // UTC yyyy-mm
};

type QuotaWindow = { key: string; resetsAt: number; startsAt: number };

export function getDailyWindow(now: Date): QuotaWindow {
  const startsAt = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return { key: new Date(startsAt).toISOString().slice(0, 10), resetsAt: startsAt + 86_400_000, startsAt };
}

export function getMonthlyWindow(now: Date): QuotaWindow {
  const startsAt = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const resetsAt = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  return { key: new Date(startsAt).toISOString().slice(0, 7), resetsAt, startsAt };
}

export class QuotaTracker implements QuotaStore {
  private store: Map<string, QuotaState>;
  private limits: BackendProxyLimits;

  constructor(limits: BackendProxyLimits) {
    this.store = new Map();
    this.limits = limits;
  }

  // Rejects a request that would push usage past a limit, so a single large request cannot overshoot.
  checkQuota(userId: string, feature: QuotaFeature, incrementBy: number, now = new Date()): QuotaCheckResult {
    const state = this.readState(userId, feature, now);
    const daily = getDailyWindow(now);
    const monthly = getMonthlyWindow(now);
    const { dailyLimit, monthlyLimit } = getQuotaLimits(this.limits, feature);
    const nextDaily = state.daily + incrementBy;
    const nextMonthly = state.monthly + incrementBy;

    if (nextDaily > dailyLimit) return quotaExceeded(feature, 'Daily', daily.resetsAt);
    if (nextMonthly > monthlyLimit) return quotaExceeded(feature, 'Monthly', monthly.resetsAt);

    state.daily = nextDaily;
    state.monthly = nextMonthly;

    return {
      ok: true,
      remainingDaily: dailyLimit - nextDaily,
      remainingMonthly: monthlyLimit - nextMonthly,
    };
  }

  getState(userId: string, feature: QuotaFeature, now = new Date()): QuotaUsage {
    const state = this.readState(userId, feature, now);
    return { daily: state.daily, monthly: state.monthly, ...getQuotaLimits(this.limits, feature) };
  }

  private readState(userId: string, feature: QuotaFeature, now: Date): QuotaState {
    const key = `${userId}:${feature}`;
    const dailyKey = getDailyWindow(now).key;
    const monthlyKey = getMonthlyWindow(now).key;
    const state = this.store.get(key) ?? { daily: 0, dailyKey, monthly: 0, monthlyKey };
    if (state.monthlyKey !== monthlyKey) {
      state.monthly = 0;
      state.monthlyKey = monthlyKey;
    }
    if (state.dailyKey !== dailyKey) {
      state.daily = 0;
      state.dailyKey = dailyKey;
    }
    this.store.set(key, state);
    return state;
  }
}

export function getQuotaLimits(limits: BackendProxyLimits, feature: QuotaFeature) {
  if (feature === 'translation') {
    return { dailyLimit: limits.dailyTranslationCharacterLimitPerUser, monthlyLimit: limits.monthlyCharacterLimitPerUser };
  }
  // Approximate monthly caps for request-counted features: the daily cap over a 31-day month.
  const daily = feature === 'pronunciation' ? limits.dailyPronunciationLimitPerUser : limits.dailyAiRequestLimitPerUser;
  return { dailyLimit: daily, monthlyLimit: daily * 31 };
}

export function quotaExceeded(feature: QuotaFeature, period: 'Daily' | 'Monthly', resetTime: number): QuotaCheckResult {
  return {
    error: {
      code: 'quota_exceeded',
      message: `${period} ${feature} quota exceeded. Resets at ${new Date(resetTime).toISOString()}.`,
      resetTime,
    },
    ok: false,
    status: 429,
  };
}
