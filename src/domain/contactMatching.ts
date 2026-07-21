// Regra pura de comparação de contatos (sem dependência de rede/Supabase),
// para poder ser testada isoladamente — mesmo padrão do resto de domain/.
//
// Por que existe: sem checagem, "Roni", "Roni JLR" e "Roni 2" viram três
// contatos diferentes e os relatórios por contato/grupo ficam fragmentados.

export interface MatchableContact {
  id: string;
  name: string;
  phone: string | null;
}

export function normalizeContactName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/\s+/g, ' ');
}

export function normalizeContactPhone(value?: string | null): string {
  return (value ?? '').replace(/\D/g, '');
}

// Telefone só é sinal confiável a partir de 8 dígitos — evita que um número
// digitado pela metade case com qualquer outro.
const MIN_PHONE_DIGITS = 8;

/**
 * Procura, entre os contatos existentes, um que provavelmente é a mesma
 * pessoa do candidato. Telefone igual é o sinal forte; nome idêntico
 * (ignorando acento e caixa) é o sinal fraco. Retorna null se não houver.
 */
export function findDuplicate<T extends MatchableContact>(
  contacts: T[],
  candidate: { name: string; phone?: string }
): T | null {
  const phone = normalizeContactPhone(candidate.phone);
  if (phone.length >= MIN_PHONE_DIGITS) {
    const byPhone = contacts.find((c) => normalizeContactPhone(c.phone) === phone);
    if (byPhone) return byPhone;
  }

  const name = normalizeContactName(candidate.name);
  if (!name) return null;
  return contacts.find((c) => normalizeContactName(c.name) === name) ?? null;
}
