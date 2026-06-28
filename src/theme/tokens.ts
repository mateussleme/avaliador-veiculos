// Design tokens for o Avaliador de Veículos.
//
// A identidade visual segue a metáfora de painel de instrumentos / relatório
// de inspeção automotiva: verde, âmbar e vermelho têm o mesmo significado
// que têm no painel de um carro (bom / atenção / problema), e o resto da
// paleta é neutro para não competir com esses sinais.

export const colors = {
  // Base
  background: '#EEF1EF',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F6F4',
  border: '#DCE0DB',
  borderStrong: '#C3C9C2',

  // Texto
  textPrimary: '#13181B',
  textSecondary: '#5B6360',
  textTertiary: '#8B9290',
  textOnInk: '#F4F6F4',

  // Marca
  ink: '#16243B', // navy profundo — header, botão primário
  inkLight: '#27395A',

  // Sinalização (mesma linguagem de um painel de carro)
  good: '#1E7A52',
  goodBg: '#E3F1E9',
  caution: '#A8690F',
  cautionBg: '#FBEDD9',
  danger: '#A93226',
  dangerBg: '#F8E1DE',
  info: '#1B5A8C',
  infoBg: '#E2EEF6',
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
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.3 },
  h1: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.2 },
  h2: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.6 },
  caption: { fontSize: 12, fontWeight: '400' as const },
};
