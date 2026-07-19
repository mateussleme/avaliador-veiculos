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

  notes                    TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Desfecho de cada avaliação (foi comprado? vendido? por quanto? em quanto tempo?)
CREATE TABLE outcomes (
  id               UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
  evaluation_id    UUID REFERENCES evaluations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  was_purchased    BOOLEAN,           -- null = ainda não decidido
  purchase_price   NUMERIC(12,2),
  purchase_date    DATE,

  was_sold         BOOLEAN DEFAULT FALSE,
  sale_price       NUMERIC(12,2),
  sale_date        DATE,

  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security: cada usuário acessa só os próprios dados
-- ============================================================
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê e edita o próprio perfil"
  ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Usuário gerencia as próprias avaliações"
  ON evaluations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Usuário gerencia os próprios desfechos"
  ON outcomes FOR ALL USING (auth.uid() = user_id);

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
    o.purchase_price,
    o.purchase_date,
    o.was_sold,
    o.sale_price,
    o.sale_date,
    o.notes AS outcome_notes
  FROM evaluations e
  LEFT JOIN outcomes o ON o.evaluation_id = e.id;
