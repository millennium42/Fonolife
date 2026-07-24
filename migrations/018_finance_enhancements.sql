-- Migration 018: Ajustes no esquema financeiro, ledger e idempotência de baixas
ALTER TABLE sales ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

ALTER TABLE financial_entries ADD COLUMN IF NOT EXISTS client_request_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_entries_client_request ON financial_entries(client_request_id) WHERE client_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_financial_entries_company_account ON financial_entries(company_account_id, occurred_on DESC);
CREATE INDEX IF NOT EXISTS idx_receivable_installments_due ON receivable_installments(due_on);
