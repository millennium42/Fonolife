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
LANGUAGE: each entry has a `lang=` marker giving the language of its source.
Write that entry's description in EXACTLY that language. Do not translate to
a single common language — match each node's source language individually.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "commit:repo:github.com/millennium42/Fonolife@4b82016d02e0a670cc6738d1e836b7ac2a9ae6bd": "4b82016 fix(import): versionar hash e idempotência concorrente" | kind=Commit | source=git | neighbors=[2945f8e refactor(import): adotar parser…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 5648d01 feat(validation): aplicar schem…, routes.ts] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@5648d015bd1297d29c1d4f480d9bffee09145b8b": "5648d01 feat(validation): aplicar schemas ao módulo de importação" | kind=Commit | source=git | neighbors=[4b82016 fix(import): versionar hash e i…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 5c00115 docs(import): documentar format…, app.ts] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@733ff418eec1259b9a805218440a84d835b15545": "733ff41 docs(auth): documentar sessão, proxy e recuperação" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, a81a149 chore(graphify): atualizar graf…, 80a2483 feat(admin): criar bootstrap se…, codex/pr-03-auth-session-reliability] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@a81a149c869ef3ea9c1c0d5666446c976302a74f": "a81a149 chore(graphify): atualizar grafo de conhecimento apos refatoracao de au…" | kind=Commit | source=git | neighbors=[733ff41 docs(auth): documentar sessão, …, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, c1ef4e2 test(import): adicionar fixture…, codex/pr-03-auth-session-reliability] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@c1ef4e21cff70a3c1559a40397b2a3dfe4dc42f3": "c1ef4e2 test(import): adicionar fixtures RFC 4180 e casos inválidos" | kind=Commit | source=git | neighbors=[a81a149 chore(graphify): atualizar graf…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 2945f8e refactor(import): adotar parser…, csv-fixtures.test.ts] | lang=en
- "domain_csv_import_validatefinancialcsvrow": "validateFinancialCsvRow()" | kind=code-symbol | source=src/domain/csv-import.ts:L299 | neighbors=[csv-import.ts, isValidCivilDate(), isValidUuid(), routes.ts, app.ts, csv-fixtures.test.ts] | lang=en
- "domain_privacy": "privacy.ts" | kind=code-symbol | source=src/domain/privacy.ts:L1 | neighbors=[ee6a73e feat(privacy): adicionar regras…, anonymizePatientName(), formatLgpdExportPackage(), isAnonymized(), app.ts, privacy.test.ts] | lang=en
- "migrations_001_base": "001_base.sql" | kind=code-symbol | source=migrations/001_base.sql:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, audit_events, audit_events_immutable, company_accounts, reject_audit_changes(), user_sessions] | lang=en
- "migrations_003_follow_up_tasks_restrict_follow_up_update": "restrict_follow_up_update()" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L25 | neighbors=[003_follow_up_tasks.sql, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id] | lang=en
- "src_config_config": "config" | kind=code-symbol | source=src/config.ts:L58 | neighbors=[middleware.ts, routes.ts, pool.ts, seed.ts, app.ts, config.ts] | lang=en
- "tests_finance_smoke": "finance-smoke.mjs" | kind=code-symbol | source=tests/finance-smoke.mjs:L1 | neighbors=[2dd873d feat: consolidar financeiro úni…, accounts, call(), clientRequestId, login(), payload] | lang=en
- "tests_inventory_test": "inventory.test.ts" | kind=code-symbol | source=tests/inventory.test.ts:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, inventory.ts, validInventoryMovement(), validProduct(), validProductBrand(), validProductModel()] | lang=en
- "tests_patients_test": "patients.test.ts" | kind=code-symbol | source=tests/patients.test.ts:L1 | neighbors=[0d2db0f feat: centralizar cadastro e hi…, patients.ts, isOneOf(), normalizePhone(), PATIENT_EVENT_TYPES, PATIENT_STATUSES] | lang=en
- "auth_middleware_getratelimitkey": "getRateLimitKey()" | kind=code-symbol | source=src/modules/auth/middleware.ts:L9 | neighbors=[middleware.ts, clearLoginFailures(), isLoginRateLimited(), recordLoginFailure(), auth-csrf-hardening.test.ts, auth-session.test.ts] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@5c001158883c49947b61534f6a16cc6432768cf7": "5c00115 docs(import): documentar formato, erros e reprocessamento" | kind=Commit | source=git | neighbors=[5648d01 feat(validation): aplicar schem…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 913308b chore(graphify): atualizar graf…, codex/pr-04-csv-validation] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@7e2a0653e88f64e7666887da45d66674b7e59a44": "7e2a065 fix(auth): remover fallback silencioso em produção" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 438f52a fix(auth): tornar revogação de …, config.ts, 887d25e fix(csrf): comparar origem de f…] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@887d25e8c6ca84a9fcdae4d486e33efe80ac456d": "887d25e fix(csrf): comparar origem de forma estrita" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 7e2a065 fix(auth): remover fallback sil…, app.ts, e6d5a4b test(security): reproduzir bypa…] | lang=nl
- "commit:repo:github.com/millennium42/Fonolife@e6d5a4ba4098bad23aec883677a8a3ce8979ba29": "e6d5a4b test(security): reproduzir bypass de referer e falhas silenciosas" | kind=Commit | source=git | neighbors=[913308b chore(graphify): atualizar graf…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 887d25e fix(csrf): comparar origem de f…, auth-csrf-hardening.test.ts] | lang=en
- "db_migrate": "migrate.ts" | kind=code-symbol | source=src/db/migrate.ts:L1 | neighbors=[3f9e6cc feat: estabelecer núcleo seguro…, create-admin.ts, migrate(), pool.ts, pool, server.ts] | lang=en
- "domain_attachments_attachmentscanner": "AttachmentScanner" | kind=code-symbol | source=src/domain/attachments.ts:L189 | neighbors=[attachments.ts, ClamAVAttachmentScanner, DevAttachmentScanner, MockAttachmentScanner, app.ts, attachment-environment-boundary.test.ts] | lang=en
- "domain_attachments_clamavattachmentscanner": "ClamAVAttachmentScanner" | kind=code-symbol | source=src/domain/attachments.ts:L271 | neighbors=[attachments.ts, AttachmentScanner, .constructor(), .scan(), app.ts, attachment-environment-boundary.test.ts] | lang=en
- "domain_attachments_devattachmentscanner": "DevAttachmentScanner" | kind=code-symbol | source=src/domain/attachments.ts:L196 | neighbors=[attachments.ts, AttachmentScanner, .scan(), app.ts, attachment-environment-boundary.test.ts, secure-attachments.test.ts] | lang=en
- "domain_attachments_mockattachmentscanner": "MockAttachmentScanner" | kind=code-symbol | source=src/domain/attachments.ts:L326 | neighbors=[attachments.ts, AttachmentScanner, .constructor(), .scan(), app.ts, attachment-environment-boundary.test.ts] | lang=en
- "domain_csv_import_parsecsv": "parseCsv()" | kind=code-symbol | source=src/domain/csv-import.ts:L108 | neighbors=[csv-import.ts, routes.ts, app.ts, csv-fixtures.test.ts, csv-import.test.ts, sanitizeCsvCell()] | lang=en
- "domain_csv_import_validatepatientcsvrow": "validatePatientCsvRow()" | kind=code-symbol | source=src/domain/csv-import.ts:L253 | neighbors=[csv-import.ts, isValidCivilDate(), routes.ts, app.ts, csv-fixtures.test.ts, csv-import.test.ts] | lang=en
- "domain_patients_normalizephone": "normalizePhone()" | kind=code-symbol | source=src/domain/patients.ts:L10 | neighbors=[csv-import.ts, patients.ts, validPatientPhone(), whatsapp.ts, app.ts, patients.test.ts] | lang=en
- "domain_patients_validpatientphone": "validPatientPhone()" | kind=code-symbol | source=src/domain/patients.ts:L12 | neighbors=[csv-import.ts, patients.ts, normalizePhone(), whatsapp.ts, app.ts, patients.test.ts] | lang=en
- "domain_security_canreadpatient": "canReadPatient()" | kind=code-symbol | source=src/domain/security.ts:L43 | neighbors=[security.ts, canReadAttachment(), canWritePatient(), app.ts, security-object-lgpd.test.ts, security.test.ts] | lang=en
- "migrations_004_sales_receivable_installments": "receivable_installments" | kind=code-symbol | source=migrations/004_sales.sql:L25 | neighbors=[004_sales.sql, check_sale_installment_total(), financial_entries, sales, receivable_installments_immutable, receivable_installments_total] | lang=en
- "migrations_007_inventory": "007_inventory.sql" | kind=code-symbol | source=migrations/007_inventory.sql:L1 | neighbors=[bb925aa feat: implementar catálogo e co…, inventory_movements, prevent_inventory_movement_modification…, products, trg_prevent_inventory_movement_modifica…, users] | lang=en
- "src_app_buildapp": "buildApp()" | kind=code-symbol | source=src/app.ts:L89 | neighbors=[app.ts, server.ts, attachment-environment-boundary.test.ts, auth-csrf-hardening.test.ts, auth-session.test.ts, security-object-lgpd.test.ts] | lang=en
- "auth_middleware_isloginratelimited": "isLoginRateLimited()" | kind=code-symbol | source=src/modules/auth/middleware.ts:L23 | neighbors=[middleware.ts, getRateLimitKey(), routes.ts, auth-csrf-hardening.test.ts, auth-session.test.ts] | lang=en
- "auth_middleware_recordloginfailure": "recordLoginFailure()" | kind=code-symbol | source=src/modules/auth/middleware.ts:L55 | neighbors=[middleware.ts, getRateLimitKey(), routes.ts, auth-csrf-hardening.test.ts, auth-session.test.ts] | lang=en
- "auth_middleware_revokeusersessions": "revokeUserSessions()" | kind=code-symbol | source=src/modules/auth/middleware.ts:L113 | neighbors=[middleware.ts, routes.ts, app.ts, auth-csrf-hardening.test.ts, auth-session.test.ts] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@1af0f9af46c2666fd071f893322764157d3a2549": "1af0f9a docs(auth): documentar origem, falhas e recuperação" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 39dd6c8 chore(graphify): atualizar mapa…, 438f52a fix(auth): tornar revogação de …] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@39dd6c8674e21428fb0960e027431f1a9ada88b2": "39dd6c8 chore(graphify): atualizar mapa sem versionar caches" | kind=Commit | source=git | neighbors=[1af0f9a docs(auth): documentar origem, …, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, 2f9877e test(attachments): cobrir front…] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@913308b915ddc939b037f009498c6280e84ee248": "913308b chore(graphify): atualizar grafo de conhecimento apos refatoracao de im…" | kind=Commit | source=git | neighbors=[5c00115 docs(import): documentar format…, codex/pr-05-auth-csrf-hardening, codex/pr-06-attachments-production-boun…, main, e6d5a4b test(security): reproduzir bypa…] | lang=nl
- "domain_attachments_calculatefilehash": "calculateFileHash()" | kind=code-symbol | source=src/domain/attachments.ts:L403 | neighbors=[attachments.ts, .save(), .save(), app.ts, attachments.test.ts] | lang=en
- "domain_attachments_localattachmentstorage_getfilepath": ".getFilePath()" | kind=code-symbol | source=src/domain/attachments.ts:L42 | neighbors=[LocalAttachmentStorage, .delete(), .exists(), .getStream(), .save()] | lang=en
- "domain_csv_import_calculateversionedcsvhash": "calculateVersionedCsvHash()" | kind=code-symbol | source=src/domain/csv-import.ts:L48 | neighbors=[csv-import.ts, calculateCsvHash(), routes.ts, csv-fixtures.test.ts, csv-import.test.ts] | lang=en

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
