-- Migration: bank-sync ingestion support (source/externalId dedup on expenses) + API tokens
-- Execute this in Supabase SQL Editor

-- Dedup fields for expenses created by external integrations (ej. bank-sync script)
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS external_id TEXT;

ALTER TABLE expenses
ADD CONSTRAINT expenses_source_external_id_key UNIQUE (source, external_id);

-- API tokens: personal access tokens scoped to one user + one group/space
CREATE TABLE IF NOT EXISTS api_tokens (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id      TEXT NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  token_hash    TEXT NOT NULL UNIQUE,
  last_used_at  TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_tokens_user_id_idx ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS api_tokens_group_id_idx ON api_tokens(group_id);

COMMENT ON TABLE api_tokens IS 'Personal access tokens for programmatic access, scoped to one user + one group/space';
COMMENT ON COLUMN expenses.source IS 'ej. "santander_checking" - solo para gastos creados por integraciones externas';
COMMENT ON COLUMN expenses.external_id IS 'id de deduplicación dentro de source, calculado por el cliente externo';
