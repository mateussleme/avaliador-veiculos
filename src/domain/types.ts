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
}

// ---- Métricas de avaliação informadas pelo usuário ----

export interface EvaluationInput {
  vehicle: FipeVehicleInfo;
  kind: VehicleKind;
  currentMileageKm: number;
  newTireCount: number; // será arredondado e limitado pelo motor de avaliação (0-4 carro, 0-2 moto)
  hadDealerService: boolean; // revisão feita na concessionária
  hasRepaint: boolean; // há repintura identificada
}

export type AdjustmentSeverity = 'good' | 'neutral' | 'caution' | 'danger';

export interface AdjustmentLine {
  label: string;
  detail: string;
  percent: number; // pode ser positivo ou negativo
  severity: AdjustmentSeverity;
}

export interface EvaluationResult {
  baseValue: number;              // preço cheio da tabela FIPE
  baseDiscountPercent: number;    // desconto base em % (ex: 20), vindo da tabela ou padrão
  discountSource: 'table' | 'default'; // 'table' = achado na planilha, 'default' = padrão -20%
  discountMatchedModel?: string;  // modelo exato encontrado na tabela (para exibição)
  standardValue: number;          // FIPE - desconto base = valor de referência da avaliação
  adjustmentPercent: number;      // soma de km + pneus + revisão + repintura, sobre o padrão
  estimatedValue: number;         // standardValue ajustado pelo adjustmentPercent
  lines: AdjustmentLine[];
  positionLabel: 'Abaixo do padrão' | 'No padrão' | 'Acima do padrão';
  mileageKm: number;
}
