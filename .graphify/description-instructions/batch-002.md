# Node Description Batch 3 of 8

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

- "tests_doctors_test": "doctors.test.ts" | kind=code-symbol | source=tests/doctors.test.ts:L1 | neighbors=[5fe1e04 feat(doctor): adicionar perfil …, 91c499c Merge branch 'codex/02-medico-r…, b0009ad feat(patients): adicionar medic…, patients.ts, validDoctorId(), doctors.ts]
- "tests_services_test": "services.test.ts" | kind=code-symbol | source=tests/services.test.ts:L1 | neighbors=[264533a feat(services): adicionar migra…, d7896dd Merge branch 'codex/01-servicos…, inventory.ts, validProduct(), services.ts, validExecutionTime()]
- "db_pool_pool": "pool" | kind=code-symbol | source=src/db/pool.ts:L9 | neighbors=[routes.ts, create-admin.ts, migrate.ts, pool.ts, seed.ts, app.ts]
- "domain_security_hashpassword": "hashPassword()" | kind=code-symbol | source=src/domain/security.ts:L5 | neighbors=[routes.ts, create-admin.ts, seed.ts, security.ts, scrypt, app.ts]
- "migrations_001_base": "001_base.sql" | kind=code-symbol | source=migrations/001_base.sql:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, audit_events, audit_events_immutable, company_accounts, reject_audit_changes(), user_sessions]
- "migrations_003_follow_up_tasks_restrict_follow_up_update": "restrict_follow_up_update()" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L25 | neighbors=[003_follow_up_tasks.sql, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id]
- "tests_csv_import_test": "csv-import.test.ts" | kind=code-symbol | source=tests/csv-import.test.ts:L1 | neighbors=[98e15b2 feat: implementar importação CS…, csv-import.ts, calculateCsvHash(), parseCsv(), sanitizeCsvCell(), validateFinancialCsvRow()]
- "tests_finance_smoke": "finance-smoke.mjs" | kind=code-symbol | source=tests/finance-smoke.mjs:L1 | neighbors=[2dd873d feat: consolidar financeiro úni…, accounts, call(), clientRequestId, login(), payload]
- "tests_inventory_test": "inventory.test.ts" | kind=code-symbol | source=tests/inventory.test.ts:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, inventory.ts, validInventoryMovement(), validProduct(), validProductBrand(), validProductModel()]
- "tests_patients_test": "patients.test.ts" | kind=code-symbol | source=tests/patients.test.ts:L1 | neighbors=[0d2db0f feat: centralizar cadastro e hi…, patients.ts, isOneOf(), normalizePhone(), PATIENT_EVENT_TYPES, PATIENT_STATUSES]
- "db_migrate": "migrate.ts" | kind=code-symbol | source=src/db/migrate.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, create-admin.ts, migrate(), pool.ts, pool, server.ts]
- "domain_patients_normalizephone": "normalizePhone()" | kind=code-symbol | source=src/domain/patients.ts:L10 | neighbors=[csv-import.ts, patients.ts, validPatientPhone(), whatsapp.ts, app.ts, patients.test.ts]
- "domain_patients_validpatientphone": "validPatientPhone()" | kind=code-symbol | source=src/domain/patients.ts:L12 | neighbors=[csv-import.ts, patients.ts, normalizePhone(), whatsapp.ts, app.ts, patients.test.ts]
- "domain_privacy": "privacy.ts" | kind=code-symbol | source=src/domain/privacy.ts:L1 | neighbors=[ee6a73e feat(privacy): adicionar regras…, anonymizePatientName(), formatLgpdExportPackage(), isAnonymized(), app.ts, privacy.test.ts]
- "migrations_004_sales_receivable_installments": "receivable_installments" | kind=code-symbol | source=migrations/004_sales.sql:L25 | neighbors=[004_sales.sql, check_sale_installment_total(), financial_entries, sales, receivable_installments_immutable, receivable_installments_total]
- "migrations_007_inventory": "007_inventory.sql" | kind=code-symbol | source=migrations/007_inventory.sql:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, inventory_movements, prevent_inventory_movement_modification…, products, trg_prevent_inventory_movement_modifica…, users]
- "src_config_config": "config" | kind=code-symbol | source=src/config.ts:L9 | neighbors=[routes.ts, pool.ts, seed.ts, app.ts, config.ts, server.ts]
- "domain_doctors": "doctors.ts" | kind=code-symbol | source=src/domain/doctors.ts:L1 | neighbors=[5fe1e04 feat(doctor): adicionar perfil …, buildCalendarDays(), CalendarDay, validLicenseNumber(), doctors.test.ts]
- "domain_follow_ups": "follow-ups.ts" | kind=code-symbol | source=src/domain/follow-ups.ts:L1 | neighbors=[ff35345 feat: tornar o pós-atendimento …, FOLLOW_UP_FILTERS, saoPauloDate(), app.ts, follow-ups.test.ts]
- "domain_patients_isoneof": "isOneOf()" | kind=code-symbol | source=src/domain/patients.ts:L9 | neighbors=[csv-import.ts, inventory.ts, patients.ts, app.ts, patients.test.ts]
- "domain_sales_validcents": "validCents()" | kind=code-symbol | source=src/domain/sales.ts:L6 | neighbors=[finance.ts, inventory.ts, sales.ts, splitMonthly(), validateInstallments()]
- "domain_security_canreadpatient": "canReadPatient()" | kind=code-symbol | source=src/domain/security.ts:L42 | neighbors=[security.ts, canReadAttachment(), canWritePatient(), app.ts, security.test.ts]
- "domain_security_verifypassword": "verifyPassword()" | kind=code-symbol | source=src/domain/security.ts:L11 | neighbors=[routes.ts, security.ts, scrypt, app.ts, security.test.ts]
- "domain_services_validservice": "validService()" | kind=code-symbol | source=src/domain/services.ts:L33 | neighbors=[services.ts, validExecutionTime(), validServiceName(), app.ts, services.test.ts]
- "migrations_003_follow_up_tasks_follow_up_tasks": "follow_up_tasks" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L1 | neighbors=[003_follow_up_tasks.sql, patients, users, follow_up_tasks_no_delete, follow_up_tasks_restrict_update]
- "migrations_004_sales_check_sale_installment_total": "check_sale_installment_total()" | kind=code-symbol | source=migrations/004_sales.sql:L84 | neighbors=[004_sales.sql, actual, expected, receivable_installments, sales]
- "migrations_012_services_and_inventory": "012_services_and_inventory.sql" | kind=code-symbol | source=migrations/012_services_and_inventory.sql:L1 | neighbors=[264533a feat(services): adicionar migra…, d7896dd Merge branch 'codex/01-servicos…, products, service_products, services]
- "tests_privacy_test": "privacy.test.ts" | kind=code-symbol | source=tests/privacy.test.ts:L1 | neighbors=[ee6a73e feat(privacy): adicionar regras…, privacy.ts, anonymizePatientName(), formatLgpdExportPackage(), isAnonymized()]
- "tests_whatsapp_test": "whatsapp.test.ts" | kind=code-symbol | source=tests/whatsapp.test.ts:L1 | neighbors=[5ccde91 feat: implementar atalhos rápid…, whatsapp.ts, buildWhatsAppLink(), formatE164Phone(), WHATSAPP_TEMPLATES]
- "domain_csv_import_parsecsv": "parseCsv()" | kind=code-symbol | source=src/domain/csv-import.ts:L66 | neighbors=[csv-import.ts, sanitizeCsvCell(), app.ts, csv-import.test.ts]
- "domain_patients_patient_statuses": "PATIENT_STATUSES" | kind=code-symbol | source=src/domain/patients.ts:L1 | neighbors=[csv-import.ts, patients.ts, app.ts, patients.test.ts]
- "domain_sales_validateinstallments": "validateInstallments()" | kind=code-symbol | source=src/domain/sales.ts:L10 | neighbors=[sales.ts, validCents(), app.ts, sales.test.ts]
- "domain_security_canreadattachment": "canReadAttachment()" | kind=code-symbol | source=src/domain/security.ts:L64 | neighbors=[security.ts, canReadPatient(), app.ts, security.test.ts]
- "domain_security_canwritepatient": "canWritePatient()" | kind=code-symbol | source=src/domain/security.ts:L51 | neighbors=[security.ts, canReadPatient(), app.ts, security.test.ts]
- "domain_security_hashtoken": "hashToken()" | kind=code-symbol | source=src/domain/security.ts:L18 | neighbors=[routes.ts, security.ts, app.ts, security.test.ts]
- "migrations_002_crm_patients_patient_events": "patient_events" | kind=code-symbol | source=migrations/002_crm_patients.sql:L30 | neighbors=[002_crm_patients.sql, patients, users, patient_events_immutable]
- "migrations_002_crm_patients_patients": "patients" | kind=code-symbol | source=migrations/002_crm_patients.sql:L1 | neighbors=[002_crm_patients.sql, patient_events, users, patients_no_delete]
- "migrations_006_csv_imports": "006_csv_imports.sql" | kind=code-symbol | source=migrations/006_csv_imports.sql:L1 | neighbors=[98e15b2 feat: implementar importação CS…, csv_import_errors, csv_import_jobs, users]
- "migrations_007_inventory_inventory_movements": "inventory_movements" | kind=code-symbol | source=migrations/007_inventory.sql:L12 | neighbors=[007_inventory.sql, products, users, trg_prevent_inventory_movement_modifica…]
- "migrations_009_attachments": "009_attachments.sql" | kind=code-symbol | source=migrations/009_attachments.sql:L1 | neighbors=[c067885 feat(attachments): adicionar mi…, patient_attachments, patients, users]

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
