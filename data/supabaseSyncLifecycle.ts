import { loadUserProfile } from './profileStore';
import { loadCurrentAuthSession } from './authController';
import { runSupabaseCloudSyncOnce } from './supabaseSyncRunner';

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

export async function triggerManualSync() {
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
    const result = await runSupabaseCloudSyncOnce();
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

export function startSyncLifecycle() {
  notifyListeners('idle');
}

export function stopSyncLifecycle() {
  notifyListeners('idle');
}
