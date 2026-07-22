# Node Description Batch 3 of 5

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
- "src_app_buildapp": "buildApp()" | kind=code-symbol | source=src/app.ts:L52 | neighbors=[app.ts, server.ts]
- "src_main_dashboard": "Dashboard()" | kind=code-symbol | source=web/src/main.tsx:L1504 | neighbors=[main.tsx, money()]
- "src_main_date": "date()" | kind=code-symbol | source=web/src/main.tsx:L131 | neighbors=[main.tsx, PatientRecord()]
- "src_main_patientrecord": "PatientRecord()" | kind=code-symbol | source=web/src/main.tsx:L530 | neighbors=[main.tsx, date()]
- "src_main_saleform": "SaleForm()" | kind=code-symbol | source=web/src/main.tsx:L168 | neighbors=[main.tsx, today()]
- "tests_devsec_smoke": "devsec-smoke.mjs" | kind=code-symbol | source=tests/devsec-smoke.mjs:L1 | neighbors=[0e1c4ad test: consolidar QA, acessibili…, login()]
- "db_create_admin_email": "email" | kind=code-symbol | source=src/db/create-admin.ts:L6 | neighbors=[create-admin.ts]
- "domain_finance_entry_types": "ENTRY_TYPES" | kind=code-symbol | source=src/domain/finance.ts:L3 | neighbors=[finance.ts]
- "domain_finance_finance_categories": "FINANCE_CATEGORIES" | kind=code-symbol | source=src/domain/finance.ts:L4 | neighbors=[finance.ts]
- "domain_patients_contactsource": "ContactSource" | kind=code-symbol | source=src/domain/patients.ts:L6 | neighbors=[patients.ts]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\milla\Documents\Projetos\Git\Fonolife\.graphify\description-instructions\batch-002.json

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
