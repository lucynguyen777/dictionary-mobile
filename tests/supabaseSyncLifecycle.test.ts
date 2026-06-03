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

vi.mock('../data/supabaseSyncRunner', () => ({
  runSupabaseCloudSyncOnce,
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
  });

  it('does not auto sync when lifecycle starts', async () => {
    const { startSyncLifecycle } = await import('../data/supabaseSyncLifecycle');

    startSyncLifecycle();

    expect(loadUserProfile).not.toHaveBeenCalled();
    expect(runSupabaseCloudSyncOnce).not.toHaveBeenCalled();
  });

  it('runs cloud sync only through manual trigger', async () => {
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
