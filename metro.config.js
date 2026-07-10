// metro.config.js
// Documentação: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Desabilita source maps em builds de produção.
// Impede que o .tsx original apareça no DevTools de usuários finais.
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
