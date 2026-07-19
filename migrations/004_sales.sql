CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY,
  client_request_id uuid NOT NULL UNIQUE,
  patient_id uuid NOT NULL REFERENCES patients(id),
  product text NOT NULL CHECK (length(trim(product)) >= 2),
  quantity integer NOT NULL CHECK (quantity > 0),
  total_amount_cents bigint NOT NULL CHECK (total_amount_cents > 0),
  sold_on date NOT NULL,
  company_account_id uuid NOT NULL REFERENCES company_accounts(id),
  notes text NOT NULL DEFAULT '',
  warranty_until date,
  delivery_status text NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending','delivered','adaptation','completed')),
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES users(id),
  cancellation_reason text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((cancelled_at IS NULL AND cancelled_by IS NULL AND cancellation_reason IS NULL) OR (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL AND length(trim(cancellation_reason)) >= 3))
);
CREATE INDEX IF NOT EXISTS sales_patient_idx ON sales(patient_id, sold_on DESC);

ALTER TABLE follow_up_tasks ADD COLUMN IF NOT EXISTS sale_id uuid REFERENCES sales(id);
CREATE INDEX IF NOT EXISTS follow_up_tasks_sale_idx ON follow_up_tasks(sale_id) WHERE sale_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS receivable_installments (
  id uuid PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES sales(id),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  due_on date NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash','pix','debit_card','credit_card','bank_transfer','boleto','other')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS receivable_installments_sale_idx ON receivable_installments(sale_id, due_on);

CREATE TABLE IF NOT EXISTS financial_entries (
  id uuid PRIMARY KEY,
  entry_type text NOT NULL CHECK (entry_type IN ('income','expense')),
  category text NOT NULL,
  description text NOT NULL CHECK (length(trim(description)) >= 2),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  competence_on date NOT NULL,
  occurred_on date NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash','pix','debit_card','credit_card','bank_transfer','boleto','other')),
  company_account_id uuid NOT NULL REFERENCES company_accounts(id),
  patient_id uuid REFERENCES patients(id),
  sale_id uuid REFERENCES sales(id),
  receivable_installment_id uuid REFERENCES receivable_installments(id),
  reversal_of_id uuid UNIQUE REFERENCES financial_entries(id),
  reversal_reason text,
  notes text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((reversal_of_id IS NULL AND reversal_reason IS NULL) OR (reversal_of_id IS NOT NULL AND length(trim(reversal_reason)) >= 3))
);
DROP INDEX IF EXISTS financial_entries_active_installment_idx;
CREATE INDEX IF NOT EXISTS financial_entries_sale_idx ON financial_entries(sale_id, created_at);

CREATE OR REPLACE FUNCTION reject_financial_changes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'histórico financeiro é imutável; use lançamento compensatório'; END $$;
DROP TRIGGER IF EXISTS financial_entries_immutable ON financial_entries;
CREATE TRIGGER financial_entries_immutable BEFORE UPDATE OR DELETE ON financial_entries FOR EACH ROW EXECUTE FUNCTION reject_financial_changes();

CREATE OR REPLACE FUNCTION reject_duplicate_active_receipt() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.receivable_installment_id IS NOT NULL AND NEW.reversal_of_id IS NULL AND EXISTS (SELECT 1 FROM financial_entries original WHERE original.receivable_installment_id=NEW.receivable_installment_id AND original.reversal_of_id IS NULL AND NOT EXISTS (SELECT 1 FROM financial_entries reversal WHERE reversal.reversal_of_id=original.id)) THEN RAISE EXCEPTION 'parcela já possui realização ativa'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS financial_entries_one_active_receipt ON financial_entries;
CREATE TRIGGER financial_entries_one_active_receipt BEFORE INSERT ON financial_entries FOR EACH ROW EXECUTE FUNCTION reject_duplicate_active_receipt();

CREATE OR REPLACE FUNCTION restrict_sale_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.client_request_id IS DISTINCT FROM OLD.client_request_id OR NEW.patient_id IS DISTINCT FROM OLD.patient_id OR NEW.product IS DISTINCT FROM OLD.product OR NEW.quantity IS DISTINCT FROM OLD.quantity OR NEW.total_amount_cents IS DISTINCT FROM OLD.total_amount_cents OR NEW.sold_on IS DISTINCT FROM OLD.sold_on OR NEW.company_account_id IS DISTINCT FROM OLD.company_account_id OR NEW.created_by IS DISTINCT FROM OLD.created_by OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'dados econômicos da venda são imutáveis'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS sales_restrict_update ON sales;
CREATE TRIGGER sales_restrict_update BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION restrict_sale_update();

CREATE OR REPLACE FUNCTION reject_installment_changes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'previsões de venda são imutáveis'; END $$;
DROP TRIGGER IF EXISTS receivable_installments_immutable ON receivable_installments;
CREATE TRIGGER receivable_installments_immutable BEFORE UPDATE OR DELETE ON receivable_installments FOR EACH ROW EXECUTE FUNCTION reject_installment_changes();

CREATE OR REPLACE FUNCTION check_sale_installment_total() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target uuid; expected bigint; actual bigint;
BEGIN
  target := COALESCE(NEW.sale_id, OLD.sale_id);
  SELECT total_amount_cents INTO expected FROM sales WHERE id=target;
  SELECT COALESCE(sum(amount_cents),0) INTO actual FROM receivable_installments WHERE sale_id=target;
  IF expected IS DISTINCT FROM actual THEN RAISE EXCEPTION 'parcelas (%) não somam o total da venda (%)', actual, expected; END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS receivable_installments_total ON receivable_installments;
CREATE CONSTRAINT TRIGGER receivable_installments_total AFTER INSERT OR UPDATE OR DELETE ON receivable_installments DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_sale_installment_total();
