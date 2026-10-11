import { loadUserProfile } from './profileStore';
import { loadCurrentAuthSession } from './authController';
import { getSharedSupabaseAuthClient, type SupabaseAuthClientResult } from './supabaseAuthClient';
import { runSupabaseCloudSyncOnce } from './supabaseSyncRunner';
import type { SupabaseSyncRuntimeClient } from './supabaseSyncRuntimeAdapter';

// The shared app client satisfies the narrow runtime surface the sync adapter uses.
const createSharedRuntimeClient = () =>
  getSharedSupabaseAuthClient() as unknown as SupabaseAuthClientResult<SupabaseSyncRuntimeClient>;

export type SyncState = 'syncing' | 'synced' | 'error' | 'offline' | 'signed-out' | 'unconfigured' | 'idle';
export type SyncStateListener = (state: SyncState) => void;

let listeners: SyncStateListener[] = [];
let currentSyncState: SyncState = 'idle';

export function addSyncStateListener(listener: SyncStateListener) {
  listeners.push(listener);
  listener(currentSyncState);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notifyListeners(state: SyncState) {
  currentSyncState = state;
  listeners.forEach((l) => l(state));
}

export function getCurrentSyncState(): SyncState {
  return currentSyncState;
}

let inFlightSync: ReturnType<typeof runSyncOnce> | null = null;

// One sync at a time: manual taps, foreground events and post-save timers share the running sync.
export function triggerManualSync() {
  inFlightSync ??= runSyncOnce().finally(() => {
    inFlightSync = null;
  });
  return inFlightSync;
}

async function runSyncOnce() {
  try {
    const profile = await loadUserProfile();
    if (!profile.cloudSyncEnabled) {
      notifyListeners('idle');
      return { status: 'idle' as const };
    }

    const session = await loadCurrentAuthSession();
    if (session.status === 'unconfigured') {
      notifyListeners('unconfigured');
      return { status: 'unconfigured' as const };
    }

    if (session.status !== 'authenticated') {
      notifyListeners('signed-out');
      return { status: 'signed-out' as const };
    }

    notifyListeners('syncing');
    const result = await runSupabaseCloudSyncOnce({ createClient: createSharedRuntimeClient });
    if (result.status === 'synced') {
      notifyListeners('synced');
    } else if (result.status === 'offline') {
      notifyListeners('offline');
    } else if (result.status === 'unconfigured') {
      notifyListeners('unconfigured');
    } else if (result.status === 'signed-out') {
      notifyListeners('signed-out');
    } else {
      notifyListeners('error');
    }

    return result;
  } catch (error) {
    notifyListeners('error');
    return { error, status: 'failed' as const };
  }
}

export const triggerLifecycleSync = triggerManualSync;

export const AUTO_SYNC_AFTER_SAVE_DELAY_MS = 30_000;

export type SyncLifecycleOptions = {
  autoSyncDelayMs?: number;
  // Calls back when the app returns to the foreground; returns an unsubscribe function.
  subscribeToForeground?: (onForeground: () => void) => () => void;
  // Calls back after local user data is saved; returns an unsubscribe function.
  subscribeToLocalSaves?: (onSave: () => void) => () => void;
};

let stopCurrentLifecycle: (() => void) | null = null;

/**
 * Automatic sync for users who turned Cloud Sync on: once at start, whenever the app returns to the
 * foreground, and shortly after local edits (debounced so a burst of edits syncs once).
 * With sync turned off, each trigger only reports 'idle'.
 */
export function startSyncLifecycle({
  autoSyncDelayMs = AUTO_SYNC_AFTER_SAVE_DELAY_MS,
  subscribeToForeground,
  subscribeToLocalSaves,
}: SyncLifecycleOptions = {}) {
  stopSyncLifecycle();

  let timer: ReturnType<typeof setTimeout> | null = null;
  const scheduleSync = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void triggerManualSync();
    }, autoSyncDelayMs);
  };

  const unsubscribeForeground = subscribeToForeground?.(() => void triggerManualSync());
  const unsubscribeSaves = subscribeToLocalSaves?.(scheduleSync);

  stopCurrentLifecycle = () => {
    if (timer) clearTimeout(timer);
    unsubscribeForeground?.();
    unsubscribeSaves?.();
  };

  void triggerManualSync();
  return stopSyncLifecycle;
}

export function stopSyncLifecycle() {
  stopCurrentLifecycle?.();
  stopCurrentLifecycle = null;
}
