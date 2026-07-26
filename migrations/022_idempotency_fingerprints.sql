ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS request_fingerprint text
  CHECK (request_fingerprint IS NULL OR request_fingerprint ~ '^[0-9a-f]{64}$');

ALTER TABLE financial_entries
  ADD COLUMN IF NOT EXISTS request_fingerprint text
  CHECK (request_fingerprint IS NULL OR request_fingerprint ~ '^[0-9a-f]{64}$');

ALTER TABLE inventory_movements
  ADD COLUMN IF NOT EXISTS request_fingerprint text
  CHECK (request_fingerprint IS NULL OR request_fingerprint ~ '^[0-9a-f]{64}$');
