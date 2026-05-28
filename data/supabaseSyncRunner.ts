import {
  runSupabaseSyncOnce,
  type RunSupabaseSyncOnceOptions,
  type SupabaseSyncClientPort,
  type SupabaseSyncDomain,
  type SupabaseSyncLocalPort,
  type SupabaseSyncRunResult,
} from './supabaseSyncClient';
import { createUserDatabaseSyncLocalPort } from './supabaseSyncLocalPort';
import {
  createSupabaseSyncRuntimeAdapter,
  type CreateSupabaseSyncRuntimeClient,
} from './supabaseSyncRuntimeAdapter';
import type { OpenUserSqliteDatabase } from './userDatabaseSchema';

export type SupabaseCloudSyncRunner = {
  runOnce: (options?: SupabaseCloudSyncRunOnceOptions) => Promise<SupabaseSyncRunResult>;
};

export type CreateSupabaseCloudSyncRunnerOptions = {
  client?: SupabaseSyncClientPort;
  createClient?: CreateSupabaseSyncRuntimeClient;
  databaseName?: string;
  domains?: readonly SupabaseSyncDomain[];
  isOnline?: () => boolean;
  local?: SupabaseSyncLocalPort;
  now?: () => string;
  openDatabase?: OpenUserSqliteDatabase;
};

export type SupabaseCloudSyncRunOnceOptions = Pick<RunSupabaseSyncOnceOptions, 'domains' | 'now'>;

export function createSupabaseCloudSyncRunner({
  client,
  createClient,
  databaseName,
  domains,
  isOnline,
  local,
  now,
  openDatabase,
}: CreateSupabaseCloudSyncRunnerOptions = {}): SupabaseCloudSyncRunner {
  const syncClient = client ?? createSupabaseSyncRuntimeAdapter({ createClient, isOnline });
  const syncLocal = local ?? createUserDatabaseSyncLocalPort({ databaseName, openDatabase });

  return {
    runOnce(options = {}) {
      return runSupabaseSyncOnce({
        client: syncClient,
        domains: options.domains ?? domains,
        local: syncLocal,
        now: options.now ?? now,
      });
    },
  };
}

export function runSupabaseCloudSyncOnce(options: CreateSupabaseCloudSyncRunnerOptions = {}) {
  return createSupabaseCloudSyncRunner(options).runOnce();
}
