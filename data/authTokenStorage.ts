import * as SecureStore from 'expo-secure-store';

import { createChunkedSecureStorage } from './chunkedSecureStorage';

export const AUTH_TOKEN_STORAGE_KIND = 'secure-store-native';

export type AuthTokenStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

// Sessions are larger than one SecureStore entry allows, so they are stored in chunks (plan 0.8).
export const authTokenStorage: AuthTokenStorage = createChunkedSecureStorage(SecureStore);
