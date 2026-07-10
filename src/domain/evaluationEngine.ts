import { AdjustmentLine, EvaluationInput, EvaluationResult, VehicleKind } from './types';
import { DEFAULT_DISCOUNT_PERCENT, DiscountLookupResult, lookupDiscount } from './discountTable';

// ---- Constantes fixas do motor de avaliação ----

// Revisão na concessionária
const DEALER_SERVICE_YES_PERCENT = 1;    // +1% se fez revisão na CSS
const DEALER_SERVICE_NO_PERCENT  = -4;   // -4% se NÃO fez revisão na CSS

// Repintura percentual (desvalorização por ter repintado)
const REPAINT_PERCENT = -2.5;

// Custo de preparação (valores em R$)
const REPAINT_PIECE_COST  = 800;   // R$800 por peça para pintar
const REPAINT_WHEEL_COST  = 300;   // R$300 por roda para pintar

// Repasse: percentual do valor final de oferta
const REPASSE_PERCENT = 0.92;

// Bônus por pneu novo (carro: 4 × 0.5% = +2% max; moto: 2 × 1.0% = +2% max)
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

// Faixa dos ajustes variáveis — usada pelo medidor visual
export const ADJUSTMENT_RANGE = {
  min: MILEAGE_ABOVE_MAX_PERCENT + REPAINT_PERCENT + DEALER_SERVICE_NO_PERCENT, // -13.5%
  max: MILEAGE_PER_YEAR_TIERS[0].percent
    + PER_TIRE_BONUS_PERCENT.cars * MAX_NEW_TIRES.cars
    + DEALER_SERVICE_YES_PERCENT,  // +9%
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// Referência de km esperados para veículos do ano atual
const CURRENT_YEAR_KM_PER_YEAR = 5000; // base anual para cálculo proporcional ao mês

function vehicleAgeYears(modelYear: number): number {
  const now = new Date();
  const currentYear = now.getFullYear();

  if (modelYear >= currentYear) {
    // Veículo do ano atual: usa os meses decorridos como fração do ano.
    // getMonth() retorna 0-11, então +1 para o mês real (julho = 7).
    const monthsElapsed = now.getMonth() + 1;
    // Fração do ano decorrida, com mínimo de 1 mês para evitar divisão por zero.
    return Math.max(monthsElapsed, 1) / 12;
  }

  return Math.max(currentYear - modelYear, MIN_AGE_YEARS);
}

// Calcula a km esperada para o período de uso do veículo.
// Para ano atual: 5.000 km ÷ 12 × meses decorridos.
// Para anos anteriores: 12.000 km × anos de uso.
function expectedKmForAge(modelYear: number): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  if (modelYear >= currentYear) {
    const monthsElapsed = Math.max(now.getMonth() + 1, 1);
    return Math.round((CURRENT_YEAR_KM_PER_YEAR / 12) * monthsElapsed);
  }
  return Math.max(currentYear - modelYear, MIN_AGE_YEARS) * 12000;
}

function mileageTierPercent(kmPerYear: number): number {
  return MILEAGE_PER_YEAR_TIERS.find((t) => kmPerYear <= t.upTo)?.percent
    ?? MILEAGE_ABOVE_MAX_PERCENT;
}

export function previewMileageAdjustment(
  currentMileageKm: number,
  modelYear: number
): { kmPerYear: number; percent: number; expectedKm: number; isCurrentYear: boolean } {
  const age = vehicleAgeYears(modelYear);
  const kmPerYear = currentMileageKm / age;
  const expectedKm = expectedKmForAge(modelYear);
  const isCurrentYear = modelYear >= new Date().getFullYear();
  return { kmPerYear, percent: mileageTierPercent(kmPerYear), expectedKm, isCurrentYear };
}

function buildMileageLine(currentMileageKm: number, modelYear: number): AdjustmentLine {
  const now = new Date();
  const currentYear = now.getFullYear();
  const isCurrentYear = modelYear >= currentYear;

  const age = vehicleAgeYears(modelYear);
  const kmPerYear = currentMileageKm / age;
  const percent = mileageTierPercent(kmPerYear);
  const expectedKm = expectedKmForAge(modelYear);

  let label: string;
  let detail: string;

  if (isCurrentYear) {
    const month = now.getMonth() + 1;
    label = `${currentMileageKm.toLocaleString('pt-BR')} km em ${month} meses`;
    detail =
      `Referência para ${month} meses: ${expectedKm.toLocaleString('pt-BR')} km ` +
      `(5.000 km ÷ 12 × ${month}). ` +
      `Equivalente a ${Math.round(kmPerYear).toLocaleString('pt-BR')} km/ano.`;
  } else {
    const ageYearsDisplay = Math.round(age);
    label = `${Math.round(kmPerYear).toLocaleString('pt-BR')} km/ano rodados`;
    detail =
      `${currentMileageKm.toLocaleString('pt-BR')} km no total, ` +
      `considerando ${ageYearsDisplay} ano(s) de uso. ` +
      `Referência: ${expectedKm.toLocaleString('pt-BR')} km esperados.`;
  }

  return {
    label,
    detail,
    percent,
    severity: percent >= 1 ? 'good' : percent <= -4 ? 'danger' : 'caution',
  };
}

