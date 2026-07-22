CREATE TABLE IF NOT EXISTS csv_import_jobs (
  id uuid PRIMARY KEY,
  batch_hash text NOT NULL UNIQUE,
  entity_type text NOT NULL CHECK (entity_type IN ('patient', 'financial')),
  status text NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  total_rows integer NOT NULL DEFAULT 0,
  processed_rows integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS csv_import_errors (
  id uuid PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES csv_import_jobs(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  error_message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS csv_import_errors_job_idx ON csv_import_errors(job_id);
