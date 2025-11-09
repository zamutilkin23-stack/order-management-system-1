-- Таблица разделов
CREATE TABLE IF NOT EXISTS sections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставляем основные разделы
INSERT INTO sections (name) VALUES 
('Ламинация'),
('Маскитные сетки'),
('Отливы'),
('Прочее')
ON CONFLICT (name) DO NOTHING;

-- Таблица цветов
CREATE TABLE IF NOT EXISTS colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    hex_code VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Связь материалов и разделов
ALTER TABLE materials ADD COLUMN IF NOT EXISTS section_id INTEGER REFERENCES sections(id);

-- Связь материалов и цветов (многие ко многим)
CREATE TABLE IF NOT EXISTS material_colors (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id),
    color_id INTEGER REFERENCES colors(id),
    UNIQUE(material_id, color_id)
);

-- Флаги для управления списанием материалов
ALTER TABLE materials ADD COLUMN IF NOT EXISTS auto_deduct BOOLEAN DEFAULT FALSE;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS manual_deduct BOOLEAN DEFAULT TRUE;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS defect_tracking BOOLEAN DEFAULT FALSE;