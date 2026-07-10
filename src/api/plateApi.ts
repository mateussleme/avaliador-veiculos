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

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/plate-lookup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ placa: parsed.normalized }),
    });
  } catch {
    throw new PlateApiError('Não foi possível conectar ao servidor. Verifique sua internet.');
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) throw new PlateApiError('Sessão expirada. Faça login novamente.');
  if (response.status === 402) throw new PlateApiError('Sem créditos no serviço de consulta. Entre em contato com o suporte.');
  if (response.status === 429) throw new PlateApiError(data?.error ?? 'Limite de consultas atingido. Aguarde e tente novamente.');
  if (response.status === 404) throw new PlateApiError('Veículo não encontrado para essa placa.');
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
