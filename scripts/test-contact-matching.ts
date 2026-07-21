/**
 * Testes da detecção de contato duplicado.
 *
 * Rode com:  npx tsx scripts/test-contact-matching.ts
 * Sai com código 1 se algum caso falhar.
 *
 * Por que existe: se a comparação afrouxar, contatos diferentes viram um só;
 * se apertar demais, "Roni" e "Roni" viram dois e o relatório por contato
 * fragmenta. Estes casos travam o comportamento nas duas direções.
 */
import { findDuplicate } from '../src/domain/contactMatching';

const contact = (id: string, name: string, phone: string | null) => ({ id, name, phone });

const existentes = [
  contact('1', 'Roni', '(51) 99316-8486'),
  contact('2', 'Thainá', '51 93168486'),
  contact('3', 'Carlos Souza', null),
];

// [descrição, nome digitado, telefone digitado, id esperado (null = nenhum)]
const cases: [string, string, string | undefined, string | null][] = [
  ['mesmo telefone com formatação diferente', 'Ronaldo',      '51993168486',    '1'],
  ['mesmo nome exato',                        'Roni',          undefined,       '1'],
  ['nome com acento e caixa diferentes',      'THAINA',        undefined,       '2'],
  ['nome igual, contato sem telefone',        'carlos souza',  undefined,       '3'],
  ['espaços extras no nome',                  '  Roni  ',      undefined,       '1'],
  ['telefone novo e nome novo',               'Beatriz',       '11955550000',   null],
  ['nome parecido mas diferente',             'Ronaldo',       '11988887777',   null],
  ['telefone curto não pode casar',           'Alguem',        '9',             null],
  ['nome vazio não casa com ninguém',         '   ',           undefined,       null],
];

let failed = 0;

for (const [desc, name, phone, expectedId] of cases) {
  const found = findDuplicate(existentes, { name, phone });
  const gotId = found?.id ?? null;
  if (gotId === expectedId) {
    console.log(`OK   ${desc}`);
  } else {
    failed++;
    console.log(`FALHA ${desc}`);
    console.log(`      - encontrou ${found ? `"${found.name}" (id ${gotId})` : 'nenhum'}, esperado ${expectedId ?? 'nenhum'}`);
  }
}

console.log('');
if (failed === 0) {
  console.log(`Todos os ${cases.length} casos passaram.`);
} else {
  console.log(`${failed} de ${cases.length} casos falharam.`);
  process.exit(1);
}
