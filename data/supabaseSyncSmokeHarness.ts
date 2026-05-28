import {
  createSupabaseCloudSyncRunner,
  type CreateSupabaseCloudSyncRunnerOptions,
} from './supabaseSyncRunner';
import type {
  SupabaseSyncDomain,
  SupabaseSyncRunResult,
} from './supabaseSyncClient';

export type SupabaseSyncSmokeHarnessResult =
  | {
      reason: string;
      status: 'skipped';
    }
  | {
      result: SupabaseSyncRunResult;
      status: 'ran';
    };

export type RunSupabaseSyncManualSmokeOptions = CreateSupabaseCloudSyncRunnerOptions & {
  domains?: readonly SupabaseSyncDomain[];
  enabled?: boolean;
};

export async function runSupabaseSyncManualSmoke({
  enabled = false,
  ...runnerOptions
}: RunSupabaseSyncManualSmokeOptions = {}): Promise<SupabaseSyncSmokeHarnessResult> {
  if (!enabled) {
    return {
      reason: 'Manual Supabase cloud sync smoke is disabled.',
      status: 'skipped',
    };
  }

  if (!runnerOptions.createClient && !runnerOptions.client) {
    return {
      reason: 'Manual Supabase cloud sync smoke requires an injected Supabase client factory or client port.',
      status: 'skipped',
    };
  }

  const runner = createSupabaseCloudSyncRunner(runnerOptions);

  return {
    result: await runner.runOnce({
      domains: runnerOptions.domains,
      now: runnerOptions.now,
    }),
    status: 'ran',
  };
}
