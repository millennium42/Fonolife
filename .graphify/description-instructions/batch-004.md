# Node Description Batch 5 of 11

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

- "tests_privacy_test": "privacy.test.ts" | kind=code-symbol | source=tests/privacy.test.ts:L1 | neighbors=[ee6a73e feat(privacy): adicionar regras…, privacy.ts, anonymizePatientName(), formatLgpdExportPackage(), isAnonymized()] | lang=en
- "tests_whatsapp_test": "whatsapp.test.ts" | kind=code-symbol | source=tests/whatsapp.test.ts:L1 | neighbors=[5ccde91 feat: implementar atalhos rápid…, whatsapp.ts, buildWhatsAppLink(), formatE164Phone(), WHATSAPP_TEMPLATES] | lang=en
- "auth_middleware_clearloginfailures": "clearLoginFailures()" | kind=code-symbol | source=src/modules/auth/middleware.ts:L90 | neighbors=[middleware.ts, getRateLimitKey(), routes.ts, auth-session.test.ts] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@7e2a0653e88f64e7666887da45d66674b7e59a44": "7e2a065 fix(auth): remover fallback silencioso em produção" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, 438f52a fix(auth): tornar revogação de …, config.ts, 887d25e fix(csrf): comparar origem de f…] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@887d25e8c6ca84a9fcdae4d486e33efe80ac456d": "887d25e fix(csrf): comparar origem de forma estrita" | kind=Commit | source=git | neighbors=[codex/pr-05-auth-csrf-hardening, 7e2a065 fix(auth): remover fallback sil…, app.ts, e6d5a4b test(security): reproduzir bypa…] | lang=nl
- "commit:repo:github.com/millennium42/Fonolife@913308b915ddc939b037f009498c6280e84ee248": "913308b chore(graphify): atualizar grafo de conhecimento apos refatoracao de im…" | kind=Commit | source=git | neighbors=[5c00115 docs(import): documentar format…, codex/pr-05-auth-csrf-hardening, main, e6d5a4b test(security): reproduzir bypa…] | lang=nl
- "commit:repo:github.com/millennium42/Fonolife@e6d5a4ba4098bad23aec883677a8a3ce8979ba29": "e6d5a4b test(security): reproduzir bypass de referer e falhas silenciosas" | kind=Commit | source=git | neighbors=[913308b chore(graphify): atualizar graf…, codex/pr-05-auth-csrf-hardening, 887d25e fix(csrf): comparar origem de f…, auth-csrf-hardening.test.ts] | lang=en
- "domain_attachments_attachmentstorage": "AttachmentStorage" | kind=code-symbol | source=src/domain/attachments.ts:L23 | neighbors=[attachments.ts, LocalAttachmentStorage, S3AttachmentStorage, app.ts] | lang=en
- "domain_attachments_detectmimetypefrommagicbytes": "detectMimeTypeFromMagicBytes()" | kind=code-symbol | source=src/domain/attachments.ts:L278 | neighbors=[attachments.ts, .scan(), attachments.test.ts, secure-attachments.test.ts] | lang=en
- "domain_attachments_reconcileorphanattachments": "reconcileOrphanAttachments()" | kind=code-symbol | source=src/domain/attachments.ts:L336 | neighbors=[attachments.ts, .listKeys(), app.ts, secure-attachments.test.ts] | lang=en
- "domain_attachments_sanitizefilename": "sanitizeFilename()" | kind=code-symbol | source=src/domain/attachments.ts:L245 | neighbors=[attachments.ts, app.ts, attachments.test.ts, secure-attachments.test.ts] | lang=en
- "domain_csv_import_calculatecsvhash": "calculateCsvHash()" | kind=code-symbol | source=src/domain/csv-import.ts:L58 | neighbors=[csv-import.ts, calculateVersionedCsvHash(), app.ts, csv-import.test.ts] | lang=en
- "domain_csv_import_isvalidcivildate": "isValidCivilDate()" | kind=code-symbol | source=src/domain/csv-import.ts:L79 | neighbors=[csv-import.ts, validateFinancialCsvRow(), validatePatientCsvRow(), csv-fixtures.test.ts] | lang=en
- "domain_patients_patient_statuses": "PATIENT_STATUSES" | kind=code-symbol | source=src/domain/patients.ts:L1 | neighbors=[csv-import.ts, patients.ts, app.ts, patients.test.ts] | lang=en
- "domain_privacy_anonymizepatientname": "anonymizePatientName()" | kind=code-symbol | source=src/domain/privacy.ts:L7 | neighbors=[privacy.ts, app.ts, privacy.test.ts, security-object-lgpd.test.ts] | lang=en
- "domain_sales_validateinstallments": "validateInstallments()" | kind=code-symbol | source=src/domain/sales.ts:L10 | neighbors=[sales.ts, validCents(), app.ts, sales.test.ts] | lang=en
- "domain_security_canexportpatientdata": "canExportPatientData()" | kind=code-symbol | source=src/domain/security.ts:L59 | neighbors=[security.ts, app.ts, security-object-lgpd.test.ts, security.test.ts] | lang=en
- "domain_security_hashtoken": "hashToken()" | kind=code-symbol | source=src/domain/security.ts:L18 | neighbors=[routes.ts, security.ts, app.ts, security.test.ts] | lang=en
- "migrations_002_crm_patients_patient_events": "patient_events" | kind=code-symbol | source=migrations/002_crm_patients.sql:L30 | neighbors=[002_crm_patients.sql, patients, users, patient_events_immutable] | lang=en
- "migrations_002_crm_patients_patients": "patients" | kind=code-symbol | source=migrations/002_crm_patients.sql:L1 | neighbors=[002_crm_patients.sql, patient_events, users, patients_no_delete] | lang=en
- "migrations_006_csv_imports": "006_csv_imports.sql" | kind=code-symbol | source=migrations/006_csv_imports.sql:L1 | neighbors=[98e15b2 feat: implementar importação CS…, csv_import_errors, csv_import_jobs, users] | lang=en
- "migrations_007_inventory_inventory_movements": "inventory_movements" | kind=code-symbol | source=migrations/007_inventory.sql:L12 | neighbors=[007_inventory.sql, products, users, trg_prevent_inventory_movement_modifica…] | lang=en
- "migrations_009_attachments": "009_attachments.sql" | kind=code-symbol | source=migrations/009_attachments.sql:L1 | neighbors=[c067885 feat(attachments): adicionar mi…, patient_attachments, patients, users] | lang=en
- "migrations_014_lgpd_redactions": "014_lgpd_redactions.sql" | kind=code-symbol | source=migrations/014_lgpd_redactions.sql:L1 | neighbors=[4693487 fix(security): implementa corre…, patient_redactions, patients, users] | lang=en
- "src_main_today": "today()" | kind=code-symbol | source=web/src/main.tsx:L147 | neighbors=[main.tsx, DoctorCalendar(), Finance(), SaleForm()] | lang=en
- "tests_follow_ups_test": "follow-ups.test.ts" | kind=code-symbol | source=tests/follow-ups.test.ts:L1 | neighbors=[ff35345 feat: tornar o pós-atendimento …, follow-ups.ts, FOLLOW_UP_FILTERS, saoPauloDate()] | lang=en
- "tests_sales_test": "sales.test.ts" | kind=code-symbol | source=tests/sales.test.ts:L1 | neighbors=[a740db5 feat: registrar vendas com parc…, sales.ts, splitMonthly(), validateInstallments()] | lang=en
- "db_migrate_migrate": "migrate()" | kind=code-symbol | source=src/db/migrate.ts:L7 | neighbors=[create-admin.ts, migrate.ts, server.ts] | lang=en
- "domain_attachments_generatestoragekey": "generateStorageKey()" | kind=code-symbol | source=src/domain/attachments.ts:L325 | neighbors=[attachments.ts, app.ts, secure-attachments.test.ts] | lang=en
- "domain_attachments_localattachmentstorage_save": ".save()" | kind=code-symbol | source=src/domain/attachments.ts:L46 | neighbors=[LocalAttachmentStorage, calculateFileHash(), .getFilePath()] | lang=en
- "domain_attachments_validatebase64strict": "validateBase64Strict()" | kind=code-symbol | source=src/domain/attachments.ts:L307 | neighbors=[attachments.ts, app.ts, secure-attachments.test.ts] | lang=en
- "domain_attachments_validfilesize": "validFileSize()" | kind=code-symbol | source=src/domain/attachments.ts:L263 | neighbors=[attachments.ts, app.ts, attachments.test.ts] | lang=en
- "domain_attachments_validmimetype": "validMimeType()" | kind=code-symbol | source=src/domain/attachments.ts:L255 | neighbors=[attachments.ts, app.ts, attachments.test.ts] | lang=en
- "domain_csv_import_isvaliduuid": "isValidUuid()" | kind=code-symbol | source=src/domain/csv-import.ts:L98 | neighbors=[csv-import.ts, validateFinancialCsvRow(), csv-fixtures.test.ts] | lang=en
- "domain_csv_import_sanitizecsvcell": "sanitizeCsvCell()" | kind=code-symbol | source=src/domain/csv-import.ts:L66 | neighbors=[csv-import.ts, csv-import.test.ts, parseCsv()] | lang=en
- "domain_finance_validfinancialentry": "validFinancialEntry()" | kind=code-symbol | source=src/domain/finance.ts:L6 | neighbors=[finance.ts, app.ts, finance.test.ts] | lang=en
- "domain_follow_ups_follow_up_filters": "FOLLOW_UP_FILTERS" | kind=code-symbol | source=src/domain/follow-ups.ts:L1 | neighbors=[follow-ups.ts, app.ts, follow-ups.test.ts] | lang=en
- "domain_inventory_validinventorymovement": "validInventoryMovement()" | kind=code-symbol | source=src/domain/inventory.ts:L59 | neighbors=[inventory.ts, app.ts, inventory.test.ts] | lang=en
- "domain_inventory_validnonnegativecents": "validNonNegativeCents()" | kind=code-symbol | source=src/domain/inventory.ts:L39 | neighbors=[inventory.ts, validProduct(), services.ts] | lang=en
- "domain_inventory_validproductbrand": "validProductBrand()" | kind=code-symbol | source=src/domain/inventory.ts:L31 | neighbors=[inventory.ts, validProduct(), inventory.test.ts] | lang=en

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
