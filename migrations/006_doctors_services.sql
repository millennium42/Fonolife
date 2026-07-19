ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'operator', 'doctor'));

ALTER TABLE sales ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES users(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_kind text NOT NULL DEFAULT 'device';
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_sale_kind_check;
ALTER TABLE sales ADD CONSTRAINT sales_sale_kind_check CHECK (sale_kind IN ('device', 'service'));

ALTER TABLE financial_entries ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES users(id);
ALTER TABLE follow_up_tasks ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES users(id);

CREATE INDEX IF NOT EXISTS sales_doctor_idx ON sales(doctor_id, sold_on DESC);
CREATE INDEX IF NOT EXISTS financial_entries_doctor_service_idx
  ON financial_entries(doctor_id, occurred_on DESC) WHERE category = 'service';
CREATE INDEX IF NOT EXISTS follow_up_tasks_doctor_open_idx
  ON follow_up_tasks(doctor_id, due_on) WHERE completed_at IS NULL AND cancelled_at IS NULL;

CREATE OR REPLACE FUNCTION require_doctor_assignment() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME IN ('sales', 'follow_up_tasks') AND NEW.doctor_id IS NULL THEN
    RAISE EXCEPTION 'médico é obrigatório';
  END IF;
  IF TG_TABLE_NAME = 'financial_entries' AND NEW.category = 'service' AND NEW.doctor_id IS NULL THEN
    RAISE EXCEPTION 'médico é obrigatório para serviço';
  END IF;
  IF NEW.doctor_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM users WHERE id = NEW.doctor_id AND role = 'doctor' AND active
  ) THEN
    IF TG_TABLE_NAME = 'financial_entries' THEN
      IF NOT (
        NEW.reversal_of_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM financial_entries original
          WHERE original.id = NEW.reversal_of_id
            AND original.doctor_id IS NOT DISTINCT FROM NEW.doctor_id
        )
        OR NEW.sale_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM sales
          WHERE id = NEW.sale_id
            AND doctor_id IS NOT DISTINCT FROM NEW.doctor_id
        )
      ) THEN RAISE EXCEPTION 'médico ativo é obrigatório'; END IF;
    ELSE
      RAISE EXCEPTION 'médico ativo é obrigatório';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS sales_require_doctor ON sales;
CREATE TRIGGER sales_require_doctor BEFORE INSERT ON sales
FOR EACH ROW EXECUTE FUNCTION require_doctor_assignment();

DROP TRIGGER IF EXISTS financial_entries_require_doctor ON financial_entries;
CREATE TRIGGER financial_entries_require_doctor BEFORE INSERT ON financial_entries
FOR EACH ROW EXECUTE FUNCTION require_doctor_assignment();

DROP TRIGGER IF EXISTS follow_up_tasks_require_doctor ON follow_up_tasks;
CREATE TRIGGER follow_up_tasks_require_doctor BEFORE INSERT ON follow_up_tasks
FOR EACH ROW EXECUTE FUNCTION require_doctor_assignment();

CREATE OR REPLACE FUNCTION restrict_sale_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.client_request_id IS DISTINCT FROM OLD.client_request_id
     OR NEW.patient_id IS DISTINCT FROM OLD.patient_id
     OR NEW.doctor_id IS DISTINCT FROM OLD.doctor_id
     OR NEW.sale_kind IS DISTINCT FROM OLD.sale_kind
     OR NEW.product IS DISTINCT FROM OLD.product
     OR NEW.quantity IS DISTINCT FROM OLD.quantity
     OR NEW.total_amount_cents IS DISTINCT FROM OLD.total_amount_cents
     OR NEW.sold_on IS DISTINCT FROM OLD.sold_on
     OR NEW.company_account_id IS DISTINCT FROM OLD.company_account_id
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN RAISE EXCEPTION 'dados econômicos da venda são imutáveis'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION restrict_follow_up_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.completed_at IS NOT NULL OR OLD.cancelled_at IS NOT NULL
     OR NEW.patient_id IS DISTINCT FROM OLD.patient_id
     OR NEW.doctor_id IS DISTINCT FROM OLD.doctor_id
     OR NEW.sale_id IS DISTINCT FROM OLD.sale_id
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.due_on IS DISTINCT FROM OLD.due_on
     OR NEW.notes IS DISTINCT FROM OLD.notes
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.closed_by IS NULL
     OR (NEW.completed_at IS NULL) = (NEW.cancelled_at IS NULL)
  THEN RAISE EXCEPTION 'follow_up_tasks aceita somente encerramento único'; END IF;
  RETURN NEW;
END $$;
