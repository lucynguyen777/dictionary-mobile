import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadUserProfile = vi.fn();
const loadCurrentAuthSession = vi.fn();
const runSupabaseCloudSyncOnce = vi.fn();

vi.mock('../data/profileStore', () => ({
  loadUserProfile,
}));

vi.mock('../data/authController', () => ({
  loadCurrentAuthSession,
}));

vi.mock('../data/supabaseAuthClient', () => ({
  getSharedSupabaseAuthClient: vi.fn(() => ({ status: 'unconfigured' })),
}));

vi.mock('../data/supabaseSyncRunner', () => ({
  runSupabaseCloudSyncOnce,
}));

const syncSpecializedGlossariesWithSharedClient = vi.fn();
vi.mock('../data/specializedGlossarySync', () => ({
  syncSpecializedGlossariesWithSharedClient,
}));

describe('supabase sync lifecycle', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    loadUserProfile.mockResolvedValue({ cloudSyncEnabled: true });
    loadCurrentAuthSession.mockResolvedValue({ status: 'authenticated' });
    runSupabaseCloudSyncOnce.mockResolvedValue({
      domains: [],
      status: 'synced',
      syncedAt: '2026-06-03T00:00:00.000Z',
    });
    syncSpecializedGlossariesWithSharedClient.mockResolvedValue({ pulled: [], pushed: [] });
  });

  it('syncs glossaries after user data and reports a glossary failure as an error', async () => {
    const { addSyncStateListener, triggerManualSync } = await import('../data/supabaseSyncLifecycle');
    const states: string[] = [];
    const unsubscribe = addSyncStateListener((state) => states.push(state));

    await triggerManualSync();
    expect(syncSpecializedGlossariesWithSharedClient).toHaveBeenCalledTimes(1);
    expect(states.at(-1)).toBe('synced');

    syncSpecializedGlossariesWithSharedClient.mockRejectedValueOnce(new Error('glossary_sync_push_failed'));
    await triggerManualSync();
    expect(states.at(-1)).toBe('error');
    unsubscribe();
  });

  it('does not sync glossaries when the main sync did not finish', async () => {
    runSupabaseCloudSyncOnce.mockResolvedValue({ status: 'offline' });
    const { triggerManualSync } = await import('../data/supabaseSyncLifecycle');
    await triggerManualSync();
    expect(syncSpecializedGlossariesWithSharedClient).not.toHaveBeenCalled();
  });

  it('syncs once at start, on foreground, and once after a burst of local saves', async () => {
    vi.useFakeTimers();
    try {
      const { startSyncLifecycle, stopSyncLifecycle } = await import('../data/supabaseSyncLifecycle');
      let onForeground = () => {};
      let onSave = () => {};
      const unsubscribeForeground = vi.fn();
      const unsubscribeSaves = vi.fn();

      startSyncLifecycle({
        autoSyncDelayMs: 1_000,
        subscribeToForeground: (callback) => { onForeground = callback; return unsubscribeForeground; },
        subscribeToLocalSaves: (callback) => { onSave = callback; return unsubscribeSaves; },
      });
      await vi.runAllTimersAsync();
      expect(runSupabaseCloudSyncOnce).toHaveBeenCalledTimes(1);

      onForeground();
      await vi.runAllTimersAsync();
      expect(runSupabaseCloudSyncOnce).toHaveBeenCalledTimes(2);

      onSave();
      onSave();
      onSave();
      await vi.advanceTimersByTimeAsync(999);
      expect(runSupabaseCloudSyncOnce).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);
      await vi.runAllTimersAsync();
      expect(runSupabaseCloudSyncOnce).toHaveBeenCalledTimes(3);

      stopSyncLifecycle();
      expect(unsubscribeForeground).toHaveBeenCalled();
      expect(unsubscribeSaves).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shares one running sync between overlapping triggers', async () => {
    let finish: (value: unknown) => void = () => {};
    runSupabaseCloudSyncOnce.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const { triggerManualSync } = await import('../data/supabaseSyncLifecycle');

    const first = triggerManualSync();
    const second = triggerManualSync();
    await vi.waitFor(() => expect(runSupabaseCloudSyncOnce).toHaveBeenCalledTimes(1));
    finish({ domains: [], status: 'synced', syncedAt: '2026-06-03T00:00:00.000Z' });

    expect(await first).toEqual(await second);
    expect(runSupabaseCloudSyncOnce).toHaveBeenCalledTimes(1);
  });

  it('runs cloud sync through the manual trigger', async () => {
    const { triggerManualSync } = await import('../data/supabaseSyncLifecycle');

    const result = await triggerManualSync();

    expect(result.status).toBe('synced');
    expect(loadUserProfile).toHaveBeenCalledTimes(1);
    expect(loadCurrentAuthSession).toHaveBeenCalledTimes(1);
    expect(runSupabaseCloudSyncOnce).toHaveBeenCalledTimes(1);
  });

  it('reports idle when beta sync is disabled', async () => {
    loadUserProfile.mockResolvedValueOnce({ cloudSyncEnabled: false });
    const states: string[] = [];
    const { addSyncStateListener, triggerManualSync } = await import('../data/supabaseSyncLifecycle');
    const unsubscribe = addSyncStateListener((state) => states.push(state));

    const result = await triggerManualSync();

    unsubscribe();
    expect(result.status).toBe('idle');
    expect(states.at(-1)).toBe('idle');
    expect(runSupabaseCloudSyncOnce).not.toHaveBeenCalled();
  });

  it('reports unconfigured and signed-out without running sync', async () => {
    const { triggerManualSync } = await import('../data/supabaseSyncLifecycle');

    loadCurrentAuthSession.mockResolvedValueOnce({ status: 'unconfigured' });
    await expect(triggerManualSync()).resolves.toEqual({ status: 'unconfigured' });

    loadCurrentAuthSession.mockResolvedValueOnce({ status: 'unauthenticated' });
    await expect(triggerManualSync()).resolves.toEqual({ status: 'signed-out' });

    expect(runSupabaseCloudSyncOnce).not.toHaveBeenCalled();
  });

  it('maps runner availability states to listener states', async () => {
    const states: string[] = [];
    const { addSyncStateListener, triggerManualSync } = await import('../data/supabaseSyncLifecycle');
    const unsubscribe = addSyncStateListener((state) => states.push(state));

    runSupabaseCloudSyncOnce.mockResolvedValueOnce({
      domains: [],
      reason: 'No network',
      status: 'offline',
      syncedAt: '2026-06-03T00:00:00.000Z',
    });

    const result = await triggerManualSync();

    unsubscribe();
    expect(result.status).toBe('offline');
    expect(states.at(-1)).toBe('offline');
  });
});
