ALTER TABLE csv_import_jobs
  DROP CONSTRAINT IF EXISTS csv_import_jobs_status_check;

ALTER TABLE csv_import_jobs
  ADD CONSTRAINT csv_import_jobs_status_check
  CHECK (status IN ('processing', 'completed', 'completed_with_errors', 'failed'));

ALTER TABLE csv_import_jobs
  DROP CONSTRAINT IF EXISTS csv_import_jobs_batch_hash_key;

ALTER TABLE csv_import_jobs
  ADD COLUMN IF NOT EXISTS parser_version text NOT NULL DEFAULT 'v2',
  ADD COLUMN IF NOT EXISTS previous_job_id uuid REFERENCES csv_import_jobs(id),
  ADD COLUMN IF NOT EXISTS attempt_number integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE,
  ADD COLUMN IF NOT EXISTS error_summary text;

CREATE UNIQUE INDEX IF NOT EXISTS csv_import_jobs_batch_attempt_idx ON csv_import_jobs(batch_hash, attempt_number);

CREATE TABLE IF NOT EXISTS csv_imported_rows (
  id uuid PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES csv_import_jobs(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  row_hash text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS csv_imported_rows_job_idx ON csv_imported_rows(job_id);
CREATE INDEX IF NOT EXISTS csv_imported_rows_hash_idx ON csv_imported_rows(row_hash);
