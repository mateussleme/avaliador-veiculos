/**
 * Testes do filtro por intervalo de datas (domain/dateFilter).
 *
 * Rode com:  npx tsx scripts/test-date-filter.ts
 * Sai com codigo 1 se algum caso falhar.
 *
 * Por que existe: o intervalo decide o que aparece no Historico e no Contato.
 * Bordas de "de/ate" precisam ser inclusivas no dia inteiro (00:00 -> 23:59),
 * senao o usuario perde avaliacoes feitas no comeco ou no fim do dia limite.
 */
import { DateRange, isWithinRange, rangeFromISO, rangeToISO, hasRange, EMPTY_RANGE } from '../src/domain/dateFilter';

let failed = 0;
function check(desc: string, got: boolean, expected: boolean) {
  if (got === expected) { console.log(`OK   ${desc}`); }
  else { failed++; console.log(`FALHA ${desc} -> got ${got}, esperado ${expected}`); }
}

const d = (y: number, m: number, day: number, h = 12) => new Date(y, m, day, h).toISOString();

// Sem filtro: inclui tudo.
check('vazio inclui qualquer data', isWithinRange(d(2020, 0, 1), EMPTY_RANGE), true);
check('vazio -> hasRange false', hasRange(EMPTY_RANGE), false);

// Intervalo fechado 10/07 -> 20/07.
const r: DateRange = { from: new Date(2026, 6, 10), to: new Date(2026, 6, 20) };
check('dentro do intervalo (15/07)', isWithinRange(d(2026, 6, 15), r), true);
check('inicio inclusivo (10/07 00:05)', isWithinRange(d(2026, 6, 10, 0), r), true);
check('fim inclusivo (20/07 23h)', isWithinRange(d(2026, 6, 20, 23), r), true);
check('antes do inicio (09/07 23h)', isWithinRange(d(2026, 6, 9, 23), r), false);
check('depois do fim (21/07 00h)', isWithinRange(d(2026, 6, 21, 0), r), false);
check('intervalo -> hasRange true', hasRange(r), true);

// So "de" (aberto no fim).
const rFrom: DateRange = { from: new Date(2026, 6, 10), to: null };
check("'de' inclui data futura", isWithinRange(d(2026, 11, 1), rFrom), true);
check("'de' exclui antes", isWithinRange(d(2026, 6, 9), rFrom), false);

// So "ate" (aberto no inicio).
const rTo: DateRange = { from: null, to: new Date(2026, 6, 20) };
check("'ate' inclui data antiga", isWithinRange(d(2000, 0, 1), rTo), true);
check("'ate' exclui depois", isWithinRange(d(2026, 6, 21), rTo), false);

// ISOs de limite.
check('rangeFromISO nulo quando sem from', rangeFromISO(rTo) === null, true);
check('rangeToISO nulo quando sem to', rangeToISO(rFrom) === null, true);
check('rangeFromISO no inicio do dia', (rangeFromISO(r) ?? '').includes('T'), true);

console.log('');
if (failed === 0) console.log('Todos os casos passaram.');
else { console.log(`${failed} caso(s) falharam.`); process.exit(1); }
