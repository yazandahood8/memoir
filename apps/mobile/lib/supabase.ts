import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1900;

const ChunkedSecureStore = {
  async getItem(key: string): Promise<string | null> {
    const numChunksStr = await SecureStore.getItemAsync(`${key}_n`);
    if (!numChunksStr) return SecureStore.getItemAsync(key);
    const chunks = await Promise.all(
      Array.from({ length: parseInt(numChunksStr) }, (_, i) =>
        SecureStore.getItemAsync(`${key}_${i}`)
      )
    );
    return chunks.every(Boolean) ? chunks.join('') : null;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.deleteItemAsync(`${key}_n`).catch(() => {});
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${key}_n`, String(chunks.length));
    await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(`${key}_${i}`, c)));
  },

  async removeItem(key: string): Promise<void> {
    const numChunksStr = await SecureStore.getItemAsync(`${key}_n`);
    if (numChunksStr) {
      const n = parseInt(numChunksStr);
      await SecureStore.deleteItemAsync(`${key}_n`);
      await Promise.all(Array.from({ length: n }, (_, i) => SecureStore.deleteItemAsync(`${key}_${i}`)));
    }
    await SecureStore.deleteItemAsync(key).catch(() => {});
  },
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ChunkedSecureStore,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
