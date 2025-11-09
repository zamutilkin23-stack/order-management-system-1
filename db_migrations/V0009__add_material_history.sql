-- История изменений материалов
CREATE TABLE IF NOT EXISTS material_history (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id),
    order_item_id INTEGER REFERENCES order_items(id),
    user_id INTEGER REFERENCES users(id),
    quantity_change DECIMAL(10, 2) NOT NULL,
    action_type VARCHAR(20) CHECK (action_type IN ('add', 'deduct', 'defect', 'manual')),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по материалу
CREATE INDEX IF NOT EXISTS idx_material_history_material ON material_history(material_id);
CREATE INDEX IF NOT EXISTS idx_material_history_created ON material_history(created_at);