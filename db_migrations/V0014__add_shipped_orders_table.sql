CREATE TABLE IF NOT EXISTS shipped_orders (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  material_id INTEGER NOT NULL REFERENCES materials(id),
  color_id INTEGER REFERENCES colors(id),
  quantity INTEGER NOT NULL,
  is_defective BOOLEAN DEFAULT FALSE,
  shipped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  shipped_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_shipped_orders_order_id ON shipped_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_shipped_orders_material_id ON shipped_orders(material_id);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;
