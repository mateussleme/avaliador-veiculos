import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnon) {
  console.warn('[Supabase] variáveis de ambiente não configuradas no .env');
}

// O SecureStore tem limite de 2048 bytes por chave.
// Os tokens JWT do Supabase costumam ultrapassar esse limite, então
// dividimos em pedaços (chunks) automaticamente.
const CHUNK_SIZE = 1900;
function chunkKey(key: string, index: number) {
  return `${key}_chunk_${index}`;
}

const LargeSecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      const countStr = await SecureStore.getItemAsync(`${key}_numChunks`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        const chunks: string[] = [];
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(chunkKey(key, i));
          if (chunk === null) return null;
          chunks.push(chunk);
        }
        return chunks.join('');
      }
      return SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    const oldCountStr = await SecureStore.getItemAsync(`${key}_numChunks`);
    if (oldCountStr) {
      const oldCount = parseInt(oldCountStr, 10);
      for (let i = 0; i < oldCount; i++) {
        await SecureStore.deleteItemAsync(chunkKey(key, i));
      }
      await SecureStore.deleteItemAsync(`${key}_numChunks`);
    }
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const count = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}_numChunks`, String(count));
    for (let i = 0; i < count; i++) {
      const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await SecureStore.setItemAsync(chunkKey(key, i), chunk);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      const countStr = await SecureStore.getItemAsync(`${key}_numChunks`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        await SecureStore.deleteItemAsync(`${key}_numChunks`);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(chunkKey(key, i));
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignora erros de remoção
    }
  },
};

// localStorage do navegador não tem o limite de 2048 bytes do SecureStore,
// então na web não precisamos do esquema de chunks.
const WebLocalStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    return window.localStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    storage:            Platform.OS === 'web' ? WebLocalStorageAdapter : LargeSecureStoreAdapter,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
});
