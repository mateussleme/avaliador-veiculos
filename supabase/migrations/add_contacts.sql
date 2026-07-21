-- ============================================================
-- Migração: cadastro de contatos (leads) + vínculo com o desfecho
--
-- Objetivo: cada lojista registra com quem negocia (contato + grupo/empresa
-- + telefone) e, ao registrar o desfecho de uma avaliação, vincula o contato.
-- Depois é possível buscar por contato/grupo e ver todos os carros cotados,
-- quantos viraram compra, cotado vs pago e taxa de conversão.
--
-- LGPD: nome e telefone são dados pessoais. A tabela tem RLS — cada lojista
-- só acessa os próprios contatos (auth.uid() = user_id). Nada é compartilhado
-- entre usuários.
--
-- Rode este SQL no Supabase SQL Editor. Idempotente.
-- ============================================================

-- 1. Tabela de contatos
CREATE TABLE IF NOT EXISTS contacts (
  id             UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name           TEXT NOT NULL,          -- contato (ex: Mateus)
  company_group  TEXT,                   -- grupo/empresa (ex: AutoNation)
  phone          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON contacts(user_id);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy idempotente
DROP POLICY IF EXISTS "Usuário gerencia os próprios contatos" ON contacts;
CREATE POLICY "Usuário gerencia os próprios contatos"
  ON contacts FOR ALL USING (auth.uid() = user_id);

-- 2. Vínculo do contato ao desfecho (preenchido junto do desfecho)
ALTER TABLE outcomes
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- 3. Recria a view expondo os dados do contato junto de cada avaliação.
--    (Regra de sempre: "SELECT e.*" não pega colunas/joins novos — recriar.)
DROP VIEW IF EXISTS evaluations_with_outcome;

CREATE VIEW evaluations_with_outcome
WITH (security_invoker = on)
AS
  SELECT
    e.*,
    o.was_purchased,
    o.purchase_price,
    o.purchase_date,
    o.was_sold,
    o.sale_price,
    o.sale_date,
    o.notes AS outcome_notes,
    o.contact_id,
    c.name          AS contact_name,
    c.company_group AS contact_group,
    c.phone         AS contact_phone
  FROM evaluations e
  LEFT JOIN outcomes o ON o.evaluation_id = e.id
  LEFT JOIN contacts c ON c.id = o.contact_id;
