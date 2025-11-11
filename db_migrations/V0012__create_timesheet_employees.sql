CREATE TABLE IF NOT EXISTS t_p435659_order_management_sys.timesheet_employees (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE t_p435659_order_management_sys.time_tracking 
ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES t_p435659_order_management_sys.timesheet_employees(id);

CREATE INDEX IF NOT EXISTS idx_time_tracking_employee ON t_p435659_order_management_sys.time_tracking(employee_id);