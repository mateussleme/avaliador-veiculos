// Tipos centrais do domínio do app.
// Mantidos em um único lugar para que motor de avaliação, API e telas
// nunca fiquem fora de sincronia sobre o formato dos dados.

export type VehicleKind = 'cars' | 'motorcycles';

export interface FipeBrand {
  code: string;
  name: string;
}

export interface FipeModel {
  code: string;
  name: string;
}

export interface FipeYear {
  code: string; // ex: "2014-3"
  name: string; // ex: "2014 Diesel"
}

export interface FipeVehicleInfo {
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  codeFipe: string;
  priceLabel: string; // "R$ 45.000,00" — como a FIPE formata
  priceValue: number; // 45000 — convertido para number
  referenceMonth: string;
  // A FIPE usa o ano "32000" como convenção interna para veículo 0km (sem
  // ano de modelo definido ainda). Quando isso acontece, normalizamos
  // modelYear para o ano atual (mantém os cálculos de depreciação corretos)
  // e marcamos isZeroKm para a tela exibir "0 km" em vez do número cru.
  isZeroKm?: boolean;
}

// ---- Métricas de avaliação informadas pelo usuário ----

export interface EvaluationInput {
  vehicle: FipeVehicleInfo;
  kind: VehicleKind;
  currentMileageKm: number;
  hasTires: boolean;               // veículo possui pneus novos?
  newTireCount: number;            // quantos pneus novos (0-4 carro, 0-2 moto)
  hadDealerService: boolean;       // revisão feita na concessionária
  hasRepaint: boolean;             // há repintura identificada
  repaintPiecesCount: number;      // número de peças para pintar (R$800 cada)
  repaintWheelsCount: number;      // número de rodas para pintar (R$300 cada)
}

export type AdjustmentSeverity = 'good' | 'neutral' | 'caution' | 'danger';

export interface AdjustmentLine {
  label: string;
  detail: string;
  percent: number; // pode ser positivo ou negativo
  amountDeduction?: number; // dedução em R$ (para custos concretos como repintura)
  severity: AdjustmentSeverity;
}

export interface EvaluationResult {
  baseValue: number;              // preço cheio da tabela FIPE
  baseDiscountPercent: number;    // desconto base em % (ex: 20), vindo da tabela ou padrão
  discountSource: 'table' | 'default';
  discountMatchedModel?: string;
  standardValue: number;          // FIPE - desconto base
  adjustmentPercent: number;      // soma dos ajustes percentuais (km + pneus + revisão + repintura %)
  estimatedValue: number;         // standardValue × (1 + adjustmentPercent/100)
  preparationCost: number;        // custo de preparação em R$ (peças + rodas para pintar)
  finalOfferValue: number;        // estimatedValue - preparationCost = valor da oferta de compra
  repasseValue: number;           // finalOfferValue × 0.92 = valor para repasse
  lines: AdjustmentLine[];
  positionLabel: 'Abaixo do padrão' | 'No padrão' | 'Acima do padrão';
  mileageKm: number;
}
