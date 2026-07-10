# AutoValor

Plataforma de inteligência para compra de veículos seminovos. O avaliador informa a placa ou seleciona o veículo manualmente, preenche as condições (km, pneus, revisão, repintura) e recebe um valor de oferta de compra e um valor de repasse — ambos com breakdown detalhado de cada fator aplicado.

---

## Padrão de avaliação

- **Desconto base**: tabela por marca/modelo (355 modelos cadastrados) ou -20% padrão
- **Quilometragem**:
  - Veículo do ano atual: referência de 5.000 km ÷ 12 × mês atual (ex: julho = 2.917 km)
  - Demais anos: km/ano sobre 12.000 km/ano de referência
  - Faixas: até 3.000 km/ano (+6%), até 6.000 (+4%), até 9.000 (+2%), até 14.000 (+1%), até 16.000 (-1%), até 20.000 (-2%), até 25.000 (-4%), até 30.000 (-6%), acima de 30.000 (-7%)
- **Pneus novos**: +0,5% por pneu (carro, máx. +2%) ou +1,0% por pneu (moto, máx. +2%)
- **Revisão na concessionária**: +1% se sim, -4% se não
- **Repintura**: -2,5% + dedução em R$ (peças × R$800, rodas × R$300)
- **Repasse**: 92% do valor de oferta

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| App mobile | React Native + Expo SDK 54 (iOS e Android) |
| Backend | Vercel Serverless Functions (Node.js) |
| Banco de dados | Supabase (Postgres + Auth + RLS) |
| API FIPE | fipe.parallelum.com.br — gratuita, 500 req/dia sem token |
| API de placa/Renavam | APIBrasil — R$0,06/consulta |
| Linguagem | TypeScript no app, JavaScript no backend |

---

## Estrutura do projeto

```
App.tsx                              entrada, navegação e auth gate
src/
  api/
    fipeApi.ts                       cliente FIPE gratuito (marca/modelo/ano)
    plateApi.ts                      consulta por placa/Renavam (com cache em sessão)
  components/                        peças de UI reutilizáveis
  domain/
    types.ts                         tipos centrais
    evaluationEngine.ts              motor de avaliação (regras e cálculos)
    discountTable.ts                 tabela de descontos por marca/modelo (355 modelos)
    brBrands.ts                      filtro de marcas do mercado brasileiro
    plateValidation.ts               validação local de formato (placa/Renavam)
  hooks/
    useBottomPadding.ts              safe area dinâmica para ScrollViews
  lib/
    supabase.ts                      cliente Supabase com SecureStore chunked
    plateCache.ts                    cache em sessão para consultas de placa
  screens/
    AuthScreen.tsx                   login (email/senha + Google + Apple no iOS)
    SearchScreen.tsx                 busca por marca/modelo/ano ou placa/Renavam
    VersionSelectionScreen.tsx       seleção da versão FIPE quando há múltiplos matches
    EvaluationFormScreen.tsx         formulário de condições do veículo
    ResultScreen.tsx                 resultado com breakdown + repasse
    HistoryScreen.tsx                histórico de avaliações salvas
    EvaluationDetailScreen.tsx       detalhe de uma avaliação do histórico
    OutcomeScreen.tsx                registro de desfecho (compra/venda)
    PrivacyScreen.tsx                transparência LGPD
  services/
    evaluationService.ts             CRUD Supabase para avaliações e desfechos
  types/
    database.ts                      tipos espelho das tabelas Supabase
  theme/
    tokens.ts                        cores, espaçamentos e tipografia
supabase/
  schema.sql                         schema completo do banco (rodar no SQL Editor)
```

---

## Como rodar localmente

**Pré-requisitos**: Node.js 20+, conta no Expo (expo.dev), app Expo Go no celular.

```bash
npm install
npx expo start
```

Escaneie o QR code com o Expo Go.

**Variáveis de ambiente** (arquivo `.env` na raiz — nunca commitar):

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_BACKEND_URL=https://seu-backend.vercel.app
EXPO_PUBLIC_FIPE_TOKEN=                # opcional — aumenta o limite gratuito para 1.000 req/dia
```

---

## Autenticação

Controlada pela constante `REQUIRE_AUTH` no `App.tsx`:

```typescript
const REQUIRE_AUTH = false; // false = modo desenvolvimento (sem login)
                            // true  = produção (exige login)
```

Quando `true`, o app exige email/senha ou Google OAuth antes de qualquer acesso. O histórico e os desfechos ficam vinculados ao usuário logado com RLS no Supabase.

---

## Gerar APK (Android)

```bash
eas build --platform android --profile preview
```

O build roda na nuvem (Expo EAS). Quando terminar, baixe o `.apk`:

```bash
eas build:download --id SEU-BUILD-ID
```

---

## Backend (avaliador-backend)

Serverless na Vercel. Única responsabilidade: receber placa ou Renavam do app e consultar a APIBrasil, mantendo o token da APIBrasil seguro no servidor.

Variável de ambiente necessária na Vercel:
```
APIBRASIL_BEARER_TOKEN=eyJ...
```

Endpoints:
- `GET  /api/health` — health check
- `POST /api/plate-lookup` — consulta placa ou Renavam

---

## Banco de dados (Supabase)

Para criar as tabelas no projeto Supabase, cole o conteúdo de `supabase/schema.sql` no SQL Editor e clique em Run.

Tabelas: `profiles`, `evaluations`, `outcomes`
View: `evaluations_with_outcome` (com `security_invoker = on`)

---

## Segurança

- Chave APIBrasil: apenas no backend (nunca no app)
- Sessão do usuário: `expo-secure-store` com chunking automático para tokens > 2048 bytes
- RLS: cada usuário só acessa os próprios dados, mesmo com acesso direto ao Supabase
- Source maps: desabilitados em produção (`extra.productionSourceMap: false`)
- Botão voltar Android: único `BackHandler` listener para evitar comportamento duplo
- Cache de placas: evita cobranças duplas para a mesma placa na mesma sessão
