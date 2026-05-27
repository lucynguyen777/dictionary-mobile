export const AUTH_TOKEN_STORAGE_KIND = 'web-local-storage';

export type AuthTokenStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memoryFallback = new Map<string, string>();

function getLocalStorage() {
  if (typeof window === 'undefined') return null;

  return window.localStorage;
}

export const authTokenStorage: AuthTokenStorage = {
  async getItem(key) {
    const localStorage = getLocalStorage();
    if (!localStorage) return memoryFallback.get(key) ?? null;

    return localStorage.getItem(key);
  },
  async setItem(key, value) {
    const localStorage = getLocalStorage();
    if (!localStorage) {
      memoryFallback.set(key, value);
      return;
    }

    localStorage.setItem(key, value);
  },
  async removeItem(key) {
    const localStorage = getLocalStorage();
    if (!localStorage) {
      memoryFallback.delete(key);
      return;
    }

    localStorage.removeItem(key);
  },
};

