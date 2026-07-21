import { FipeBrand, FipeModel, FipeVehicleInfo, FipeYear, VehicleKind } from '../domain/types';
import { filterBrazilianMarketBrands } from '../domain/brandFilters';
import { supabase } from '../lib/supabase';

// Consultas FIPE agora passam pelo backend (/api/fipe), não mais direto na
// FIPE. Motivo: o token da FIPE saiu do app (era embutido e compartilhado por
// todos, estourava a cota diária em escala e podia ser extraído). O backend
// guarda o token e cacheia as respostas — compartilhado entre todos os
// usuários. Nenhum dado pessoal passa por aqui, só marca/modelo/ano.
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

class FipeApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FipeApiError';
  }
}

async function fipeFetch<T>(path: string): Promise<T> {
  if (!BACKEND_URL) {
    throw new FipeApiError('Backend não configurado. Adicione EXPO_PUBLIC_BACKEND_URL no .env do app.');
  }

  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/fipe?path=${encodeURIComponent(path)}`, { headers });
  } catch {
    throw new FipeApiError('Não foi possível conectar à tabela FIPE. Verifique sua internet.');
  }

  if (response.status === 401) {
    throw new FipeApiError('Sessão expirada. Faça login novamente.');
  }
  if (response.status === 404) {
    throw new FipeApiError('Nenhum resultado encontrado para essa combinação.');
  }
  if (response.status === 429) {
    throw new FipeApiError('Muitas consultas em pouco tempo. Aguarde um instante e tente de novo.');
  }
  if (!response.ok) {
    throw new FipeApiError('A tabela FIPE está indisponível agora. Tente novamente em instantes.');
  }

  return response.json() as Promise<T>;
}

export async function fetchBrands(kind: VehicleKind): Promise<FipeBrand[]> {
  const brands = await fipeFetch<FipeBrand[]>(`/${kind}/brands`);
  return filterBrazilianMarketBrands(kind, brands);
}

export async function fetchModels(kind: VehicleKind, brandCode: string): Promise<FipeModel[]> {
  return fipeFetch<FipeModel[]>(`/${kind}/brands/${brandCode}/models`);
}

// Fluxo alternativo marca → ano → modelo.
// A FIPE expõe os anos de uma marca inteira (sem precisar do modelo) e os
// modelos de uma marca+ano. Cada um continua sendo 1 requisição só, então
// não fica mais lento nem gasta cota extra. O código de ano já vem com o
// combustível embutido (ex: "2025-5" = 2025 Flex), então escolher o ano
// aqui já filtra os modelos por ano E combustível.
export async function fetchYearsByBrand(
  kind: VehicleKind,
  brandCode: string
): Promise<FipeYear[]> {
  const years = await fipeFetch<FipeYear[]>(`/${kind}/brands/${brandCode}/years`);
  return years.map((y) =>
    isZeroKmYearCode(y.code)
      ? { ...y, name: y.name.replace(ZERO_KM_YEAR_PREFIX, '0 km') }
      : y
  );
}

export async function fetchModelsByYear(
  kind: VehicleKind,
  brandCode: string,
  yearCode: string
): Promise<FipeModel[]> {
  return fipeFetch<FipeModel[]>(`/${kind}/brands/${brandCode}/years/${yearCode}/models`);
}

// A FIPE usa "32000" como ano de convenção interna para veículo 0km (sem
// ano de modelo definido ainda) — ex: code "32000-5", name "32000 Flex".
// Mostrar esse número cru pro usuário ("32000 Gasolina") é confuso, então
// trocamos o rótulo por "0 km" aqui. O code original não muda: ele ainda é
// o que a API espera para consultar o preço em fetchVehicleInfo.
const ZERO_KM_YEAR_PREFIX = '32000';

function isZeroKmYearCode(code: string): boolean {
  return code.startsWith(`${ZERO_KM_YEAR_PREFIX}-`);
}

export async function fetchYears(
  kind: VehicleKind,
  brandCode: string,
  modelCode: string
): Promise<FipeYear[]> {
  const years = await fipeFetch<FipeYear[]>(`/${kind}/brands/${brandCode}/models/${modelCode}/years`);
  return years.map((y) =>
    isZeroKmYearCode(y.code)
      ? { ...y, name: y.name.replace(ZERO_KM_YEAR_PREFIX, '0 km') }
      : y
  );
}

function parsePriceLabel(label: string): number {
  // "R$ 45.231,00" -> 45231.00
  const numeric = label
    .replace(/[^\d,]/g, '')
    .replace(/\.(?=\d{3},)/g, '')
    .replace(',', '.');
  const value = parseFloat(numeric);
  return Number.isFinite(value) ? value : 0;
}

export async function fetchVehicleInfo(
  kind: VehicleKind,
  brandCode: string,
  modelCode: string,
  yearCode: string
): Promise<FipeVehicleInfo> {
  const raw = await fipeFetch<{
    brand: string;
    model: string;
    modelYear: number;
    fuel: string;
    codeFipe: string;
    price: string;
    referenceMonth: string;
  }>(`/${kind}/brands/${brandCode}/models/${modelCode}/years/${yearCode}`);

  // raw.modelYear vem como 32000 (numérico) pra veículo 0km — normalizamos
  // pro ano atual (mantém a lógica de "veículo novo" do motor de avaliação
  // correta, já que ela já trata modelYear >= anoAtual como 0km) e marcamos
  // isZeroKm pra tela mostrar "0 km" em vez do "32000" cru.
  const isZeroKm = raw.modelYear === 32000;

  return {
    brand: raw.brand,
    model: raw.model,
    modelYear: isZeroKm ? new Date().getFullYear() : raw.modelYear,
    fuel: raw.fuel,
    codeFipe: raw.codeFipe,
    priceLabel: raw.price,
    priceValue: parsePriceLabel(raw.price),
    referenceMonth: raw.referenceMonth,
    isZeroKm,
  };
}

// Formata o ano do modelo pra exibição: "0 km" pra veículos 0km da FIPE,
// ou o ano normal como texto. Use isso em vez de mostrar vehicle.modelYear
// direto sempre que for exibir pro usuário.
//
// Checa isZeroKm E o valor cru 32000: a consulta por placa passa pelo
// backend (Node/Vercel, fora deste repo), que pode devolver o modelYear da
// FIPE sem passar pela normalização feita aqui em fetchVehicleInfo — então
// esse fallback numérico garante que "0 km" apareça mesmo nesse caminho.
export function formatModelYear(vehicle: Pick<FipeVehicleInfo, 'modelYear' | 'isZeroKm'>): string {
  if (vehicle.isZeroKm || vehicle.modelYear === 32000) return '0 km';
  return String(vehicle.modelYear);
}

export { FipeApiError };
