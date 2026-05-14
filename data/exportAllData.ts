import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { getStoredItem } from './storageAdapter';

type ExportResult = {
  ok: boolean;
  message: string;
  uri?: string;
};

const PROFILE_KEY = 'dictionary-mobile.profile.v1';
const LIBRARY_KEY = 'dictionary-mobile.library.v1';
const READER_KEY = 'dictionary-mobile.reader.v1';

export async function exportAllLocalData(): Promise<ExportResult> {
  try {
    const rawProfile = await getStoredItem(PROFILE_KEY);
    const rawLibrary = await getStoredItem(LIBRARY_KEY);
    const rawReader = await getStoredItem(READER_KEY);

    const payload = {
      exportedAt: new Date().toISOString(),
      profile: rawProfile ? JSON.parse(rawProfile) : null,
      library: rawLibrary ? JSON.parse(rawLibrary) : null,
      reader: rawReader ? JSON.parse(rawReader) : null,
    } as const;

    const filename = `dictionary-mobile-backup-${Date.now()}.json`;
    const file = new File(Paths.document, filename);
    file.create({ overwrite: true });
    file.write(JSON.stringify(payload, null, 2), { encoding: 'utf8' });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        UTI: 'public.json',
      });
    }

    return { ok: true, message: 'Đã xuất dữ liệu local.', uri: file.uri };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Không thể xuất dữ liệu.' };
  }
}

export default exportAllLocalData;
