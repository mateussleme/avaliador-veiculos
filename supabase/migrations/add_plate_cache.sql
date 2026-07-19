-- ============================================================
-- Migração: cache de consultas de placa (plate_cache)
--
-- Por que: cada consulta de placa na APIBrasil custa R$0,10. O cache do
-- app é só em memória (zera ao fechar o app, não é compartilhado entre
-- aparelhos). Esta tabela guarda a resposta de cada placa consultada e o
-- backend a reaproveita por 30 dias antes de pagar de novo — para
-- qualquer usuário, em qualquer aparelho.
--
-- Segurança: RLS ligada SEM nenhuma policy. Isso significa que o app
-- (anon key / usuários logados) NUNCA consegue ler nem escrever aqui —
-- só o backend na Vercel, que usa a service_role key. Contém chassi,
-- então não deve ser legível pelo cliente diretamente.
--
-- Rode este SQL no Supabase SQL Editor.
--
-- ATENÇÃO: usa DROP TABLE. Se já existia uma tabela "plate_cache" com
-- estrutura antiga/diferente (sem a coluna "payload"), o CREATE TABLE IF
-- NOT EXISTS passava por cima dela e o cache falhava silenciosamente
-- ("column plate_cache.payload does not exist"). Como é só cache, apagar
-- e recriar é seguro — não há dado importante para preservar.
-- ============================================================

DROP TABLE IF EXISTS plate_cache;

CREATE TABLE plate_cache (
  plate      TEXT PRIMARY KEY,
  payload    JSONB NOT NULL,
  cached_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE plate_cache ENABLE ROW LEVEL SECURITY;

-- Sem policies de propósito: nenhum acesso via anon/authenticated.
-- O backend usa service_role, que ignora RLS.
