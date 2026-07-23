# Node Description Batch 4 of 10

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

- "commit:repo:github.com/millennium42/Fonolife@2600ae324f3ec5004defac510e53393c547ce53d": "2600ae3 feat(auth): persistir tentativas e expiração" | kind=Commit | source=git | neighbors=[20d3779 refactor(auth): registrar módul…, middleware.ts, codex/pr-03-auth-session-reliability, 80a2483 feat(admin): criar bootstrap se…, 016_auth_sessions.sql] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@c8ba10330da1341fb82ea2321fcf01997869e8b6": "c8ba103 chore(graphify): atualizar grafo de conhecimento apos refatoracao de an…" | kind=Commit | source=git | neighbors=[codex/pr-02-secure-attachments, codex/pr-03-auth-session-reliability, main, 1524f7f test(auth): cobrir limite distr…, dbdb5db docs(attachments): registrar re…] | lang=nl
- "commit:repo:github.com/millennium42/Fonolife@dbdb5db8afbff87aa8880faf631b12dbad70b965": "dbdb5db docs(attachments): registrar retenção, storage e rollback" | kind=Commit | source=git | neighbors=[483b27d feat(attachments): implementar …, codex/pr-02-secure-attachments, codex/pr-03-auth-session-reliability, main, c8ba103 chore(graphify): atualizar graf…] | lang=pt
- "domain_attachments_calculatefilehash": "calculateFileHash()" | kind=code-symbol | source=src/domain/attachments.ts:L271 | neighbors=[attachments.ts, .save(), .save(), app.ts, attachments.test.ts] | lang=en
- "domain_attachments_devattachmentscanner": "DevAttachmentScanner" | kind=code-symbol | source=src/domain/attachments.ts:L194 | neighbors=[attachments.ts, AttachmentScanner, .scan(), app.ts, secure-attachments.test.ts] | lang=en
- "domain_attachments_localattachmentstorage_getfilepath": ".getFilePath()" | kind=code-symbol | source=src/domain/attachments.ts:L41 | neighbors=[LocalAttachmentStorage, .delete(), .exists(), .getStream(), .save()] | lang=en
- "domain_doctors": "doctors.ts" | kind=code-symbol | source=src/domain/doctors.ts:L1 | neighbors=[5fe1e04 feat(doctor): adicionar perfil …, buildCalendarDays(), CalendarDay, validLicenseNumber(), doctors.test.ts] | lang=en
- "domain_follow_ups": "follow-ups.ts" | kind=code-symbol | source=src/domain/follow-ups.ts:L1 | neighbors=[ff35345 feat: tornar o pós-atendimento …, FOLLOW_UP_FILTERS, saoPauloDate(), app.ts, follow-ups.test.ts] | lang=en
- "domain_patients_isoneof": "isOneOf()" | kind=code-symbol | source=src/domain/patients.ts:L9 | neighbors=[csv-import.ts, inventory.ts, patients.ts, app.ts, patients.test.ts] | lang=en
- "domain_sales_validcents": "validCents()" | kind=code-symbol | source=src/domain/sales.ts:L6 | neighbors=[finance.ts, inventory.ts, sales.ts, splitMonthly(), validateInstallments()] | lang=en
- "domain_security_canreadattachment": "canReadAttachment()" | kind=code-symbol | source=src/domain/security.ts:L71 | neighbors=[security.ts, canReadPatient(), app.ts, security-object-lgpd.test.ts, security.test.ts] | lang=en
- "domain_security_canwritepatient": "canWritePatient()" | kind=code-symbol | source=src/domain/security.ts:L55 | neighbors=[security.ts, canReadPatient(), app.ts, security-object-lgpd.test.ts, security.test.ts] | lang=en
- "domain_security_verifypassword": "verifyPassword()" | kind=code-symbol | source=src/domain/security.ts:L11 | neighbors=[routes.ts, security.ts, scrypt, app.ts, security.test.ts] | lang=en
- "domain_services_validservice": "validService()" | kind=code-symbol | source=src/domain/services.ts:L33 | neighbors=[services.ts, validExecutionTime(), validServiceName(), app.ts, services.test.ts] | lang=en
- "migrations_003_follow_up_tasks_follow_up_tasks": "follow_up_tasks" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L1 | neighbors=[003_follow_up_tasks.sql, patients, users, follow_up_tasks_no_delete, follow_up_tasks_restrict_update] | lang=en
- "migrations_004_sales_check_sale_installment_total": "check_sale_installment_total()" | kind=code-symbol | source=migrations/004_sales.sql:L84 | neighbors=[004_sales.sql, actual, expected, receivable_installments, sales] | lang=en
- "migrations_012_services_and_inventory": "012_services_and_inventory.sql" | kind=code-symbol | source=migrations/012_services_and_inventory.sql:L1 | neighbors=[264533a feat(services): adicionar migra…, d7896dd Merge branch 'codex/01-servicos…, products, service_products, services] | lang=en
- "tests_privacy_test": "privacy.test.ts" | kind=code-symbol | source=tests/privacy.test.ts:L1 | neighbors=[ee6a73e feat(privacy): adicionar regras…, privacy.ts, anonymizePatientName(), formatLgpdExportPackage(), isAnonymized()] | lang=en
- "tests_whatsapp_test": "whatsapp.test.ts" | kind=code-symbol | source=tests/whatsapp.test.ts:L1 | neighbors=[5ccde91 feat: implementar atalhos rápid…, whatsapp.ts, buildWhatsAppLink(), formatE164Phone(), WHATSAPP_TEMPLATES] | lang=en
- "auth_middleware_clearloginfailures": "clearLoginFailures()" | kind=code-symbol | source=src/modules/auth/middleware.ts:L65 | neighbors=[middleware.ts, getRateLimitKey(), routes.ts, auth-session.test.ts] | lang=en
- "auth_middleware_isloginratelimited": "isLoginRateLimited()" | kind=code-symbol | source=src/modules/auth/middleware.ts:L15 | neighbors=[middleware.ts, getRateLimitKey(), routes.ts, auth-session.test.ts] | lang=en
- "auth_middleware_recordloginfailure": "recordLoginFailure()" | kind=code-symbol | source=src/modules/auth/middleware.ts:L39 | neighbors=[middleware.ts, getRateLimitKey(), routes.ts, auth-session.test.ts] | lang=en
- "auth_middleware_revokeusersessions": "revokeUserSessions()" | kind=code-symbol | source=src/modules/auth/middleware.ts:L78 | neighbors=[middleware.ts, routes.ts, app.ts, auth-session.test.ts] | lang=en
- "commit:repo:github.com/millennium42/Fonolife@1524f7fd80a19fc35988f2d5a627da3d1584cff4": "1524f7f test(auth): cobrir limite distribuído e revogação de sessões" | kind=Commit | source=git | neighbors=[codex/pr-03-auth-session-reliability, 20d3779 refactor(auth): registrar módul…, auth-session.test.ts, c8ba103 chore(graphify): atualizar graf…] | lang=pt
- "commit:repo:github.com/millennium42/Fonolife@80a24830f836473c8188bfcbd3ce41faf7fc5a94": "80a2483 feat(admin): criar bootstrap seguro do primeiro administrador" | kind=Commit | source=git | neighbors=[2600ae3 feat(auth): persistir tentativa…, codex/pr-03-auth-session-reliability, 733ff41 docs(auth): documentar sessão, …, bootstrap-admin.ts] | lang=pt
- "domain_attachments_attachmentstorage": "AttachmentStorage" | kind=code-symbol | source=src/domain/attachments.ts:L23 | neighbors=[attachments.ts, LocalAttachmentStorage, S3AttachmentStorage, app.ts] | lang=en
- "domain_attachments_detectmimetypefrommagicbytes": "detectMimeTypeFromMagicBytes()" | kind=code-symbol | source=src/domain/attachments.ts:L278 | neighbors=[attachments.ts, .scan(), attachments.test.ts, secure-attachments.test.ts] | lang=en
- "domain_attachments_reconcileorphanattachments": "reconcileOrphanAttachments()" | kind=code-symbol | source=src/domain/attachments.ts:L336 | neighbors=[attachments.ts, .listKeys(), app.ts, secure-attachments.test.ts] | lang=en
- "domain_attachments_sanitizefilename": "sanitizeFilename()" | kind=code-symbol | source=src/domain/attachments.ts:L245 | neighbors=[attachments.ts, app.ts, attachments.test.ts, secure-attachments.test.ts] | lang=en
- "domain_csv_import_parsecsv": "parseCsv()" | kind=code-symbol | source=src/domain/csv-import.ts:L66 | neighbors=[csv-import.ts, sanitizeCsvCell(), app.ts, csv-import.test.ts] | lang=en
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
