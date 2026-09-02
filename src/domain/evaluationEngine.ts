import { AdjustmentLine, EvaluationInput, EvaluationResult, FipeVehicleInfo, VehicleKind } from './types';
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

// Unidade de arredondamento de dinheiro. Todos os valores em reais sao
// arredondados para o multiplo mais proximo desta unidade. Trocar aqui muda o
// app inteiro (ex: 500 faria 13.478 -> 13.500 em vez de 13.000).
export const MONEY_ROUND_UNIT = 1000;

// Arredondamento "metade para cima" (half up) ao MONEY_ROUND_UNIT. Em empate
// vai para longe do zero. Ex (unit 1000): 13.478 -> 13.000, 13.500 -> 14.000,
// -13.500 -> -14.000. Mantem tela, banco e calculos com o mesmo numero redondo.
export function roundMoney(value: number): number {
  const u = MONEY_ROUND_UNIT;
  return Math.sign(value) * Math.round(Math.abs(value) / u) * u;
}

// ---- Sugestao de VENDA ----
// A venda e o custo dividido por um fator (markup embutido): 0,85 para carro de
// showroom (~17,6% de margem bruta) e 0,95 para repasse (~5%).
// So o REPASSE tem limite de margem; o SHOWROOM usa a divisao direta, sem piso
// nem teto. O piso do repasse depende do tipo: R$2k carro, R$1k moto.
export const SALE_SHOWROOM_DIVISOR = 0.85;
export const SALE_REPASSE_DIVISOR = 0.95;
export const SALE_MARGIN_MIN_CAR = 2000;   // piso de lucro do repasse - carro (R$)
export const SALE_MARGIN_MIN_MOTO = 1000;  // piso de lucro do repasse - moto (R$)
export const SALE_MARGIN_MAX = 25000;      // teto de lucro do repasse (R$)

export interface SaleSuggestion {
  sale: number;    // valor de venda sugerido (R$)
  margin: number;  // margem embutida (R$) = sale - custo, ja arredondada
}

export interface SaleSuggestions {
  showroom: SaleSuggestion;
  repasse: SaleSuggestion;
}

// Venda = custo + margem, onde margem = custo/divisor - custo. Se clamp for
// passado (repasse), a margem e limitada entre clamp.min e clamp.max. A venda e
// arredondada (roundMoney) e a margem exibida = venda - custo, entao os dois
// batem. Retorna zeros para custo invalido (<= 0), evitando divisao por zero.
export function computeSaleSuggestion(
  cost: number,
  divisor: number,
  clamp?: { min: number; max: number }
): SaleSuggestion {
  if (!(cost > 0)) return { sale: 0, margin: 0 };
  const rawMargin = cost / divisor - cost;
  const margin = clamp ? Math.min(Math.max(rawMargin, clamp.min), clamp.max) : rawMargin;
  const sale = roundMoney(cost + margin);
  return { sale, margin: sale - cost };
}

// Sugestoes de venda: showroom (sobre a sugestao de compra, SEM limite) e
// repasse (sobre o valor de repasse, COM piso/teto). O piso do repasse varia
// por tipo de veiculo (moto tem piso menor).
export function saleSuggestions(
  finalOfferValue: number,
  repasseValue: number,
  kind: VehicleKind
): SaleSuggestions {
  const repasseMin = kind === 'motorcycles' ? SALE_MARGIN_MIN_MOTO : SALE_MARGIN_MIN_CAR;
  return {
    showroom: computeSaleSuggestion(finalOfferValue, SALE_SHOWROOM_DIVISOR),
    repasse:  computeSaleSuggestion(repasseValue, SALE_REPASSE_DIVISOR, { min: repasseMin, max: SALE_MARGIN_MAX }),
  };
}

