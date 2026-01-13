-- Migration: Add Payment Templates and Monthly Payment Tasks for reminders
-- Execute this in Supabase SQL Editor

-- 1. Add auto_create_expenses_from_reminders to family_groups
ALTER TABLE family_groups 
ADD COLUMN IF NOT EXISTS auto_create_expenses_from_reminders BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN family_groups.auto_create_expenses_from_reminders IS 'If true, automatically create expenses when checking payment reminders';

-- 2. Create payment_templates table
CREATE TABLE IF NOT EXISTS payment_templates (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  name TEXT NOT NULL,
  default_category_id TEXT NOT NULL,
  estimated_day INTEGER,
  estimated_amount DECIMAL(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_payment_templates_group 
    FOREIGN KEY (group_id) 
    REFERENCES family_groups(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_payment_templates_category 
    FOREIGN KEY (default_category_id) 
    REFERENCES categories(id) 
    ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_templates_group_id ON payment_templates(group_id);
CREATE INDEX IF NOT EXISTS idx_payment_templates_category_id ON payment_templates(default_category_id);
CREATE INDEX IF NOT EXISTS idx_payment_templates_active ON payment_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE payment_templates IS 'Reusable templates for monthly payment reminders (e.g., Luz, Agua, Gas)';
COMMENT ON COLUMN payment_templates.name IS 'Name of the payment (e.g., "Luz", "Agua")';
COMMENT ON COLUMN payment_templates.default_category_id IS 'Default pocket/category where the expense should be created';
COMMENT ON COLUMN payment_templates.estimated_day IS 'Approximate day of the month when payment is due (1-31)';
COMMENT ON COLUMN payment_templates.estimated_amount IS 'Estimated amount (for reference only, actual amount varies)';

-- 3. Create monthly_payment_tasks table
CREATE TABLE IF NOT EXISTS monthly_payment_tasks (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  paid_amount DECIMAL(10, 2),
  paid_date TIMESTAMP WITH TIME ZONE,
  expense_id TEXT UNIQUE,
  completed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_monthly_payment_tasks_template 
    FOREIGN KEY (template_id) 
    REFERENCES payment_templates(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_monthly_payment_tasks_group 
    FOREIGN KEY (group_id) 
    REFERENCES family_groups(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_monthly_payment_tasks_completer 
    FOREIGN KEY (completed_by) 
    REFERENCES users(id) 
    ON DELETE SET NULL,
    
  CONSTRAINT fk_monthly_payment_tasks_expense 
    FOREIGN KEY (expense_id) 
    REFERENCES expenses(id) 
    ON DELETE SET NULL,
    
  CONSTRAINT unique_template_month_year 
    UNIQUE (template_id, group_id, month, year),
    
  CONSTRAINT valid_month CHECK (month >= 1 AND month <= 12),
  CONSTRAINT valid_year CHECK (year >= 2020 AND year <= 2100)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_monthly_payment_tasks_template ON monthly_payment_tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_monthly_payment_tasks_group ON monthly_payment_tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_monthly_payment_tasks_month_year ON monthly_payment_tasks(group_id, year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_payment_tasks_completed ON monthly_payment_tasks(is_completed) WHERE is_completed = false;
CREATE INDEX IF NOT EXISTS idx_monthly_payment_tasks_expense ON monthly_payment_tasks(expense_id) WHERE expense_id IS NOT NULL;

COMMENT ON TABLE monthly_payment_tasks IS 'Monthly payment tasks created from templates, reset each month';
COMMENT ON COLUMN monthly_payment_tasks.template_id IS 'Reference to the payment template';
COMMENT ON COLUMN monthly_payment_tasks.is_completed IS 'Whether the payment has been marked as completed';
COMMENT ON COLUMN monthly_payment_tasks.paid_amount IS 'Actual amount paid (varies from estimated)';
COMMENT ON COLUMN monthly_payment_tasks.paid_date IS 'Date when the payment was marked as completed';
COMMENT ON COLUMN monthly_payment_tasks.expense_id IS 'ID of the expense created when task was completed (if auto-create is enabled)';
COMMENT ON COLUMN monthly_payment_tasks.completed_by IS 'User who marked the task as completed';

-- 4. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_payment_templates_updated_at
  BEFORE UPDATE ON payment_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_payment_tasks_updated_at
  BEFORE UPDATE ON monthly_payment_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
