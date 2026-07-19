ALTER TABLE financial_entries ADD COLUMN IF NOT EXISTS client_request_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS financial_entries_client_request_idx ON financial_entries(client_request_id) WHERE client_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS financial_entries_filters_idx ON financial_entries(occurred_on,company_account_id,entry_type,payment_method);
CREATE INDEX IF NOT EXISTS receivable_installments_due_idx ON receivable_installments(due_on);

