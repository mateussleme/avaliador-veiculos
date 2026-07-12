import { FipeBrand, VehicleKind } from './types';

// A FIPE lista marcas que já circularam no Brasil, incluindo nomes
// históricos/descontinuados que não fazem sentido para uma avaliação de
// veículo seminovo hoje. Em vez de uma lista de "permitidas" (arriscado:
// qualquer marca que eu não previr fica escondida), usamos uma lista de
// EXCLUSÃO com nomes que temos certeza serem irrelevantes — assim, marcas
// novas que a FIPE adicionar continuam aparecendo por padrão.
//
// Lista de carros validada contra o retorno real da API em 2026.
const EXCLUDED_CAR_BRANDS = new Set<string>([
  'Asia Motors',
  'AM Gen',
  'Baby',
  'BRM',
  'Bugre',
  'CAB Motors',
  'CBT Jipe',
  'CHANA',
  'Cross Lander',
  'D2D Motors',
  'Daewoo',
  'EFFA',
  'Engesa',
  'Envemo',
  'Fibravan',
  'Fyber',
  'HAFEI',
  'HITECH ELECTRIC',
  'JINBEI',
  'JPX',
  'Lada',
  'LOBINI',
  'Matra',
  'Mercury',
  'Miura',
  'Plymouth',
  'Pontiac',
  'RELY',
  'Rover',
  'Saab',
  'Saturn',
  'TAC',
  'Wake',
  'Walk',
  'Gurgel',
]);

// Lista de motos: ainda não validada contra o retorno real da API (não
// consegui buscar a lista ao vivo nesta sessão). São nomes que, pelo
// conhecimento geral do mercado, tendem a ser irrelevantes — mas vale
// testar no app e me avisar se alguma marca relevante for escondida por
// engano, ou se alguma marca irrelevante continuar passando.
const EXCLUDED_MOTORCYCLE_BRANDS = new Set<string>([
  'Effa',
  'Wuyang',
  'CCM',
]);

export function filterBrazilianMarketBrands(
  kind: VehicleKind,
  brands: FipeBrand[]
): FipeBrand[] {
  const excluded = kind === 'cars' ? EXCLUDED_CAR_BRANDS : EXCLUDED_MOTORCYCLE_BRANDS;
  return brands.filter((brand) => !excluded.has(brand.name));
}

// ---- Lista curada (allowlist) para a visão padrão da tela de busca ----
//
// Diferente da exclusão acima (que só remove marcas historicamente
// irrelevantes), esta é uma lista positiva de palavras-chave de marcas
// atualmente comuns no mercado brasileiro. Usada como um segundo filtro,
// opcional, só na UI de busca manual — a tela sempre oferece "Mostrar
// todas as marcas" pra cair de volta na lista já filtrada acima, então
// nenhuma marca fica de fato inacessível.
//
// Havia uma cópia quase idêntica desta função em domain/brBrands.ts, com o
// mesmo nome mas argumentos na ordem invertida — um risco real de bug caso
// alguém trocasse o import sem perceber. Consolidado aqui num nome
// diferente (filterCuratedBrands) pra eliminar a ambiguidade.
const CAR_BRAND_KEYWORDS = [
  'volkswagen', 'vw', 'chevrolet', 'gm -', 'fiat', 'ford', 'toyota', 'honda',
  'hyundai', 'renault', 'nissan', 'jeep', 'peugeot', 'citro', 'mitsubishi',
  'kia', 'bmw', 'mercedes', 'audi', 'volvo', 'land rover', 'mini', 'subaru',
  'suzuki', 'ram', 'byd', 'gwm', 'great wall', 'caoa', 'chery', 'jac',
  'jaecoo', 'omoda', 'gac', 'jetour', 'geely', 'changan', 'dfsk', 'porsche',
  'jaguar', 'lexus', 'mazda', 'neta', 'troller', 'seres', 'denza', 'zeekr',
  'leapmotor', 'iveco', 'foton', 'ssangyong', 'alfa romeo', 'mg',
];

const MOTORCYCLE_BRAND_KEYWORDS = [
  'honda', 'yamaha', 'suzuki', 'kawasaki', 'bmw', 'harley', 'triumph',
  'ducati', 'ktm', 'royal enfield', 'dafra', 'shineray', 'haojue', 'cfmoto',
  'cf moto', 'voltz', 'sundown', 'kasinski', 'traxx', 'husqvarna', 'aprilia',
  'piaggio', 'vespa', 'indian', 'moto guzzi', 'bull',
];

function curatedKeywordsFor(kind: VehicleKind): string[] {
  return kind === 'cars' ? CAR_BRAND_KEYWORDS : MOTORCYCLE_BRAND_KEYWORDS;
}

export function filterCuratedBrands(
  kind: VehicleKind,
  brands: FipeBrand[]
): FipeBrand[] {
  const keywords = curatedKeywordsFor(kind);
  return brands.filter((brand) => {
    const name = brand.name.toLowerCase();
    return keywords.some((keyword) => name.includes(keyword));
  });
}
