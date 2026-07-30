CREATE TABLE IF NOT EXISTS crm_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) >= 2),
  account_type text NOT NULL CHECK (account_type IN ('company','insurer','partner','referrer','other')),
  document text,
  phone text NOT NULL DEFAULT '',
  email text,
  owner_user_id uuid REFERENCES users(id),
  active boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  custom_fields jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS crm_accounts_document_uidx ON crm_accounts(account_type, document) WHERE document IS NOT NULL AND length(trim(document)) > 0;
CREATE INDEX IF NOT EXISTS crm_accounts_owner_idx ON crm_accounts(owner_user_id, active, name);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES crm_accounts(id),
  patient_id uuid REFERENCES patients(id),
  name text NOT NULL CHECK (length(trim(name)) >= 2),
  phone text NOT NULL DEFAULT '',
  email text,
  role_title text NOT NULL DEFAULT '',
  owner_user_id uuid REFERENCES users(id),
  active boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  custom_fields jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_contacts_account_idx ON crm_contacts(account_id, active, name);
CREATE INDEX IF NOT EXISTS crm_contacts_patient_idx ON crm_contacts(patient_id);

CREATE TABLE IF NOT EXISTS crm_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (length(trim(name)) >= 2),
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) >= 2),
  position integer NOT NULL CHECK (position > 0),
  is_terminal boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pipeline_id, position),
  UNIQUE (pipeline_id, name)
);

CREATE TABLE IF NOT EXISTS crm_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES crm_pipelines(id),
  stage_id uuid NOT NULL REFERENCES crm_stages(id),
  account_id uuid REFERENCES crm_accounts(id),
  contact_id uuid REFERENCES crm_contacts(id),
  patient_id uuid REFERENCES patients(id),
  owner_user_id uuid REFERENCES users(id),
  title text NOT NULL CHECK (length(trim(title)) >= 2),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','won','lost','archived')),
  estimated_value_cents bigint NOT NULL DEFAULT 0 CHECK (estimated_value_cents >= 0),
  probability_percent integer NOT NULL DEFAULT 0 CHECK (probability_percent BETWEEN 0 AND 100),
  lead_source text NOT NULL DEFAULT 'other',
  expected_close_on date,
  notes text NOT NULL DEFAULT '',
  custom_fields jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE INDEX IF NOT EXISTS crm_opportunities_stage_idx ON crm_opportunities(stage_id, status, expected_close_on);
CREATE INDEX IF NOT EXISTS crm_opportunities_owner_idx ON crm_opportunities(owner_user_id, status);
CREATE INDEX IF NOT EXISTS crm_opportunities_patient_idx ON crm_opportunities(patient_id);

CREATE TABLE IF NOT EXISTS crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('account','contact','opportunity','patient','appointment')),
  entity_id uuid NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('note','task','follow_up','call','meeting')),
  subject text NOT NULL CHECK (length(trim(subject)) >= 2),
  description text NOT NULL DEFAULT '',
  due_at timestamptz,
  completed_at timestamptz,
  owner_user_id uuid REFERENCES users(id),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_activities_entity_idx ON crm_activities(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_activities_due_idx ON crm_activities(owner_user_id, completed_at, due_at);

CREATE OR REPLACE FUNCTION reject_crm_activity_changes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.completed_at IS NOT NULL OR NEW.entity_type IS DISTINCT FROM OLD.entity_type OR NEW.entity_id IS DISTINCT FROM OLD.entity_id
     OR NEW.activity_type IS DISTINCT FROM OLD.activity_type OR NEW.subject IS DISTINCT FROM OLD.subject
     OR NEW.description IS DISTINCT FROM OLD.description OR NEW.due_at IS DISTINCT FROM OLD.due_at
     OR NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at OR NEW.completed_at IS NULL
  THEN RAISE EXCEPTION 'crm_activities aceita apenas encerramento único'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_activities_restrict_update ON crm_activities;
CREATE TRIGGER crm_activities_restrict_update BEFORE UPDATE ON crm_activities
FOR EACH ROW EXECUTE FUNCTION reject_crm_activity_changes();

CREATE OR REPLACE FUNCTION reject_crm_activity_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'crm_activities preserva histórico e não pode ser excluída'; END $$;
DROP TRIGGER IF EXISTS crm_activities_no_delete ON crm_activities;
CREATE TRIGGER crm_activities_no_delete BEFORE DELETE ON crm_activities
FOR EACH ROW EXECUTE FUNCTION reject_crm_activity_delete();

CREATE TABLE IF NOT EXISTS doctor_availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES users(id),
  block_type text NOT NULL CHECK (block_type IN ('available','blocked')),
  unit_name text NOT NULL DEFAULT '',
  room_name text NOT NULL DEFAULT '',
  specialty text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  notes text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS doctor_availability_blocks_idx ON doctor_availability_blocks(doctor_id, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id),
  opportunity_id uuid REFERENCES crm_opportunities(id),
  doctor_id uuid NOT NULL REFERENCES users(id),
  unit_name text NOT NULL DEFAULT '',
  room_name text NOT NULL DEFAULT '',
  specialty text NOT NULL DEFAULT '',
  appointment_type text NOT NULL DEFAULT 'consultation',
  booking_mode text NOT NULL DEFAULT 'normal' CHECK (booking_mode IN ('normal','fit_in','walk_in')),
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','checked_in','in_progress','completed','cancelled','no_show')),
  notes text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  checked_in_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  CHECK (scheduled_end > scheduled_start),
  CHECK ((cancelled_at IS NULL AND cancellation_reason IS NULL) OR (cancelled_at IS NOT NULL AND length(trim(cancellation_reason)) >= 3))
);
CREATE INDEX IF NOT EXISTS appointments_doctor_time_idx ON appointments(doctor_id, scheduled_start, scheduled_end);
CREATE INDEX IF NOT EXISTS appointments_patient_time_idx ON appointments(patient_id, scheduled_start DESC);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments(status, scheduled_start);

