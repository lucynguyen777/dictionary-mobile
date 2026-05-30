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

export type QuotaState = {
  daily: number;
  lastDailyReset: number; // epoch ms
  monthly: number;
  lastMonthlyReset: number; // epoch ms
};

function getDailyResetKey(userId: string, feature: QuotaFeature): string {
  const now = new Date();
  const dateStr = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
  return `${userId}:${feature}:daily:${dateStr}`;
}

function getMonthlyResetKey(userId: string, feature: QuotaFeature): string {
  const now = new Date();
  const monthStr = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
  return `${userId}:${feature}:monthly:${monthStr}`;
}

function getStartOfDayEpoch(): number {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();
}

function getStartOfMonthEpoch(): number {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).getTime();
}

export class QuotaTracker {
  private store: Map<string, QuotaState>;
  private limits: BackendProxyLimits;

  constructor(limits: BackendProxyLimits) {
    this.store = new Map();
    this.limits = limits;
  }

  checkQuota(userId: string, feature: QuotaFeature, incrementBy: number): QuotaCheckResult {
    const dailyKey = getDailyResetKey(userId, feature);
    const monthlyKey = getMonthlyResetKey(userId, feature);

    let state = this.store.get(monthlyKey);
    if (!state) {
      state = {
        daily: 0,
        lastDailyReset: getStartOfDayEpoch(),
        monthly: 0,
        lastMonthlyReset: getStartOfMonthEpoch(),
      };
      this.store.set(monthlyKey, state);
    }

    // Reset daily counter if day changed
    const now = Date.now();
    if (now - state.lastDailyReset > 86_400_000) {
      state.daily = 0;
      state.lastDailyReset = getStartOfDayEpoch();
    }
    // Reset monthly counter if month changed
    if (now - state.lastMonthlyReset > 31 * 86_400_000) {
      state.monthly = 0;
      state.lastMonthlyReset = getStartOfMonthEpoch();
    }

    const dailyLimit = this.getDailyLimit(feature);
    const monthlyLimit = this.getMonthlyLimit(feature);

    const nextDaily = state.daily + incrementBy;
    const nextMonthly = state.monthly + incrementBy;

    if (state.daily >= dailyLimit) {
      const resetTime = state.lastDailyReset + 86_400_000;
      return {
        error: {
          code: 'quota_exceeded',
          message: `Daily ${feature} quota exceeded. Resets at ${new Date(resetTime).toISOString()}.`,
          resetTime,
        },
        ok: false,
        status: 429,
      };
    }

    if (state.monthly >= monthlyLimit) {
      const resetTime = state.lastMonthlyReset + 31 * 86_400_000;
      return {
        error: {
          code: 'quota_exceeded',
          message: `Monthly ${feature} quota exceeded. Resets at ${new Date(resetTime).toISOString()}.`,
          resetTime,
        },
        ok: false,
        status: 429,
      };
    }

    state.daily = nextDaily;
    state.monthly = nextMonthly;

    return {
      ok: true,
      remainingDaily: dailyLimit - nextDaily,
      remainingMonthly: monthlyLimit - nextMonthly,
    };
  }

  getState(userId: string, feature: QuotaFeature): { daily: number; monthly: number; dailyLimit: number; monthlyLimit: number } {
    const monthlyKey = getMonthlyResetKey(userId, feature);
    const state = this.store.get(monthlyKey);
    return {
      daily: state?.daily ?? 0,
      monthly: state?.monthly ?? 0,
      dailyLimit: this.getDailyLimit(feature),
      monthlyLimit: this.getMonthlyLimit(feature),
    };
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