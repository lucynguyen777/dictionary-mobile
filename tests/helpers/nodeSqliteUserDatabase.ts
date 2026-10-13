import { createRequire } from 'node:module';
import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite';

import type { UserSqliteBindParams, UserSqliteDatabase } from '../../data/userDatabaseSchema';

// Vitest 1.x cannot resolve the newer `node:sqlite` builtin through its module graph, so load it at runtime.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

type SqliteValue = string | number | null | Uint8Array;

function toSqliteParams(params: UserSqliteBindParams): SqliteValue[] {
  return params.map((value) => (typeof value === 'boolean' ? Number(value) : value));
}

export type SqliteTestDatabase = UserSqliteDatabase & {
  closeCount: number;
  database: DatabaseSyncType;
  execStatements: string[];
  // Makes the next INSERT into this table throw, to exercise transaction rollback.
  failOnTable: string | null;
  rows: (table: string) => Record<string, unknown>[];
  transactionCount: number;
};

// Real SQLite (Node's built-in driver) behind the expo-sqlite subset the app uses.
export function createSqliteTestDatabase(): SqliteTestDatabase {
  const database = new DatabaseSync(':memory:');
  const adapter: SqliteTestDatabase = {
    closeAsync: async () => {
      adapter.closeCount += 1;
    },
    closeCount: 0,
    database,
    execAsync: async (source) => {
      adapter.execStatements.push(source);
      database.exec(source);
    },
    execStatements: [],
    failOnTable: null,
    getAllAsync: async <T>(source: string, ...params: UserSqliteBindParams) =>
      database.prepare(source).all(...toSqliteParams(params)) as T[],
    getFirstAsync: async <T>(source: string, ...params: UserSqliteBindParams) =>
      (database.prepare(source).get(...toSqliteParams(params)) as T | undefined) ?? null,
    rows: (table) => database.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[],
    runAsync: async (source, ...params) => {
      if (adapter.failOnTable && new RegExp(`INSERT OR REPLACE INTO ${adapter.failOnTable}\\b`).test(source)) {
        throw new Error(`fake insert failure for ${adapter.failOnTable}`);
      }
      return database.prepare(source).run(...toSqliteParams(params));
    },
    transactionCount: 0,
    withTransactionAsync: async (task) => {
      adapter.transactionCount += 1;
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
  return adapter;
}

// One in-memory database per name, reused across opens like a file on disk.
export function createSqliteTestHarness() {
  const databases = new Map<string, SqliteTestDatabase>();
  const openedDatabaseNames: string[] = [];

  return {
    openDatabase: async (databaseName: string) => {
      openedDatabaseNames.push(databaseName);
      const existing = databases.get(databaseName);
      if (existing) return existing;
      const created = createSqliteTestDatabase();
      databases.set(databaseName, created);
      return created;
    },
    openedDatabaseNames,
    requireDatabase(databaseName: string) {
      const database = databases.get(databaseName);
      if (!database) throw new Error(`Missing test database ${databaseName}`);
      return database;
    },
  };
}

export function createNodeSqliteUserDatabase() {
  const adapter = createSqliteTestDatabase();
  return { database: adapter.database, openDatabase: async () => adapter as UserSqliteDatabase };
}
