-- Permite que bank-sync importe ingresos (abonos de cuenta corriente).
-- external_id usa el movementNumber de Santander: ID real del banco, verificado
-- estable sobre 11 días con transacciones nuevas de por medio.
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS bank TEXT;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS account_type TEXT;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS external_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS incomes_bank_accounttype_externalid_key
  ON incomes(bank, account_type, external_id);
COMMENT ON COLUMN incomes.external_id IS 'movementNumber del banco; estable entre corridas';
