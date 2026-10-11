import type { BackendProxyLimits } from './proxyConfig';

export type QuotaFeature = 'translation' | 'ai-chat';

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

// In-memory only: resets on serverless cold starts. Durable quota storage is tracked as plan task 0.4.
export type QuotaState = {
  daily: number;
  dailyKey: string; // UTC yyyy-mm-dd
  monthly: number;
  monthlyKey: string; // UTC yyyy-mm
};

type QuotaWindow = { key: string; resetsAt: number; startsAt: number };

function getDailyWindow(now: Date): QuotaWindow {
  const startsAt = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return { key: new Date(startsAt).toISOString().slice(0, 10), resetsAt: startsAt + 86_400_000, startsAt };
}

function getMonthlyWindow(now: Date): QuotaWindow {
  const startsAt = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const resetsAt = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  return { key: new Date(startsAt).toISOString().slice(0, 7), resetsAt, startsAt };
}

export class QuotaTracker {
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
    const dailyLimit = this.getDailyLimit(feature);
    const monthlyLimit = this.getMonthlyLimit(feature);
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

  getState(userId: string, feature: QuotaFeature, now = new Date()) {
    const state = this.readState(userId, feature, now);
    return {
      daily: state.daily,
      monthly: state.monthly,
      dailyLimit: this.getDailyLimit(feature),
      monthlyLimit: this.getMonthlyLimit(feature),
    };
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

  private getDailyLimit(feature: QuotaFeature): number {
    return feature === 'translation'
      ? this.limits.dailyTranslationCharacterLimitPerUser
      : this.limits.dailyAiRequestLimitPerUser;
  }

  private getMonthlyLimit(feature: QuotaFeature): number {
    return feature === 'translation'
      ? this.limits.monthlyCharacterLimitPerUser
      : this.limits.dailyAiRequestLimitPerUser * 31; // approximate monthly for AI
  }
}

function quotaExceeded(feature: QuotaFeature, period: 'Daily' | 'Monthly', resetTime: number): QuotaCheckResult {
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
