import { FipeBrand, FipeModel, FipeVehicleInfo, FipeYear, VehicleKind } from '../domain/types';
import { filterBrazilianMarketBrands } from '../domain/brandFilters';

// Cliente da API pública e gratuita da tabela FIPE (parallelum/fipe.online).
// Nenhum dado pessoal passa por aqui — só marca, modelo e ano do veículo,
// que não são dados pessoais sob a LGPD.
//
// Token opcional: sem token o limite é de 500 consultas/dia; com um token
// gratuito (cadastro em https://fipe.online) o limite sobe para 1000/dia.
// Definido via variável de ambiente pública do Expo (não é segredo).
const BASE_URL = 'https://fipe.parallelum.com.br/api/v2';
const SUBSCRIPTION_TOKEN = process.env.EXPO_PUBLIC_FIPE_TOKEN;

class FipeApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FipeApiError';
  }
}

async function fipeFetch<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (SUBSCRIPTION_TOKEN) {
    headers['X-Subscription-Token'] = SUBSCRIPTION_TOKEN;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { headers });
  } catch {
    throw new FipeApiError('Não foi possível conectar à tabela FIPE. Verifique sua internet.');
  }

  if (response.status === 404) {
    throw new FipeApiError('Nenhum resultado encontrado para essa combinação.');
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

export async function fetchYears(
  kind: VehicleKind,
  brandCode: string,
  modelCode: string
): Promise<FipeYear[]> {
  return fipeFetch<FipeYear[]>(`/${kind}/brands/${brandCode}/models/${modelCode}/years`);
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

  return {
    brand: raw.brand,
    model: raw.model,
    modelYear: raw.modelYear,
    fuel: raw.fuel,
    codeFipe: raw.codeFipe,
    priceLabel: raw.price,
    priceValue: parsePriceLabel(raw.price),
    referenceMonth: raw.referenceMonth,
  };
}

export { FipeApiError };
