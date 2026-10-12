// Supabase sessions often exceed SecureStore's ~2048-byte value limit (plan 0.8). Instead of moving
// the session out of the keychain, it is split across several SecureStore entries: `<key>.count`
// plus `<key>.0`, `<key>.1`, … Values written by older app versions under the plain key are still
// read, and are migrated on the next write.
export type SecureStoreLike = {
  deleteItemAsync: (key: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
};

// Characters, not bytes: 600 UTF-16 units stay under 2048 bytes even if every one is a 3-byte
// UTF-8 character (Vietnamese names in user metadata).
export const SECURE_STORE_CHUNK_CHARS = 600;

const countKey = (key: string) => `${key}.count`;
const chunkKey = (key: string, index: number) => `${key}.${index}`;

export function createChunkedSecureStorage(store: SecureStoreLike, chunkChars = SECURE_STORE_CHUNK_CHARS) {
  const readCount = async (key: string) => {
    const raw = await store.getItemAsync(countKey(key));
    const count = raw === null ? null : Number(raw);
    return count !== null && Number.isInteger(count) && count >= 0 ? count : null;
  };

  const deleteChunks = async (key: string, from: number, to: number) => {
    for (let index = from; index < to; index += 1) await store.deleteItemAsync(chunkKey(key, index));
  };

  return {
    async getItem(key: string) {
      const count = await readCount(key);
      if (count === null) return store.getItemAsync(key);
      const parts: string[] = [];
      for (let index = 0; index < count; index += 1) {
        const part = await store.getItemAsync(chunkKey(key, index));
        // A missing chunk means an interrupted write; a partial session is useless, so sign in again.
        if (part === null) return null;
        parts.push(part);
      }
      return parts.join('');
    },

    async setItem(key: string, value: string) {
      const previousCount = (await readCount(key)) ?? 0;
      const chunks: string[] = [];
      for (let index = 0; index < value.length; index += chunkChars) chunks.push(value.slice(index, index + chunkChars));
      for (let index = 0; index < chunks.length; index += 1) await store.setItemAsync(chunkKey(key, index), chunks[index]);
      await store.setItemAsync(countKey(key), String(chunks.length));
      await deleteChunks(key, chunks.length, previousCount);
      await store.deleteItemAsync(key);
    },

    async removeItem(key: string) {
      const count = (await readCount(key)) ?? 0;
      await store.deleteItemAsync(countKey(key));
      await deleteChunks(key, 0, count);
      await store.deleteItemAsync(key);
    },
  };
}
