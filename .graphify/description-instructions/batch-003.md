# Node Description Batch 4 of 6

Graphify is running in assistant/skill mode (no API key). You are the host
assistant (Claude Code / Codex / Gemini CLI). Read the prompt below and write
your JSON answer to the answer file.

## Prompt

You are documenting nodes in a knowledge graph.
For each entry below, write ONE concise factual plain-language sentence
describing what it is or does. Use only the provided context.
For a code symbol (kind=code-symbol — a function, class, or constant),
describe what the function/symbol does based on its name, source location
and neighbors — e.g. "Resolves the configured ontology profile from graphify.yaml.".
Write every description in English (en). Do not switch languages.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "db_seed_seeddemo": "seedDemo()" | kind=code-symbol | source=src/db/seed.ts:L6 | neighbors=[seed.ts, server.ts]
- "domain_csv_import_sanitizecsvcell": "sanitizeCsvCell()" | kind=code-symbol | source=src/domain/csv-import.ts:L54 | neighbors=[csv-import.ts, csv-import.test.ts]
- "domain_finance_entry_types": "ENTRY_TYPES" | kind=code-symbol | source=src/domain/finance.ts:L3 | neighbors=[csv-import.ts, finance.ts]
- "domain_finance_finance_categories": "FINANCE_CATEGORIES" | kind=code-symbol | source=src/domain/finance.ts:L4 | neighbors=[csv-import.ts, finance.ts]
- "domain_follow_ups_saopaulodate": "saoPauloDate()" | kind=code-symbol | source=src/domain/follow-ups.ts:L3 | neighbors=[follow-ups.ts, follow-ups.test.ts]
- "domain_privacy_isanonymized": "isAnonymized()" | kind=code-symbol | source=src/domain/privacy.ts:L15 | neighbors=[privacy.ts, privacy.test.ts]
- "domain_sales_delivery_statuses": "DELIVERY_STATUSES" | kind=code-symbol | source=src/domain/sales.ts:L2 | neighbors=[sales.ts, app.ts]
- "domain_sales_saleinstallment": "SaleInstallment" | kind=code-symbol | source=src/domain/sales.ts:L4 | neighbors=[sales.ts, app.ts]
- "domain_whatsapp_whatsapp_templates": "WHATSAPP_TEMPLATES" | kind=code-symbol | source=src/domain/whatsapp.ts:L25 | neighbors=[whatsapp.ts, whatsapp.test.ts]
- "migrations_001_base_audit_events_immutable": "audit_events_immutable" | kind=code-symbol | source=migrations/001_base.sql:L45 | neighbors=[001_base.sql, audit_events]
- "migrations_001_base_user_sessions": "user_sessions" | kind=code-symbol | source=migrations/001_base.sql:L14 | neighbors=[001_base.sql, users]
- "migrations_002_crm_patients_patient_events_immutable": "patient_events_immutable" | kind=code-symbol | source=migrations/002_crm_patients.sql:L44 | neighbors=[002_crm_patients.sql, patient_events]
- "migrations_002_crm_patients_patients_no_delete": "patients_no_delete" | kind=code-symbol | source=migrations/002_crm_patients.sql:L27 | neighbors=[002_crm_patients.sql, patients]
- "migrations_003_follow_up_tasks_follow_up_tasks_no_delete": "follow_up_tasks_no_delete" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L22 | neighbors=[003_follow_up_tasks.sql, follow_up_tasks]
- "migrations_003_follow_up_tasks_follow_up_tasks_restrict_update": "follow_up_tasks_restrict_update" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L36 | neighbors=[003_follow_up_tasks.sql, follow_up_tasks]
- "migrations_003_follow_up_tasks_old_created_at": "OLD.created_at" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L30 | neighbors=[003_follow_up_tasks.sql, restrict_follow_up_update()]
- "migrations_003_follow_up_tasks_old_created_by": "OLD.created_by" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L30 | neighbors=[003_follow_up_tasks.sql, restrict_follow_up_update()]
- "migrations_003_follow_up_tasks_old_due_on": "OLD.due_on" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L29 | neighbors=[003_follow_up_tasks.sql, restrict_follow_up_update()]
- "migrations_003_follow_up_tasks_old_notes": "OLD.notes" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L29 | neighbors=[003_follow_up_tasks.sql, restrict_follow_up_update()]
- "migrations_003_follow_up_tasks_old_patient_id": "OLD.patient_id" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L28 | neighbors=[003_follow_up_tasks.sql, restrict_follow_up_update()]
- "migrations_003_follow_up_tasks_old_title": "OLD.title" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L28 | neighbors=[003_follow_up_tasks.sql, restrict_follow_up_update()]
- "migrations_003_follow_up_tasks_patients": "patients" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L3 | neighbors=[003_follow_up_tasks.sql, follow_up_tasks]
- "migrations_003_follow_up_tasks_users": "users" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L9 | neighbors=[003_follow_up_tasks.sql, follow_up_tasks]
- "migrations_004_sales_actual": "actual" | kind=code-symbol | source=migrations/004_sales.sql:L89 | neighbors=[004_sales.sql, check_sale_installment_total()]
- "migrations_004_sales_expected": "expected" | kind=code-symbol | source=migrations/004_sales.sql:L88 | neighbors=[004_sales.sql, check_sale_installment_total()]
- "migrations_004_sales_financial_entries_immutable": "financial_entries_immutable" | kind=code-symbol | source=migrations/004_sales.sql:L61 | neighbors=[004_sales.sql, financial_entries]
- "migrations_004_sales_financial_entries_one_active_receipt": "financial_entries_one_active_receipt" | kind=code-symbol | source=migrations/004_sales.sql:L69 | neighbors=[004_sales.sql, financial_entries]
- "migrations_004_sales_old_client_request_id": "OLD.client_request_id" | kind=code-symbol | source=migrations/004_sales.sql:L73 | neighbors=[004_sales.sql, restrict_sale_update()]
- "migrations_004_sales_old_company_account_id": "OLD.company_account_id" | kind=code-symbol | source=migrations/004_sales.sql:L73 | neighbors=[004_sales.sql, restrict_sale_update()]
- "migrations_004_sales_old_created_at": "OLD.created_at" | kind=code-symbol | source=migrations/004_sales.sql:L73 | neighbors=[004_sales.sql, restrict_sale_update()]
- "migrations_004_sales_old_created_by": "OLD.created_by" | kind=code-symbol | source=migrations/004_sales.sql:L73 | neighbors=[004_sales.sql, restrict_sale_update()]
- "migrations_004_sales_old_patient_id": "OLD.patient_id" | kind=code-symbol | source=migrations/004_sales.sql:L73 | neighbors=[004_sales.sql, restrict_sale_update()]
- "migrations_004_sales_old_product": "OLD.product" | kind=code-symbol | source=migrations/004_sales.sql:L73 | neighbors=[004_sales.sql, restrict_sale_update()]
- "migrations_004_sales_old_quantity": "OLD.quantity" | kind=code-symbol | source=migrations/004_sales.sql:L73 | neighbors=[004_sales.sql, restrict_sale_update()]
- "migrations_004_sales_old_sold_on": "OLD.sold_on" | kind=code-symbol | source=migrations/004_sales.sql:L73 | neighbors=[004_sales.sql, restrict_sale_update()]
- "migrations_004_sales_old_total_amount_cents": "OLD.total_amount_cents" | kind=code-symbol | source=migrations/004_sales.sql:L73 | neighbors=[004_sales.sql, restrict_sale_update()]
- "migrations_004_sales_receivable_installments_immutable": "receivable_installments_immutable" | kind=code-symbol | source=migrations/004_sales.sql:L82 | neighbors=[004_sales.sql, receivable_installments]
- "migrations_004_sales_receivable_installments_total": "receivable_installments_total" | kind=code-symbol | source=migrations/004_sales.sql:L94 | neighbors=[004_sales.sql, receivable_installments]
- "migrations_004_sales_reject_duplicate_active_receipt": "reject_duplicate_active_receipt()" | kind=code-symbol | source=migrations/004_sales.sql:L63 | neighbors=[004_sales.sql, financial_entries]
- "migrations_004_sales_sales_restrict_update": "sales_restrict_update" | kind=code-symbol | source=migrations/004_sales.sql:L77 | neighbors=[004_sales.sql, sales]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\milla\Documents\Projetos\Git\Fonolife\.graphify\description-instructions\batch-003.json

Keep each description factual and concise (one sentence). No markdown, no prose
outside the JSON object. It is acceptable to omit a node if context is
insufficient — but include every node you can ground confidently.

Example answer format:
```json
{
  "node_id_1": "Resolves the configured ontology profile from graphify.yaml.",
  "node_id_2": "Colonel James Barclay, an antagonist in The Crooked Man."
}
```
