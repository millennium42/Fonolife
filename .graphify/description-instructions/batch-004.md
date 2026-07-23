# Node Description Batch 5 of 8

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

- "migrations_004_sales_users": "users" | kind=code-symbol | source=migrations/004_sales.sql:L14 | neighbors=[004_sales.sql, financial_entries, sales]
- "migrations_006_csv_imports_csv_import_jobs": "csv_import_jobs" | kind=code-symbol | source=migrations/006_csv_imports.sql:L1 | neighbors=[006_csv_imports.sql, csv_import_errors, users]
- "migrations_009_attachments_patient_attachments": "patient_attachments" | kind=code-symbol | source=migrations/009_attachments.sql:L1 | neighbors=[009_attachments.sql, patients, users]
- "migrations_012_services_and_inventory_service_products": "service_products" | kind=code-symbol | source=migrations/012_services_and_inventory.sql:L15 | neighbors=[012_services_and_inventory.sql, products, services]
- "migrations_014_lgpd_redactions_patient_redactions": "patient_redactions" | kind=code-symbol | source=migrations/014_lgpd_redactions.sql:L2 | neighbors=[014_lgpd_redactions.sql, patients, users]
- "src_main_api": "api()" | kind=code-symbol | source=web/src/main.tsx:L187 | neighbors=[main.tsx, for(), submit()]
- "src_main_finance": "Finance()" | kind=code-symbol | source=web/src/main.tsx:L1171 | neighbors=[main.tsx, money(), today()]
- "src_main_for": "for()" | kind=code-symbol | source=web/src/main.tsx:L543 | neighbors=[main.tsx, api(), monthly()]
- "src_main_money": "money()" | kind=code-symbol | source=web/src/main.tsx:L1144 | neighbors=[main.tsx, Dashboard(), Finance()]
- "src_main_monthly": "monthly()" | kind=code-symbol | source=web/src/main.tsx:L204 | neighbors=[main.tsx, for(), submit()]
- "src_main_submit": "submit()" | kind=code-symbol | source=web/src/main.tsx:L293 | neighbors=[main.tsx, api(), monthly()]
- "tests_dashboard_smoke": "dashboard-smoke.mjs" | kind=code-symbol | source=tests/dashboard-smoke.mjs:L1 | neighbors=[a56a353 feat: priorizar filas acionávei…, dashboard(), login()]
- "tests_finance_test": "finance.test.ts" | kind=code-symbol | source=tests/finance.test.ts:L1 | neighbors=[2dd873d feat: consolidar financeiro úni…, finance.ts, validFinancialEntry()]
- "db_seed_seeddemo": "seedDemo()" | kind=code-symbol | source=src/db/seed.ts:L6 | neighbors=[seed.ts, server.ts]
- "domain_attachments_detectmimetypefrommagicbytes": "detectMimeTypeFromMagicBytes()" | kind=code-symbol | source=src/domain/attachments.ts:L50 | neighbors=[attachments.ts, attachments.test.ts]
- "domain_doctors_buildcalendardays": "buildCalendarDays()" | kind=code-symbol | source=src/domain/doctors.ts:L14 | neighbors=[doctors.ts, doctors.test.ts]
- "domain_doctors_validlicensenumber": "validLicenseNumber()" | kind=code-symbol | source=src/domain/doctors.ts:L1 | neighbors=[doctors.ts, doctors.test.ts]
- "domain_finance_entry_types": "ENTRY_TYPES" | kind=code-symbol | source=src/domain/finance.ts:L3 | neighbors=[csv-import.ts, finance.ts]
- "domain_finance_finance_categories": "FINANCE_CATEGORIES" | kind=code-symbol | source=src/domain/finance.ts:L4 | neighbors=[csv-import.ts, finance.ts]
- "domain_follow_ups_saopaulodate": "saoPauloDate()" | kind=code-symbol | source=src/domain/follow-ups.ts:L3 | neighbors=[follow-ups.ts, follow-ups.test.ts]
- "domain_patients_validdoctorid": "validDoctorId()" | kind=code-symbol | source=src/domain/patients.ts:L13 | neighbors=[patients.ts, doctors.test.ts]
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

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\milla\Documents\Projetos\Git\Fonolife\.graphify\description-instructions\batch-004.json

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
