// metro.config.js
// Documentação: https://docs.expo.dev/guides/customizing-metro/
//
// Usamos getSentryExpoConfig (em vez de getDefaultConfig) para que o Sentry
// injete os "debug IDs" que relacionam o stack trace minificado ao código
// original via source maps enviados de forma privada ao painel do Sentry.
// Sem DSN/token no build, isso é inofensivo e não altera o bundle final.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);

// Desabilita source maps embutidos em builds de produção.
// Impede que o .tsx original apareça no DevTools de usuários finais.
// (Os source maps do Sentry são gerados no build e enviados em separado,
//  não vão dentro do app.)
// Em desenvolvimento continua habilitado para facilitar o debug.
if (process.env.NODE_ENV === 'production') {
  config.transformer = {
    ...config.transformer,
    minifierConfig: {
      ...config.transformer?.minifierConfig,
      sourceMap: false,
    },
  };
}

module.exports = config;
