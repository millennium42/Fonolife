# Node Description Batch 4 of 11

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
Write every description in Portuguese (pt). Do not switch languages.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "migrations_003_follow_up_tasks_restrict_follow_up_update": "restrict_follow_up_update()" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L25 | neighbors=[003_follow_up_tasks.sql, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id]
- "src_config_config": "config" | kind=code-symbol | source=src/config.ts:L14 | neighbors=[middleware.ts, routes.ts, pool.ts, seed.ts, app.ts, config.ts]
- "tests_finance_smoke": "finance-smoke.mjs" | kind=code-symbol | source=tests/finance-smoke.mjs:L1 | neighbors=[2dd873d feat: consolidar financeiro úni…, accounts, call(), clientRequestId, login(), payload]
- "tests_inventory_test": "inventory.test.ts" | kind=code-symbol | source=tests/inventory.test.ts:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, inventory.ts, validInventoryMovement(), validProduct(), validProductBrand(), validProductModel()]
- "tests_patients_test": "patients.test.ts" | kind=code-symbol | source=tests/patients.test.ts:L1 | neighbors=[0d2db0f feat: centralizar cadastro e hi…, patients.ts, isOneOf(), normalizePhone(), PATIENT_EVENT_TYPES, PATIENT_STATUSES]
- "auth_middleware_getratelimitkey": "getRateLimitKey()" | kind=code-symbol | source=src/modules/auth/middleware.ts:L9 | neighbors=[middleware.ts, clearLoginFailures(), isLoginRateLimited(), recordLoginFailure(), auth-csrf-hardening.test.ts, auth-session.test.ts]
- "commit:repo:github.com/millennium42/Fonolife@438f52a08c9cb78979f708906c0150e3db0ebd63": "438f52a fix(auth): tornar revogação de sessões comprovável" | kind=Commit | source=git | neighbors=[middleware.ts, codex/pr-05-auth-csrf-hardening, 1af0f9a docs(auth): documentar origem, …, auth-csrf-hardening.test.ts, auth-session.test.ts, 7e2a065 fix(auth): remover fallback sil…]
- "commit:repo:github.com/millennium42/Fonolife@4b82016d02e0a670cc6738d1e836b7ac2a9ae6bd": "4b82016 fix(import): versionar hash e idempotência concorrente" | kind=Commit | source=git | neighbors=[2945f8e refactor(import): adotar parser…, codex/pr-05-auth-csrf-hardening, main, 5648d01 feat(validation): aplicar schem…, routes.ts, codex/pr-04-csv-validation]
- "commit:repo:github.com/millennium42/Fonolife@5648d015bd1297d29c1d4f480d9bffee09145b8b": "5648d01 feat(validation): aplicar schemas ao módulo de importação" | kind=Commit | source=git | neighbors=[4b82016 fix(import): versionar hash e i…, codex/pr-05-auth-csrf-hardening, main, 5c00115 docs(import): documentar format…, app.ts, codex/pr-04-csv-validation]
- "commit:repo:github.com/millennium42/Fonolife@733ff418eec1259b9a805218440a84d835b15545": "733ff41 docs(auth): documentar sessão, proxy e recuperação" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, main, a81a149 chore(graphify): atualizar graf…, 80a2483 feat(admin): criar bootstrap se…, codex/pr-03-auth-session-reliability, codex/pr-04-csv-validation]
- "commit:repo:github.com/millennium42/Fonolife@a81a149c869ef3ea9c1c0d5666446c976302a74f": "a81a149 chore(graphify): atualizar grafo de conhecimento apos refatoracao de au…" | kind=Commit | source=git | neighbors=[733ff41 docs(auth): documentar sessão, …, codex/pr-05-auth-csrf-hardening, main, c1ef4e2 test(import): adicionar fixture…, codex/pr-03-auth-session-reliability, codex/pr-04-csv-validation]
- "commit:repo:github.com/millennium42/Fonolife@c1ef4e21cff70a3c1559a40397b2a3dfe4dc42f3": "c1ef4e2 test(import): adicionar fixtures RFC 4180 e casos inválidos" | kind=Commit | source=git | neighbors=[a81a149 chore(graphify): atualizar graf…, codex/pr-05-auth-csrf-hardening, main, 2945f8e refactor(import): adotar parser…, csv-fixtures.test.ts, codex/pr-04-csv-validation]
- "db_migrate": "migrate.ts" | kind=code-symbol | source=src/db/migrate.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, create-admin.ts, migrate(), pool.ts, pool, server.ts]
- "domain_csv_import_parsecsv": "parseCsv()" | kind=code-symbol | source=src/domain/csv-import.ts:L108 | neighbors=[csv-import.ts, routes.ts, app.ts, csv-fixtures.test.ts, csv-import.test.ts, sanitizeCsvCell()]
- "domain_csv_import_validatepatientcsvrow": "validatePatientCsvRow()" | kind=code-symbol | source=src/domain/csv-import.ts:L253 | neighbors=[csv-import.ts, isValidCivilDate(), routes.ts, app.ts, csv-fixtures.test.ts, csv-import.test.ts]
- "domain_patients_normalizephone": "normalizePhone()" | kind=code-symbol | source=src/domain/patients.ts:L10 | neighbors=[csv-import.ts, patients.ts, validPatientPhone(), whatsapp.ts, app.ts, patients.test.ts]
- "domain_patients_validpatientphone": "validPatientPhone()" | kind=code-symbol | source=src/domain/patients.ts:L12 | neighbors=[csv-import.ts, patients.ts, normalizePhone(), whatsapp.ts, app.ts, patients.test.ts]
- "domain_security_canreadpatient": "canReadPatient()" | kind=code-symbol | source=src/domain/security.ts:L43 | neighbors=[security.ts, canReadAttachment(), canWritePatient(), app.ts, security-object-lgpd.test.ts, security.test.ts]
- "migrations_004_sales_receivable_installments": "receivable_installments" | kind=code-symbol | source=migrations/004_sales.sql:L25 | neighbors=[004_sales.sql, check_sale_installment_total(), financial_entries, sales, receivable_installments_immutable, receivable_installments_total]
- "migrations_007_inventory": "007_inventory.sql" | kind=code-symbol | source=migrations/007_inventory.sql:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, inventory_movements, prevent_inventory_movement_modification…, products, trg_prevent_inventory_movement_modifica…, users]
- "auth_middleware_isloginratelimited": "isLoginRateLimited()" | kind=code-symbol | source=src/modules/auth/middleware.ts:L23 | neighbors=[middleware.ts, getRateLimitKey(), routes.ts, auth-csrf-hardening.test.ts, auth-session.test.ts]
- "auth_middleware_recordloginfailure": "recordLoginFailure()" | kind=code-symbol | source=src/modules/auth/middleware.ts:L55 | neighbors=[middleware.ts, getRateLimitKey(), routes.ts, auth-csrf-hardening.test.ts, auth-session.test.ts]
- "auth_middleware_revokeusersessions": "revokeUserSessions()" | kind=code-symbol | source=src/modules/auth/middleware.ts:L113 | neighbors=[middleware.ts, routes.ts, app.ts, auth-csrf-hardening.test.ts, auth-session.test.ts]
- "commit:repo:github.com/millennium42/Fonolife@5c001158883c49947b61534f6a16cc6432768cf7": "5c00115 docs(import): documentar formato, erros e reprocessamento" | kind=Commit | source=git | neighbors=[5648d01 feat(validation): aplicar schem…, codex/pr-05-auth-csrf-hardening, main, 913308b chore(graphify): atualizar graf…, codex/pr-04-csv-validation]
- "domain_attachments_calculatefilehash": "calculateFileHash()" | kind=code-symbol | source=src/domain/attachments.ts:L271 | neighbors=[attachments.ts, .save(), .save(), app.ts, attachments.test.ts]
- "domain_attachments_devattachmentscanner": "DevAttachmentScanner" | kind=code-symbol | source=src/domain/attachments.ts:L194 | neighbors=[attachments.ts, AttachmentScanner, .scan(), app.ts, secure-attachments.test.ts]
- "domain_attachments_localattachmentstorage_getfilepath": ".getFilePath()" | kind=code-symbol | source=src/domain/attachments.ts:L41 | neighbors=[LocalAttachmentStorage, .delete(), .exists(), .getStream(), .save()]
- "domain_csv_import_calculateversionedcsvhash": "calculateVersionedCsvHash()" | kind=code-symbol | source=src/domain/csv-import.ts:L48 | neighbors=[csv-import.ts, calculateCsvHash(), routes.ts, csv-fixtures.test.ts, csv-import.test.ts]
- "domain_doctors": "doctors.ts" | kind=code-symbol | source=src/domain/doctors.ts:L1 | neighbors=[5fe1e04 feat(doctor): adicionar perfil …, buildCalendarDays(), CalendarDay, validLicenseNumber(), doctors.test.ts]
- "domain_follow_ups": "follow-ups.ts" | kind=code-symbol | source=src/domain/follow-ups.ts:L1 | neighbors=[ff35345 feat: tornar o pós-atendimento …, FOLLOW_UP_FILTERS, saoPauloDate(), app.ts, follow-ups.test.ts]
- "domain_patients_isoneof": "isOneOf()" | kind=code-symbol | source=src/domain/patients.ts:L9 | neighbors=[csv-import.ts, inventory.ts, patients.ts, app.ts, patients.test.ts]
- "domain_sales_validcents": "validCents()" | kind=code-symbol | source=src/domain/sales.ts:L6 | neighbors=[finance.ts, inventory.ts, sales.ts, splitMonthly(), validateInstallments()]
- "domain_security_canreadattachment": "canReadAttachment()" | kind=code-symbol | source=src/domain/security.ts:L71 | neighbors=[security.ts, canReadPatient(), app.ts, security-object-lgpd.test.ts, security.test.ts]
- "domain_security_canwritepatient": "canWritePatient()" | kind=code-symbol | source=src/domain/security.ts:L55 | neighbors=[security.ts, canReadPatient(), app.ts, security-object-lgpd.test.ts, security.test.ts]
- "domain_security_verifypassword": "verifyPassword()" | kind=code-symbol | source=src/domain/security.ts:L11 | neighbors=[routes.ts, security.ts, scrypt, app.ts, security.test.ts]
- "domain_services_validservice": "validService()" | kind=code-symbol | source=src/domain/services.ts:L33 | neighbors=[services.ts, validExecutionTime(), validServiceName(), app.ts, services.test.ts]
- "migrations_003_follow_up_tasks_follow_up_tasks": "follow_up_tasks" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L1 | neighbors=[003_follow_up_tasks.sql, patients, users, follow_up_tasks_no_delete, follow_up_tasks_restrict_update]
- "migrations_004_sales_check_sale_installment_total": "check_sale_installment_total()" | kind=code-symbol | source=migrations/004_sales.sql:L84 | neighbors=[004_sales.sql, actual, expected, receivable_installments, sales]
- "migrations_012_services_and_inventory": "012_services_and_inventory.sql" | kind=code-symbol | source=migrations/012_services_and_inventory.sql:L1 | neighbors=[264533a feat(services): adicionar migra…, d7896dd Merge branch 'codex/01-servicos…, products, service_products, services]
- "src_app_buildapp": "buildApp()" | kind=code-symbol | source=src/app.ts:L86 | neighbors=[app.ts, server.ts, auth-csrf-hardening.test.ts, auth-session.test.ts, security-object-lgpd.test.ts]

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
