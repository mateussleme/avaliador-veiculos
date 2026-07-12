// DEPRECIADO: consolidado em domain/brandFilters.ts (ver filterCuratedBrands).
//
// Este arquivo existia como uma cópia quase idêntica de filterBrazilianMarketBrands
// em brandFilters.ts, mas com o mesmo nome de função e os argumentos em ordem
// invertida — um risco real de bug se alguém trocasse o import por engano.
// Nenhum arquivo do app importa daqui mais; pode ser apagado com segurança.
export { filterCuratedBrands } from './brandFilters';
