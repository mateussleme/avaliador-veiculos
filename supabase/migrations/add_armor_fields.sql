-- ============================================================
-- Migração: campos de blindagem em evaluations
-- Rode este SQL no Supabase SQL Editor do projeto já em produção.
-- Idempotente (IF NOT EXISTS) — seguro rodar mais de uma vez.
-- ============================================================

ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS is_armored               BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_armored_3a            BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_delamination         BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS delaminated_window_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS armor_adjustment_value   NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Garante que a contagem de vidros fica sempre entre 0 e 7
ALTER TABLE evaluations
  DROP CONSTRAINT IF EXISTS evaluations_delaminated_window_count_check;

ALTER TABLE evaluations
  ADD CONSTRAINT evaluations_delaminated_window_count_check
  CHECK (delaminated_window_count BETWEEN 0 AND 7);

-- Recria a view: no Postgres, "SELECT e.*" numa view é travado na lista de
-- colunas que existia no momento da criação — colunas novas adicionadas
-- depois na tabela (como as de blindagem acima) NÃO aparecem sozinhas na
-- view. Sem isso, o app (que lê por essa view) nunca vê os campos novos,
-- mesmo que a tabela em si já tenha os dados corretos.
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
    o.notes AS outcome_notes
  FROM evaluations e
  LEFT JOIN outcomes o ON o.evaluation_id = e.id;
