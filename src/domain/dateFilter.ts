// Filtro por intervalo de datas (de -> ate), usado no Historico e no detalhe
// do Contato. Puro (sem React), para ser testavel e compartilhado entre telas.
//
// Semantica:
//   from -> inclui a partir do INICIO do dia escolhido (00:00:00).
//   to   -> inclui ate o FIM do dia escolhido (23:59:59.999).
//   qualquer um pode ser null (aberto daquele lado). Ambos null = sem filtro.

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export const EMPTY_RANGE: DateRange = { from: null, to: null };

export function hasRange(range: DateRange): boolean {
  return range.from !== null || range.to !== null;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// Limite inferior (ISO) do intervalo, ou null.
export function rangeFromISO(range: DateRange): string | null {
  return range.from ? startOfDay(range.from).toISOString() : null;
}

// Limite superior (ISO) do intervalo, ou null. Fim do dia para incluir o "ate".
export function rangeToISO(range: DateRange): string | null {
  return range.to ? endOfDay(range.to).toISOString() : null;
}

// Filtro cliente-side por created_at (para listas ja carregadas em memoria).
export function isWithinRange(iso: string, range: DateRange): boolean {
  const t = new Date(iso).getTime();
  if (range.from && t < startOfDay(range.from).getTime()) return false;
  if (range.to && t > endOfDay(range.to).getTime()) return false;
  return true;
}

function fmt(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Rotulo curto para o campo: "Todas as datas", "De 01/07/2026", "Ate 24/07/2026"
// ou "01/07/2026 - 24/07/2026".
export function formatRangeLabel(range: DateRange): string {
  if (range.from && range.to) return `${fmt(range.from)} - ${fmt(range.to)}`;
  if (range.from) return `A partir de ${fmt(range.from)}`;
  if (range.to) return `Ate ${fmt(range.to)}`;
  return 'Todas as datas';
}
