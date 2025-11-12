ALTER TABLE shipped_orders ADD COLUMN IF NOT EXISTS comment TEXT;

CREATE TABLE IF NOT EXISTS free_shipments (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES materials(id),
    color_id INTEGER NOT NULL REFERENCES colors(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    is_defective BOOLEAN DEFAULT FALSE,
    shipped_by INTEGER REFERENCES users(id),
    comment TEXT,
    shipped_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_free_shipments_material ON free_shipments(material_id);
CREATE INDEX IF NOT EXISTS idx_free_shipments_shipped_at ON free_shipments(shipped_at DESC);
