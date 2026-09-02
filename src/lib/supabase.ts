import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnon) {
  console.warn('[Supabase] variáveis de ambiente não configuradas no .env');
}

// O SecureStore tem limite de 2048 bytes por chave.
// Os tokens JWT do Supabase costumam ultrapassar esse limite, então
// dividimos em pedaços (chunks) automaticamente.
const CHUNK_SIZE = 1900; // margem de segurança abaixo do limite de 2048

function chunkKey(key: string, index: number) {
  return `${key}_chunk_${index}`;
}

const LargeSecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      // Verifica se foi armazenado em chunks
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
      // Valor simples (sem chunks)
      return SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    // Limpa chunks anteriores caso existam
    const oldCountStr = await SecureStore.getItemAsync(`${key}_numChunks`);
    if (oldCountStr) {
      const oldCount = parseInt(oldCountStr, 10);
      for (let i = 0; i < oldCount; i++) {
        await SecureStore.deleteItemAsync(chunkKey(key, i));
      }
      await SecureStore.deleteItemAsync(`${key}_numChunks`);
    }

    if (value.length <= CHUNK_SIZE) {
      // Cabe em uma única entrada
      await SecureStore.setItemAsync(key, value);
      return;
    }

    // Divide em chunks
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

// Na WEB (PWA) o SecureStore nao existe: usamos localStorage do navegador.
// O adaptador nativo (SecureStore com chunks) continua igual no Android/iOS.
// O typeof localStorage guarda contra ambientes sem window (ex: pre-render).
const WebStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  },
};

const sessionStorageAdapter =
  Platform.OS === 'web' ? WebStorageAdapter : LargeSecureStoreAdapter;

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    storage:            sessionStorageAdapter,
    autoRefreshToken:   true,
    persistSession:     true,
    // Na web, o Supabase precisa ler o token que volta na URL apos login OAuth
    // (ex: Google). No nativo o fluxo e via deep link, entao fica false.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
