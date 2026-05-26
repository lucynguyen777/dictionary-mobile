import { exportAllLocalData } from './exportAllData';
import { getStoredItem, removeStoredItem, setStoredItem } from './storageAdapter';
import {
  openExpoUserDatabase,
  USER_DATABASE_NAME,
  USER_DATABASE_SCHEMA_VERSION,
  type OpenUserSqliteDatabase,
  type UserSqliteBindParams,
  type UserSqliteDatabase,
} from './userDatabaseSchema';

export const LEGACY_USER_DATA_KEYS = [
  'dictionary-mobile.profile.v1',
  'dictionary-mobile.library.v1',
  'dictionary-mobile.reader.v1',
] as const;

export const LEGACY_USER_DATA_CLEANUP_BACKUP_MARKER_KEY =
  'dictionary-mobile.user-data-cleanup-backup.v1';

type LegacyUserDataKey =
  | 'dictionary-mobile.profile.v1'
  | 'dictionary-mobile.library.v1'
  | 'dictionary-mobile.reader.v1';

type CleanupSource = {
  exportLocalData: typeof exportAllLocalData;
  getStoredItem: typeof getStoredItem;
  removeStoredItem: typeof removeStoredItem;
  setStoredItem: typeof setStoredItem;
};

export type LegacyUserDataCleanupOptions = {
  databaseName?: string;
  now?: () => string;
  openDatabase?: OpenUserSqliteDatabase;
  source?: CleanupSource;
};

export type LegacyUserDataCleanupResult = {
  backupMarkerKey: typeof LEGACY_USER_DATA_CLEANUP_BACKUP_MARKER_KEY;
  backupUri?: string;
  databaseName: string;
  eligible: boolean;
  reason?: string;
  removedKeys: LegacyUserDataKey[];
  schemaVersion: number;
};

const SELECT_META_SQL = 'SELECT value FROM user_database_meta WHERE key = ? LIMIT 1';
const SELECT_PROFILE_SQL = 'SELECT id FROM user_profile WHERE id = ? LIMIT 1';
const SELECT_READER_SETTINGS_SQL = 'SELECT id FROM reader_settings WHERE id = ? LIMIT 1';
const PROBE_LIBRARY_SQL = 'SELECT id FROM folders LIMIT 1';

export async function cleanupLegacyUserDataAsyncStorage({
  databaseName = USER_DATABASE_NAME,
  now = () => new Date().toISOString(),
  openDatabase = openExpoUserDatabase,
  source = createDefaultCleanupSource(),
}: LegacyUserDataCleanupOptions = {}): Promise<LegacyUserDataCleanupResult> {
  const eligibility = await verifyLegacyUserDataCleanupEligibility({ databaseName, openDatabase });
  if (!eligibility.eligible) {
    return {
      backupMarkerKey: LEGACY_USER_DATA_CLEANUP_BACKUP_MARKER_KEY,
      databaseName,
      eligible: false,
      reason: eligibility.reason,
      removedKeys: [],
      schemaVersion: USER_DATABASE_SCHEMA_VERSION,
    };
  }

  const marker = await ensureCleanupBackupMarker({ databaseName, now, source });
  const removedKeys: LegacyUserDataKey[] = [];

  for (const key of LEGACY_USER_DATA_KEYS) {
    const existingValue = await source.getStoredItem(key);
    if (existingValue === null) continue;

    await source.removeStoredItem(key);
    removedKeys.push(key);
  }

  return {
    backupMarkerKey: LEGACY_USER_DATA_CLEANUP_BACKUP_MARKER_KEY,
    backupUri: marker.backupUri,
    databaseName,
    eligible: true,
    removedKeys,
    schemaVersion: USER_DATABASE_SCHEMA_VERSION,
  };
}

async function verifyLegacyUserDataCleanupEligibility({
  databaseName,
  openDatabase,
}: Required<Pick<LegacyUserDataCleanupOptions, 'databaseName' | 'openDatabase'>>) {
  let database: UserSqliteDatabase;

  try {
    database = await openDatabase(databaseName);
  } catch {
    return { eligible: false, reason: 'sqlite-open-failed' };
  }

  try {
    const meta = await getFirstRequired<{ value: string }>(database, SELECT_META_SQL, 'schema_version');
    if (meta?.value !== String(USER_DATABASE_SCHEMA_VERSION)) {
      return { eligible: false, reason: 'schema-version-missing' };
    }

    const profile = await getFirstRequired<{ id: string }>(database, SELECT_PROFILE_SQL, 'local-profile');
    if (!profile) {
      return { eligible: false, reason: 'profile-row-missing' };
    }

    const readerSettings = await getFirstRequired<{ id: string }>(
      database,
      SELECT_READER_SETTINGS_SQL,
      'local-reader-settings'
    );
    if (!readerSettings) {
      return { eligible: false, reason: 'reader-settings-row-missing' };
    }

    await getAllRequired(database, PROBE_LIBRARY_SQL);

    return { eligible: true };
  } catch {
    return { eligible: false, reason: 'sqlite-read-failed' };
  } finally {
    await database.closeAsync?.();
  }
}

async function ensureCleanupBackupMarker({
  databaseName,
  now,
  source,
}: {
  databaseName: string;
  now: () => string;
  source: CleanupSource;
}) {
  const existingMarker = await source.getStoredItem(LEGACY_USER_DATA_CLEANUP_BACKUP_MARKER_KEY);
  if (existingMarker) {
    return parseBackupMarker(existingMarker);
  }

  const exportResult = await source.exportLocalData();
  if (!exportResult.ok) {
    throw new Error(`Legacy user-data cleanup backup failed: ${exportResult.message}`);
  }

  const marker = {
    backupUri: exportResult.uri,
    createdAt: now(),
    databaseName,
    legacyKeys: LEGACY_USER_DATA_KEYS,
    schemaVersion: USER_DATABASE_SCHEMA_VERSION,
  };

  await source.setStoredItem(LEGACY_USER_DATA_CLEANUP_BACKUP_MARKER_KEY, JSON.stringify(marker));

  return marker;
}

function parseBackupMarker(rawMarker: string) {
  try {
    const marker = JSON.parse(rawMarker) as { backupUri?: string };
    return { backupUri: marker.backupUri };
  } catch {
    return {};
  }
}

function createDefaultCleanupSource(): CleanupSource {
  return {
    exportLocalData: exportAllLocalData,
    getStoredItem,
    removeStoredItem,
    setStoredItem,
  };
}

async function getAllRequired<T>(
  database: UserSqliteDatabase,
  source: string,
  ...params: UserSqliteBindParams
) {
  if (!database.getAllAsync) {
    throw new Error('User SQLite database does not support getAllAsync.');
  }

  return database.getAllAsync<T>(source, ...params);
}

async function getFirstRequired<T>(
  database: UserSqliteDatabase,
  source: string,
  ...params: UserSqliteBindParams
) {
  if (!database.getFirstAsync) {
    throw new Error('User SQLite database does not support getFirstAsync.');
  }

  return database.getFirstAsync<T>(source, ...params);
}