CREATE TABLE IF NOT EXISTS appointment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('created','confirmed','rescheduled','checked_in','started','completed','cancelled','note')),
  description text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS appointment_events_idx ON appointment_events(appointment_id, created_at DESC);

CREATE OR REPLACE FUNCTION reject_appointment_event_changes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'appointment_events é imutável'; END $$;
DROP TRIGGER IF EXISTS appointment_events_immutable ON appointment_events;
CREATE TRIGGER appointment_events_immutable BEFORE UPDATE OR DELETE ON appointment_events
FOR EACH ROW EXECUTE FUNCTION reject_appointment_event_changes();

CREATE TABLE IF NOT EXISTS clinical_encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL UNIQUE REFERENCES appointments(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  doctor_id uuid NOT NULL REFERENCES users(id),
  chief_complaint text NOT NULL DEFAULT '',
  evolution text NOT NULL CHECK (length(trim(evolution)) >= 3),
  clinical_notes text NOT NULL DEFAULT '',
  guidance text NOT NULL DEFAULT '',
  plan text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  references_text text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clinical_encounters_patient_idx ON clinical_encounters(patient_id, created_at DESC);

CREATE OR REPLACE FUNCTION reject_clinical_encounter_changes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'clinical_encounters é imutável'; END $$;
DROP TRIGGER IF EXISTS clinical_encounters_immutable ON clinical_encounters;
CREATE TRIGGER clinical_encounters_immutable BEFORE UPDATE OR DELETE ON clinical_encounters
FOR EACH ROW EXECUTE FUNCTION reject_clinical_encounter_changes();

ALTER TABLE sales ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES appointments(id);
ALTER TABLE sales ALTER COLUMN patient_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS sales_appointment_idx ON sales(appointment_id);

ALTER TABLE financial_entries ADD COLUMN IF NOT EXISTS payable_id uuid;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'financial_entries_payable_id_fkey'
  ) THEN
    ALTER TABLE financial_entries
      ADD CONSTRAINT financial_entries_payable_id_fkey FOREIGN KEY (payable_id) REFERENCES accounts_payable(id) DEFERRABLE INITIALLY DEFERRED;
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS accounts_payable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_request_id uuid NOT NULL UNIQUE,
  request_fingerprint text
    CHECK (request_fingerprint IS NULL OR request_fingerprint ~ '^[0-9a-f]{64}$'),
  vendor_account_id uuid REFERENCES crm_accounts(id),
  vendor_name text NOT NULL CHECK (length(trim(vendor_name)) >= 2),
  company_account_id uuid NOT NULL REFERENCES company_accounts(id),
  description text NOT NULL CHECK (length(trim(description)) >= 2),
  category text NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  competence_on date NOT NULL,
  due_on date NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash','pix','debit_card','credit_card','bank_transfer','boleto','other')),
  notes text NOT NULL DEFAULT '',
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES users(id),
  cancellation_reason text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((cancelled_at IS NULL AND cancelled_by IS NULL AND cancellation_reason IS NULL) OR (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL AND length(trim(cancellation_reason)) >= 3))
);
CREATE INDEX IF NOT EXISTS accounts_payable_due_idx ON accounts_payable(due_on, company_account_id);

ALTER TABLE financial_entries DROP CONSTRAINT IF EXISTS financial_entries_payable_id_fkey;
ALTER TABLE financial_entries
  ADD CONSTRAINT financial_entries_payable_id_fkey FOREIGN KEY (payable_id) REFERENCES accounts_payable(id);
CREATE INDEX IF NOT EXISTS financial_entries_payable_idx ON financial_entries(payable_id, occurred_on DESC);

CREATE TABLE IF NOT EXISTS appointment_costings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL UNIQUE REFERENCES appointments(id),
  patient_id uuid REFERENCES patients(id),
  doctor_id uuid NOT NULL REFERENCES users(id),
  service_revenue_cents bigint NOT NULL DEFAULT 0 CHECK (service_revenue_cents >= 0),
  product_revenue_cents bigint NOT NULL DEFAULT 0 CHECK (product_revenue_cents >= 0),
  total_revenue_cents bigint NOT NULL DEFAULT 0 CHECK (total_revenue_cents >= 0),
  honorarium_cents bigint NOT NULL DEFAULT 0 CHECK (honorarium_cents >= 0),
  supply_cost_cents bigint NOT NULL DEFAULT 0 CHECK (supply_cost_cents >= 0),
  other_cost_cents bigint NOT NULL DEFAULT 0 CHECK (other_cost_cents >= 0),
  total_cost_cents bigint NOT NULL DEFAULT 0 CHECK (total_cost_cents >= 0),
  margin_cents bigint NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION reject_appointment_costing_changes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'appointment_costings é imutável'; END $$;
DROP TRIGGER IF EXISTS appointment_costings_immutable ON appointment_costings;
CREATE TRIGGER appointment_costings_immutable BEFORE UPDATE OR DELETE ON appointment_costings
FOR EACH ROW EXECUTE FUNCTION reject_appointment_costing_changes();
