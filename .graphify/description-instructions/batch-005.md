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

- "migrations_007_inventory_products": "products" | kind=code-symbol | source=migrations/007_inventory.sql:L1 | neighbors=[007_inventory.sql, inventory_movements]
- "migrations_007_inventory_trg_prevent_inventory_movement_modification": "trg_prevent_inventory_movement_modification" | kind=code-symbol | source=migrations/007_inventory.sql:L32 | neighbors=[007_inventory.sql, inventory_movements]
- "migrations_007_inventory_users": "users" | kind=code-symbol | source=migrations/007_inventory.sql:L18 | neighbors=[007_inventory.sql, inventory_movements]
- "migrations_009_attachments_patients": "patients" | kind=code-symbol | source=migrations/009_attachments.sql:L3 | neighbors=[009_attachments.sql, patient_attachments]
- "migrations_009_attachments_users": "users" | kind=code-symbol | source=migrations/009_attachments.sql:L9 | neighbors=[009_attachments.sql, patient_attachments]
- "migrations_012_services_and_inventory_products": "products" | kind=code-symbol | source=migrations/012_services_and_inventory.sql:L17 | neighbors=[012_services_and_inventory.sql, service_products]
- "migrations_012_services_and_inventory_services": "services" | kind=code-symbol | source=migrations/012_services_and_inventory.sql:L3 | neighbors=[012_services_and_inventory.sql, service_products]
- "migrations_013_responsible_doctor": "013_responsible_doctor.sql" | kind=code-symbol | source=migrations/013_responsible_doctor.sql:L1 | neighbors=[91c499c Merge branch 'codex/02-medico-r…, b0009ad feat(patients): adicionar medic…]
- "playwright_config": "playwright.config.ts" | kind=code-symbol | source=playwright.config.ts:L1 | neighbors=[0e1c4ad test: consolidar QA, acessibili…, 75e42fd fix(ui): aplicar flex min-width…]
- "src_app_buildapp": "buildApp()" | kind=code-symbol | source=src/app.ts:L73 | neighbors=[app.ts, server.ts]
- "src_main_dashboard": "Dashboard()" | kind=code-symbol | source=web/src/main.tsx:L1610 | neighbors=[main.tsx, money()]
- "src_main_date": "date()" | kind=code-symbol | source=web/src/main.tsx:L134 | neighbors=[main.tsx, PatientRecord()]
- "src_main_doctorcalendar": "DoctorCalendar()" | kind=code-symbol | source=web/src/main.tsx:L2155 | neighbors=[main.tsx, today()]
- "src_main_patientrecord": "PatientRecord()" | kind=code-symbol | source=web/src/main.tsx:L604 | neighbors=[main.tsx, date()]
- "src_main_saleform": "SaleForm()" | kind=code-symbol | source=web/src/main.tsx:L171 | neighbors=[main.tsx, today()]
- "tests_devsec_smoke": "devsec-smoke.mjs" | kind=code-symbol | source=tests/devsec-smoke.mjs:L1 | neighbors=[0e1c4ad test: consolidar QA, acessibili…, login()]
- "db_create_admin_email": "email" | kind=code-symbol | source=src/db/create-admin.ts:L6 | neighbors=[create-admin.ts]
- "domain_attachments_allowed_mime_types": "ALLOWED_MIME_TYPES" | kind=code-symbol | source=src/domain/attachments.ts:L3 | neighbors=[attachments.ts]
- "domain_attachments_allowedmimetype": "AllowedMimeType" | kind=code-symbol | source=src/domain/attachments.ts:L10 | neighbors=[attachments.ts]
- "domain_csv_import_csvfinancialrow": "CsvFinancialRow" | kind=code-symbol | source=src/domain/csv-import.ts:L27 | neighbors=[csv-import.ts]
- "domain_csv_import_csvpatientrow": "CsvPatientRow" | kind=code-symbol | source=src/domain/csv-import.ts:L16 | neighbors=[csv-import.ts]
- "domain_csv_import_parsedcsv": "ParsedCsv" | kind=code-symbol | source=src/domain/csv-import.ts:L38 | neighbors=[csv-import.ts]
- "domain_doctors_calendarday": "CalendarDay" | kind=code-symbol | source=src/domain/doctors.ts:L7 | neighbors=[doctors.ts]
- "domain_inventory_inventorymovement": "InventoryMovement" | kind=code-symbol | source=src/domain/inventory.ts:L17 | neighbors=[inventory.ts]
- "domain_inventory_movement_types": "MOVEMENT_TYPES" | kind=code-symbol | source=src/domain/inventory.ts:L4 | neighbors=[inventory.ts]
- "domain_inventory_movementtype": "MovementType" | kind=code-symbol | source=src/domain/inventory.ts:L5 | neighbors=[inventory.ts]
- "domain_inventory_product": "Product" | kind=code-symbol | source=src/domain/inventory.ts:L7 | neighbors=[inventory.ts]
- "domain_patients_contactsource": "ContactSource" | kind=code-symbol | source=src/domain/patients.ts:L6 | neighbors=[patients.ts]
- "domain_patients_patienteventtype": "PatientEventType" | kind=code-symbol | source=src/domain/patients.ts:L7 | neighbors=[patients.ts]
- "domain_patients_patientstatus": "PatientStatus" | kind=code-symbol | source=src/domain/patients.ts:L5 | neighbors=[patients.ts]
- "domain_services_serviceinput": "ServiceInput" | kind=code-symbol | source=src/domain/services.ts:L8 | neighbors=[services.ts]
- "domain_services_serviceitem": "ServiceItem" | kind=code-symbol | source=src/domain/services.ts:L17 | neighbors=[services.ts]
- "domain_services_serviceproductinput": "ServiceProductInput" | kind=code-symbol | source=src/domain/services.ts:L3 | neighbors=[services.ts]
- "e2e_critical_flow_spec_accessible": "accessible()" | kind=code-symbol | source=tests/e2e/critical-flow.spec.ts:L12 | neighbors=[critical-flow.spec.ts]
- "e2e_critical_flow_spec_login": "login()" | kind=code-symbol | source=tests/e2e/critical-flow.spec.ts:L4 | neighbors=[critical-flow.spec.ts]
- "migrations_001_base_company_accounts": "company_accounts" | kind=code-symbol | source=migrations/001_base.sql:L23 | neighbors=[001_base.sql]
- "migrations_001_base_reject_audit_changes": "reject_audit_changes()" | kind=code-symbol | source=migrations/001_base.sql:L42 | neighbors=[001_base.sql]
- "migrations_002_crm_patients_reject_patient_deletion": "reject_patient_deletion()" | kind=code-symbol | source=migrations/002_crm_patients.sql:L24 | neighbors=[002_crm_patients.sql]
- "migrations_002_crm_patients_reject_patient_event_changes": "reject_patient_event_changes()" | kind=code-symbol | source=migrations/002_crm_patients.sql:L41 | neighbors=[002_crm_patients.sql]
- "migrations_003_follow_up_tasks_reject_follow_up_deletion": "reject_follow_up_deletion()" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L19 | neighbors=[003_follow_up_tasks.sql]

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
