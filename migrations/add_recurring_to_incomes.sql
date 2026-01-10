-- Migration: Add isRecurring and recurringConfig to Income model
-- Execute this in Supabase SQL Editor

-- Add is_recurring column (boolean, default false)
ALTER TABLE incomes 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false;

-- Add recurring_config column (JSONB, nullable)
ALTER TABLE incomes 
ADD COLUMN IF NOT EXISTS recurring_config JSONB;

-- Add comment for documentation
COMMENT ON COLUMN incomes.is_recurring IS 'Indicates if this income is recurring';
COMMENT ON COLUMN incomes.recurring_config IS 'JSON configuration for recurrence rules (frequency, interval, end conditions, etc.)';
