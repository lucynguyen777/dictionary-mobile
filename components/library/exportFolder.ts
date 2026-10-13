import { Alert } from 'react-native';

import { type LibraryState, exportFolderToAnkiTsv, exportFolderToCsv, exportFolderToExcel } from '@/data/libraryStore';

export type FolderFileFormat = 'csv' | 'excel' | 'anki';

// Exports a folder to a file and reports the outcome; shared by Library and the folder screen.
export async function exportFolderWithAlert(libraryState: LibraryState, folderId: string, format: FolderFileFormat) {
  try {
    const result =
      format === 'excel'
        ? await exportFolderToExcel(libraryState, folderId)
        : format === 'anki'
          ? await exportFolderToAnkiTsv(libraryState, folderId)
          : await exportFolderToCsv(libraryState, folderId);
    Alert.alert(result.ok ? 'Xuất dữ liệu xong' : 'Chưa thể xuất dữ liệu', result.message);
  } catch (error) {
    Alert.alert('Xuất dữ liệu thất bại', error instanceof Error ? error.message : 'Chưa thể xuất bộ từ này.');
  }
}
