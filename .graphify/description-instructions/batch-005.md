# Node Description Batch 6 of 8

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
- "migrations_006_csv_imports_csv_import_errors": "csv_import_errors" | kind=code-symbol | source=migrations/006_csv_imports.sql:L14 | neighbors=[006_csv_imports.sql, csv_import_jobs]
- "migrations_006_csv_imports_users": "users" | kind=code-symbol | source=migrations/006_csv_imports.sql:L9 | neighbors=[006_csv_imports.sql, csv_import_jobs]
- "migrations_007_inventory_products": "products" | kind=code-symbol | source=migrations/007_inventory.sql:L1 | neighbors=[007_inventory.sql, inventory_movements]
- "migrations_007_inventory_trg_prevent_inventory_movement_modification": "trg_prevent_inventory_movement_modification" | kind=code-symbol | source=migrations/007_inventory.sql:L32 | neighbors=[007_inventory.sql, inventory_movements]
- "migrations_007_inventory_users": "users" | kind=code-symbol | source=migrations/007_inventory.sql:L18 | neighbors=[007_inventory.sql, inventory_movements]
- "migrations_009_attachments_patients": "patients" | kind=code-symbol | source=migrations/009_attachments.sql:L3 | neighbors=[009_attachments.sql, patient_attachments]
- "migrations_009_attachments_users": "users" | kind=code-symbol | source=migrations/009_attachments.sql:L9 | neighbors=[009_attachments.sql, patient_attachments]
- "migrations_012_services_and_inventory_products": "products" | kind=code-symbol | source=migrations/012_services_and_inventory.sql:L17 | neighbors=[012_services_and_inventory.sql, service_products]
- "migrations_012_services_and_inventory_services": "services" | kind=code-symbol | source=migrations/012_services_and_inventory.sql:L3 | neighbors=[012_services_and_inventory.sql, service_products]
- "migrations_013_responsible_doctor": "013_responsible_doctor.sql" | kind=code-symbol | source=migrations/013_responsible_doctor.sql:L1 | neighbors=[91c499c Merge branch 'codex/02-medico-r…, b0009ad feat(patients): adicionar medic…]
- "migrations_014_lgpd_redactions_patients": "patients" | kind=code-symbol | source=migrations/014_lgpd_redactions.sql:L4 | neighbors=[014_lgpd_redactions.sql, patient_redactions]
- "migrations_014_lgpd_redactions_users": "users" | kind=code-symbol | source=migrations/014_lgpd_redactions.sql:L7 | neighbors=[014_lgpd_redactions.sql, patient_redactions]
- "playwright_config": "playwright.config.ts" | kind=code-symbol | source=playwright.config.ts:L1 | neighbors=[0e1c4ad test: consolidar QA, acessibili…, 75e42fd fix(ui): aplicar flex min-width…]
- "src_app_buildapp": "buildApp()" | kind=code-symbol | source=src/app.ts:L77 | neighbors=[app.ts, server.ts]
- "src_main_dashboard": "Dashboard()" | kind=code-symbol | source=web/src/main.tsx:L1610 | neighbors=[main.tsx, money()]
- "src_main_date": "date()" | kind=code-symbol | source=web/src/main.tsx:L134 | neighbors=[main.tsx, PatientRecord()]
- "src_main_doctorcalendar": "DoctorCalendar()" | kind=code-symbol | source=web/src/main.tsx:L2155 | neighbors=[main.tsx, today()]
- "src_main_patientrecord": "PatientRecord()" | kind=code-symbol | source=web/src/main.tsx:L604 | neighbors=[main.tsx, date()]
- "src_main_saleform": "SaleForm()" | kind=code-symbol | source=web/src/main.tsx:L171 | neighbors=[main.tsx, today()]
- "tests_devsec_smoke": "devsec-smoke.mjs" | kind=code-symbol | source=tests/devsec-smoke.mjs:L1 | neighbors=[0e1c4ad test: consolidar QA, acessibili…, login()]
- "auth_routes_authroutes": "authRoutes()" | kind=code-symbol | source=src/modules/auth/routes.ts:L7 | neighbors=[routes.ts]
- "db_create_admin_email": "email" | kind=code-symbol | source=src/db/create-admin.ts:L6 | neighbors=[create-admin.ts]
- "domain_attachments_allowed_mime_types": "ALLOWED_MIME_TYPES" | kind=code-symbol | source=src/domain/attachments.ts:L3 | neighbors=[attachments.ts]
- "domain_attachments_allowedmimetype": "AllowedMimeType" | kind=code-symbol | source=src/domain/attachments.ts:L10 | neighbors=[attachments.ts]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\milla\Documents\Projetos\Git\Fonolife\.graphify\description-instructions\batch-005.json

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
