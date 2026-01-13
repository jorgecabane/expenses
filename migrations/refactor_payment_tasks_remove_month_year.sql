-- Migration: Refactor MonthlyPaymentTask to remove month/year
-- Las tareas ahora son persistentes y se resetean cada mes en lugar de crearse nuevas

-- 1. Eliminar las columnas month y year
ALTER TABLE monthly_payment_tasks 
DROP COLUMN IF EXISTS month,
DROP COLUMN IF EXISTS year;

-- 2. Agregar columna last_reset_at para tracking
ALTER TABLE monthly_payment_tasks
ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

COMMENT ON COLUMN monthly_payment_tasks.last_reset_at IS 'Última vez que se reseteó la tarea (al inicio del mes)';

-- 3. Eliminar el constraint único antiguo
ALTER TABLE monthly_payment_tasks
DROP CONSTRAINT IF EXISTS unique_template_month_year;

-- 4. Crear nuevo constraint único (solo templateId + groupId)
-- Primero eliminar todos los constraints únicos relacionados que puedan existir
ALTER TABLE monthly_payment_tasks
DROP CONSTRAINT IF EXISTS unique_template_month_year,
DROP CONSTRAINT IF EXISTS monthly_payment_tasks_template_id_group_id_key,
DROP CONSTRAINT IF EXISTS unique_template_group;

-- Crear el nuevo constraint único con el nombre que Prisma espera
-- Prisma genera: MonthlyPaymentTask_templateId_groupId_key
ALTER TABLE monthly_payment_tasks
ADD CONSTRAINT "MonthlyPaymentTask_templateId_groupId_key" UNIQUE (template_id, group_id);

-- 5. Eliminar índices relacionados con month/year
DROP INDEX IF EXISTS idx_monthly_payment_tasks_month_year;

-- 6. Actualizar comentarios
COMMENT ON TABLE monthly_payment_tasks IS 'Tareas de pago mensual persistentes. Se resetean al inicio de cada mes en lugar de crearse nuevas.';

-- 7. Si hay tareas duplicadas (mismo template + group pero diferentes meses),
--    mantener solo una (la más reciente) y eliminar las demás
--    Esto es para limpiar datos existentes después del refactor
DO $$
DECLARE
  duplicate_record RECORD;
BEGIN
  FOR duplicate_record IN
    SELECT template_id, group_id, COUNT(*) as count
    FROM monthly_payment_tasks
    GROUP BY template_id, group_id
    HAVING COUNT(*) > 1
  LOOP
    -- Mantener la tarea más reciente (por updated_at) y eliminar las demás
    DELETE FROM monthly_payment_tasks
    WHERE template_id = duplicate_record.template_id
      AND group_id = duplicate_record.group_id
      AND id NOT IN (
        SELECT id
        FROM monthly_payment_tasks
        WHERE template_id = duplicate_record.template_id
          AND group_id = duplicate_record.group_id
        ORDER BY updated_at DESC
        LIMIT 1
      );
  END LOOP;
END $$;
