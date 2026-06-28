// Detecção e validação de formato de placa (antiga e Mercosul) e Renavam.
// Isso não consulta nada — é só validação local, pra dar feedback
// imediato antes de gastar uma consulta paga numa busca inválida.

export type PlateOrRenavamType = 'plate-old' | 'plate-mercosul' | 'renavam';

export interface ParsedPlateOrRenavam {
  type: PlateOrRenavamType;
  normalized: string; // maiúsculo, sem espaço/traço — pronto pra enviar à API
}

const OLD_PLATE_REGEX = /^[A-Z]{3}[0-9]{4}$/;
const MERCOSUL_PLATE_REGEX = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
const RENAVAM_REGEX = /^[0-9]{9,11}$/;

function normalize(raw: string): string {
  return raw.toUpperCase().replace(/[\s-.]/g, '');
}

export function parsePlateOrRenavam(raw: string): ParsedPlateOrRenavam | null {
  const normalized = normalize(raw);

  if (OLD_PLATE_REGEX.test(normalized)) return { type: 'plate-old', normalized };
  if (MERCOSUL_PLATE_REGEX.test(normalized)) return { type: 'plate-mercosul', normalized };
  if (RENAVAM_REGEX.test(normalized)) return { type: 'renavam', normalized };

  return null;
}

export function formatPlateOrRenavamHint(type: PlateOrRenavamType): string {
  switch (type) {
    case 'plate-old':
      return 'Placa no formato antigo';
    case 'plate-mercosul':
      return 'Placa no padrão Mercosul';
    case 'renavam':
      return 'Renavam';
  }
}
