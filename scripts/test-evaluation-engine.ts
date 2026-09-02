/**
 * Testes do motor de avaliação (regra de preço).
 *
 * Rode com:  npx tsx scripts/test-evaluation-engine.ts
 * Sai com código 1 se algum caso falhar (serve para CI).
 *
 * Por que existe: a regra de preço é o coração do produto. Qualquer mexida em
 * faixas de km, blindagem, custo de preparação ou na tabela de descontos pode
 * mudar valores silenciosamente. Estes casos travam os números esperados.
 *
 * Os valores esperados foram calculados à mão a partir das regras:
 *   standard  = FIPE × (1 - desconto)
 *   estimated = standard × (1 + ajuste%)
 *   final     = arredonda(estimated - preparação + blindagem)   (mínimo 0)
 *   repasse   = arredonda(final × 0,92)
 * Arredondamento: ao milhar mais proximo (roundMoney), half up. Por isso o
 * repasse usa o final JA arredondado.
 */
import { evaluateVehicle } from '../src/domain/evaluationEngine';
import { EvaluationInput, FipeVehicleInfo, VehicleKind } from '../src/domain/types';

const CURRENT_YEAR = new Date().getFullYear();

function vehicle(brand: string, model: string, price: number, ageYears: number): FipeVehicleInfo {
  return {
    brand,
    model,
    modelYear: CURRENT_YEAR - ageYears,
    fuel: 'Gasolina',
    codeFipe: '000000-0',
    priceLabel: `R$ ${price}`,
    priceValue: price,
    referenceMonth: 'janeiro de 2026',
  };
}

interface Opts {
  kind?: VehicleKind;
  km: number;
  tires?: number;          // pneus novos
  dealer?: boolean;        // revisão na concessionária
  repaintPieces?: number;
  repaintWheels?: number;
  armored?: boolean;
  delaminated?: number;
  additionalCosts?: number;
  optionalsValue?: number;
}

function input(v: FipeVehicleInfo, o: Opts): EvaluationInput {
  const repaint = (o.repaintPieces ?? 0) > 0 || (o.repaintWheels ?? 0) > 0;
  return {
    vehicle: v,
    kind: o.kind ?? 'cars',
    currentMileageKm: o.km,
    hasTires: (o.tires ?? 0) > 0,
    newTireCount: o.tires ?? 0,
    hadDealerService: o.dealer ?? false,
    hasRepaint: repaint,
    repaintPiecesCount: o.repaintPieces ?? 0,
    repaintWheelsCount: o.repaintWheels ?? 0,
    isArmored: o.armored ?? false,
    isArmored3A: false,
    hasDelamination: (o.delaminated ?? 0) > 0,
    delaminatedWindowCount: o.delaminated ?? 0,
    additionalCosts: o.additionalCosts ?? 0,
    optionalsValue: o.optionalsValue ?? 0,
  };
}

// ---- Casos: [descrição, entrada, esperado] ----
interface Expected {
  adjustmentPercent: number;
  standardValue: number;
  finalOfferValue: number;
  repasseValue: number;
  baseDiscountPercent?: number;
}

