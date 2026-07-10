// Detecção e validação de formato de placa (antiga e Mercosul).
// Validação local — dá feedback imediato antes de gastar uma consulta paga.

export type PlateType = 'plate-old' | 'plate-mercosul';

export interface ParsedPlate {
  type: PlateType;
  normalized: string; // maiúsculo, sem espaço/traço — pronto pra enviar à API
}

const OLD_PLATE_REGEX      = /^[A-Z]{3}[0-9]{4}$/;
const MERCOSUL_PLATE_REGEX = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

function normalize(raw: string): string {
  return raw.toUpperCase().replace(/[\s\-.]/g, '');
}

export function parsePlate(raw: string): ParsedPlate | null {
  const normalized = normalize(raw);

  if (OLD_PLATE_REGEX.test(normalized))      return { type: 'plate-old',      normalized };
  if (MERCOSUL_PLATE_REGEX.test(normalized)) return { type: 'plate-mercosul', normalized };

  return null;
}

export function formatPlateHint(type: PlateType): string {
  switch (type) {
    case 'plate-old':      return 'Placa no formato antigo';
    case 'plate-mercosul': return 'Placa no padrão Mercosul';
  }
}
