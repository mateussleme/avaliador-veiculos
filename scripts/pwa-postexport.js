/**
 * Injeta as tags de PWA no dist/index.html apos o `expo export --platform web`.
 *
 * Por que existe: este app usa registerRootComponent (nao Expo Router), entao
 * nao ha um +html.tsx para customizar o <head>. O Expo copia a pasta public/
 * (manifest.json e icones) para a raiz do build, mas nao referencia essas tags
 * no HTML. Este script adiciona:
 *   - link para o manifest.json (Android/Chrome)
 *   - apple-touch-icon + metas apple-mobile-web-app (iOS "Adicionar a Tela")
 *   - theme-color
 *
 * Rode assim (ja embutido no script npm "export:web"):
 *   npx expo export --platform web && node scripts/pwa-postexport.js
 *
 * E idempotente: se as tags ja existirem, nao duplica.
 */
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('[pwa] dist/index.html nao encontrado. Rode "npx expo export --platform web" antes.');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

const MARKER = '<!-- pwa-tags -->';
if (html.includes(MARKER)) {
  console.log('[pwa] tags ja presentes, nada a fazer.');
  process.exit(0);
}

const tags = `${MARKER}
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#16243B">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="AutoValor">`;

// Insere logo antes do fechamento do <head>.
if (html.includes('</head>')) {
  html = html.replace('</head>', `    ${tags}\n  </head>`);
} else {
  console.error('[pwa] </head> nao encontrado no index.html; abortando sem alterar.');
  process.exit(1);
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('[pwa] tags de PWA injetadas em dist/index.html com sucesso.');
