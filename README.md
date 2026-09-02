# AutoValor

AutoValor é um aplicativo desenvolvido como Trabalho de Conclusão de Curso (TCC) com o objetivo de auxiliar na avaliação de veículos seminovos. A aplicação utiliza informações da Tabela FIPE e parâmetros definidos para estimar o valor de compra e o valor de repasse de um veículo, considerando fatores como quilometragem, estado dos pneus, histórico de revisões e repintura.


## Funcionalidades

- Consulta de veículos por placa ou seleção manual.
- Integração com a Tabela FIPE.
- Cálculo automático do valor de compra.
- Estimativa do valor de repasse.
- Histórico de avaliações.
- Autenticação de usuários.
- Armazenamento das avaliações em banco de dados.

## Tecnologias

- React Native
- Expo SDK 54
- TypeScript
- Node.js
- Vercel Serverless Functions
- Supabase (PostgreSQL)
- API FIPE
- APIBrasil

## Arquitetura

O projeto é dividido em dois componentes:

- **Aplicativo mobile:** responsável pela interface, autenticação e processamento das regras de avaliação.
- **Backend:** responsável pela consulta de placas e proteção das credenciais utilizadas nas integrações externas.

## Estrutura do projeto

```text
src/
├── api/
├── components/
├── domain/
├── hooks/
├── lib/
├── screens/
├── services/
├── theme/
└── types/

supabase/
└── schema.sql
```

## Execução

### Pré-requisitos

- Node.js 20 ou superior
- Expo CLI
- Conta no Expo

### Instalação

```bash
npm install
npx expo start
```

Após iniciar o projeto, basta abrir o aplicativo Expo Go e escanear o QR Code.

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto.

```env
EXPO_PUBLIC_SUPABASE_URL=*
EXPO_PUBLIC_SUPABASE_ANON_KEY=*
EXPO_PUBLIC_BACKEND_URL=*
EXPO_PUBLIC_FIPE_TOKEN=*
```

## Banco de dados

O arquivo `supabase/schema.sql` contém a estrutura completa do banco de dados utilizada pela aplicação.

## Segurança

- Autenticação utilizando Supabase Auth.
- Row Level Security (RLS) para isolamento dos dados dos usuários.
- Token da APIBrasil armazenado apenas no backend.
- Armazenamento seguro das credenciais no dispositivo.

## Objetivo acadêmico

Este projeto foi desenvolvido como Trabalho de Conclusão de Curso, aplicando conceitos de desenvolvimento mobile, integração com APIs, banco de dados, autenticação de usuários e arquitetura cliente-servidor.