const cases: [string, EvaluationInput, Expected][] = [
  [
    'Base: sem extras, sem revisão (km na média, -4% revisão, +1% km)',
    // FIPE 100k, 2 anos, 24.000 km => 12.000 km/ano => +1% | revisão não => -4%
    input(vehicle('MarcaTeste', 'ModeloTeste', 100000, 2), { km: 24000 }),
    { adjustmentPercent: -3, standardValue: 78000, finalOfferValue: 76000, repasseValue: 70000, baseDiscountPercent: 22 },
  ],
  [
    'Mix: 4 pneus para trocar (-2%), revisão (+1%), km baixo (+4%)',
    // 12.000 km em 2 anos => 6.000 km/ano => +4% | 4 pneus para trocar => -2% | revisão => +1%
    input(vehicle('MarcaTeste', 'ModeloTeste', 100000, 2), { km: 12000, tires: 4, dealer: true }),
    { adjustmentPercent: 3, standardValue: 78000, finalOfferValue: 80000, repasseValue: 74000 },
  ],
  [
    'Repintura: -2,5% e custo de preparação (2 peças + 1 roda = R$1.900)',
    input(vehicle('MarcaTeste', 'ModeloTeste', 100000, 2), { km: 24000, dealer: true, repaintPieces: 2, repaintWheels: 1 }),
    { adjustmentPercent: -0.5, standardValue: 78000, finalOfferValue: 76000, repasseValue: 70000 },
  ],
  [
    'Blindado novo (1 ano, FIPE 150k): soma R$40.000 na oferta',
    input(vehicle('MarcaTeste', 'ModeloTeste', 150000, 1), { km: 12000, dealer: true, armored: true }),
    { adjustmentPercent: 2, standardValue: 117000, finalOfferValue: 159000, repasseValue: 146000 },
  ],
  [
    'Blindado velho (10 anos) com 2 vidros delaminados: -15.000 -12.000',
    input(vehicle('MarcaTeste', 'ModeloTeste', 150000, 10), { km: 120000, armored: true, delaminated: 2 }),
    { adjustmentPercent: -3, standardValue: 117000, finalOfferValue: 86000, repasseValue: 79000 },
  ],
  [
    'Moto: 2 pneus para trocar valem -2% (máximo da categoria)',
    // km 12.000/ano => +1% | 2 pneus para trocar => -2% | revisão => +1% | total 0%
    input(vehicle('MarcaTeste', 'ModeloTeste', 100000, 2), { kind: 'motorcycles', km: 24000, tires: 2, dealer: true }),
    { adjustmentPercent: 0, standardValue: 78000, finalOfferValue: 78000, repasseValue: 72000 },
  ],
  [
    'Gastos adicionais de R$5.000 descontam da oferta (km+1, revisão+1)',
    // padrão 22% -> standard 78.000; ajuste +2% -> estimado 79.560; -5.000 -> 75.000
    input(vehicle('MarcaTeste', 'ModeloTeste', 100000, 2), { km: 24000, dealer: true, additionalCosts: 5000 }),
    { adjustmentPercent: 2, standardValue: 78000, finalOfferValue: 75000, repasseValue: 69000 },
  ],
  [
    'Opcionais de R$15.000 somam na oferta (km+1, revisão+1)',
    // padrão 22% -> standard 78.000; ajuste +2% -> estimado 79.560; +15.000 -> 94.560 -> 95.000
    input(vehicle('MarcaTeste', 'ModeloTeste', 100000, 2), { km: 24000, dealer: true, optionalsValue: 15000 }),
    { adjustmentPercent: 2, standardValue: 78000, finalOfferValue: 95000, repasseValue: 87000 },
  ],
  [
    'Oferta nunca fica negativa: preparação maior que o valor',
    input(vehicle('MarcaTeste', 'ModeloTeste', 10000, 2), { km: 24000, repaintPieces: 25 }),
    { adjustmentPercent: -5.5, standardValue: 8000, finalOfferValue: 0, repasseValue: 0 },
  ],
  [
    'Desconto da tabela: BMW X5 usa 25% (não o padrão de 20%)',
    input(vehicle('BMW', 'X5 xDrive30e', 100000, 2), { km: 24000, dealer: true }),
    { adjustmentPercent: 2, standardValue: 75000, finalOfferValue: 77000, repasseValue: 71000, baseDiscountPercent: 25 },
  ],
  [
    'KM relativa à média do modelo: Audi (8.000 km/ano) com 10.000 km/ano = -1%',
    // Mesmo km que daria +1% num modelo de média 12.000 vira -1% aqui.
    input(vehicle('Audi', 'Q8 Perf.Black 3.0 TFSI', 100000, 1), { km: 10000, dealer: true }),
    { adjustmentPercent: 0, standardValue: 72000, finalOfferValue: 72000, repasseValue: 66000, baseDiscountPercent: 28 },
  ],
];

// ---- Execução ----
const money = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const near = (a: number, b: number) => Math.abs(a - b) < 0.01; // tolerância de centavo

let failed = 0;

for (const [desc, inp, exp] of cases) {
  const r = evaluateVehicle(inp);
  const problems: string[] = [];

  if (!near(r.adjustmentPercent, exp.adjustmentPercent)) {
    problems.push(`ajuste ${r.adjustmentPercent}% (esperado ${exp.adjustmentPercent}%)`);
  }
  if (!near(r.standardValue, exp.standardValue)) {
    problems.push(`padrão ${money(r.standardValue)} (esperado ${money(exp.standardValue)})`);
  }
  if (!near(r.finalOfferValue, exp.finalOfferValue)) {
    problems.push(`oferta ${money(r.finalOfferValue)} (esperado ${money(exp.finalOfferValue)})`);
  }
  if (!near(r.repasseValue, exp.repasseValue)) {
    problems.push(`repasse ${money(r.repasseValue)} (esperado ${money(exp.repasseValue)})`);
  }
  if (exp.baseDiscountPercent !== undefined && r.baseDiscountPercent !== exp.baseDiscountPercent) {
    problems.push(`desconto ${r.baseDiscountPercent}% (esperado ${exp.baseDiscountPercent}%)`);
  }

  if (problems.length === 0) {
    console.log(`OK   ${desc}`);
  } else {
    failed++;
    console.log(`FALHA ${desc}`);
    for (const p of problems) console.log(`      - ${p}`);
  }
}

console.log('');
if (failed === 0) {
  console.log(`Todos os ${cases.length} casos passaram.`);
} else {
  console.log(`${failed} de ${cases.length} casos falharam.`);
  process.exit(1);
}
