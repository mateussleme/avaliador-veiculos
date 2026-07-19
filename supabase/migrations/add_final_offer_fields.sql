-- ============================================================
-- Migração: valor final da oferta (final_offer_value) em evaluations
--
-- Por que: "estimated_value" é só o valor após os ajustes percentuais
-- (km, pneus, revisão, repintura %) — ele NUNCA incluiu o custo de
-- preparação nem o ajuste de blindagem, porque esses dois são somados/
-- descontados em R$ direto na oferta final, não no percentual. O app
-- sempre calculou e mostrou o valor certo ("Oferta de compra") na tela
-- de Resultado, mas nunca salvava esse valor no banco — o Histórico e
-- os Detalhes mostravam estimated_value, um número menor/diferente do
-- que foi oferecido de verdade. Essa migração corrige isso.
--
-- Rode este SQL no Supabase SQL Editor do projeto já em produção.
-- Idempotente — seguro rodar mais de uma vez.
-- ============================================================

ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS preparation_cost  NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_offer_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repasse_value     NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Backfill dos registros já existentes: reconstrói o valor final a partir
-- do que já temos salvo. preparation_cost antigo é desconhecido (nunca foi
-- salvo), então assume-se 0 — na prática só afeta avaliações antigas que
-- tinham repintura com custo de preparação, que ficam com o valor um
-- pouco mais alto do que a oferta real feita na hora. Não há como recuperar
-- esse número com exatidão para avaliações já registradas.
UPDATE evaluations
SET final_offer_value = GREATEST(0, estimated_value + armor_adjustment_value - preparation_cost)
WHERE final_offer_value = 0;

UPDATE evaluations
SET repasse_value = final_offer_value * 0.92
WHERE repasse_value = 0 AND final_offer_value > 0;

-- Recria a view (mesmo motivo de sempre: "SELECT e.*" numa view não pega
-- colunas novas adicionadas depois na tabela — precisa recriar pra atualizar).
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
