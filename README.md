# Avaliador de Veículos (MVP)

App em React Native (Expo) para avaliar veículos semi-novos: você escolhe marca,
modelo e ano, o app consulta o preço de tabela na FIPE, e em seguida você
informa quilometragem, pneus novos, revisão na concessionária e repintura. O
app calcula um valor estimado partindo de um padrão fixo (FIPE -20%) e
ajustando esse padrão para cima ou para baixo conforme as condições reais do
veículo.

## Padrão de avaliação (valores fixos)

- Toda avaliação parte de **FIPE -20%** — esse é o "padrão" do app, igual
  para todo veículo.
- **Quilometragem**: calculada como km/ano (km total ÷ idade do veículo,
  mínimo de 1 ano), não o total do odômetro:
  - até 3.000 km/ano: +6%
  - 3.001 a 6.000: +4%
  - 6.001 a 9.000: +2%
  - 9.001 a 14.000: +1%
  - 14.001 a 16.000: -1%
  - 16.001 a 20.000: -2%
  - 20.001 a 25.000: -4%
  - 25.001 a 30.000: -6%
  - acima de 30.000: -7%
- **Pneus novos**: bônus proporcional, até +2% com o jogo completo (4 no
  carro, 2 na moto).
- **Revisão na concessionária**: +3% se sim.
- **Repintura identificada**: -2,5% se sim (fixo, dentro da faixa de -2% a
  -3% pedida).

Esses números estão isolados em `src/domain/evaluationEngine.ts`, com
comentários — ajuste ali se quiser mudar qualquer um deles.

## Marcas do mercado brasileiro

Por padrão, a busca de marca mostra só uma lista curada de marcas atuais do
mercado brasileiro (`src/domain/brBrands.ts`), já que a FIPE também lista
marcas históricas/descontinuadas. Um link "Mostrar todas as marcas" na tela
de busca remove esse filtro a qualquer momento, então nenhuma marca real
fica de fato inacessível.

Nesta versão: a avaliação roda só no celular, sem dados pessoais coletados.
A busca por placa/Renavam já existe na tela, mas só valida o formato — a
consulta real ainda não está conectada a nenhuma API (ver seção abaixo).
Veja `src/screens/PrivacyScreen.tsx` ou a tela "Privacidade" dentro do
próprio app para o resumo completo.

## Busca por placa ou Renavam (estrutura pronta, API ainda não conectada)

A tela de busca tem duas abas: "Marca, modelo e ano" (como antes) e "Placa
ou Renavam". A segunda já valida o formato digitado (placa antiga, placa
Mercosul ou Renavam de 9 a 11 dígitos) e mostra isso na hora, mas a busca em
si ainda não está ligada a nenhuma API paga — ao apertar "Buscar veículo",
aparece um aviso claro de que essa parte falta conectar.

Quando você tiver o token de um provedor (ex: APIBrasil ou API Placas) e
decidir onde vai rodar o backend que guarda essa chave com segurança, o
único arquivo que precisa mudar é `src/api/plateApi.ts` — ele já tem um
comentário mostrando exatamente o formato da chamada esperada. A validação
de formato (`src/domain/plateValidation.ts`) e a tela de busca não precisam
de nenhuma alteração.

## O que você precisa instalar (uma vez só)

1. **Node.js** (versão 20 ou mais recente): baixe em https://nodejs.org e
   instale normalmente, como qualquer outro programa.
2. **App Expo Go** no seu celular: procure "Expo Go" na App Store (iOS) ou
   Google Play (Android) e instale. É de graça.
3. **Uma conta gratuita na Expo**: crie em https://expo.dev/signup. Você só
   precisa dela para o app reconhecer seu celular durante o desenvolvimento.

> **Nota sobre versões:** este projeto está fixado no Expo SDK 54 de propósito.
> O Expo Go que você baixa pela loja sempre fica limitado a uma única versão
> de SDK por vez, e versões mais novas do SDK costumam demorar a aparecer na
> App Store/Play Store (as vezes semanas). Se no futuro você atualizar
> dependências e ver o erro "Project is incompatible with this version of
> Expo Go", normalmente significa que o projeto está em um SDK mais novo do
> que o Expo Go instalado no seu celular suporta — a solução é alinhar as
> versões em `package.json` (`expo`, `react`, `react-native`, etc.) com a
> versão de SDK que o app Expo Go da loja realmente está usando.

## Como rodar o app

Abra um terminal (Prompt de Comando, PowerShell ou Terminal, dependendo do seu
sistema), entre na pasta do projeto e rode:

```
npm install
npx expo start
```

Vai aparecer um QR code no terminal. Abra o app Expo Go no celular, escaneie o
QR code (Android: opção "Scan QR code" dentro do app; iOS: pode escanear pela
câmera nativa) e o app carrega no seu celular em poucos segundos. Toda vez que
você editar um arquivo, o app atualiza automaticamente na tela — não precisa
reiniciar nada.

## Token opcional da FIPE (não é obrigatório)

O app já funciona sem nenhuma configuração extra, usando o limite gratuito de
500 consultas por dia. Se quiser aumentar para 1000/dia, copie o arquivo
`.env.example` para um novo arquivo chamado `.env`, crie uma conta gratuita em
https://fipe.online/register, copie o token gerado e cole na linha
`EXPO_PUBLIC_FIPE_TOKEN=`.

## Estrutura do projeto

```
App.tsx                        ponto de entrada, controla a navegação entre telas
src/
  theme/tokens.ts               cores, espaçamentos e tipografia usados em todo o app
  domain/types.ts                tipos centrais (veículo, métricas, resultado)
  domain/evaluationEngine.ts     a lógica de cálculo do preço ajustado
  domain/brBrands.ts             filtro de marcas do mercado brasileiro
  domain/plateValidation.ts      validação local de formato de placa/Renavam
  api/fipeApi.ts                 cliente da API pública da tabela FIPE
  api/plateApi.ts                consulta por placa/Renavam (ainda não conectada a uma API real)
  components/                    peças de UI reutilizáveis (botão, campo de seleção, etc.)
  screens/
    SearchScreen.tsx             busca por marca/modelo/ano OU por placa/Renavam
    EvaluationFormScreen.tsx     formulário com as métricas de avaliação
    ResultScreen.tsx             resultado com o detalhamento de cada ajuste
    PrivacyScreen.tsx            tela de transparência sobre dados (LGPD)
```

## Próximas fases (ainda não incluídas neste MVP)

- Conectar `src/api/plateApi.ts` a um provedor real (ex: APIBrasil, API
  Placas), via backend — a tela e a validação já estão prontas.
- Login e histórico de avaliações salvo na nuvem.
- Exportação do resultado em PDF.

Essas fases exigem um backend (recomendado: Supabase) para nunca expor
chaves de API pagas dentro do app e para aplicar controle de acesso aos dados
salvos — ver a conversa que originou este projeto para o desenho completo
dessa arquitetura.
