-- ============================================================
-- AutoValor — Schema do banco de dados
-- Cole esse SQL inteiro no Supabase SQL Editor e clique em Run
-- ============================================================

-- 1. Perfis de usuário (complementa auth.users criado pelo Supabase Auth)
CREATE TABLE profiles (
  id          UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT,
  store_name  TEXT DEFAULT 'Minha Loja',
  role        TEXT DEFAULT 'evaluator' CHECK (role IN ('admin', 'evaluator')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Avaliações
CREATE TABLE evaluations (
  id                       UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  user_id                  UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Veículo
  plate                    TEXT,
  brand                    TEXT NOT NULL,
  model                    TEXT NOT NULL,
  model_year               INT  NOT NULL,
  fuel                     TEXT,
  fipe_code                TEXT,
  chassi                   TEXT, -- só preenchido em avaliações via busca por placa
  fipe_price               NUMERIC(12,2) NOT NULL,
  fipe_reference_month     TEXT,
  vehicle_kind             TEXT NOT NULL CHECK (vehicle_kind IN ('cars', 'motorcycles')),

  -- Dados informados pelo avaliador
  mileage_km               INT  NOT NULL,
  new_tire_count           INT  NOT NULL DEFAULT 0,
  had_dealer_service       BOOLEAN NOT NULL DEFAULT FALSE,
  has_repaint               BOOLEAN NOT NULL DEFAULT FALSE,

  -- Resultado calculado
  base_discount_percent    NUMERIC(5,2) NOT NULL,
  discount_source          TEXT NOT NULL CHECK (discount_source IN ('table', 'default')),
  standard_value            NUMERIC(12,2) NOT NULL,
  adjustment_percent        NUMERIC(5,2) NOT NULL,
  estimated_value           NUMERIC(12,2) NOT NULL,

  -- Blindagem
  is_armored                BOOLEAN NOT NULL DEFAULT FALSE,
  is_armored_3a             BOOLEAN NOT NULL DEFAULT FALSE,
  has_delamination          BOOLEAN NOT NULL DEFAULT FALSE,
  delaminated_window_count  INT NOT NULL DEFAULT 0 CHECK (delaminated_window_count BETWEEN 0 AND 7),
  armor_adjustment_value    NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Valor final (o que de fato foi ofertado — inclui custo de preparação e
  -- blindagem, diferente de estimated_value que é só o ajuste percentual)
  preparation_cost          NUMERIC(12,2) NOT NULL DEFAULT 0,
  final_offer_value         NUMERIC(12,2) NOT NULL DEFAULT 0,
  repasse_value             NUMERIC(12,2) NOT NULL DEFAULT 0,
  offer_value               NUMERIC(12,2), -- oferta informada pelo avaliador (opcional)

  notes                    TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Contatos (leads): com quem o lojista negocia. Nome e telefone são dados
--    pessoais (LGPD) — protegidos por RLS (cada lojista só vê os próprios).
--    Definido antes de "outcomes" porque este tem FK para contacts.
CREATE TABLE contacts (
  id             UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name           TEXT NOT NULL,          -- contato (ex: Mateus)
  company_group  TEXT,                   -- grupo/empresa (ex: AutoNation)
  phone          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX contacts_user_id_idx ON contacts(user_id);

-- 4. Desfecho de cada avaliação (foi comprado? vendido? por quanto? em quanto tempo?)
CREATE TABLE outcomes (
  id               UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  evaluation_id    UUID REFERENCES evaluations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  was_purchased    BOOLEAN,           -- legado: true só quando status = 'purchased'
  status           TEXT CHECK (status IN ('purchased', 'negotiating', 'not_purchased')),
  purchase_price   NUMERIC(12,2),     -- valor pago (status = 'purchased')
  purchase_date    DATE,
  negotiation_price NUMERIC(12,2),    -- valor em negociação (status = 'negotiating')

  was_sold         BOOLEAN DEFAULT FALSE,
  sale_price       NUMERIC(12,2),
  sale_date        DATE,

  notes            TEXT,
  contact_id       UUID REFERENCES contacts(id) ON DELETE SET NULL, -- contato vinculado no desfecho
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security: cada usuário acessa só os próprios dados
-- ============================================================
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê e edita o próprio perfil"
  ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Usuário gerencia as próprias avaliações"
  ON evaluations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Usuário gerencia os próprios desfechos"
  ON outcomes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Usuário gerencia os próprios contatos"
  ON contacts FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Trigger: cria perfil automaticamente após cadastro
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoga execução pública — esta função só deve ser chamada pelo trigger interno
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- View útil: avaliações com desfecho já junto
-- ============================================================
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

-- ============================================================
-- Infraestrutura para escala (índices, cache FIPE, rate limit, agregação)
-- Ver também a migração supabase/migrations/add_scale_infra.sql.
-- ============================================================
CREATE INDEX IF NOT EXISTS evaluations_user_created_idx ON evaluations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS outcomes_evaluation_idx      ON outcomes (evaluation_id);
CREATE INDEX IF NOT EXISTS outcomes_contact_idx         ON outcomes (contact_id);

-- Cache da FIPE (só backend / service_role)
CREATE TABLE IF NOT EXISTS fipe_cache (
  path       TEXT PRIMARY KEY,
  payload    JSONB NOT NULL,
  cached_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE fipe_cache ENABLE ROW LEVEL SECURITY;

-- Rate limit / cota (só backend / service_role)
CREATE TABLE IF NOT EXISTS rate_limits (
  key           TEXT NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL,
  count         INT NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION check_rate_limit(p_key TEXT, p_max INT, p_window_seconds INT)
RETURNS TABLE(allowed BOOLEAN, remaining INT, reset_seconds INT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INT;
BEGIN
  v_window_start := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);
  INSERT INTO rate_limits (key, window_start, count) VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;
  allowed := v_count <= p_max;
  remaining := greatest(p_max - v_count, 0);
  reset_seconds := p_window_seconds - (floor(extract(epoch FROM now()))::INT % p_window_seconds);
  RETURN NEXT;
END;
$$;
REVOKE EXECUTE ON FUNCTION check_rate_limit(TEXT, INT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION check_rate_limit(TEXT, INT, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION check_rate_limit(TEXT, INT, INT) FROM authenticated;

CREATE OR REPLACE FUNCTION contact_summaries()
RETURNS TABLE(
  contact_id UUID, name TEXT, company_group TEXT, phone TEXT,
  quoted BIGINT, purchased BIGINT, negotiating BIGINT, not_purchased BIGINT, pending BIGINT,
  total_quoted NUMERIC, total_paid NUMERIC, total_negotiating NUMERIC
)
LANGUAGE sql SECURITY INVOKER STABLE
AS $$
  SELECT c.id, c.name, c.company_group, c.phone,
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
