CREATE TABLE IF NOT EXISTS material_color_inventory (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES materials(id),
    color_id INTEGER NOT NULL REFERENCES colors(id),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(material_id, color_id)
);

CREATE INDEX IF NOT EXISTS idx_material_color_inventory_material ON material_color_inventory(material_id);
CREATE INDEX IF NOT EXISTS idx_material_color_inventory_color ON material_color_inventory(color_id);

COMMENT ON TABLE material_color_inventory IS 'Separate inventory tracking for each material-color combination';
