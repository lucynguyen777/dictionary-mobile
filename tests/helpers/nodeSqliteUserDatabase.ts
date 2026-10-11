import { createRequire } from 'node:module';
import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite';

import type { UserSqliteBindParams, UserSqliteDatabase } from '../../data/userDatabaseSchema';

// Vitest 1.x cannot resolve the newer `node:sqlite` builtin through its module graph, so load it at runtime.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

type SqliteValue = string | number | null | Uint8Array;

function toSqliteParams(params: UserSqliteBindParams): SqliteValue[] {
  return params.map((value) => (typeof value === 'boolean' ? Number(value) : value));
}

// Real SQLite (Node's built-in driver) behind the expo-sqlite subset the app uses.
export function createNodeSqliteUserDatabase(): { database: DatabaseSyncType; openDatabase: () => Promise<UserSqliteDatabase> } {
  const database = new DatabaseSync(':memory:');
  const adapter: UserSqliteDatabase = {
    closeAsync: async () => undefined,
    execAsync: async (source) => {
      database.exec(source);
    },
    getAllAsync: async <T>(source: string, ...params: UserSqliteBindParams) =>
      database.prepare(source).all(...toSqliteParams(params)) as T[],
    getFirstAsync: async <T>(source: string, ...params: UserSqliteBindParams) =>
      (database.prepare(source).get(...toSqliteParams(params)) as T | undefined) ?? null,
    runAsync: async (source, ...params) => database.prepare(source).run(...toSqliteParams(params)),
    withTransactionAsync: async (task) => {
      database.exec('BEGIN');
      try {
        await task();
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return { database, openDatabase: async () => adapter };
}
