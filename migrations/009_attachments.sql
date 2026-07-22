CREATE TABLE IF NOT EXISTS patient_attachments (
  id uuid PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  file_name text NOT NULL,
  original_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  file_hash text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE INDEX IF NOT EXISTS patient_attachments_patient_idx ON patient_attachments(patient_id);
CREATE INDEX IF NOT EXISTS patient_attachments_hash_idx ON patient_attachments(file_hash);
