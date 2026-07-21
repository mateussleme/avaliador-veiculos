-- ============================================================
-- Migração: infraestrutura para escala
--   1. Índices para as consultas de histórico e contatos
--   2. Cache da FIPE no servidor (fipe_cache) — só o backend acessa
--   3. Rate limit / cota real, atômico e compartilhado (rate_limits + função)
--   4. Agregação de contatos no banco (função contact_summaries)
--
-- Rode este SQL no Supabase SQL Editor. Idempotente.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Índices
-- ------------------------------------------------------------
-- Histórico ordena por created_at e filtra por user_id.
CREATE INDEX IF NOT EXISTS evaluations_user_created_idx
  ON evaluations (user_id, created_at DESC);
-- A view junta outcomes por evaluation_id e por contact_id.
CREATE INDEX IF NOT EXISTS outcomes_evaluation_idx ON outcomes (evaluation_id);
CREATE INDEX IF NOT EXISTS outcomes_contact_idx    ON outcomes (contact_id);

-- ------------------------------------------------------------
-- 2. Cache da FIPE (marcas/modelos/anos/preço) — compartilhado entre todos.
--    RLS ligada sem policies: só o backend (service_role) acessa.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fipe_cache (
  path       TEXT PRIMARY KEY,   -- ex: "/cars/brands", "/cars/brands/59/models"
  payload    JSONB NOT NULL,
  cached_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE fipe_cache ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 3. Rate limit / cota — atômico e persistente (funciona em serverless).
--    RLS ligada sem policies: só o backend (service_role) escreve/lê.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
  key           TEXT NOT NULL,          -- ex: "plate:<user_id>", "fipe:<ip>"
  window_start  TIMESTAMPTZ NOT NULL,   -- início da janela (arredondado)
  count         INT NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Incrementa de forma atômica e diz se a chamada é permitida.
-- Uma linha por (chave, janela); o UPSERT evita corrida entre instâncias.
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max INT,
  p_window_seconds INT
)
RETURNS TABLE(allowed BOOLEAN, remaining INT, reset_seconds INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INT;
BEGIN
  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO rate_limits (key, window_start, count)
    VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start)
    DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;

  allowed := v_count <= p_max;
  remaining := greatest(p_max - v_count, 0);
  reset_seconds := p_window_seconds
    - (floor(extract(epoch FROM now()))::INT % p_window_seconds);
  RETURN NEXT;
END;
$$;

-- Só o backend (service_role) pode chamar — nunca o app.
REVOKE EXECUTE ON FUNCTION check_rate_limit(TEXT, INT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION check_rate_limit(TEXT, INT, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION check_rate_limit(TEXT, INT, INT) FROM authenticated;

-- Limpeza opcional de janelas antigas (rode manualmente ou por cron).
-- DELETE FROM rate_limits WHERE window_start < now() - INTERVAL '1 day';

-- ------------------------------------------------------------
-- 4. Agregação de contatos no banco (substitui a soma feita no celular).
--    SECURITY INVOKER + RLS: cada lojista só vê os próprios dados.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION contact_summaries()
RETURNS TABLE(
  contact_id    UUID,
  name          TEXT,
  company_group TEXT,
  phone         TEXT,
  quoted        BIGINT,
  purchased     BIGINT,
  not_purchased BIGINT,
  pending       BIGINT,
  total_quoted  NUMERIC,
  total_paid    NUMERIC
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT
    c.id,
    c.name,
    c.company_group,
    c.phone,
    count(o.id) AS quoted,
    count(*) FILTER (WHERE o.was_purchased IS TRUE)  AS purchased,
    count(*) FILTER (WHERE o.was_purchased IS FALSE) AS not_purchased,
    count(*) FILTER (WHERE o.id IS NOT NULL AND o.was_purchased IS NULL) AS pending,
    coalesce(sum(e.final_offer_value), 0) AS total_quoted,
    coalesce(sum(o.purchase_price), 0)    AS total_paid
  FROM contacts c
  LEFT JOIN outcomes o    ON o.contact_id = c.id
  LEFT JOIN evaluations e ON e.id = o.evaluation_id
  GROUP BY c.id, c.name, c.company_group, c.phone
  ORDER BY quoted DESC, c.name ASC;
$$;
