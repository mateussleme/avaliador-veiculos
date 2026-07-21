-- ============================================================
-- Migração: terceiro estado de desfecho — "Em negociação"
--
-- Antes o desfecho era um booleano (was_purchased): comprado / não comprado.
-- Agora há três estados explícitos, com valor próprio para negociação:
--   status = 'purchased'      -> comprado        (valor em purchase_price)
--   status = 'negotiating'    -> em negociação   (valor em negotiation_price)
--   status = 'not_purchased'  -> não comprado
--
-- was_purchased é mantido por compatibilidade (true só quando 'purchased').
--
-- Rode este SQL no Supabase SQL Editor. Idempotente.
-- ============================================================

ALTER TABLE outcomes
  ADD COLUMN IF NOT EXISTS status TEXT
    CHECK (status IN ('purchased', 'negotiating', 'not_purchased')),
  ADD COLUMN IF NOT EXISTS negotiation_price NUMERIC(12,2);

-- Backfill: deriva o status dos registros existentes a partir de was_purchased.
UPDATE outcomes
SET status = CASE
  WHEN was_purchased IS TRUE  THEN 'purchased'
  WHEN was_purchased IS FALSE THEN 'not_purchased'
  ELSE status
END
WHERE status IS NULL;

-- Recria a view expondo status e negotiation_price.
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

-- Recria a agregação de contatos contando o novo estado "negociação".
-- (Precisa DROP porque o tipo de retorno mudou.)
DROP FUNCTION IF EXISTS contact_summaries();
CREATE FUNCTION contact_summaries()
RETURNS TABLE(
  contact_id       UUID,
  name             TEXT,
  company_group    TEXT,
  phone            TEXT,
  quoted           BIGINT,
  purchased        BIGINT,
  negotiating      BIGINT,
  not_purchased    BIGINT,
  pending          BIGINT,
  total_quoted     NUMERIC,
  total_paid       NUMERIC,
  total_negotiating NUMERIC
)
LANGUAGE sql SECURITY INVOKER STABLE
AS $$
  SELECT
    c.id,
    c.name,
    c.company_group,
    c.phone,
    count(o.id) AS quoted,
    count(*) FILTER (WHERE o.status = 'purchased')     AS purchased,
    count(*) FILTER (WHERE o.status = 'negotiating')   AS negotiating,
    count(*) FILTER (WHERE o.status = 'not_purchased') AS not_purchased,
    count(*) FILTER (WHERE o.id IS NOT NULL AND o.status IS NULL) AS pending,
    coalesce(sum(e.final_offer_value), 0) AS total_quoted,
    coalesce(sum(o.purchase_price) FILTER (WHERE o.status = 'purchased'), 0)      AS total_paid,
    coalesce(sum(o.negotiation_price) FILTER (WHERE o.status = 'negotiating'), 0) AS total_negotiating
  FROM contacts c
  LEFT JOIN outcomes o    ON o.contact_id = c.id
  LEFT JOIN evaluations e ON e.id = o.evaluation_id
  GROUP BY c.id, c.name, c.company_group, c.phone
  ORDER BY quoted DESC, c.name ASC;
$$;
