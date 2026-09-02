/**
 * Testes da sugestao de venda e do arredondamento (evaluationEngine).
 *
 * Rode com:  npx tsx scripts/test-sale-suggestion.ts
 * Sai com codigo 1 se algum caso falhar.
 *
 * Regras travadas aqui:
 *  - roundMoney arredonda ao milhar (half up).
 *  - Showroom: divisao por 0,88, SEM piso/teto.
 *  - Repasse: divisao por 0,95, COM piso (R$2k carro / R$1k moto) e teto R$25k.
 *  - margem exibida = venda - custo (batem, ambos multiplos do milhar).
 */
import {
  computeSaleSuggestion,
  saleSuggestions,
  roundMoney,
  SALE_SHOWROOM_DIVISOR,
  SALE_REPASSE_DIVISOR,
} from '../src/domain/evaluationEngine';

let failed = 0;
function eq(desc: string, got: number, expected: number) {
  if (got === expected) { console.log(`OK   ${desc} = ${got}`); }
  else { failed++; console.log(`FALHA ${desc} -> got ${got}, esperado ${expected}`); }
}

// roundMoney: ao milhar, half up (empate para longe do zero).
eq('roundMoney 13478', roundMoney(13478), 13000);
eq('roundMoney 13500', roundMoney(13500), 14000);
eq('roundMoney 15316', roundMoney(15316), 15000);
eq('roundMoney 499', roundMoney(499), 0);
eq('roundMoney 500', roundMoney(500), 1000);
eq('roundMoney -13500', roundMoney(-13500), -14000);

// SHOWROOM (0,88) — sem limite. 100000/0.88 = 113636 -> milhar 114000.
// 100000/0.85 = 117647 -> milhar 118000; margem = venda - custo = 18000.
const s1 = computeSaleSuggestion(100000, SALE_SHOWROOM_DIVISOR);
eq('showroom 100k venda', s1.sale, 118000);
eq('showroom 100k margem', s1.margin, 18000); // venda - custo

// REPASSE carro (piso 2k): 12000/0.95 - 12000 = 631 -> piso 2000 -> venda 14000.
const rc = computeSaleSuggestion(12000, SALE_REPASSE_DIVISOR, { min: 2000, max: 25000 });
eq('repasse carro venda (piso 2k)', rc.sale, 14000);
eq('repasse carro margem', rc.margin, 2000);

// REPASSE moto (piso 1k): 12000/0.95 - 12000 = 631 -> piso 1000 -> venda 13000.
const rm = computeSaleSuggestion(12000, SALE_REPASSE_DIVISOR, { min: 1000, max: 25000 });
eq('repasse moto venda (piso 1k)', rm.sale, 13000);
eq('repasse moto margem', rm.margin, 1000);

// REPASSE teto: 600000/0.95 - 600000 = 31578 -> teto 25000 -> venda 625000.
const rt = computeSaleSuggestion(600000, SALE_REPASSE_DIVISOR, { min: 2000, max: 25000 });
eq('repasse teto margem', rt.margin, 25000);

// saleSuggestions escolhe o piso pelo tipo.
const carSug = saleSuggestions(13000, 12000, 'cars');
eq('sug carro repasse margem', carSug.repasse.margin, 2000);
const motoSug = saleSuggestions(13000, 12000, 'motorcycles');
eq('sug moto repasse margem', motoSug.repasse.margin, 1000);

// Custo invalido -> zeros.
const z = computeSaleSuggestion(0, SALE_SHOWROOM_DIVISOR);
eq('custo 0 venda', z.sale, 0);

console.log('');
if (failed === 0) console.log('Todos os casos passaram.');
else { console.log(`${failed} caso(s) falharam.`); process.exit(1); }
