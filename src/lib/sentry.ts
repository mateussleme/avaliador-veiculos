// Inicialização do Sentry (monitoramento de erros em produção).
//
// Por que existe: hoje, se o app quebra na mão de um usuário, só descobrimos
// se a pessoa relatar. O Sentry captura a exceção com contexto (versão, aparelho,
// passos anteriores) e nos avisa.
//
// Privacidade (regras do projeto): logs/eventos NUNCA devem conter placa completa,
// token, e-mail ou CPF. Por isso:
//   - sendDefaultPii: false  -> não anexa IP/dados do dispositivo por padrão;
//   - scrubEvent()           -> redige placa/CPF/e-mail/token de mensagens,
//                               exceções, breadcrumbs e URLs antes de enviar.
//
// A DSN é pública por natureza (só permite ENVIAR eventos, não ler dados), então
// pode ficar em EXPO_PUBLIC_*. O token de upload de source maps (SENTRY_AUTH_TOKEN)
// é secreto e vive apenas no build (EAS secret), nunca dentro do app.

import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import type { Breadcrumb, ErrorEvent } from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

// Ambiente: usa o NODE_ENV do build. Em produção/preview reportamos; em dev não,
// para não poluir o painel com erros de desenvolvimento.
const ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'development';

// Na WEB (PWA) desligamos o Sentry: o SDK @sentry/react-native e voltado a
// nativo e nao vale o risco de estourar no navegador. Se um dia quisermos
// monitorar a web, usa-se o @sentry/react em separado. Por ora, so nativo.
const ENABLED = !__DEV__ && DSN.length > 0 && Platform.OS !== 'web';

// ---------------------------------------------------------------------------
// Redação de dados sensíveis
// ---------------------------------------------------------------------------

const REDACTIONS: { pattern: RegExp; replacement: string }[] = [
  // E-mail
  { pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, replacement: '[email]' },
  // CPF (com ou sem pontuação): 000.000.000-00 / 00000000000
  { pattern: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, replacement: '[cpf]' },
  // Placa Mercosul (ABC1D23) e antiga (ABC1234 / ABC-1234)
  { pattern: /\b[A-Za-z]{3}-?\d[A-Za-z0-9]\d{2}\b/g, replacement: '[placa]' },
  // Token em header Authorization: Bearer xxx
  { pattern: /(bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, replacement: '$1[token]' },
  // JWT (três blocos base64url separados por ponto)
  { pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, replacement: '[jwt]' },
];

function redact(input: string): string {
  let out = input;
  for (const { pattern, replacement } of REDACTIONS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

// Percorre uma estrutura desconhecida redigindo apenas strings, preservando o formato.
function redactDeep(value: unknown, depth = 0): unknown {
  if (depth > 6) return value; // trava de segurança contra ciclos/estruturas profundas
  if (typeof value === 'string') return redact(value);
  if (Array.isArray(value)) return value.map((v) => redactDeep(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = redactDeep(v, depth + 1);
    }
    return out;
  }
  return value;
}

function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.message) {
    event.message = redact(event.message);
  }

  if (event.exception?.values) {
    for (const ex of event.exception.values) {
      if (ex.value) ex.value = redact(ex.value);
    }
  }

  if (event.breadcrumbs) {
    for (const bc of event.breadcrumbs) {
      if (bc.message) bc.message = redact(bc.message);
      if (bc.data) bc.data = redactDeep(bc.data) as Record<string, unknown>;
    }
  }

  if (event.request) {
    if (event.request.url) event.request.url = redact(event.request.url);
    if (event.request.query_string && typeof event.request.query_string === 'string') {
      event.request.query_string = redact(event.request.query_string);
    }
    if (event.request.data) event.request.data = redactDeep(event.request.data);
    // Nunca enviar cabeçalhos/cookies (podem conter Authorization).
    delete event.request.headers;
    delete event.request.cookies;
  }

  // Não enviamos dados de usuário identificáveis.
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }

  return event;
}

function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  if (breadcrumb.message) breadcrumb.message = redact(breadcrumb.message);
  if (breadcrumb.data) breadcrumb.data = redactDeep(breadcrumb.data) as Record<string, unknown>;
  return breadcrumb;
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

export function initSentry(): void {
  if (!ENABLED) return;

  Sentry.init({
    dsn: DSN,
    environment: ENVIRONMENT,
    // Não anexa PII automática (IP, etc.).
    sendDefaultPii: false,
    // Performance monitoring desligado para não gastar a cota gratuita (5k/mês)
    // com transações; usamos tudo em erros, que é o que interessa.
    tracesSampleRate: 0,
    // Redação final antes do envio.
    beforeSend: (event: ErrorEvent) => scrubEvent(event),
    beforeBreadcrumb: (breadcrumb: Breadcrumb) => scrubBreadcrumb(breadcrumb),
  });
}

// Reexport para envolver o App: `export default Sentry.wrap(App)`.
export { Sentry };
