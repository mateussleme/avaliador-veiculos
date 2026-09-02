import { supabase } from '../lib/supabase';
import { setDefaultDiscountPercent } from '../domain/discountTable';

// ------------------------------------------------------------------
// Chaves conhecidas de parâmetros (mantenha sincronizado com a
// migration que criou/populou a tabela evaluation_parameters).
// ------------------------------------------------------------------
export type ParamKey = 'default_discount_percent';

// Valores usados se a busca falhar (offline, erro de rede, etc.) e
// não houver nada em cache ainda. Mantenha estes iguais aos valores
// semente da migration, para não haver surpresa na primeira execução.
const FALLBACK_DEFAULTS: Record<ParamKey, number> = {
  default_discount_percent: 22, // igual ao DEFAULT_DISCOUNT_PERCENT em discountTable.ts
};

type ParamsMap = Record<string, number>;

interface CachedParams {
  values: ParamsMap;
  fetchedAt: number; // epoch ms
}

// Cache em memória (válido durante a sessão do app). Se quiser persistir
// entre reaberturas do app, trocar por AsyncStorage/SecureStore/localStorage
// seguindo o mesmo padrão usado em src/lib/supabase.ts.
let cache: CachedParams | null = null;

// Tempo em que o cache é considerado válido sem precisar rebuscar.
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos

export class EvaluationParamsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EvaluationParamsError';
  }
}

/**
 * Busca os parâmetros de avaliação do Supabase.
 * - Usa cache em memória por até CACHE_TTL_MS, para não bater no banco
 *   a cada tela.
 * - Se a busca falhar e já houver cache (mesmo expirado), usa o cache
 *   antigo em vez de quebrar o fluxo (fail-soft).
 * - Se nunca buscou com sucesso e a busca falhar, cai nos valores
 *   FALLBACK_DEFAULTS, para o app continuar funcionável.
 */
export async function getEvaluationParams(options?: { forceRefresh?: boolean }): Promise<ParamsMap> {
  const isCacheFresh = cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS;

  if (isCacheFresh && !options?.forceRefresh) {
    return cache!.values;
  }

  try {
    const { data, error } = await supabase
      .from('evaluation_parameters')
      .select('param_key, param_value');

    if (error) throw error;
    if (!data || data.length === 0) throw new EvaluationParamsError('Nenhum parâmetro retornado.');

    const values: ParamsMap = {};
    for (const row of data) {
      values[row.param_key] = Number(row.param_value);
    }

    cache = { values, fetchedAt: Date.now() };
    return values;
  } catch (err) {
    // Fail-soft: prefere usar dado desatualizado a travar a avaliação.
    if (cache) {
      console.warn('[evaluationParams] Falha ao atualizar parâmetros, usando cache anterior.', err);
      return cache.values;
    }
    console.warn('[evaluationParams] Falha ao buscar parâmetros, usando valores padrão embutidos.', err);
    return { ...FALLBACK_DEFAULTS };
  }
}

/**
 * Atalho para ler um parâmetro específico com fallback tipado.
 * Uso: const discount = await getParam('default_discount_percent');
 */
export async function getParam(key: ParamKey): Promise<number> {
  const params = await getEvaluationParams();
  return params[key] ?? FALLBACK_DEFAULTS[key];
}

/** Limpa o cache em memória. Útil após login/logout de outro usuário. */
export function clearEvaluationParamsCache(): void {
  cache = null;
}

/**
 * Busca os parâmetros e já aplica no motor de avaliação (discountTable.ts).
 * Chame isso uma vez no início do app, depois de confirmar que existe sessão
 * válida (o Supabase precisa de auth para ler evaluation_parameters).
 * Nunca lança erro: se a busca falhar, o motor simplesmente continua usando
 * o DEFAULT_DISCOUNT_PERCENT embutido no código (fail-soft).
 */
export async function loadAndApplyEvaluationParams(): Promise<void> {
  const params = await getEvaluationParams();
  if (params.default_discount_percent !== undefined) {
    setDefaultDiscountPercent(params.default_discount_percent);
  }
}