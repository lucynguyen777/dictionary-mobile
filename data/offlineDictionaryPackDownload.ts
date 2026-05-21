import type { OfflineDictionaryPack } from './offlineDictionaryPacks';
import {
  type OfflinePackInstallState,
  beginOfflinePackDownload,
  markOfflinePackDownloaded,
  markOfflinePackFailed,
  updateOfflinePackDownloadProgress,
} from './offlineDictionaryPackStore';

export type OfflinePackDownloadSource = {
  entriesMd5: string;
  entriesUrl: string;
  entryCount: number;
  manifestMd5?: string;
  manifestUrl?: string;
};

export type OfflinePackDownloadedFile = {
  md5: string;
  size: number;
  uri: string;
};

export type OfflinePackDownloadFileSystem = {
  deleteFile: (uri: string) => Promise<void>;
  downloadFile: (url: string, fileName: string) => Promise<OfflinePackDownloadedFile>;
};

export type OfflinePackDownloadSuccess = {
  entries: OfflinePackDownloadedFile;
  manifest?: OfflinePackDownloadedFile;
  ok: true;
  state: OfflinePackInstallState;
};

export type OfflinePackDownloadFailure = {
  errorMessage: string;
  ok: false;
  state: OfflinePackInstallState;
};

export type OfflinePackDownloadResult = OfflinePackDownloadSuccess | OfflinePackDownloadFailure;

type SaveClock = () => string;

export async function downloadOfflineDictionaryPack({
  clock = now,
  fileSystem,
  pack,
  source,
  state,
}: {
  clock?: SaveClock;
  fileSystem?: OfflinePackDownloadFileSystem;
  pack: OfflineDictionaryPack;
  source: OfflinePackDownloadSource;
  state: OfflinePackInstallState;
}): Promise<OfflinePackDownloadResult> {
  const packFileSystem = fileSystem ?? await createExpoOfflinePackFileSystem(pack.id);
  const downloadedUris: string[] = [];
  let nextState = await beginOfflinePackDownload(state, pack, clock);

  try {
    const manifest = source.manifestUrl
      ? await downloadAndVerifyFile({
          expectedMd5: source.manifestMd5,
          fileName: getOfflinePackArtifactFileName(source.manifestUrl, 'manifest.json'),
          fileSystem: packFileSystem,
          url: source.manifestUrl,
        })
      : undefined;

    if (manifest) {
      downloadedUris.push(manifest.uri);
      nextState = await updateOfflinePackDownloadProgress(nextState, pack, 0.25, clock);
    }

    const entries = await downloadAndVerifyFile({
      expectedMd5: source.entriesMd5,
      fileName: getOfflinePackArtifactFileName(source.entriesUrl, 'entries.json.gz'),
      fileSystem: packFileSystem,
      url: source.entriesUrl,
    });
    downloadedUris.push(entries.uri);

    nextState = await markOfflinePackDownloaded(
      nextState,
      pack,
      {
        entryCount: source.entryCount,
        localUri: entries.uri,
      },
      clock
    );

    return {
      entries,
      manifest,
      ok: true,
      state: nextState,
    };
  } catch (error) {
    await Promise.all(downloadedUris.map((uri) => packFileSystem.deleteFile(uri)));

    const errorMessage = error instanceof Error ? error.message : 'Offline pack download failed.';
    return {
      errorMessage,
      ok: false,
      state: await markOfflinePackFailed(nextState, pack, errorMessage, clock),
    };
  }
}

export function getOfflinePackArtifactFileName(url: string, fallbackFileName: string) {
  const rawFileName = getUrlFileName(url) || fallbackFileName;
  const safeFileName = rawFileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return safeFileName || fallbackFileName;
}

async function downloadAndVerifyFile({
  expectedMd5,
  fileName,
  fileSystem,
  url,
}: {
  expectedMd5?: string;
  fileName: string;
  fileSystem: OfflinePackDownloadFileSystem;
  url: string;
}) {
  const file = await fileSystem.downloadFile(url, fileName);
  const normalizedActualMd5 = normalizeMd5(file.md5);
  const normalizedExpectedMd5 = normalizeMd5(expectedMd5 ?? '');

  if (normalizedExpectedMd5 && normalizedActualMd5 !== normalizedExpectedMd5) {
    await fileSystem.deleteFile(file.uri);
    throw new Error(`Checksum mismatch for ${fileName}.`);
  }

  return {
    ...file,
    md5: normalizedActualMd5,
  };
}

export async function createExpoOfflinePackFileSystem(packId: string): Promise<OfflinePackDownloadFileSystem> {
  const { Directory, File, Paths } = await import('expo-file-system');
  const directory = new Directory(Paths.document, 'offline-packs', getOfflinePackDirectoryName(packId));
  directory.create({ idempotent: true, intermediates: true });

  return {
    async deleteFile(uri: string) {
      const file = new File(uri);
      if (file.exists) {
        file.delete();
      }
    },
    async downloadFile(url: string, fileName: string) {
      const targetFile = new File(directory, fileName);
      const downloadedFile = await File.downloadFileAsync(url, targetFile, { idempotent: true });

      return toDownloadedFile(downloadedFile);
    },
  };
}

function toDownloadedFile(file: { md5: string | null; size: number; uri: string }): OfflinePackDownloadedFile {
  return {
    md5: normalizeMd5(file.md5 ?? ''),
    size: file.size,
    uri: file.uri,
  };
}

function getOfflinePackDirectoryName(packId: string) {
  const safePackId = packId
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return safePackId || 'pack';
}

function getUrlFileName(url: string) {
  try {
    const parsedUrl = url.startsWith('/') ? new URL(url, 'https://offline-pack.local') : new URL(url);
    const fileName = parsedUrl.pathname.split('/').filter(Boolean).at(-1) ?? '';
    return decodeURIComponent(fileName);
  } catch {
    return '';
  }
}

function normalizeMd5(value: string) {
  return value.trim().toLocaleLowerCase();
}

function now() {
  return new Date().toISOString();
}
