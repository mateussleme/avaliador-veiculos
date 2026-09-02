# Sentry — estado e passos restantes

Sentry adiciona codigo nativo: **nao sai por `eas update`**, exige `eas build`.

## Ja concluido

- `@sentry/react-native@8.19.0` instalado (via wizard).
- Projeto no Sentry: org `autovalor-gq`, projeto `react-native`.
- `src/lib/sentry.ts` — init unico, com redacao de PII.
- `index.ts` — `initSentry()` + `Sentry.wrap(App)`.
- `metro.config.js` — `getSentryExpoConfig` (debug IDs p/ source maps).
- `app.json` — plugin com org/project corretos.
- `.env` — `EXPO_PUBLIC_SENTRY_DSN` preenchida.
- `.env.local` — `SENTRY_AUTH_TOKEN` (ignorado pelo git, confirmado).
- TypeScript limpo e `npm test` passando.

## Correcoes aplicadas sobre o que o wizard fez

O wizard escreveu um `Sentry.init` dentro do `App.tsx` que conflitava com o nosso.
Foi removido, porque:

| Wizard | Problema | Agora |
|---|---|---|
| `Sentry.init` no `App.tsx` | init duplicado (o nosso ja roda no `index.ts`) | init unico em `src/lib/sentry.ts` |
| `Sentry.wrap` no `App.tsx` | wrap duplicado com o do `index.ts` | wrap so no `index.ts` |
| `sendDefaultPii: true` | anexa IP/dados de usuario; viola as regras do projeto | `false` |
| sem reducao de PII | placa/CPF/e-mail/token iriam integros | `beforeSend`/`beforeBreadcrumb` com redacao |
| DSN fixa no codigo | vai versionada no git | lida de `EXPO_PUBLIC_SENTRY_DSN` |
| Session Replay ligado | grava a tela (placa, chassi, valores) e consome cota | desligado |
| `enableLogs: true` | logs podem carregar dados sensiveis | desligado |
| Feedback Widget | nao usado em nenhuma tela | desligado |
| `project: avaliador-veiculos` | projeto real e `react-native`; upload falharia | corrigido |

## Passos restantes

### 1. Token de source maps como segredo do EAS
O `.env.local` so vale na sua maquina. O build na nuvem precisa do segredo:

```powershell
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value COLE_O_TOKEN_DO_ENV_LOCAL
```

### 2. DSN disponivel no build da nuvem
`.env` esta no `.gitignore`, entao **nao chega no build do EAS**. Adicione a
variavel no painel (EAS > Project > Environment Variables), como voce ja fez com
as outras, com visibilidade "Plain text":

```
EXPO_PUBLIC_SENTRY_DSN = <a mesma DSN do seu .env>
```

Sem isso o app compila normalmente, mas o Sentry fica inativo (o init e ignorado
quando a DSN esta vazia).

### 3. Build nativo

```powershell
eas build --profile production --platform android
```

### 4. Testar o envio
Depois de instalar o APK, dispare um erro de teste. Opcao rapida sem mexer em tela:
adicione temporariamente em algum `onPress`:

```ts
import { Sentry } from './src/lib/sentry';
Sentry.captureException(new Error('teste sentry'));
```

Confira em: https://autovalor-gq.sentry.io/issues/?project=4511780283219968
Depois remova o teste.

> Lembre-se: em `__DEV__` o Sentry fica desligado de proposito. O teste so
> funciona no build de producao/preview.

## Revisao de seguranca

- DSN em `EXPO_PUBLIC_*` — correta: a DSN so permite ENVIAR eventos, nao ler dados.
- `SENTRY_AUTH_TOKEN` — secreto; fica no `.env.local` (gitignored) e como EAS secret.
  Nunca com prefixo `EXPO_PUBLIC` (seria extraivel do app).
- `sendDefaultPii: false`.
- Reducao antes do envio: e-mail, CPF, placa (Mercosul e antiga), `Bearer <token>` e JWT
  em mensagens, excecoes, breadcrumbs e `request.url/query_string/data`.
- `request.headers` e `request.cookies` removidos (poderiam conter Authorization).
- `user.email`, `user.ip_address`, `user.username` removidos.
- `tracesSampleRate: 0` — nao gasta a cota gratuita (5k eventos/mes) com performance.
- Session Replay e Logs desligados.
- Desligado em `__DEV__`.
