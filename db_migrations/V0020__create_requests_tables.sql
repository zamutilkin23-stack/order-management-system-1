-- Таблица заявок с автоматической сменой статуса
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(100) NOT NULL UNIQUE,
    section_id INTEGER NOT NULL REFERENCES sections(id),
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    comment TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица позиций заявки (материалы в заявке)
CREATE TABLE IF NOT EXISTS request_items (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id),
    material_name VARCHAR(255) NOT NULL,
    quantity_required DECIMAL(10, 2),
    quantity_completed DECIMAL(10, 2) DEFAULT 0,
    color VARCHAR(100),
    size VARCHAR(100),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_section ON requests(section_id);
CREATE INDEX IF NOT EXISTS idx_request_items_request ON request_items(request_id);