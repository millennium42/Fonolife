# Node Description Batch 3 of 9

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
Write every description in Dutch (nl). Do not switch languages.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "commit:repo:github.com/millennium42/Fonolife@a01c4f0b6281d0c7b01db1b4c47ea4f9787c489a": "a01c4f0 fix(security): centralizar carregamento e autorizacao de pacientes" | kind=Commit | source=git | neighbors=[0b8c651 fix(csrf): endurecer validacao …, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, main, cbaee24 docs(security): documentar matr…, security.ts]
- "db_create_admin": "create-admin.ts" | kind=code-symbol | source=src/db/create-admin.ts:L1 | neighbors=[0e1c4ad test: consolidar QA, acessibili…, email, migrate.ts, migrate(), pool.ts, pool]
- "domain_inventory_validproduct": "validProduct()" | kind=code-symbol | source=src/domain/inventory.ts:L43 | neighbors=[inventory.ts, validNonNegativeCents(), validProductBrand(), validProductModel(), validProductName(), app.ts]
- "domain_whatsapp": "whatsapp.ts" | kind=code-symbol | source=src/domain/whatsapp.ts:L1 | neighbors=[5ccde91 feat: implementar atalhos rápid…, patients.ts, normalizePhone(), validPatientPhone(), buildWhatsAppLink(), formatE164Phone()]
- "migrations_002_crm_patients": "002_crm_patients.sql" | kind=code-symbol | source=migrations/002_crm_patients.sql:L1 | neighbors=[0d2db0f feat: centralizar cadastro e hi…, patient_events, patient_events_immutable, patients, patients_no_delete, reject_patient_deletion()]
- "migrations_004_sales_sales": "sales" | kind=code-symbol | source=migrations/004_sales.sql:L1 | neighbors=[004_sales.sql, check_sale_installment_total(), financial_entries, receivable_installments, company_accounts, patients]
- "tests_attachments_test": "attachments.test.ts" | kind=code-symbol | source=tests/attachments.test.ts:L1 | neighbors=[a7b6a8a feat(attachments): adicionar va…, e517fa0 refactor(core): implementa corr…, attachments.ts, calculateFileHash(), detectMimeTypeFromMagicBytes(), sanitizeFilename()]
- "tests_doctors_test": "doctors.test.ts" | kind=code-symbol | source=tests/doctors.test.ts:L1 | neighbors=[5fe1e04 feat(doctor): adicionar perfil …, 91c499c Merge branch 'codex/02-medico-r…, b0009ad feat(patients): adicionar medic…, patients.ts, validDoctorId(), doctors.ts]
- "tests_services_test": "services.test.ts" | kind=code-symbol | source=tests/services.test.ts:L1 | neighbors=[264533a feat(services): adicionar migra…, d7896dd Merge branch 'codex/01-servicos…, inventory.ts, validProduct(), services.ts, validExecutionTime()]
- "commit:repo:github.com/millennium42/Fonolife@0b8c65133ba2831a81e90f5899860eab873aa908": "0b8c651 fix(csrf): endurecer validacao de origem" | kind=Commit | source=git | neighbors=[codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, main, a01c4f0 fix(security): centralizar carr…, app.ts, security-object-lgpd.test.ts]
- "commit:repo:github.com/millennium42/Fonolife@1091aa4377acfe578e26021f6d5172df3308587f": "1091aa4 feat(core): implementa melhorias operacionais e de qualidade P2" | kind=Commit | source=git | neighbors=[codex/p2-melhorias-operacionais, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, main, 55ec728 Merge branch 'main' of https://…, app.ts]
- "db_pool_pool": "pool" | kind=code-symbol | source=src/db/pool.ts:L9 | neighbors=[routes.ts, create-admin.ts, migrate.ts, pool.ts, seed.ts, app.ts]
- "domain_privacy": "privacy.ts" | kind=code-symbol | source=src/domain/privacy.ts:L1 | neighbors=[ee6a73e feat(privacy): adicionar regras…, anonymizePatientName(), formatLgpdExportPackage(), isAnonymized(), app.ts, privacy.test.ts]
- "domain_security_hashpassword": "hashPassword()" | kind=code-symbol | source=src/domain/security.ts:L5 | neighbors=[routes.ts, create-admin.ts, seed.ts, security.ts, scrypt, app.ts]
- "migrations_001_base": "001_base.sql" | kind=code-symbol | source=migrations/001_base.sql:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, audit_events, audit_events_immutable, company_accounts, reject_audit_changes(), user_sessions]
- "migrations_003_follow_up_tasks_restrict_follow_up_update": "restrict_follow_up_update()" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L25 | neighbors=[003_follow_up_tasks.sql, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id]
- "tests_csv_import_test": "csv-import.test.ts" | kind=code-symbol | source=tests/csv-import.test.ts:L1 | neighbors=[98e15b2 feat: implementar importação CS…, csv-import.ts, calculateCsvHash(), parseCsv(), sanitizeCsvCell(), validateFinancialCsvRow()]
- "tests_finance_smoke": "finance-smoke.mjs" | kind=code-symbol | source=tests/finance-smoke.mjs:L1 | neighbors=[2dd873d feat: consolidar financeiro úni…, accounts, call(), clientRequestId, login(), payload]
- "tests_inventory_test": "inventory.test.ts" | kind=code-symbol | source=tests/inventory.test.ts:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, inventory.ts, validInventoryMovement(), validProduct(), validProductBrand(), validProductModel()]
- "tests_patients_test": "patients.test.ts" | kind=code-symbol | source=tests/patients.test.ts:L1 | neighbors=[0d2db0f feat: centralizar cadastro e hi…, patients.ts, isOneOf(), normalizePhone(), PATIENT_EVENT_TYPES, PATIENT_STATUSES]
- "commit:repo:github.com/millennium42/Fonolife@55ec728c86a65b09b08ef7ee58766647236df5c1": "55ec728 Merge branch 'main' of https://github.com/millennium42/Fonolife" | kind=Commit | source=git | neighbors=[1091aa4 feat(core): implementa melhoria…, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, main, 0b8c651 fix(csrf): endurecer validacao …, 7139d08 docs: adicionar guia de desenvo…]
- "db_migrate": "migrate.ts" | kind=code-symbol | source=src/db/migrate.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, create-admin.ts, migrate(), pool.ts, pool, server.ts]
- "domain_patients_normalizephone": "normalizePhone()" | kind=code-symbol | source=src/domain/patients.ts:L10 | neighbors=[csv-import.ts, patients.ts, validPatientPhone(), whatsapp.ts, app.ts, patients.test.ts]
- "domain_patients_validpatientphone": "validPatientPhone()" | kind=code-symbol | source=src/domain/patients.ts:L12 | neighbors=[csv-import.ts, patients.ts, normalizePhone(), whatsapp.ts, app.ts, patients.test.ts]
- "domain_security_canreadpatient": "canReadPatient()" | kind=code-symbol | source=src/domain/security.ts:L43 | neighbors=[security.ts, canReadAttachment(), canWritePatient(), app.ts, security-object-lgpd.test.ts, security.test.ts]
- "migrations_004_sales_receivable_installments": "receivable_installments" | kind=code-symbol | source=migrations/004_sales.sql:L25 | neighbors=[004_sales.sql, check_sale_installment_total(), financial_entries, sales, receivable_installments_immutable, receivable_installments_total]
- "migrations_007_inventory": "007_inventory.sql" | kind=code-symbol | source=migrations/007_inventory.sql:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, inventory_movements, prevent_inventory_movement_modification…, products, trg_prevent_inventory_movement_modifica…, users]
- "src_config_config": "config" | kind=code-symbol | source=src/config.ts:L9 | neighbors=[routes.ts, pool.ts, seed.ts, app.ts, config.ts, server.ts]
- "commit:repo:github.com/millennium42/Fonolife@483b27dfc281f2720b927feedda3c8662affa771": "483b27d feat(attachments): implementar upload streaming e estados" | kind=Commit | source=git | neighbors=[codex/pr-02-secure-attachments, dbdb5db docs(attachments): registrar re…, 015_secure_attachments.sql, app.ts, c45b42d refactor(attachments): introduz…]
- "commit:repo:github.com/millennium42/Fonolife@5b76b079ff6ae200665740d01d6c975cb33a7e25": "5b76b07 chore(graphify): atualizar grafo de conhecimento e dependencias" | kind=Commit | source=git | neighbors=[codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, main, d183f47 test(attachments): reproduzir s…, cbaee24 docs(security): documentar matr…]
- "commit:repo:github.com/millennium42/Fonolife@7139d0853a6d1296d2254e807dca6d9d473e3cdb": "7139d08 docs: adicionar guia de desenvolvimento com IA e análise histórica" | kind=Commit | source=git | neighbors=[codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, main, 55ec728 Merge branch 'main' of https://…, a412d5e Merge branch 'codex/quick-demo-…]
- "commit:repo:github.com/millennium42/Fonolife@c45b42d5443f93e69b1c55c4870b8af1604bdae9": "c45b42d refactor(attachments): introduzir contrato de armazenamento privado" | kind=Commit | source=git | neighbors=[codex/pr-02-secure-attachments, 483b27d feat(attachments): implementar …, attachments.ts, config.ts, d183f47 test(attachments): reproduzir s…]
- "commit:repo:github.com/millennium42/Fonolife@cbaee24106a956b67a20e79e71b0d137ffd1bfa2": "cbaee24 docs(security): documentar matriz de acesso e anonimizacao" | kind=Commit | source=git | neighbors=[a01c4f0 fix(security): centralizar carr…, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, main, 5b76b07 chore(graphify): atualizar graf…]
- "domain_attachments_calculatefilehash": "calculateFileHash()" | kind=code-symbol | source=src/domain/attachments.ts:L271 | neighbors=[attachments.ts, .save(), .save(), app.ts, attachments.test.ts]
- "domain_attachments_devattachmentscanner": "DevAttachmentScanner" | kind=code-symbol | source=src/domain/attachments.ts:L194 | neighbors=[attachments.ts, AttachmentScanner, .scan(), app.ts, secure-attachments.test.ts]
- "domain_attachments_localattachmentstorage_getfilepath": ".getFilePath()" | kind=code-symbol | source=src/domain/attachments.ts:L41 | neighbors=[LocalAttachmentStorage, .delete(), .exists(), .getStream(), .save()]
- "domain_doctors": "doctors.ts" | kind=code-symbol | source=src/domain/doctors.ts:L1 | neighbors=[5fe1e04 feat(doctor): adicionar perfil …, buildCalendarDays(), CalendarDay, validLicenseNumber(), doctors.test.ts]
- "domain_follow_ups": "follow-ups.ts" | kind=code-symbol | source=src/domain/follow-ups.ts:L1 | neighbors=[ff35345 feat: tornar o pós-atendimento …, FOLLOW_UP_FILTERS, saoPauloDate(), app.ts, follow-ups.test.ts]
- "domain_patients_isoneof": "isOneOf()" | kind=code-symbol | source=src/domain/patients.ts:L9 | neighbors=[csv-import.ts, inventory.ts, patients.ts, app.ts, patients.test.ts]
- "domain_sales_validcents": "validCents()" | kind=code-symbol | source=src/domain/sales.ts:L6 | neighbors=[finance.ts, inventory.ts, sales.ts, splitMonthly(), validateInstallments()]

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
