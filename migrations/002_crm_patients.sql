CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) >= 2),
  phone varchar(13) NOT NULL CHECK (phone ~ '^[0-9]{10,13}$'),
  birth_date date,
  guardian_name text,
  contact_source text NOT NULL DEFAULT 'other' CHECK (contact_source IN ('referral','whatsapp','instagram','google','walk_in','other')),
  journey_status text NOT NULL DEFAULT 'new_lead' CHECK (journey_status IN ('new_lead','screening','assessment_scheduled','proposal','sale_completed','adaptation','follow_up','inactive')),
  notes text NOT NULL DEFAULT '',
  care_alert text NOT NULL DEFAULT '',
  next_contact_on date,
  assigned_user_id uuid NOT NULL REFERENCES users(id),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS patients_name_lower_idx ON patients(lower(name));
CREATE INDEX IF NOT EXISTS patients_phone_idx ON patients(phone);
CREATE INDEX IF NOT EXISTS patients_status_active_idx ON patients(journey_status) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS patients_next_contact_active_idx ON patients(next_contact_on) WHERE archived_at IS NULL;

CREATE OR REPLACE FUNCTION reject_patient_deletion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'patients devem ser arquivados, nunca excluídos'; END $$;
DROP TRIGGER IF EXISTS patients_no_delete ON patients;
CREATE TRIGGER patients_no_delete BEFORE DELETE ON patients
FOR EACH ROW EXECUTE FUNCTION reject_patient_deletion();

CREATE TABLE IF NOT EXISTS patient_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  event_type text NOT NULL CHECK (event_type IN ('call','whatsapp','consultation','device_adjustment','cleaning','maintenance','exchange','warranty','clinical_note','scheduled_return')),
  description text NOT NULL CHECK (length(trim(description)) >= 2),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS patient_events_patient_time_idx ON patient_events(patient_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION reject_patient_event_changes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'patient_events é imutável'; END $$;
DROP TRIGGER IF EXISTS patient_events_immutable ON patient_events;
CREATE TRIGGER patient_events_immutable BEFORE UPDATE OR DELETE ON patient_events
FOR EACH ROW EXECUTE FUNCTION reject_patient_event_changes();
