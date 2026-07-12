/**
 * Script de verificação da tabela de descontos contra a base real da FIPE.
 *
 * NÃO faz parte do app (não é importado por nenhum código do App/Expo).
 * É uma ferramenta de desenvolvimento para rodar manualmente, localmente,
 * sempre que o discountTable.ts for alterado — ou periodicamente para
 * detectar quando a FIPE renomeia/descontinua um modelo.
 *
 * O que ele faz:
 *   1. Busca ao vivo, na API pública da FIPE (fipe.parallelum.com.br),
 *      a lista real de marcas e, para cada marca presente no
 *      DISCOUNT_TABLE, a lista real de modelos.
 *   2. Para cada linha do DISCOUNT_TABLE, verifica se existe pelo menos
 *      um modelo real da FIPE que bate com ela (mesma regra de match do
 *      app: lookupDiscount). Se nenhum modelo real bater, a linha é
 *      provavelmente um nome errado/desatualizado — reporta como aviso.
 *   3. Para cada modelo real da FIPE, roda a mesma lógica de match do app
 *      e verifica se mais de uma linha do DISCOUNT_TABLE "empata" em
 *      especificidade (mesmo número de palavras) — isso indica uma
 *      colisão ambígua que precisa de ajuste manual na tabela.
 *
 * Como rodar (precisa de internet — não funciona em sandbox isolado):
 *   npx tsx scripts/verify-discount-table.ts
 *
 * Sem token da FIPE, o limite é 500 consultas/dia. Esse script faz 1
 * chamada por "kind" (cars/motorcycles) + 1 chamada por marca coberta
 * pela tabela — hoje isso fica bem abaixo do limite.
 */

import {
  DISCOUNT_TABLE,
  normBrand,
  normalize,
  tableWordsOf,
} from '../src/domain/discountTable';

const BASE_URL = 'https://fipe.parallelum.com.br/api/v2';

type VehicleKind = 'cars' | 'motorcycles';

interface FipeBrandApi {
  code: string;
  name: string;
}

interface FipeModelApi {
  code: number;
  name: string;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`FIPE ${path} -> HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Marcas do DISCOUNT_TABLE que são motos (o resto é considerado carro).
// Precisa bater manualmente porque o FIPE separa carros e motos em
// endpoints diferentes, e a nossa tabela mistura os dois por marca (ex:
// BMW tem entradas de carro E de moto).
const MOTORCYCLE_BRAND_KEYS = new Set<string>(['bmw']);

function brandKeysInTable(): Set<string> {
  const keys = new Set<string>();
  for (const entry of DISCOUNT_TABLE) {
    keys.add(normBrand(entry.brand));
  }
  return keys;
}

// Retorna TODOS os códigos de marca da FIPE que apontam pro mesmo alias —
// a FIPE às vezes cadastra a mesma marca duas vezes com códigos diferentes
// (ex: "Caoa Chery" e "Caoa Chery/Chery"), e ignorar isso deixaria metade
// dos modelos reais de fora da verificação.
function findFipeBrandCodes(brands: FipeBrandApi[], wantedKey: string): FipeBrandApi[] {
  return brands.filter((b) => normBrand(b.name) === wantedKey);
}

async function main() {
  console.log('== Verificação da tabela de descontos vs. base real da FIPE ==\n');

  const tableBrandKeys = brandKeysInTable();

  const [carBrands, motoBrands] = await Promise.all([
    fetchJson<FipeBrandApi[]>('/cars/brands'),
    fetchJson<FipeBrandApi[]>('/motorcycles/brands'),
  ]);

  // brandKey -> { kind, models: string[] }
  const realModelsByBrand = new Map<string, { kind: VehicleKind; models: string[] }>();

  for (const key of tableBrandKeys) {
    const kind: VehicleKind = MOTORCYCLE_BRAND_KEYS.has(key) ? 'motorcycles' : 'cars';
    const brandList = kind === 'motorcycles' ? motoBrands : carBrands;
    const matches = findFipeBrandCodes(brandList, key);
    if (matches.length === 0) {
      console.log(`[AVISO] Marca "${key}" do DISCOUNT_TABLE não foi encontrada na lista de marcas da FIPE (${kind}). Verifique o alias em normBrand/BRAND_ALIASES.`);
      continue;
    }
    if (matches.length > 1) {
      console.log(`[INFO] Marca "${key}" tem ${matches.length} códigos na FIPE (${matches.map((m) => `${m.name}#${m.code}`).join(', ')}) — buscando modelos de todos.`);
    }
    const allModels: string[] = [];
    for (const match of matches) {
      try {
        const models = await fetchJson<FipeModelApi[]>(`/${kind}/brands/${match.code}/models`);
        allModels.push(...models.map((m) => m.name));
      } catch (err) {
        console.log(`[ERRO] Falha ao buscar modelos de "${match.name}" (${kind}): ${(err as Error).message}`);
      }
    }
    realModelsByBrand.set(key, { kind, models: allModels });
  }

  console.log('\n-- 1. Linhas do DISCOUNT_TABLE sem nenhum modelo real correspondente --\n');
  let deadEntryCount = 0;
  for (const entry of DISCOUNT_TABLE) {
    const key = normBrand(entry.brand);
    const bucket = realModelsByBrand.get(key);
    if (!bucket) continue; // já avisado acima (marca não encontrada)

    const entryWords = tableWordsOf(entry.model);
    const hasMatch = bucket.models.some((realModel) => {
      const realWords = normalize(realModel).split(' ');
      return entryWords.every((w) => realWords.includes(w));
    });

    if (!hasMatch) {
      deadEntryCount++;
      console.log(`[SEM MATCH] ${entry.brand} / ${entry.model} (${Math.round(entry.discount * 100)}%) — nenhum modelo real da FIPE contém essas palavras.`);
    }
  }
  if (deadEntryCount === 0) {
    console.log('Nenhuma linha órfã encontrada — todas batem com pelo menos um modelo real.');
  }

  console.log('\n-- 2. Colisões de especificidade (mais de uma linha empatando no mesmo modelo real) --\n');
  let collisionCount = 0;
  for (const [key, bucket] of realModelsByBrand) {
    for (const realModel of bucket.models) {
      const realWords = normalize(realModel).split(' ');
      const candidates = DISCOUNT_TABLE.filter((e) => {
        if (normBrand(e.brand) !== key) return false;
        const tw = tableWordsOf(e.model);
        return tw.length > 0 && tw.every((w) => realWords.includes(w));
      });
      if (candidates.length < 2) continue;

      const maxLen = Math.max(...candidates.map((c) => tableWordsOf(c.model).length));
      const tied = candidates.filter((c) => tableWordsOf(c.model).length === maxLen);
      if (tied.length > 1) {
        collisionCount++;
        const names = tied.map((c) => `"${c.model}" (${Math.round(c.discount * 100)}%)`).join(' vs. ');
        console.log(`[COLISÃO] Modelo real "${realModel}" (${bucket.kind}, marca ${key}) empata entre: ${names} — resultado depende da ordem no array, ajuste manualmente.`);
      }
    }
  }
  if (collisionCount === 0) {
    console.log('Nenhuma colisão de especificidade encontrada.');
  }

  console.log(`\n== Resumo: ${deadEntryCount} linha(s) órfã(s), ${collisionCount} colisão(ões) ==`);
}

main().catch((err) => {
  console.error('Falha ao rodar verificação:', err.message ?? err);
  process.exit(1);
});
