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
For an entity node (any other kind — e.g. a person, place, event, object),
describe what the entity is and its role, grounded in its type, its
relations (neighbors) and the provided citations/evidence — e.g.
"Lady Carfax, a wealthy heiress who disappears en route to Lausanne.".
Ground entity descriptions in the citations/evidence when present; do not
speculate beyond the context, so a node with no supporting context may be
left out of the reply.
Write every description in English (en). Do not switch languages.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "domain_patients_validpatientphone": "validPatientPhone()" | kind=code-symbol | source=src/domain/patients.ts:L12 | neighbors=[csv-import.ts, patients.ts, normalizePhone(), whatsapp.ts, app.ts, patients.test.ts]
- "domain_privacy": "privacy.ts" | kind=code-symbol | source=src/domain/privacy.ts:L1 | neighbors=[ee6a73e feat(privacy): adicionar regras…, anonymizePatientName(), formatLgpdExportPackage(), isAnonymized(), app.ts, privacy.test.ts]
- "domain_security_hashpassword": "hashPassword()" | kind=code-symbol | source=src/domain/security.ts:L5 | neighbors=[create-admin.ts, seed.ts, security.ts, scrypt, app.ts, security.test.ts]
- "migrations_004_sales_receivable_installments": "receivable_installments" | kind=code-symbol | source=migrations/004_sales.sql:L25 | neighbors=[004_sales.sql, check_sale_installment_total(), financial_entries, sales, receivable_installments_immutable, receivable_installments_total]
- "migrations_007_inventory": "007_inventory.sql" | kind=code-symbol | source=migrations/007_inventory.sql:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, inventory_movements, prevent_inventory_movement_modification…, products, trg_prevent_inventory_movement_modifica…, users]
- "tests_attachments_test": "attachments.test.ts" | kind=code-symbol | source=tests/attachments.test.ts:L1 | neighbors=[a7b6a8a feat(attachments): adicionar va…, attachments.ts, calculateFileHash(), sanitizeFilename(), validFileSize(), validMimeType()]
- "tests_security_test": "security.test.ts" | kind=code-symbol | source=tests/security.test.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, security.ts, hashPassword(), hashToken(), validCnpj(), verifyPassword()]
- "commit:repo:github.com/millennium42/Fonolife@bacc0034551890f1fcab390d37f4e7c45d66c7db": "bacc003 Merge branch 'codex/fix-seed-fk-constraint' into main" | kind=Commit | source=git | neighbors=[552fbd9 chore: atualizar grafo de conhe…, codex/quick-demo-login-buttons, main, seed.ts, e6906b3 fix(seed): resolver IDs existen…]
- "domain_doctors": "doctors.ts" | kind=code-symbol | source=src/domain/doctors.ts:L1 | neighbors=[5fe1e04 feat(doctor): adicionar perfil …, buildCalendarDays(), CalendarDay, validLicenseNumber(), doctors.test.ts]
- "domain_follow_ups": "follow-ups.ts" | kind=code-symbol | source=src/domain/follow-ups.ts:L1 | neighbors=[ff35345 feat: tornar o pós-atendimento …, FOLLOW_UP_FILTERS, saoPauloDate(), app.ts, follow-ups.test.ts]
- "domain_patients_isoneof": "isOneOf()" | kind=code-symbol | source=src/domain/patients.ts:L9 | neighbors=[csv-import.ts, inventory.ts, patients.ts, app.ts, patients.test.ts]
- "domain_sales_validcents": "validCents()" | kind=code-symbol | source=src/domain/sales.ts:L6 | neighbors=[finance.ts, inventory.ts, sales.ts, splitMonthly(), validateInstallments()]
- "domain_services_validservice": "validService()" | kind=code-symbol | source=src/domain/services.ts:L33 | neighbors=[services.ts, validExecutionTime(), validServiceName(), app.ts, services.test.ts]
- "migrations_003_follow_up_tasks_follow_up_tasks": "follow_up_tasks" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L1 | neighbors=[003_follow_up_tasks.sql, patients, users, follow_up_tasks_no_delete, follow_up_tasks_restrict_update]
- "migrations_004_sales_check_sale_installment_total": "check_sale_installment_total()" | kind=code-symbol | source=migrations/004_sales.sql:L84 | neighbors=[004_sales.sql, actual, expected, receivable_installments, sales]
- "migrations_012_services_and_inventory": "012_services_and_inventory.sql" | kind=code-symbol | source=migrations/012_services_and_inventory.sql:L1 | neighbors=[264533a feat(services): adicionar migra…, d7896dd Merge branch 'codex/01-servicos…, products, service_products, services]
- "src_config_config": "config" | kind=code-symbol | source=src/config.ts:L1 | neighbors=[pool.ts, seed.ts, app.ts, config.ts, server.ts]
- "tests_privacy_test": "privacy.test.ts" | kind=code-symbol | source=tests/privacy.test.ts:L1 | neighbors=[ee6a73e feat(privacy): adicionar regras…, privacy.ts, anonymizePatientName(), formatLgpdExportPackage(), isAnonymized()]
- "tests_whatsapp_test": "whatsapp.test.ts" | kind=code-symbol | source=tests/whatsapp.test.ts:L1 | neighbors=[5ccde91 feat: implementar atalhos rápid…, whatsapp.ts, buildWhatsAppLink(), formatE164Phone(), WHATSAPP_TEMPLATES]
- "domain_patients_patient_statuses": "PATIENT_STATUSES" | kind=code-symbol | source=src/domain/patients.ts:L1 | neighbors=[csv-import.ts, patients.ts, app.ts, patients.test.ts]
- "domain_sales_validateinstallments": "validateInstallments()" | kind=code-symbol | source=src/domain/sales.ts:L10 | neighbors=[sales.ts, validCents(), app.ts, sales.test.ts]
- "domain_security_verifypassword": "verifyPassword()" | kind=code-symbol | source=src/domain/security.ts:L11 | neighbors=[security.ts, scrypt, app.ts, security.test.ts]
- "migrations_002_crm_patients_patient_events": "patient_events" | kind=code-symbol | source=migrations/002_crm_patients.sql:L30 | neighbors=[002_crm_patients.sql, patients, users, patient_events_immutable]
- "migrations_002_crm_patients_patients": "patients" | kind=code-symbol | source=migrations/002_crm_patients.sql:L1 | neighbors=[002_crm_patients.sql, patient_events, users, patients_no_delete]
- "migrations_006_csv_imports": "006_csv_imports.sql" | kind=code-symbol | source=migrations/006_csv_imports.sql:L1 | neighbors=[98e15b2 feat: implementar importação CS…, csv_import_errors, csv_import_jobs, users]
- "migrations_007_inventory_inventory_movements": "inventory_movements" | kind=code-symbol | source=migrations/007_inventory.sql:L12 | neighbors=[007_inventory.sql, products, users, trg_prevent_inventory_movement_modifica…]
- "migrations_009_attachments": "009_attachments.sql" | kind=code-symbol | source=migrations/009_attachments.sql:L1 | neighbors=[c067885 feat(attachments): adicionar mi…, patient_attachments, patients, users]
- "src_main_today": "today()" | kind=code-symbol | source=web/src/main.tsx:L147 | neighbors=[main.tsx, DoctorCalendar(), Finance(), SaleForm()]
- "tests_follow_ups_test": "follow-ups.test.ts" | kind=code-symbol | source=tests/follow-ups.test.ts:L1 | neighbors=[ff35345 feat: tornar o pós-atendimento …, follow-ups.ts, FOLLOW_UP_FILTERS, saoPauloDate()]
- "tests_sales_test": "sales.test.ts" | kind=code-symbol | source=tests/sales.test.ts:L1 | neighbors=[a740db5 feat: registrar vendas com parc…, sales.ts, splitMonthly(), validateInstallments()]
- "db_migrate_migrate": "migrate()" | kind=code-symbol | source=src/db/migrate.ts:L7 | neighbors=[create-admin.ts, migrate.ts, server.ts]
- "domain_attachments_calculatefilehash": "calculateFileHash()" | kind=code-symbol | source=src/domain/attachments.ts:L43 | neighbors=[attachments.ts, app.ts, attachments.test.ts]
- "domain_attachments_sanitizefilename": "sanitizeFilename()" | kind=code-symbol | source=src/domain/attachments.ts:L16 | neighbors=[attachments.ts, app.ts, attachments.test.ts]
- "domain_attachments_validfilesize": "validFileSize()" | kind=code-symbol | source=src/domain/attachments.ts:L35 | neighbors=[attachments.ts, app.ts, attachments.test.ts]
- "domain_attachments_validmimetype": "validMimeType()" | kind=code-symbol | source=src/domain/attachments.ts:L27 | neighbors=[attachments.ts, app.ts, attachments.test.ts]
- "domain_csv_import_calculatecsvhash": "calculateCsvHash()" | kind=code-symbol | source=src/domain/csv-import.ts:L46 | neighbors=[csv-import.ts, app.ts, csv-import.test.ts]
- "domain_csv_import_parsecsv": "parseCsv()" | kind=code-symbol | source=src/domain/csv-import.ts:L66 | neighbors=[csv-import.ts, app.ts, csv-import.test.ts]
- "domain_csv_import_validatefinancialcsvrow": "validateFinancialCsvRow()" | kind=code-symbol | source=src/domain/csv-import.ts:L162 | neighbors=[csv-import.ts, app.ts, csv-import.test.ts]
- "domain_csv_import_validatepatientcsvrow": "validatePatientCsvRow()" | kind=code-symbol | source=src/domain/csv-import.ts:L121 | neighbors=[csv-import.ts, app.ts, csv-import.test.ts]
- "domain_finance_validfinancialentry": "validFinancialEntry()" | kind=code-symbol | source=src/domain/finance.ts:L6 | neighbors=[finance.ts, app.ts, finance.test.ts]

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
