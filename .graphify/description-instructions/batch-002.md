# Node Description Batch 3 of 10

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
LANGUAGE: each entry has a `lang=` marker giving the language of its source.
Write that entry's description in EXACTLY that language. Do not translate to
a single common language — match each node's source language individually.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "migrations_004_sales_restrict_sale_update": "restrict_sale_update()" | kind=code-symbol | source=migrations/004_sales.sql:L71 | neighbors=[004_sales.sql, OLD.client_request_id, OLD.company_account_id, OLD.created_at, OLD.created_by, OLD.patient_id] | lang=en
- "src_config": "config.ts" | kind=code-symbol | source=src/config.ts:L1 | neighbors=[routes.ts, 3a29c99 chore(deploy): preparar infraes…, 3f9e6cc feat: estabelecer núcleo seguro…, 4693487 fix(security): implementa corre…, c45b42d refactor(attachments): introduz…, pool.ts] | lang=en
- "tests_secure_attachments_test": "secure-attachments.test.ts" | kind=code-symbol | source=tests/secure-attachments.test.ts:L1 | neighbors=[d183f47 test(attachments): reproduzir s…, attachments.ts, detectMimeTypeFromMagicBytes(), DevAttachmentScanner, generateStorageKey(), LocalAttachmentStorage] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@a01c4f0b6281d0c7b01db1b4c47ea4f9787c489a": "a01c4f0 fix(security): centralizar carregamento e autorizacao de pacientes" | kind=Commit | source=git | neighbors=[0b8c651 fix(csrf): endurecer validacao …, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, codex/pr-03-auth-session-reliability, main, cbaee24 docs(security): documentar matr…] | lang=en
- "db_pool_pool": "pool" | kind=code-symbol | source=src/db/pool.ts:L9 | neighbors=[routes.ts, create-admin.ts, migrate.ts, pool.ts, seed.ts, bootstrap-admin.ts] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@0b8c65133ba2831a81e90f5899860eab873aa908": "0b8c651 fix(csrf): endurecer validacao de origem" | kind=Commit | source=git | neighbors=[codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, codex/pr-03-auth-session-reliability, main, a01c4f0 fix(security): centralizar carr…, app.ts] | lang=nl
- "commit:repo:github.com/millennium42/Fonolife@1091aa4377acfe578e26021f6d5172df3308587f": "1091aa4 feat(core): implementa melhorias operacionais e de qualidade P2" | kind=Commit | source=git | neighbors=[codex/p2-melhorias-operacionais, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, codex/pr-03-auth-session-reliability, main, 55ec728 Merge branch 'main' of https://…] | lang=nl
- "db_create_admin": "create-admin.ts" | kind=code-symbol | source=src/db/create-admin.ts:L1 | neighbors=[0e1c4ad test: consolidar QA, acessibili…, email, migrate.ts, migrate(), pool.ts, pool] | lang=en
- "domain_inventory_validproduct": "validProduct()" | kind=code-symbol | source=src/domain/inventory.ts:L43 | neighbors=[inventory.ts, validNonNegativeCents(), validProductBrand(), validProductModel(), validProductName(), app.ts] | lang=en
- "domain_security_hashpassword": "hashPassword()" | kind=code-symbol | source=src/domain/security.ts:L5 | neighbors=[routes.ts, create-admin.ts, seed.ts, security.ts, scrypt, bootstrap-admin.ts] | lang=en
- "domain_whatsapp": "whatsapp.ts" | kind=code-symbol | source=src/domain/whatsapp.ts:L1 | neighbors=[5ccde91 feat: implementar atalhos rápid…, patients.ts, normalizePhone(), validPatientPhone(), buildWhatsAppLink(), formatE164Phone()] | lang=en
- "migrations_002_crm_patients": "002_crm_patients.sql" | kind=code-symbol | source=migrations/002_crm_patients.sql:L1 | neighbors=[0d2db0f feat: centralizar cadastro e hi…, patient_events, patient_events_immutable, patients, patients_no_delete, reject_patient_deletion()] | lang=en
- "migrations_004_sales_sales": "sales" | kind=code-symbol | source=migrations/004_sales.sql:L1 | neighbors=[004_sales.sql, check_sale_installment_total(), financial_entries, receivable_installments, company_accounts, patients] | lang=en
- "scripts_bootstrap_admin": "bootstrap-admin.ts" | kind=code-symbol | source=src/scripts/bootstrap-admin.ts:L1 | neighbors=[80a2483 feat(admin): criar bootstrap se…, pool.ts, pool, security.ts, hashPassword(), bootstrapFirstAdmin()] | lang=en
- "tests_attachments_test": "attachments.test.ts" | kind=code-symbol | source=tests/attachments.test.ts:L1 | neighbors=[a7b6a8a feat(attachments): adicionar va…, e517fa0 refactor(core): implementa corr…, attachments.ts, calculateFileHash(), detectMimeTypeFromMagicBytes(), sanitizeFilename()] | lang=en
- "tests_doctors_test": "doctors.test.ts" | kind=code-symbol | source=tests/doctors.test.ts:L1 | neighbors=[5fe1e04 feat(doctor): adicionar perfil …, 91c499c Merge branch 'codex/02-medico-r…, b0009ad feat(patients): adicionar medic…, patients.ts, validDoctorId(), doctors.ts] | lang=en
- "tests_services_test": "services.test.ts" | kind=code-symbol | source=tests/services.test.ts:L1 | neighbors=[264533a feat(services): adicionar migra…, d7896dd Merge branch 'codex/01-servicos…, inventory.ts, validProduct(), services.ts, validExecutionTime()] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@483b27dfc281f2720b927feedda3c8662affa771": "483b27d feat(attachments): implementar upload streaming e estados" | kind=Commit | source=git | neighbors=[codex/pr-02-secure-attachments, codex/pr-03-auth-session-reliability, main, dbdb5db docs(attachments): registrar re…, 015_secure_attachments.sql, app.ts] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@55ec728c86a65b09b08ef7ee58766647236df5c1": "55ec728 Merge branch 'main' of https://github.com/millennium42/Fonolife" | kind=Commit | source=git | neighbors=[1091aa4 feat(core): implementa melhoria…, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, codex/pr-03-auth-session-reliability, main, 0b8c651 fix(csrf): endurecer validacao …] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@c45b42d5443f93e69b1c55c4870b8af1604bdae9": "c45b42d refactor(attachments): introduzir contrato de armazenamento privado" | kind=Commit | source=git | neighbors=[codex/pr-02-secure-attachments, codex/pr-03-auth-session-reliability, main, 483b27d feat(attachments): implementar …, attachments.ts, config.ts] | lang=nl
- "domain_privacy": "privacy.ts" | kind=code-symbol | source=src/domain/privacy.ts:L1 | neighbors=[ee6a73e feat(privacy): adicionar regras…, anonymizePatientName(), formatLgpdExportPackage(), isAnonymized(), app.ts, privacy.test.ts] | lang=en
- "migrations_001_base": "001_base.sql" | kind=code-symbol | source=migrations/001_base.sql:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, audit_events, audit_events_immutable, company_accounts, reject_audit_changes(), user_sessions] | lang=en
- "migrations_003_follow_up_tasks_restrict_follow_up_update": "restrict_follow_up_update()" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L25 | neighbors=[003_follow_up_tasks.sql, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id] | lang=en
- "tests_csv_import_test": "csv-import.test.ts" | kind=code-symbol | source=tests/csv-import.test.ts:L1 | neighbors=[98e15b2 feat: implementar importação CS…, csv-import.ts, calculateCsvHash(), parseCsv(), sanitizeCsvCell(), validateFinancialCsvRow()] | lang=en
- "tests_finance_smoke": "finance-smoke.mjs" | kind=code-symbol | source=tests/finance-smoke.mjs:L1 | neighbors=[2dd873d feat: consolidar financeiro úni…, accounts, call(), clientRequestId, login(), payload] | lang=en
- "tests_inventory_test": "inventory.test.ts" | kind=code-symbol | source=tests/inventory.test.ts:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, inventory.ts, validInventoryMovement(), validProduct(), validProductBrand(), validProductModel()] | lang=en
- "tests_patients_test": "patients.test.ts" | kind=code-symbol | source=tests/patients.test.ts:L1 | neighbors=[0d2db0f feat: centralizar cadastro e hi…, patients.ts, isOneOf(), normalizePhone(), PATIENT_EVENT_TYPES, PATIENT_STATUSES] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@5b76b079ff6ae200665740d01d6c975cb33a7e25": "5b76b07 chore(graphify): atualizar grafo de conhecimento e dependencias" | kind=Commit | source=git | neighbors=[codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, codex/pr-03-auth-session-reliability, main, d183f47 test(attachments): reproduzir s…, cbaee24 docs(security): documentar matr…] | lang=nl
- "commit:repo:github.com/millennium42/Fonolife@7139d0853a6d1296d2254e807dca6d9d473e3cdb": "7139d08 docs: adicionar guia de desenvolvimento com IA e análise histórica" | kind=Commit | source=git | neighbors=[codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, codex/pr-03-auth-session-reliability, main, 55ec728 Merge branch 'main' of https://…, a412d5e Merge branch 'codex/quick-demo-…] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@cbaee24106a956b67a20e79e71b0d137ffd1bfa2": "cbaee24 docs(security): documentar matriz de acesso e anonimizacao" | kind=Commit | source=git | neighbors=[a01c4f0 fix(security): centralizar carr…, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, codex/pr-03-auth-session-reliability, main, 5b76b07 chore(graphify): atualizar graf…] | lang=nl
- "commit:repo:github.com/millennium42/Fonolife@d183f4787cb38a9df1be48d339008a8827b9447c": "d183f47 test(attachments): reproduzir spoofing, órfãos e acessos indevidos" | kind=Commit | source=git | neighbors=[5b76b07 chore(graphify): atualizar graf…, codex/pr-02-secure-attachments, codex/pr-03-auth-session-reliability, main, c45b42d refactor(attachments): introduz…, secure-attachments.test.ts] | lang=pt
- "db_migrate": "migrate.ts" | kind=code-symbol | source=src/db/migrate.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, create-admin.ts, migrate(), pool.ts, pool, server.ts] | lang=en
- "domain_patients_normalizephone": "normalizePhone()" | kind=code-symbol | source=src/domain/patients.ts:L10 | neighbors=[csv-import.ts, patients.ts, validPatientPhone(), whatsapp.ts, app.ts, patients.test.ts] | lang=en
- "domain_patients_validpatientphone": "validPatientPhone()" | kind=code-symbol | source=src/domain/patients.ts:L12 | neighbors=[csv-import.ts, patients.ts, normalizePhone(), whatsapp.ts, app.ts, patients.test.ts] | lang=en
- "domain_security_canreadpatient": "canReadPatient()" | kind=code-symbol | source=src/domain/security.ts:L43 | neighbors=[security.ts, canReadAttachment(), canWritePatient(), app.ts, security-object-lgpd.test.ts, security.test.ts] | lang=en
- "migrations_004_sales_receivable_installments": "receivable_installments" | kind=code-symbol | source=migrations/004_sales.sql:L25 | neighbors=[004_sales.sql, check_sale_installment_total(), financial_entries, sales, receivable_installments_immutable, receivable_installments_total] | lang=en
- "migrations_007_inventory": "007_inventory.sql" | kind=code-symbol | source=migrations/007_inventory.sql:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, inventory_movements, prevent_inventory_movement_modification…, products, trg_prevent_inventory_movement_modifica…, users] | lang=en
- "src_config_config": "config" | kind=code-symbol | source=src/config.ts:L9 | neighbors=[routes.ts, pool.ts, seed.ts, app.ts, config.ts, server.ts] | lang=en
- "auth_middleware_getratelimitkey": "getRateLimitKey()" | kind=code-symbol | source=src/modules/auth/middleware.ts:L3 | neighbors=[middleware.ts, clearLoginFailures(), isLoginRateLimited(), recordLoginFailure(), auth-session.test.ts] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@20d3779cbf03b841d864726b615f897556d62e9f": "20d3779 refactor(auth): registrar módulo e remover rotas duplicadas" | kind=Commit | source=git | neighbors=[1524f7f test(auth): cobrir limite distr…, routes.ts, codex/pr-03-auth-session-reliability, 2600ae3 feat(auth): persistir tentativa…, app.ts] | lang=en

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
