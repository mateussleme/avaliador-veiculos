import { FipeVehicleInfo, VehicleKind } from '../domain/types';
import { ParsedPlateOrRenavam } from '../domain/plateValidation';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

// Uma versão FIPE possível para o veículo consultado.
export interface FipeVersionMatch {
  vehicle: FipeVehicleInfo;
  isPrincipal: boolean; // sugestão do sistema (melhor match automático)
}

export interface PlateLookupResult {
  kind: VehicleKind;
  vehicle: FipeVehicleInfo;          // versão principal (sugestão automática)
  allMatches: FipeVersionMatch[];    // todas as versões FIPE retornadas
}

export class PlateApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlateApiError';
  }
}

export async function fetchVehicleByPlateOrRenavam(
  parsed: ParsedPlateOrRenavam
): Promise<PlateLookupResult> {
  if (!BACKEND_URL) {
    throw new PlateApiError(
      'Backend não configurado. Adicione EXPO_PUBLIC_BACKEND_URL no arquivo .env do app (ver README).'
    );
  }

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/plate-lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placa: parsed.normalized }),
    });
  } catch {
    throw new PlateApiError('Não foi possível conectar ao servidor. Verifique sua internet.');
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 402) throw new PlateApiError('Sem créditos na APIBrasil. Adicione saldo em app.apibrasil.io.');
  if (response.status === 401) throw new PlateApiError('Token da APIBrasil inválido.');
  if (response.status === 404) throw new PlateApiError('Veículo não encontrado para essa placa.');
  if (!response.ok) throw new PlateApiError(data?.error ?? 'Erro ao consultar o veículo.');

  const vehicle = data?.vehicle;
  if (!vehicle?.brand || !vehicle?.model || !vehicle?.priceValue) {
    throw new PlateApiError('Dados incompletos. Esse veículo pode não ter valor FIPE disponível.');
  }

  const kind: VehicleKind = data.kind === 'motorcycles' ? 'motorcycles' : 'cars';

  // Constrói a lista de todos os matches (o backend agora devolve allMatches)
  const allMatches: FipeVersionMatch[] = Array.isArray(data.allMatches)
    ? data.allMatches.map((m: { vehicle: FipeVehicleInfo; isPrincipal: boolean }) => ({
        vehicle: m.vehicle as FipeVehicleInfo,
        isPrincipal: Boolean(m.isPrincipal),
      }))
    : [{ vehicle: vehicle as FipeVehicleInfo, isPrincipal: true }];

  return { kind, vehicle: vehicle as FipeVehicleInfo, allMatches };
}
