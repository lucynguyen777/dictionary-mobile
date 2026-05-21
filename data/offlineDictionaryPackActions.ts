import { ungzip } from 'pako';

import {
  type OfflineDictionaryStorage,
  type OfflinePackManifest,
  importOfflineDictionaryPack,
} from './offlineDictionaryImport';
import { createDefaultOfflineDictionaryStorage } from './offlineDictionaryDefaultStorage';
import type { OfflineDictionaryEntry } from './offlineDictionaryLookup';
import {
  type OfflinePackDownloadFileSystem,
  type OfflinePackDownloadSource,
  createExpoOfflinePackFileSystem,
  downloadOfflineDictionaryPack,
} from './offlineDictionaryPackDownload';
import type { OfflineDictionaryPack } from './offlineDictionaryPacks';
import {
  type OfflinePackInstallState,
  deleteOfflinePackRecord,
  getOfflinePackInstallRecord,
  markOfflinePackFailed,
} from './offlineDictionaryPackStore';

export type OfflinePackFileReader = {
  readBytes: (uri: string) => Promise<Uint8Array>;
  readText: (uri: string) => Promise<string>;
};

export type OfflinePackInstallActionSuccess = {
  entryCount: number;
  ok: true;
  state: OfflinePackInstallState;
};

export type OfflinePackInstallActionFailure = {
  errorMessage: string;
  ok: false;
  state: OfflinePackInstallState;
};

export type OfflinePackInstallActionResult = OfflinePackInstallActionSuccess | OfflinePackInstallActionFailure;

type SaveClock = () => string;

export async function installOfflineDictionaryPackFromSource({
  clock = now,
  fileReader,
  fileSystem,
  pack,
  source = pack.downloadSource,
  state,
  storage,
}: {
  clock?: SaveClock;
  fileReader?: OfflinePackFileReader;
  fileSystem?: OfflinePackDownloadFileSystem;
  pack: OfflineDictionaryPack;
  source?: OfflinePackDownloadSource;
  state: OfflinePackInstallState;
  storage?: OfflineDictionaryStorage;
}): Promise<OfflinePackInstallActionResult> {
  if (!source) {
    const errorMessage = 'Offline pack source URL is not configured.';
    return {
      errorMessage,
      ok: false,
      state: await markOfflinePackFailed(state, pack, errorMessage, clock),
    };
  }

  const packFileSystem = fileSystem ?? await createExpoOfflinePackFileSystem(pack.id);
  const packFileReader = fileReader ?? await createExpoOfflinePackFileReader();
  const offlineStorage = storage ?? await createDefaultOfflineDictionaryStorage();
  const downloadResult = await downloadOfflineDictionaryPack({
    clock,
    fileSystem: packFileSystem,
    pack,
    source,
    state,
  });

  if (!downloadResult.ok) return downloadResult;

  const downloadedUris = [downloadResult.entries.uri, downloadResult.manifest?.uri].filter(Boolean) as string[];

  try {
    const manifest = downloadResult.manifest
      ? await readOfflinePackManifest(packFileReader, downloadResult.manifest.uri)
      : getManifestFromDownloadSource(pack, source);
    const entries = await readOfflinePackEntries(packFileReader, downloadResult.entries.uri);
    const importedState = await importOfflineDictionaryPack({
      clock,
      entries,
      manifest,
      pack,
      state: downloadResult.state,
      storage: offlineStorage,
    });
    await cleanupDownloadedArtifacts(packFileSystem, downloadedUris);

    const record = getOfflinePackInstallRecord(importedState, pack);
    if (record.status === 'ready') {
      return {
        entryCount: record.entryCount,
        ok: true,
        state: importedState,
      };
    }

    return {
      errorMessage: record.errorMessage || 'Offline pack import failed.',
      ok: false,
      state: importedState,
    };
  } catch (error) {
    await cleanupDownloadedArtifacts(packFileSystem, downloadedUris);

    const errorMessage = error instanceof Error ? error.message : 'Offline pack install failed.';
    return {
      errorMessage,
      ok: false,
      state: await markOfflinePackFailed(downloadResult.state, pack, errorMessage, clock),
    };
  }
}

export async function deleteInstalledOfflineDictionaryPack({
  pack,
  state,
  storage,
}: {
  pack: OfflineDictionaryPack;
  state: OfflinePackInstallState;
  storage?: OfflineDictionaryStorage;
}) {
  const offlineStorage = storage ?? await createDefaultOfflineDictionaryStorage();
  await offlineStorage.deletePack(pack.id);
  return deleteOfflinePackRecord(state, pack.id);
}

export async function readOfflinePackManifest(fileReader: OfflinePackFileReader, uri: string): Promise<OfflinePackManifest> {
  return JSON.parse(await fileReader.readText(uri)) as OfflinePackManifest;
}

export async function readOfflinePackEntries(fileReader: OfflinePackFileReader, uri: string): Promise<OfflineDictionaryEntry[]> {
  const rawEntries = uri.toLocaleLowerCase().endsWith('.gz')
    ? ungzip(await fileReader.readBytes(uri), { to: 'string' })
    : await fileReader.readText(uri);

  const entries = JSON.parse(rawEntries) as unknown;
  return Array.isArray(entries) ? entries as OfflineDictionaryEntry[] : [];
}

async function createExpoOfflinePackFileReader(): Promise<OfflinePackFileReader> {
  const { File } = await import('expo-file-system');

  return {
    async readBytes(uri: string) {
      return new File(uri).bytes();
    },
    async readText(uri: string) {
      return new File(uri).text();
    },
  };
}

function getManifestFromDownloadSource(
  pack: OfflineDictionaryPack,
  source: OfflinePackDownloadSource
): OfflinePackManifest {
  return {
    entryCount: source.entryCount,
    generatedAt: '',
    langCode: pack.languageCode,
    license: pack.license,
    packId: pack.id,
    schemaVersion: 1,
    sourceName: pack.sourceName,
    sourceUrl: source.entriesUrl,
  };
}

async function cleanupDownloadedArtifacts(fileSystem: OfflinePackDownloadFileSystem, uris: string[]) {
  await Promise.all(uris.map((uri) => fileSystem.deleteFile(uri)));
}

function now() {
  return new Date().toISOString();
}
