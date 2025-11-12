CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES materials(id),
    color_id INTEGER NOT NULL REFERENCES colors(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    recipient TEXT,
    comment TEXT,
    shipped_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_material ON shipments(material_id);
CREATE INDEX IF NOT EXISTS idx_shipments_shipped_at ON shipments(shipped_at DESC);
