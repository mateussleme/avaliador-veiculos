# Política de Privacidade — Avaliador de Veículos

> **Aviso importante:** este é um rascunho técnico, escrito para já nascer
> alinhado à LGPD (Lei 13.709/2018), e cobre exatamente o que o app faz hoje.
> Antes de publicar o app para o público, peça a revisão de um advogado —
> política de privacidade é uma peça com responsabilidade legal, e este
> documento não substitui essa revisão.

Última atualização: [preencher na publicação]

## 1. Quem trata os dados

[Nome completo ou razão social] é responsável pelo tratamento de dados
descrito nesta política. Contato: [e-mail de contato].

## 2. Dados tratados nesta versão do app

Nesta fase do app (busca manual por marca/modelo/ano + formulário de
avaliação), o app **não coleta dados pessoais**. Especificamente:

- Marca, modelo e ano do veículo são enviados à API pública da tabela FIPE
  apenas para consultar o preço de referência. Esses dados identificam um
  veículo, não uma pessoa.
- Quilometragem, estado dos pneus, histórico de manutenção e demais
  respostas do formulário de avaliação permanecem apenas na memória do
  aplicativo, no próprio celular, e são descartados quando o app é fechado.

Como nenhum dado pessoal é coletado, armazenado ou transmitido para um
servidor próprio nesta versão, a base legal de tratamento (art. 7º da LGPD) e
o tópico de retenção de dados não se aplicam ainda — ambos serão detalhados
aqui antes de qualquer funcionalidade futura começar a coletar dados.

## 3. O que muda em versões futuras (e como isso será comunicado)

Funcionalidades futuras planejadas — consulta por placa, criação de conta e
histórico de avaliações salvo na nuvem — vão envolver dados pessoais (ex.:
placa do veículo, que pode ser combinada com outras informações para
identificar o proprietário). Antes de qualquer uma dessas funcionalidades
coletar dados, esta política será atualizada para detalhar:

- quais dados passam a ser coletados e por quê;
- a base legal específica (em geral, consentimento — art. 7º, I);
- por quanto tempo os dados ficam armazenados;
- quais terceiros (ex.: provedor da API de consulta de placa, provedor de
  backend) têm acesso a esses dados, e por quê.

O app vai pedir consentimento explícito antes da primeira consulta de placa,
explicando isso na hora, e não apenas nesta política.

## 4. Seus direitos como titular dos dados (art. 18 da LGPD)

Quando dados pessoais passarem a ser coletados, você terá direito a:

- confirmar a existência de tratamento e acessar seus dados;
- corrigir dados incompletos, inexatos ou desatualizados;
- solicitar anonimização, bloqueio ou eliminação de dados desnecessários;
- solicitar a portabilidade dos seus dados;
- revogar o consentimento dado, a qualquer momento;
- solicitar a eliminação dos dados tratados com base no seu consentimento.

Esses pedidos poderão ser feitos pelo e-mail [e-mail de contato], e serão
respondidos dentro do prazo previsto em lei.

## 5. Segurança

Mesmo nesta fase sem coleta de dados pessoais, o app já segue por padrão:

- todas as comunicações de rede usam HTTPS;
- nenhuma chave de API fica embutida no aplicativo;
- nenhum SDK de publicidade ou rastreamento de terceiros é usado.

Quando o armazenamento de dados pessoais for introduzido, esta seção será
expandida para descrever criptografia em repouso, controle de acesso e
política de retenção.

## 6. Alterações nesta política

Sempre que uma nova versão do app passar a coletar um tipo de dado novo, esta
política será atualizada antes do lançamento dessa versão, com a data da
última atualização revisada no topo do documento.
