-- Agregar columna monthly_limit a la tabla categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS monthly_limit DECIMAL(10, 2);

-- Comentario para documentar
COMMENT ON COLUMN categories.monthly_limit IS 'Límite mensual de gasto para este bolsillo';
