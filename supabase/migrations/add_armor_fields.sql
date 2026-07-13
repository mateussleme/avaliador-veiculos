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
