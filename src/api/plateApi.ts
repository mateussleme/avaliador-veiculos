import { FipeVehicleInfo, VehicleKind } from '../domain/types';
import { ParsedPlate } from '../domain/plateValidation';
import { supabase } from '../lib/supabase';
import { getCachedPlate, setCachedPlate } from '../lib/plateCache';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

export interface FipeVersionMatch {
  vehicle: FipeVehicleInfo;
  isPrincipal: boolean;
}

export interface PlateLookupResult {
  kind: VehicleKind;
  vehicle: FipeVehicleInfo;
  allMatches: FipeVersionMatch[];
  fromCache?: boolean; // true = resultado do cache, sem custo
}

export class PlateApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlateApiError';
  }
}

export async function fetchVehicleByPlate(
  parsed: ParsedPlate
): Promise<PlateLookupResult> {
  if (!BACKEND_URL) {
    throw new PlateApiError(
      'Backend não configurado. Adicione EXPO_PUBLIC_BACKEND_URL no .env do app.'
    );
  }

  // ---- Verifica cache antes de chamar a API paga ----
  const cached = getCachedPlate(parsed.normalized);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  // Timeout de rede do lado do app: se a conexao app<->backend cair, o fetch
  // pode ficar pendurado indefinidamente (o timeout do backend so cobre a
  // etapa backend<->APIBrasil). 25s da margem sobre o timeout de 20s do
  // backend, entao no caminho normal e o backend que responde primeiro; o
  // abort so dispara quando a rede realmente travou.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/plate-lookup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ placa: parsed.normalized }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new PlateApiError('A consulta demorou demais. Verifique sua internet e tente novamente.');
    }
    throw new PlateApiError('Não foi possível conectar ao servidor. Verifique sua internet.');
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) throw new PlateApiError('Sessão expirada. Faça login novamente.');
  if (response.status === 402) throw new PlateApiError('Sem créditos no serviço de consulta. Entre em contato com o suporte.');
  if (response.status === 429) throw new PlateApiError(data?.error ?? 'Limite de consultas atingido. Aguarde e tente novamente.');
  if (response.status === 404) throw new PlateApiError('Veículo não encontrado para essa placa.');
  if (response.status === 502 || response.status === 503 || response.status === 504) {
  throw new PlateApiError('Consulta por placa temporariamente indisponível (serviço externo fora do ar). Tente buscar por marca, modelo e ano.');
  }
  if (!response.ok)            throw new PlateApiError(data?.error ?? 'Erro ao consultar o veículo.');

  const vehicle = data?.vehicle;
  if (!vehicle?.brand || !vehicle?.model || !vehicle?.priceValue) {
    throw new PlateApiError('Dados incompletos. Esse veículo pode não ter valor FIPE disponível.');
  }

  const kind: VehicleKind = data.kind === 'motorcycles' ? 'motorcycles' : 'cars';

  const allMatches: FipeVersionMatch[] = Array.isArray(data.allMatches)
    ? data.allMatches.map((m: { vehicle: FipeVehicleInfo; isPrincipal: boolean }) => ({
        vehicle: m.vehicle as FipeVehicleInfo,
        isPrincipal: Boolean(m.isPrincipal),
      }))
    : [{ vehicle: vehicle as FipeVehicleInfo, isPrincipal: true }];

  const result: PlateLookupResult = { kind, vehicle: vehicle as FipeVehicleInfo, allMatches };

  // Salva no cache para consultas futuras da mesma placa nesta sessão
  setCachedPlate(parsed.normalized, result);

  return result;
}