function buildTireLine(kind: VehicleKind, hasTires: boolean, newTireCount: number): AdjustmentLine {
  if (!hasTires) {
    return {
      label: 'Sem pneus novos',
      detail: 'Nenhum bônus aplicado.',
      percent: 0,
      severity: 'neutral',
    };
  }
  const max = MAX_NEW_TIRES[kind];
  const count = clamp(Math.round(newTireCount), 0, max);
  const percent = PER_TIRE_BONUS_PERCENT[kind] * count;
  return {
    label: count > 0 ? `${count} de ${max} pneus novos` : 'Pneus novos — quantidade não informada',
    detail: count > 0
      ? 'Reduz um gasto imediato que o próximo comprador teria com troca de pneus.'
      : 'Informe a quantidade para aplicar o bônus.',
    percent,
    severity: count > 0 ? 'good' : 'neutral',
  };
}

function buildDealerServiceLine(hadDealerService: boolean): AdjustmentLine {
  return {
    label: hadDealerService
      ? 'Revisão feita na concessionária'
      : 'Sem revisão na concessionária',
    detail: hadDealerService
      ? 'Histórico de manutenção preventiva em rede autorizada.'
      : 'Veículo sem revisão registrada em concessionária — desconto aplicado.',
    percent: hadDealerService ? DEALER_SERVICE_YES_PERCENT : DEALER_SERVICE_NO_PERCENT,
    severity: hadDealerService ? 'good' : 'danger',
  };
}

function buildRepaintLine(hasRepaint: boolean): AdjustmentLine {
  return {
    label: hasRepaint ? 'Repintura identificada' : 'Sem repintura identificada',
    detail: hasRepaint
      ? 'Desvalorização pela repintura — custo de preparação calculado separadamente abaixo.'
      : 'Nenhum desconto aplicado por repintura.',
    percent: hasRepaint ? REPAINT_PERCENT : 0,
    severity: hasRepaint ? 'danger' : 'neutral',
  };
}

function buildPreparationCostLine(
  hasRepaint: boolean,
  pieces: number,
  wheels: number
): AdjustmentLine | null {
  if (!hasRepaint || (pieces <= 0 && wheels <= 0)) return null;

  const pieceCost = Math.max(0, Math.round(pieces)) * REPAINT_PIECE_COST;
  const wheelCost = Math.max(0, Math.round(wheels)) * REPAINT_WHEEL_COST;
  const total = pieceCost + wheelCost;

  const parts: string[] = [];
  if (pieces > 0) parts.push(`${pieces} peça(s) × R$${REPAINT_PIECE_COST} = R$${pieceCost.toLocaleString('pt-BR')}`);
  if (wheels > 0) parts.push(`${wheels} roda(s) × R$${REPAINT_WHEEL_COST} = R$${wheelCost.toLocaleString('pt-BR')}`);

  return {
    label: `Custo de preparação — R$ ${total.toLocaleString('pt-BR')}`,
    detail: parts.join(' + '),
    percent: 0,
    amountDeduction: total,
    severity: 'danger',
  };
}

export function evaluateVehicle(input: EvaluationInput): EvaluationResult {
  // 1. Desconto base por modelo (tabela ou padrão)
  const discountLookup: DiscountLookupResult = lookupDiscount(
    input.vehicle.brand,
    input.vehicle.model
  );
  const standardValue = input.vehicle.priceValue * (1 - discountLookup.discount);

  // 2. Ajustes percentuais
  const percentLines: AdjustmentLine[] = [
    buildMileageLine(input.currentMileageKm, input.vehicle.modelYear),
    buildTireLine(input.kind, input.hasTires, input.newTireCount),
    buildDealerServiceLine(input.hadDealerService),
    buildRepaintLine(input.hasRepaint),
  ];

  const adjustmentPercent = percentLines.reduce((sum, l) => sum + l.percent, 0);
  const estimatedValue = standardValue * (1 + adjustmentPercent / 100);

  // 3. Dedução de custo de preparação (repintura em R$)
  const prepLine = buildPreparationCostLine(
    input.hasRepaint,
    input.repaintPiecesCount,
    input.repaintWheelsCount
  );
  const preparationCost = prepLine?.amountDeduction ?? 0;

  const lines: AdjustmentLine[] = prepLine
    ? [...percentLines, prepLine]
    : percentLines;

  // 4. Valor final e repasse
  const finalOfferValue = Math.max(0, estimatedValue - preparationCost);
  const repasseValue = finalOfferValue * REPASSE_PERCENT;

  let positionLabel: EvaluationResult['positionLabel'] = 'No padrão';
  if (adjustmentPercent <= -0.4) positionLabel = 'Abaixo do padrão';
  if (adjustmentPercent >= 0.4) positionLabel = 'Acima do padrão';

  return {
    baseValue: input.vehicle.priceValue,
    baseDiscountPercent: discountLookup.discountPercent,
    discountSource: discountLookup.source,
    discountMatchedModel: discountLookup.matchedModel,
    standardValue,
    adjustmentPercent,
    estimatedValue,
    preparationCost,
    finalOfferValue,
    repasseValue,
    lines,
    positionLabel,
    mileageKm: input.currentMileageKm,
  };
}
