ALTER TABLE patients ADD COLUMN IF NOT EXISTS responsible_doctor_id uuid REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_patients_responsible_doctor ON patients(responsible_doctor_id) WHERE archived_at IS NULL;
