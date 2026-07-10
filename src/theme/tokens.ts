// Design tokens for o Avaliador de Veículos.
//
// A identidade visual segue a metáfora de painel de instrumentos / relatório
// de inspeção automotiva: verde, âmbar e vermelho têm o mesmo significado
// que têm no painel de um carro (bom / atenção / problema), e o resto da
// paleta é neutro para não competir com esses sinais.

export const colors = {
  // Base
  background: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF3FA',
  border: '#D9DEE8',
  borderStrong: '#B7C2D1',

  // Texto
  textPrimary: '#20262E',
  textSecondary: '#667085',
  textTertiary: '#98A2B3',
  textOnInk: '#FFFFFF',

  // Marca
  ink: '#16243B',
  inkLight: '#213551',
  brandBlue: '#1E4E8C',
  gold: '#C69349',
  goldLight: '#E7BF78',

  // Sinalização (mesma linguagem de um painel de carro)
  good: '#1F9D6A',
  goodBg: '#ECF8F2',
  caution: '#C69349',
  cautionBg: '#FAF3E3',
  danger: '#D64545',
  dangerBg: '#FBE8E8',
  info: '#1E4E8C',
  infoBg: '#EAF2FF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.3 },
  h2: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.7 },
  caption: { fontSize: 12, fontWeight: '400' as const },
};