// Penalidade por pneu que PRECISA TROCAR (carro: 4 × 0.5% = -2% max; moto: 2 × 1.0% = -2% max).
// Cada pneu a trocar desconta do valor (gasto imediato com a troca).
const PER_TIRE_PENALTY_PERCENT: Record<VehicleKind, number> = {
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

// Faixa dos ajustes variáveis — usada pelo medidor visual.
// Pior caso: km alto, repintura, sem revisão e TODOS os pneus para trocar.
// Melhor caso: km baixo + revisão (pneus agora só descontam, nunca somam).
export const ADJUSTMENT_RANGE = {
  min: MILEAGE_ABOVE_MAX_PERCENT + REPAINT_PERCENT + DEALER_SERVICE_NO_PERCENT
    - PER_TIRE_PENALTY_PERCENT.cars * MAX_NEW_TIRES.cars, // -15.5%
  max: MILEAGE_PER_YEAR_TIERS[0].percent + DEALER_SERVICE_YES_PERCENT, // +5%
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// Referência de km esperados para veículos do ano atual
const CURRENT_YEAR_KM_PER_YEAR = 5000; // base anual para cálculo proporcional ao mês

// Média de km/ano padrão (usada quando o modelo não tem "KM Média Ano" na
// tabela). Todas as faixas de km e a referência exibida são calibradas para
// esse valor; para modelos com média diferente, tudo é escalonado pelo fator
// (média do modelo ÷ 12.000), deixando o ajuste relativo ao modelo sem mudar
// o comportamento de quem usa o padrão.
const DEFAULT_KM_PER_YEAR = 12000;

function kmFactor(mediaKmPerYear: number): number {
  return mediaKmPerYear / DEFAULT_KM_PER_YEAR;
}

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

// Calcula a km esperada para o período de uso do veículo, já ajustada pela
// média do modelo (fator = média ÷ 12.000; padrão = 1, sem mudança).
// Para ano atual: (5.000 km ÷ 12 × meses) × fator.
// Para anos anteriores: 12.000 km × anos × fator = média × anos.
function expectedKmForAge(modelYear: number, mediaKmPerYear: number): number {
  const factor = kmFactor(mediaKmPerYear);
  const now = new Date();
  const currentYear = now.getFullYear();
  if (modelYear >= currentYear) {
    const monthsElapsed = Math.max(now.getMonth() + 1, 1);
    return Math.round((CURRENT_YEAR_KM_PER_YEAR / 12) * monthsElapsed * factor);
  }
  return Math.round(Math.max(currentYear - modelYear, MIN_AGE_YEARS) * DEFAULT_KM_PER_YEAR * factor);
}

// As faixas de km/ano são escalonadas pela média do modelo: os limites são
// multiplicados por (média ÷ 12.000). Assim o ajuste vira relativo — quem
// tem média 8.000 recebe as mesmas proporções que um modelo de 12.000 teria,
// só que em torno da sua própria média.
function mileageTierPercent(kmPerYear: number, mediaKmPerYear: number): number {
  const factor = kmFactor(mediaKmPerYear);
  return MILEAGE_PER_YEAR_TIERS.find((t) => kmPerYear <= t.upTo * factor)?.percent
    ?? MILEAGE_ABOVE_MAX_PERCENT;
}

export function previewMileageAdjustment(
  currentMileageKm: number,
  modelYear: number,
  mediaKmPerYear: number = DEFAULT_KM_PER_YEAR
): { kmPerYear: number; percent: number; expectedKm: number; isCurrentYear: boolean } {
  const age = vehicleAgeYears(modelYear);
  const kmPerYear = currentMileageKm / age;
  const expectedKm = expectedKmForAge(modelYear, mediaKmPerYear);
  const isCurrentYear = modelYear >= new Date().getFullYear();
  return { kmPerYear, percent: mileageTierPercent(kmPerYear, mediaKmPerYear), expectedKm, isCurrentYear };
}

function buildMileageLine(
  currentMileageKm: number,
  modelYear: number,
  mediaKmPerYear: number
): AdjustmentLine {
  const now = new Date();
  const currentYear = now.getFullYear();
  const isCurrentYear = modelYear >= currentYear;

  const age = vehicleAgeYears(modelYear);
  const kmPerYear = currentMileageKm / age;
  const percent = mileageTierPercent(kmPerYear, mediaKmPerYear);
  const expectedKm = expectedKmForAge(modelYear, mediaKmPerYear);

  let label: string;
  let detail: string;

  if (isCurrentYear) {
    const month = now.getMonth() + 1;
    label = `${currentMileageKm.toLocaleString('pt-BR')} km em ${month} meses`;
    detail =
      `Referência para ${month} meses: ${expectedKm.toLocaleString('pt-BR')} km. ` +
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
      label: 'Pneus não precisam trocar',
      detail: 'Nenhum desconto aplicado.',
      percent: 0,
      severity: 'neutral',
    };
  }
  const max = MAX_NEW_TIRES[kind];
  const count = clamp(Math.round(newTireCount), 0, max);
  const percent = -(PER_TIRE_PENALTY_PERCENT[kind] * count);
  return {
    label: count > 0 ? `${count} de ${max} pneus para trocar` : 'Troca de pneus — quantidade não informada',
    detail: count > 0
      ? 'Desconto pelo gasto imediato com a troca dos pneus.'
      : 'Informe a quantidade para aplicar o desconto.',
    percent,
    severity: count > 0 ? 'danger' : 'neutral',
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

// ---- Blindagem ----
//
// Diferente dos outros ajustes (percentuais sobre o valor FIPE), a
// blindagem soma ou subtrai um valor FIXO em R$, direto na oferta final.
// Um blindado novo agrega valor (a blindagem ainda está intacta); a manta
// balística começa a delaminar a partir de ~5 anos, e um blindado velho
// vale MENOS que o equivalente sem blindagem — por isso os valores das
// faixas de idade mais altas são negativos.
interface ArmorPriceBracket {
  upToPrice: number; // Infinity para "acima de X"
  amount: number;    // R$: positivo = soma na oferta, negativo = desconta
}
interface ArmorAgeTier {
  maxAge: number; // idade máxima (inclusive) da faixa, Infinity para "acima de X"
  brackets: ArmorPriceBracket[];
}

const ARMOR_TIERS: ArmorAgeTier[] = [
  { maxAge: 2, brackets: [
    { upToPrice: 200000, amount: 40000 },
    { upToPrice: 300000, amount: 50000 },
    { upToPrice: 400000, amount: 60000 },
    { upToPrice: Infinity, amount: 70000 },
  ]},
  { maxAge: 4, brackets: [
    { upToPrice: 200000, amount: 25000 },
    { upToPrice: 300000, amount: 35000 },
    { upToPrice: 400000, amount: 45000 },
    { upToPrice: Infinity, amount: 60000 },
  ]},
  { maxAge: 6, brackets: [
    { upToPrice: 200000, amount: 15000 },
    { upToPrice: 300000, amount: 25000 },
    { upToPrice: 400000, amount: 35000 },
    { upToPrice: Infinity, amount: 40000 },
  ]},
  { maxAge: 8, brackets: [
    { upToPrice: Infinity, amount: 0 }, // 7-8 anos: não soma nem desconta
  ]},
  { maxAge: Infinity, brackets: [
    { upToPrice: 100000, amount: -10000 },
    { upToPrice: 150000, amount: -15000 },
    { upToPrice: 200000, amount: -20000 },
    { upToPrice: 300000, amount: -25000 },
    { upToPrice: 400000, amount: -30000 },
    { upToPrice: Infinity, amount: -30000 },
  ]},
];

const DELAMINATION_PENALTY_PER_WINDOW = 6000; // R$ por vidro delaminado
export const MAX_DELAMINATED_WINDOWS = 7;

function armorAgeYears(modelYear: number): number {
  return Math.max(new Date().getFullYear() - modelYear, 0);
}

function armorTierAmount(ageYears: number, fipePrice: number): number {
  const tier = ARMOR_TIERS.find((t) => ageYears <= t.maxAge) ?? ARMOR_TIERS[ARMOR_TIERS.length - 1];
  const bracket = tier.brackets.find((b) => fipePrice <= b.upToPrice) ?? tier.brackets[tier.brackets.length - 1];
  return bracket.amount;
}

export interface ArmorPreview {
  ageYears: number;
  tierAmount: number;
  delaminationPenalty: number;
  total: number;
}

export function previewArmorAdjustment(
  modelYear: number,
  fipePrice: number,
  delaminatedWindowCount: number
): ArmorPreview {
  const ageYears = armorAgeYears(modelYear);
  const tierAmount = armorTierAmount(ageYears, fipePrice);
  const delaminationPenalty = clamp(Math.round(delaminatedWindowCount), 0, MAX_DELAMINATED_WINDOWS) * DELAMINATION_PENALTY_PER_WINDOW;
  return { ageYears, tierAmount, delaminationPenalty, total: tierAmount - delaminationPenalty };
}

function buildArmorLine(
  isArmored: boolean,
  modelYear: number,
  fipePrice: number,
  delaminatedWindowCount: number
): AdjustmentLine | null {
  if (!isArmored) return null;

  const { ageYears, tierAmount, delaminationPenalty, total } = previewArmorAdjustment(
    modelYear,
    fipePrice,
    delaminatedWindowCount
  );

  const parts: string[] = [
    `${ageYears} ano(s) de uso: ${tierAmount >= 0 ? '+' : ''}R$ ${tierAmount.toLocaleString('pt-BR')}`,
  ];
  if (delaminationPenalty > 0) {
    const windows = clamp(Math.round(delaminatedWindowCount), 0, MAX_DELAMINATED_WINDOWS);
    parts.push(`${windows} vidro(s) delaminado(s): -R$ ${delaminationPenalty.toLocaleString('pt-BR')}`);
  }

  return {
    label: `Blindagem — ${total >= 0 ? '+' : ''}R$ ${total.toLocaleString('pt-BR')}`,
    detail: parts.join(' · '),
    percent: 0,
    // amountDeduction negativo aqui = soma na oferta final; ver evaluateVehicle().
    amountDeduction: -total,
    severity: total > 0 ? 'good' : total < 0 ? 'danger' : 'neutral',
  };
}

export function evaluateVehicle(input: EvaluationInput): EvaluationResult {
  // 1. Desconto base por modelo (tabela ou padrão)
  const discountLookup: DiscountLookupResult = lookupDiscount(
    input.vehicle.brand,
    input.vehicle.model
  );
  const standardValue = input.vehicle.priceValue * (1 - discountLookup.discount);

  // Média de km/ano do modelo (da tabela) ou padrão de 12.000.
  const mediaKmPerYear = discountLookup.kmPerYear ?? DEFAULT_KM_PER_YEAR;

  // 2. Ajustes percentuais
  const percentLines: AdjustmentLine[] = [
    buildMileageLine(input.currentMileageKm, input.vehicle.modelYear, mediaKmPerYear),
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

  // 3b. Blindagem (soma ou desconta um valor fixo em R$, ver buildArmorLine)
  const armorLine = buildArmorLine(
    input.isArmored,
    input.vehicle.modelYear,
    input.vehicle.priceValue,
    input.delaminatedWindowCount
  );
  const armorAdjustmentValue = armorLine ? -(armorLine.amountDeduction ?? 0) : 0;

  // 3c. Gastos adicionais previstos (R$) informados pelo avaliador (descontam).
  const additionalCosts = Math.max(0, Math.round(input.additionalCosts ?? 0));
  const additionalCostsLine: AdjustmentLine | null = additionalCosts > 0
    ? {
        label: `Gastos adicionais — ${'R$ ' + additionalCosts.toLocaleString('pt-BR')}`,
        detail: 'Custo extra previsto pelo avaliador (peças, funilaria, documentação, etc.).',
        percent: 0,
        amountDeduction: additionalCosts,
        severity: 'danger',
      }
    : null;

  // 3d. Opcionais / valorizacao (R$) — SOMAM na oferta (a FIPE nao distingue).
  const optionalsValue = Math.max(0, Math.round(input.optionalsValue ?? 0));
  const optionalsLine: AdjustmentLine | null = optionalsValue > 0
    ? {
        label: `Opcionais / valorização — ${'R$ ' + optionalsValue.toLocaleString('pt-BR')}`,
        detail: 'Valor agregado por opcionais não previstos pela FIPE (teto solar, acabamento/pintura especial, etc.).',
        percent: 0,
        amountDeduction: -optionalsValue, // negativo = soma na oferta
        severity: 'good',
      }
    : null;

  const lines: AdjustmentLine[] = [
    ...percentLines,
    ...(armorLine ? [armorLine] : []),
    ...(prepLine ? [prepLine] : []),
    ...(additionalCostsLine ? [additionalCostsLine] : []),
    ...(optionalsLine ? [optionalsLine] : []),
  ];

  // 4. Valor final e repasse (arredondados; o repasse deriva do final ja inteiro)
  const finalOfferValue = roundMoney(Math.max(0, estimatedValue - preparationCost - additionalCosts + optionalsValue + armorAdjustmentValue));
  const repasseValue = roundMoney(finalOfferValue * REPASSE_PERCENT);

  let positionLabel: EvaluationResult['positionLabel'] = 'No padrão';
  if (adjustmentPercent <= -0.4) positionLabel = 'Abaixo do padrão';
  if (adjustmentPercent >= 0.4) positionLabel = 'Acima do padrão';

  return {
    baseValue: roundMoney(input.vehicle.priceValue),
    baseDiscountPercent: discountLookup.discountPercent,
    discountSource: discountLookup.source,
    discountMatchedModel: discountLookup.matchedModel,
    standardValue: roundMoney(standardValue),
    adjustmentPercent,
    estimatedValue: roundMoney(estimatedValue),
    // preparationCost e armorAdjustmentValue NAO sao arredondados ao milhar:
    // sao valores de regra (ex: R$800/peca, faixas de blindagem) que aparecem
    // na explicacao "como chegamos nesse valor" e ficariam incorretos.
    preparationCost,
    additionalCosts,
    optionalsValue,
    armorAdjustmentValue,
    finalOfferValue,
    repasseValue,
    lines,
    positionLabel,
    mileageKm: input.currentMileageKm,
  };
}

// ---- Recalculo ao TROCAR a versao FIPE de uma avaliacao ja salva ----
// So o veiculo muda (preco/nome), entao recalculamos o que depende dele:
// desconto (nome pode casar outra faixa), valor padrao, estimado e blindagem
// (que depende do preco). O ajuste % (km/pneus/revisao/repintura) e o custo de
// preparacao NAO mudam com a versao — vem salvos e sao reaproveitados. Assim
// nao precisamos das pecas/rodas de repintura (que nao ficam salvas).
export interface VersionRecompute {
  baseValue: number;
  baseDiscountPercent: number;
  discountSource: 'table' | 'default';
  discountMatchedModel?: string;
  standardValue: number;
  adjustmentPercent: number;
  estimatedValue: number;
  armorAdjustmentValue: number;
  finalOfferValue: number;
  repasseValue: number;
}

export function recomputeForNewVehicle(args: {
  vehicle: FipeVehicleInfo;
  adjustmentPercent: number;   // salvo — nao muda com a versao
  preparationCost: number;     // salvo — custo fisico, nao muda com a versao
  additionalCosts: number;     // salvo — gastos adicionais, nao mudam com a versao
  optionalsValue: number;      // salvo — opcionais/valorizacao, nao mudam com a versao
  isArmored: boolean;
  delaminatedWindowCount: number;
}): VersionRecompute {
  const { vehicle, adjustmentPercent, preparationCost, additionalCosts, optionalsValue, isArmored, delaminatedWindowCount } = args;

  const discount = lookupDiscount(vehicle.brand, vehicle.model);
  const standardValue = vehicle.priceValue * (1 - discount.discount);
  const estimatedValue = standardValue * (1 + adjustmentPercent / 100);

  // Blindagem recalculada com o NOVO preco/ano (as faixas dependem do preco).
  const armorLine = buildArmorLine(isArmored, vehicle.modelYear, vehicle.priceValue, delaminatedWindowCount);
  const armorAdjustmentValue = armorLine ? -(armorLine.amountDeduction ?? 0) : 0;

  const finalOfferValue = roundMoney(Math.max(0, estimatedValue - preparationCost - Math.max(0, additionalCosts) + Math.max(0, optionalsValue) + armorAdjustmentValue));
  const repasseValue = roundMoney(finalOfferValue * REPASSE_PERCENT);

  return {
    baseValue: roundMoney(vehicle.priceValue),
    baseDiscountPercent: discount.discountPercent,
    discountSource: discount.source,
    discountMatchedModel: discount.matchedModel,
    standardValue: roundMoney(standardValue),
    adjustmentPercent,
    estimatedValue: roundMoney(estimatedValue),
    armorAdjustmentValue,
    finalOfferValue,
    repasseValue,
  };
}
