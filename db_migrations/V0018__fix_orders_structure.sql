-- Обновляем orders_status_check constraint для поддержки статуса shipped
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('new', 'in_progress', 'completed', 'shipped'));

-- Устанавливаем значения по умолчанию
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'new';

-- Добавляем нужные колонки в order_items если их нет
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS material_id INTEGER REFERENCES materials(id);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity_completed DECIMAL(10, 2) DEFAULT 0;

-- Устанавливаем значения по умолчанию
ALTER TABLE order_items ALTER COLUMN quantity_completed SET DEFAULT 0;

-- Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_order_items_material_id ON order_items(material_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_section_id ON orders(section_id);