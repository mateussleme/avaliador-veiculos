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
