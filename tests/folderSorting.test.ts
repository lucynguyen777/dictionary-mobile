import { describe, expect, it } from 'vitest';

import { sortFolders } from '../components/library/folderSorting';
import type { Folder, LibraryState } from '../data/libraryStore';

function folder(id: string, name: string, overrides: Partial<Folder> = {}): Folder {
  return {
    color: '#E8F0FF',
    colorNote: '',
    createdAt: '2026-10-01T00:00:00.000Z',
    id,
    isFavorite: false,
    name,
    tags: [],
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

const folders = [
  folder('a', 'Beta', { createdAt: '2026-10-02T00:00:00.000Z', updatedAt: '2026-10-05T00:00:00.000Z' }),
  folder('b', 'alpha', { createdAt: '2026-10-01T00:00:00.000Z', isFavorite: true, updatedAt: '2026-10-03T00:00:00.000Z' }),
  folder('c', 'Gamma', { createdAt: '2026-10-03T00:00:00.000Z', updatedAt: '2026-10-04T00:00:00.000Z' }),
];
const state = {
  folders,
  savedWords: [
    { folderIds: ['c'], id: 'w1' },
    { folderIds: ['c'], id: 'w2' },
    { folderIds: ['a'], id: 'w3' },
  ],
} as unknown as LibraryState;

const ids = (option: Parameters<typeof sortFolders>[2]) =>
  [...folders].sort((left, right) => sortFolders(left, right, option, state)).map((item) => item.id);

describe('sortFolders', () => {
  it.each([
    ['recent', ['a', 'c', 'b']],
    ['oldest', ['b', 'a', 'c']],
    ['az', ['b', 'a', 'c']],
    ['za', ['c', 'a', 'b']],
    ['mostWords', ['c', 'a', 'b']],
    ['leastWords', ['b', 'a', 'c']],
    ['favoritesFirst', ['b', 'c', 'a']],
  ] as const)('%s', (option, expected) => {
    expect(ids(option)).toEqual(expected);
  });
});
