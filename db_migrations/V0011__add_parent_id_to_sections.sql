ALTER TABLE t_p435659_order_management_sys.sections 
ADD COLUMN parent_id INTEGER REFERENCES t_p435659_order_management_sys.sections(id);