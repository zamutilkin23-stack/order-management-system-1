-- Обновляем структуру заявок
ALTER TABLE orders ADD COLUMN IF NOT EXISTS section_id INTEGER REFERENCES sections(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Обновляем статусы заявок
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('new', 'in_progress', 'completed'));

-- Обновляем структуру order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color_id INTEGER REFERENCES colors(id);
ALTER TABLE order_items ALTER COLUMN material TYPE VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Переименовываем quantity в quantity_required для ясности
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity_required DECIMAL(10, 2);
UPDATE order_items SET quantity_required = quantity WHERE quantity_required IS NULL;
ALTER TABLE order_items ALTER COLUMN quantity_required SET NOT NULL;