ALTER TABLE patient_attachments
  ADD COLUMN IF NOT EXISTS storage_provider text NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS storage_key text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ready' CHECK (status IN ('pending', 'ready', 'quarantined', 'failed', 'archived')),
  ADD COLUMN IF NOT EXISTS detected_mime_type text,
  ADD COLUMN IF NOT EXISTS scanned_at timestamptz,
  ADD COLUMN IF NOT EXISTS failure_reason text;

CREATE INDEX IF NOT EXISTS patient_attachments_status_idx ON patient_attachments(status);
CREATE INDEX IF NOT EXISTS patient_attachments_storage_key_idx ON patient_attachments(storage_key);
