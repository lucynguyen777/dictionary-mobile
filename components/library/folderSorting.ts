import type { Folder, LibraryState } from '@/data/libraryStore';

export type FolderSortOption = 'recent' | 'oldest' | 'az' | 'za' | 'mostWords' | 'leastWords' | 'favoritesFirst';

export const sortOptions: { value: FolderSortOption; label: string }[] = [
  { value: 'recent', label: 'Gần đây nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'az', label: 'A-Z' },
  { value: 'za', label: 'Z-A' },
  { value: 'mostWords', label: 'Nhiều từ nhất' },
  { value: 'leastWords', label: 'Ít từ nhất' },
  { value: 'favoritesFirst', label: 'Yêu thích trước' },
];

export function getSortLabel(sortOption: FolderSortOption) {
  return sortOptions.find((option) => option.value === sortOption)?.label ?? 'Gần đây nhất';
}

export function sortFolders(leftFolder: Folder, rightFolder: Folder, sortOption: FolderSortOption, state: LibraryState) {
  const leftWordCount = countFolderWords(state, leftFolder.id);
  const rightWordCount = countFolderWords(state, rightFolder.id);

  switch (sortOption) {
    case 'oldest':
      return new Date(leftFolder.createdAt).getTime() - new Date(rightFolder.createdAt).getTime();
    case 'az':
      return leftFolder.name.localeCompare(rightFolder.name);
    case 'za':
      return rightFolder.name.localeCompare(leftFolder.name);
    case 'mostWords':
      return rightWordCount - leftWordCount || rightFolder.name.localeCompare(leftFolder.name);
    case 'leastWords':
      return leftWordCount - rightWordCount || leftFolder.name.localeCompare(rightFolder.name);
    case 'favoritesFirst':
      if (leftFolder.isFavorite !== rightFolder.isFavorite) return leftFolder.isFavorite ? -1 : 1;
      return rightWordCount - leftWordCount || leftFolder.name.localeCompare(rightFolder.name);
    case 'recent':
    default:
      return new Date(rightFolder.updatedAt).getTime() - new Date(leftFolder.updatedAt).getTime();
  }
}

function countFolderWords(state: Pick<LibraryState, 'savedWords'>, folderId: string) {
  return state.savedWords.filter((word) => word.folderIds.includes(folderId)).length;
}
