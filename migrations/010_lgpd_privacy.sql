ALTER TABLE patients ADD COLUMN IF NOT EXISTS anonymized_at timestamptz;

CREATE INDEX IF NOT EXISTS patients_anonymized_idx ON patients(anonymized_at) WHERE anonymized_at IS NOT NULL;
