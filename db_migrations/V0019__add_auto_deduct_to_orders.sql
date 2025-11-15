-- Добавляем флаг auto_deduct к заявкам
ALTER TABLE orders ADD COLUMN IF NOT EXISTS auto_deduct BOOLEAN DEFAULT true NOT NULL;

-- Создаем индекс для быстрой фильтрации
CREATE INDEX IF NOT EXISTS idx_orders_auto_deduct ON orders(auto_deduct);