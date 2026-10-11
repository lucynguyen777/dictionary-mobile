import { describe, expect, it } from 'vitest';

import { reconcileSyncedRows } from '../data/userDatabaseSyncReconcile';

const T0 = '2026-10-01T00:00:00.000Z';
const LOADED = '2026-10-02T00:00:00.000Z';
const PULLED_AFTER_LOAD = '2026-10-03T00:00:00.000Z';
const NOW = '2026-10-04T00:00:00.000Z';

function syncedFolder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'f1',
    name: 'Travel',
    deleted_at: null,
    last_local_change_at: null,
    last_pulled_at: null,
    last_synced_at: T0,
    remote_version: 2,
    sync_status: 'clean',
    ...overrides,
  };
}

const context = { loadedAt: { library: LOADED }, now: NOW };

describe('reconcileSyncedRows', () => {
  it('keeps sync bookkeeping for unchanged rows', () => {
    const [row] = reconcileSyncedRows('folders', [{ id: 'f1', name: 'Travel', deleted_at: null }], [syncedFolder()], context);
    expect(row).toMatchObject({ sync_status: 'clean', last_synced_at: T0, remote_version: 2 });
  });

  it('marks edited and new rows dirty with the save time', () => {
    const rows = reconcileSyncedRows(
      'folders',
      [{ id: 'f1', name: 'Trips', deleted_at: null }, { id: 'f2', name: 'New', deleted_at: null }],
      [syncedFolder()],
      context
    );
    expect(rows).toEqual([
      expect.objectContaining({ id: 'f1', name: 'Trips', sync_status: 'dirty', last_local_change_at: NOW, remote_version: 2 }),
      expect.objectContaining({ id: 'f2', sync_status: 'dirty', last_synced_at: null }),
    ]);
  });

  it('soft-deletes removed rows the server has seen, and drops never-synced ones', () => {
    const rows = reconcileSyncedRows(
      'folders',
      [],
      [syncedFolder(), syncedFolder({ id: 'local-only', last_synced_at: null, sync_status: 'dirty' })],
      context
    );
    expect(rows).toEqual([
      expect.objectContaining({ id: 'f1', deleted_at: NOW, sync_status: 'dirty', last_local_change_at: NOW }),
    ]);
  });

  it('keeps already soft-deleted rows until they sync', () => {
    const ghost = syncedFolder({ deleted_at: T0, sync_status: 'dirty' });
    expect(reconcileSyncedRows('folders', [], [ghost], context)).toEqual([ghost]);
  });

  it('lets rows pulled after the snapshot was loaded win over a stale snapshot', () => {
    const pulled = syncedFolder({ name: 'From other device', last_pulled_at: PULLED_AFTER_LOAD });
    const pulledNew = syncedFolder({ id: 'f9', name: 'Pulled new', last_pulled_at: PULLED_AFTER_LOAD });

    const rows = reconcileSyncedRows('folders', [{ id: 'f1', name: 'Stale name', deleted_at: null }], [pulled, pulledNew], context);

    expect(rows).toEqual([pulled, pulledNew]);
  });

  it('applies the snapshot normally when its load time is unknown', () => {
    const pulled = syncedFolder({ last_pulled_at: PULLED_AFTER_LOAD });
    const [row] = reconcileSyncedRows('folders', [{ id: 'f1', name: 'Edited', deleted_at: null }], [pulled], {
      loadedAt: {},
      now: NOW,
    });
    expect(row).toMatchObject({ name: 'Edited', sync_status: 'dirty' });
  });

  it('drops Reader document content once the document is soft-deleted', () => {
    const doc = { id: 'd1', title: 'Book', content: 'long text', deleted_at: null, last_synced_at: T0, sync_status: 'clean' };
    const [row] = reconcileSyncedRows('reader_documents', [], [doc], { loadedAt: {}, now: NOW });
    expect(row).toMatchObject({ content: '', deleted_at: NOW, sync_status: 'dirty' });
  });

  it('never removes tombstones or singletons because a snapshot omitted them', () => {
    const tombstone = { entity_type: 'folder', entity_id: 'f1', deleted_at: T0, sync_status: 'clean', last_synced_at: T0 };
    expect(reconcileSyncedRows('deleted_entities', [], [tombstone], context)).toEqual([tombstone]);
  });

  it('keys composite-key tables by every key column', () => {
    const membership = { word_id: 'w1', folder_id: 'f1', created_at: T0, last_synced_at: T0, sync_status: 'clean' };
    const rows = reconcileSyncedRows(
      'saved_word_folders',
      [{ word_id: 'w1', folder_id: 'f2', created_at: T0 }],
      [membership],
      { loadedAt: {}, now: NOW }
    );
    expect(rows).toEqual([
      expect.objectContaining({ folder_id: 'f2', sync_status: 'dirty' }),
      expect.objectContaining({ folder_id: 'f1', deleted_at: NOW, sync_status: 'dirty' }),
    ]);
  });
});
