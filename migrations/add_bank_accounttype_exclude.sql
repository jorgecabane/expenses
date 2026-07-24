-- Migration: contabilidad tarjeta vs cuenta corriente (Consumo vs Caja)
-- Separa el viejo `source` en `bank` + `account_type`, y agrega `exclude_from_spending`
-- a categorías (para el bolsillo de pago de tarjeta). Ejecutar en Supabase SQL Editor.

-- 1. Nuevas columnas
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS bank TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS account_type TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS exclude_from_spending BOOLEAN NOT NULL DEFAULT false;

-- 2. Backfill desde el `source` viejo
UPDATE expenses SET bank = 'santander', account_type = 'credit'
  WHERE source = 'santander_credit_card';
UPDATE expenses SET bank = 'santander', account_type = 'checking'
  WHERE source = 'santander_checking';
-- manuales / legacy (source null u otro) -> checking (default seguro)
UPDATE expenses SET account_type = 'checking' WHERE account_type IS NULL;

-- 3. Flag del bolsillo de pago de tarjeta (gasto de caja, no consumo)
UPDATE categories SET exclude_from_spending = true WHERE name = 'Pago tarjeta crédito';

-- 4. Mover el unique de deduplicación de (source, external_id) a (bank, account_type, external_id)
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_source_external_id_key;
ALTER TABLE expenses ADD CONSTRAINT expenses_bank_accounttype_externalid_key
  UNIQUE (bank, account_type, external_id);

COMMENT ON COLUMN expenses.bank IS 'banco de origen (ej. santander); integraciones externas';
COMMENT ON COLUMN expenses.account_type IS 'credit=tarjeta, checking=cuenta corriente; null=checking';
COMMENT ON COLUMN categories.exclude_from_spending IS 'true = gasto de caja pero no consumo (ej. pago de tarjeta)';
