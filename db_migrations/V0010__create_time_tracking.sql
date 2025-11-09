CREATE TABLE IF NOT EXISTS time_tracking (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    work_date DATE NOT NULL,
    hours DECIMAL(4,2) NOT NULL DEFAULT 0,
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, work_date)
);

CREATE INDEX idx_time_tracking_user_date ON time_tracking(user_id, work_date);
CREATE INDEX idx_time_tracking_date ON time_tracking(work_date);