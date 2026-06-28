import { AdjustmentLine, EvaluationInput, EvaluationResult, VehicleKind } from './types';
import { DEFAULT_DISCOUNT_PERCENT, DiscountLookupResult, lookupDiscount } from './discountTable';

// ---- Ajustes adicionais fixos (aplicados EM CIMA do desconto base da tabela) ----

const REPAINT_PERCENT = -2.5;         // Repintura identificada
const DEALER_SERVICE_PERCENT = 3;     // Revisão na concessionária

// Bônus por pneu novo (carro: até 4 × 0.5% = +2%; moto: até 2 × 1.0% = +2%)
const PER_TIRE_BONUS_PERCENT: Record<VehicleKind, number> = {
  cars: 0.5,
  motorcycles: 1.0,
};
const MAX_NEW_TIRES: Record<VehicleKind, number> = {
  cars: 4,
  motorcycles: 2,
};

// Faixas de km/ano → ajuste percentual
const MILEAGE_PER_YEAR_TIERS: { upTo: number; percent: number }[] = [
  { upTo: 3000,  percent:  6 },
  { upTo: 6000,  percent:  4 },
  { upTo: 9000,  percent:  2 },
  { upTo: 14000, percent:  1 },
  { upTo: 16000, percent: -1 },
  { upTo: 20000, percent: -2 },
  { upTo: 25000, percent: -4 },
  { upTo: 30000, percent: -6 },
];
const MILEAGE_ABOVE_MAX_PERCENT = -7;

const MIN_AGE_YEARS = 1;

// Faixa máxima/mínima dos ajustes variáveis — usada pelo medidor visual
export const ADJUSTMENT_RANGE = {
  min: MILEAGE_ABOVE_MAX_PERCENT + REPAINT_PERCENT,                             // -9.5%
  max: MILEAGE_PER_YEAR_TIERS[0].percent
    + PER_TIRE_BONUS_PERCENT.cars * MAX_NEW_TIRES.cars
    + DEALER_SERVICE_PERCENT,                                                    // +11%
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function vehicleAgeYears(modelYear: number): number {
  return Math.max(new Date().getFullYear() - modelYear, MIN_AGE_YEARS);
}

function mileageTierPercent(kmPerYear: number): number {
  return MILEAGE_PER_YEAR_TIERS.find((t) => kmPerYear <= t.upTo)?.percent
    ?? MILEAGE_ABOVE_MAX_PERCENT;
}

// Exportado para o preview em tempo real no formulário
export function previewMileageAdjustment(
  currentMileageKm: number,
  modelYear: number
): { kmPerYear: number; percent: number } {
  const age = vehicleAgeYears(modelYear);
  const kmPerYear = currentMileageKm / age;
  return { kmPerYear, percent: mileageTierPercent(kmPerYear) };
}

function buildMileageLine(currentMileageKm: number, modelYear: number): AdjustmentLine {
  const age = vehicleAgeYears(modelYear);
  const kmPerYear = currentMileageKm / age;
  const percent = mileageTierPercent(kmPerYear);
  return {
    label: `${Math.round(kmPerYear).toLocaleString('pt-BR')} km/ano rodados`,
    detail: `${currentMileageKm.toLocaleString('pt-BR')} km no total, considerando ${age} ano(s) de uso.`,
    percent,
    severity: percent >= 1 ? 'good' : percent <= -4 ? 'danger' : 'caution',
  };
}

function buildTireLine(kind: VehicleKind, newTireCount: number): AdjustmentLine {
  const max = MAX_NEW_TIRES[kind];
  const count = clamp(Math.round(newTireCount), 0, max);
  const percent = PER_TIRE_BONUS_PERCENT[kind] * count;
  return {
    label: count > 0 ? `${count} de ${max} pneus novos` : 'Nenhum pneu novo',
    detail: count > 0
      ? 'Reduz um gasto imediato que o próximo comprador teria com troca de pneus.'
      : 'Nenhum bônus aplicado por pneus novos.',
    percent,
    severity: count > 0 ? 'good' : 'neutral',
  };
}

function buildDealerServiceLine(hadDealerService: boolean): AdjustmentLine {
  return {
    label: hadDealerService ? 'Revisão feita na concessionária' : 'Sem revisão na concessionária',
    detail: hadDealerService
      ? 'Histórico de manutenção preventiva em rede autorizada.'
      : 'Nenhum bônus aplicado por falta de revisão registrada em concessionária.',
    percent: hadDealerService ? DEALER_SERVICE_PERCENT : 0,
    severity: hadDealerService ? 'good' : 'neutral',
  };
}

function buildRepaintLine(hasRepaint: boolean): AdjustmentLine {
  return {
    label: hasRepaint ? 'Repintura identificada' : 'Sem repintura identificada',
    detail: hasRepaint
      ? 'Indício de reparo na pintura — desconto fixo aplicado independente da extensão.'
      : 'Nenhum desconto aplicado por repintura.',
    percent: hasRepaint ? REPAINT_PERCENT : 0,
    severity: hasRepaint ? 'danger' : 'neutral',
  };
}

export function evaluateVehicle(input: EvaluationInput): EvaluationResult {
  // 1. Busca o desconto base na tabela por marca+modelo
  const discountLookup: DiscountLookupResult = lookupDiscount(
    input.vehicle.brand,
    input.vehicle.model
  );
  const baseDiscountPercent = discountLookup.discountPercent; // ex: 20

  // 2. Valor padrão = FIPE - desconto base (específico por modelo)
  const standardValue = input.vehicle.priceValue * (1 - discountLookup.discount);

  // 3. Ajustes adicionais sobre o valor padrão
  const lines: AdjustmentLine[] = [
    buildMileageLine(input.currentMileageKm, input.vehicle.modelYear),
    buildTireLine(input.kind, input.newTireCount),
    buildDealerServiceLine(input.hadDealerService),
    buildRepaintLine(input.hasRepaint),
  ];

  const adjustmentPercent = lines.reduce((sum, l) => sum + l.percent, 0);
  const estimatedValue = standardValue * (1 + adjustmentPercent / 100);

  let positionLabel: EvaluationResult['positionLabel'] = 'No padrão';
  if (adjustmentPercent <= -0.4) positionLabel = 'Abaixo do padrão';
  if (adjustmentPercent >= 0.4) positionLabel = 'Acima do padrão';

  return {
    baseValue: input.vehicle.priceValue,
    baseDiscountPercent,
    discountSource: discountLookup.source,
    discountMatchedModel: discountLookup.matchedModel,
    standardValue,
    adjustmentPercent,
    estimatedValue,
    lines,
    positionLabel,
    mileageKm: input.currentMileageKm,
  };
}
