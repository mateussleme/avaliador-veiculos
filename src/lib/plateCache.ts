// Cache em memória para consultas de placa.
//
// Por que isso economiza dinheiro:
//   - A FIPE gratuita (marca/modelo/ano) já não tem custo.
//   - O APIBrasil cobra R$0,10 por consulta de placa.
//   - Sem cache, avaliar o mesmo veículo duas vezes na mesma sessão custa R$0,20.
//   - Com cache, a segunda consulta é instantânea e gratuita.
//
// O cache persiste enquanto o app estiver aberto.
// Ao fechar e reabrir, é zerado (dados de veículo mudam mensalmente com a FIPE).

import { PlateLookupResult } from '../api/plateApi';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora — suficiente para uma sessão de avaliação

interface CacheEntry {
  result: PlateLookupResult;
  cachedAt: number;
}

const cache = new Map<string, CacheEntry>();

export function getCachedPlate(plate: string): PlateLookupResult | null {
  const key = plate.trim().toUpperCase();
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

export function setCachedPlate(plate: string, result: PlateLookupResult): void {
  const key = plate.trim().toUpperCase();
  cache.set(key, { result, cachedAt: Date.now() });
}

export function getCacheSize(): number {
  return cache.size;
}
