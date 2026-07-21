-- ============================================================
-- Migração: oferta do avaliador na avaliação (offer_value)
--
-- Além da "sugestão de compra" (final_offer_value, calculada pelo app), o
-- avaliador pode informar, já na tela de Resultado, quanto pretende ofertar
-- por aquele veículo. Isso fica em offer_value. No desfecho, o valor efetivo
-- (comprado/negociação) tem prioridade sobre este.
--
-- Rode este SQL no Supabase SQL Editor. Idempotente.
-- ============================================================

ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS offer_value NUMERIC(12,2);

-- Recria a view (usa "SELECT e.*", então precisa recriar pra pegar a coluna nova).
DROP VIEW IF EXISTS evaluations_with_outcome;
CREATE VIEW evaluations_with_outcome
WITH (security_invoker = on)
AS
  SELECT
    e.*,
    o.was_purchased,
    o.status          AS outcome_status,
    o.purchase_price,
    o.purchase_date,
    o.negotiation_price,
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
