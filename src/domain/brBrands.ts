import { FipeBrand, VehicleKind } from './types';

// Lista curada de palavras-chave (em minúsculas, sem acento na parte
// usada para casar) de marcas atualmente relevantes no mercado brasileiro.
// A tabela FIPE tem marcas históricas/descontinuadas (ex: Plymouth, Saturn,
// Daewoo, Asia Motors) que raramente fazem sentido num app de avaliação de
// veículo seminovo — por isso o filtro por padrão. A tela de busca sempre
// oferece a opção de ver a lista completa, então nenhum veículo fica
// realmente bloqueado por essa lista.

export const CAR_BRAND_KEYWORDS = [
  'volkswagen',
  'vw',
  'chevrolet',
  'gm -',
  'fiat',
  'ford',
  'toyota',
  'honda',
  'hyundai',
  'renault',
  'nissan',
  'jeep',
  'peugeot',
  'citro',
  'mitsubishi',
  'kia',
  'bmw',
  'mercedes',
  'audi',
  'volvo',
  'land rover',
  'mini',
  'subaru',
  'suzuki',
  'ram',
  'byd',
  'gwm',
  'great wall',
  'caoa',
  'chery',
  'jac',
  'jaecoo',
  'omoda',
  'gac',
  'jetour',
  'geely',
  'changan',
  'dfsk',
  'porsche',
  'jaguar',
  'lexus',
  'mazda',
  'neta',
  'troller',
  'seres',
  'denza',
  'zeekr',
  'leapmotor',
  'iveco',
  'foton',
  'ssangyong',
  'alfa romeo',
  'mg',
];

export const MOTORCYCLE_BRAND_KEYWORDS = [
  'honda',
  'yamaha',
  'suzuki',
  'kawasaki',
  'bmw',
  'harley',
  'triumph',
  'ducati',
  'ktm',
  'royal enfield',
  'dafra',
  'shineray',
  'haojue',
  'cfmoto',
  'cf moto',
  'voltz',
  'sundown',
  'kasinski',
  'traxx',
  'husqvarna',
  'aprilia',
  'piaggio',
  'vespa',
  'indian',
  'moto guzzi',
  'bull',
];

function keywordsFor(kind: VehicleKind): string[] {
  return kind === 'cars' ? CAR_BRAND_KEYWORDS : MOTORCYCLE_BRAND_KEYWORDS;
}

export function filterBrazilianMarketBrands(
  brands: FipeBrand[],
  kind: VehicleKind
): FipeBrand[] {
  const keywords = keywordsFor(kind);
  return brands.filter((brand) => {
    const name = brand.name.toLowerCase();
    return keywords.some((keyword) => name.includes(keyword));
  });
}
