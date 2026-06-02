import { AppState, AppStateStatus } from 'react-native';
import { loadUserProfile } from './profileStore';
import { loadCurrentAuthSession } from './authController';
import { runSupabaseCloudSyncOnce } from './supabaseSyncRunner';

export type SyncState = 'syncing' | 'synced' | 'error' | 'offline' | 'idle';
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

export async function triggerLifecycleSync() {
  try {
    const profile = await loadUserProfile();
    if (!profile.cloudSyncEnabled) {
      notifyListeners('idle');
      return;
    }

    const session = await loadCurrentAuthSession();
    if (session.status !== 'authenticated') {
      notifyListeners('idle');
      return;
    }

    notifyListeners('syncing');
    const result = await runSupabaseCloudSyncOnce();
    if (result.status === 'synced') {
      notifyListeners('synced');
    } else if (result.status === 'offline') {
      notifyListeners('offline');
    } else {
      notifyListeners('error');
    }
  } catch (error) {
    notifyListeners('error');
  }
}

let appStateSubscription: { remove: () => void } | null = null;

export function startSyncLifecycle() {
  if (appStateSubscription) return;

  // Trigger sync on launch
  triggerLifecycleSync();

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      triggerLifecycleSync();
    }
  };

  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
}

export function stopSyncLifecycle() {
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
}
