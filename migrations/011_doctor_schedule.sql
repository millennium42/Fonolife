ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'operator', 'doctor'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty text;

ALTER TABLE follow_up_tasks ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES users(id);
ALTER TABLE patient_events ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_doctor ON follow_up_tasks(doctor_id, due_on) WHERE cancelled_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patient_events_doctor ON patient_events(doctor_id, created_at);
