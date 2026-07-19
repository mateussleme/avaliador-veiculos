-- ============================================================
-- Migração: chassi do veículo em evaluations
--
-- Por que: a busca por placa (APIBrasil) retorna o chassi, e ele agora é
-- exibido na tela de detalhes da avaliação. Avaliações feitas por busca
-- manual (marca/modelo/ano) não têm chassi — a coluna fica NULL.
--
-- Rode este SQL no Supabase SQL Editor. Idempotente.
-- ============================================================

ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS chassi TEXT;

-- Recria a view (regra de sempre: "SELECT e.*" numa view NÃO enxerga
-- colunas adicionadas depois na tabela — precisa recriar).
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
