# Node Description Batch 4 of 8

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

- "domain_follow_ups_follow_up_filters": "FOLLOW_UP_FILTERS" | kind=code-symbol | source=src/domain/follow-ups.ts:L1 | neighbors=[follow-ups.ts, app.ts, follow-ups.test.ts]
- "domain_inventory_validinventorymovement": "validInventoryMovement()" | kind=code-symbol | source=src/domain/inventory.ts:L59 | neighbors=[inventory.ts, app.ts, inventory.test.ts]
- "domain_inventory_validnonnegativecents": "validNonNegativeCents()" | kind=code-symbol | source=src/domain/inventory.ts:L39 | neighbors=[inventory.ts, validProduct(), services.ts]
- "domain_inventory_validproductbrand": "validProductBrand()" | kind=code-symbol | source=src/domain/inventory.ts:L31 | neighbors=[inventory.ts, validProduct(), inventory.test.ts]
- "domain_inventory_validproductmodel": "validProductModel()" | kind=code-symbol | source=src/domain/inventory.ts:L35 | neighbors=[inventory.ts, validProduct(), inventory.test.ts]
- "domain_inventory_validproductname": "validProductName()" | kind=code-symbol | source=src/domain/inventory.ts:L27 | neighbors=[inventory.ts, validProduct(), inventory.test.ts]
- "domain_patients_contact_sources": "CONTACT_SOURCES" | kind=code-symbol | source=src/domain/patients.ts:L2 | neighbors=[csv-import.ts, patients.ts, app.ts]
- "domain_patients_patient_event_types": "PATIENT_EVENT_TYPES" | kind=code-symbol | source=src/domain/patients.ts:L3 | neighbors=[patients.ts, app.ts, patients.test.ts]
- "domain_patients_validpatientname": "validPatientName()" | kind=code-symbol | source=src/domain/patients.ts:L11 | neighbors=[csv-import.ts, patients.ts, app.ts]
- "domain_privacy_anonymizepatientname": "anonymizePatientName()" | kind=code-symbol | source=src/domain/privacy.ts:L7 | neighbors=[privacy.ts, app.ts, privacy.test.ts]
- "domain_privacy_formatlgpdexportpackage": "formatLgpdExportPackage()" | kind=code-symbol | source=src/domain/privacy.ts:L22 | neighbors=[privacy.ts, app.ts, privacy.test.ts]
- "domain_sales_payment_methods": "PAYMENT_METHODS" | kind=code-symbol | source=src/domain/sales.ts:L1 | neighbors=[csv-import.ts, finance.ts, sales.ts]
- "domain_sales_splitmonthly": "splitMonthly()" | kind=code-symbol | source=src/domain/sales.ts:L17 | neighbors=[sales.ts, validCents(), sales.test.ts]
- "domain_security_hashtoken": "hashToken()" | kind=code-symbol | source=src/domain/security.ts:L18 | neighbors=[security.ts, app.ts, security.test.ts]
- "domain_security_scrypt": "scrypt" | kind=code-symbol | source=src/domain/security.ts:L3 | neighbors=[security.ts, hashPassword(), verifyPassword()]
- "domain_security_validcnpj": "validCnpj()" | kind=code-symbol | source=src/domain/security.ts:L20 | neighbors=[security.ts, app.ts, security.test.ts]
- "domain_services_validexecutiontime": "validExecutionTime()" | kind=code-symbol | source=src/domain/services.ts:L29 | neighbors=[services.ts, validService(), services.test.ts]
- "domain_services_validservicename": "validServiceName()" | kind=code-symbol | source=src/domain/services.ts:L25 | neighbors=[services.ts, validService(), services.test.ts]
- "domain_whatsapp_buildwhatsapplink": "buildWhatsAppLink()" | kind=code-symbol | source=src/domain/whatsapp.ts:L15 | neighbors=[whatsapp.ts, formatE164Phone(), whatsapp.test.ts]
- "domain_whatsapp_formate164phone": "formatE164Phone()" | kind=code-symbol | source=src/domain/whatsapp.ts:L6 | neighbors=[whatsapp.ts, buildWhatsAppLink(), whatsapp.test.ts]
- "e2e_critical_flow_spec": "critical-flow.spec.ts" | kind=code-symbol | source=tests/e2e/critical-flow.spec.ts:L1 | neighbors=[0e1c4ad test: consolidar QA, acessibili…, accessible(), login()]
- "migrations_001_base_audit_events": "audit_events" | kind=code-symbol | source=migrations/001_base.sql:L32 | neighbors=[001_base.sql, users, audit_events_immutable]
- "migrations_001_base_users": "users" | kind=code-symbol | source=migrations/001_base.sql:L3 | neighbors=[001_base.sql, audit_events, user_sessions]
- "migrations_002_crm_patients_users": "users" | kind=code-symbol | source=migrations/002_crm_patients.sql:L12 | neighbors=[002_crm_patients.sql, patient_events, patients]
- "migrations_004_sales_company_accounts": "company_accounts" | kind=code-symbol | source=migrations/004_sales.sql:L9 | neighbors=[004_sales.sql, financial_entries, sales]
- "migrations_004_sales_patients": "patients" | kind=code-symbol | source=migrations/004_sales.sql:L4 | neighbors=[004_sales.sql, financial_entries, sales]
- "migrations_004_sales_users": "users" | kind=code-symbol | source=migrations/004_sales.sql:L14 | neighbors=[004_sales.sql, financial_entries, sales]
- "migrations_006_csv_imports_csv_import_jobs": "csv_import_jobs" | kind=code-symbol | source=migrations/006_csv_imports.sql:L1 | neighbors=[006_csv_imports.sql, csv_import_errors, users]
- "migrations_009_attachments_patient_attachments": "patient_attachments" | kind=code-symbol | source=migrations/009_attachments.sql:L1 | neighbors=[009_attachments.sql, patients, users]
- "migrations_012_services_and_inventory_service_products": "service_products" | kind=code-symbol | source=migrations/012_services_and_inventory.sql:L15 | neighbors=[012_services_and_inventory.sql, products, services]
- "src_main_api": "api()" | kind=code-symbol | source=web/src/main.tsx:L187 | neighbors=[main.tsx, for(), submit()]
- "src_main_finance": "Finance()" | kind=code-symbol | source=web/src/main.tsx:L1171 | neighbors=[main.tsx, money(), today()]
- "src_main_for": "for()" | kind=code-symbol | source=web/src/main.tsx:L543 | neighbors=[main.tsx, api(), monthly()]
- "src_main_money": "money()" | kind=code-symbol | source=web/src/main.tsx:L1144 | neighbors=[main.tsx, Dashboard(), Finance()]
- "src_main_monthly": "monthly()" | kind=code-symbol | source=web/src/main.tsx:L204 | neighbors=[main.tsx, for(), submit()]
- "src_main_submit": "submit()" | kind=code-symbol | source=web/src/main.tsx:L293 | neighbors=[main.tsx, api(), monthly()]
- "tests_dashboard_smoke": "dashboard-smoke.mjs" | kind=code-symbol | source=tests/dashboard-smoke.mjs:L1 | neighbors=[a56a353 feat: priorizar filas acionávei…, dashboard(), login()]
- "tests_finance_test": "finance.test.ts" | kind=code-symbol | source=tests/finance.test.ts:L1 | neighbors=[2dd873d feat: consolidar financeiro úni…, finance.ts, validFinancialEntry()]
- "db_seed_seeddemo": "seedDemo()" | kind=code-symbol | source=src/db/seed.ts:L6 | neighbors=[seed.ts, server.ts]
- "domain_csv_import_sanitizecsvcell": "sanitizeCsvCell()" | kind=code-symbol | source=src/domain/csv-import.ts:L54 | neighbors=[csv-import.ts, csv-import.test.ts]

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
