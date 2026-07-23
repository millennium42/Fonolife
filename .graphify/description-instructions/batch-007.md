# Node Description Batch 8 of 10

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

- "migrations_004_sales_sales_restrict_update": "sales_restrict_update" | kind=code-symbol | source=migrations/004_sales.sql:L77 | neighbors=[004_sales.sql, sales]
- "migrations_006_csv_imports_csv_import_errors": "csv_import_errors" | kind=code-symbol | source=migrations/006_csv_imports.sql:L14 | neighbors=[006_csv_imports.sql, csv_import_jobs]
- "migrations_006_csv_imports_users": "users" | kind=code-symbol | source=migrations/006_csv_imports.sql:L9 | neighbors=[006_csv_imports.sql, csv_import_jobs]
- "migrations_007_inventory_products": "products" | kind=code-symbol | source=migrations/007_inventory.sql:L1 | neighbors=[007_inventory.sql, inventory_movements]
- "migrations_007_inventory_trg_prevent_inventory_movement_modification": "trg_prevent_inventory_movement_modification" | kind=code-symbol | source=migrations/007_inventory.sql:L32 | neighbors=[007_inventory.sql, inventory_movements]
- "migrations_007_inventory_users": "users" | kind=code-symbol | source=migrations/007_inventory.sql:L18 | neighbors=[007_inventory.sql, inventory_movements]
- "migrations_009_attachments_patients": "patients" | kind=code-symbol | source=migrations/009_attachments.sql:L3 | neighbors=[009_attachments.sql, patient_attachments]
- "migrations_009_attachments_users": "users" | kind=code-symbol | source=migrations/009_attachments.sql:L9 | neighbors=[009_attachments.sql, patient_attachments]
- "migrations_012_services_and_inventory_products": "products" | kind=code-symbol | source=migrations/012_services_and_inventory.sql:L17 | neighbors=[012_services_and_inventory.sql, service_products]
- "migrations_012_services_and_inventory_services": "services" | kind=code-symbol | source=migrations/012_services_and_inventory.sql:L3 | neighbors=[012_services_and_inventory.sql, service_products]
- "migrations_013_responsible_doctor": "013_responsible_doctor.sql" | kind=code-symbol | source=migrations/013_responsible_doctor.sql:L1 | neighbors=[91c499c Merge branch 'codex/02-medico-r…, b0009ad feat(patients): adicionar medic…]
- "migrations_014_lgpd_redactions_patients": "patients" | kind=code-symbol | source=migrations/014_lgpd_redactions.sql:L4 | neighbors=[014_lgpd_redactions.sql, patient_redactions]
- "migrations_014_lgpd_redactions_users": "users" | kind=code-symbol | source=migrations/014_lgpd_redactions.sql:L7 | neighbors=[014_lgpd_redactions.sql, patient_redactions]
- "migrations_016_auth_sessions": "016_auth_sessions.sql" | kind=code-symbol | source=migrations/016_auth_sessions.sql:L1 | neighbors=[2600ae3 feat(auth): persistir tentativa…, login_rate_limits]
- "playwright_config": "playwright.config.ts" | kind=code-symbol | source=playwright.config.ts:L1 | neighbors=[0e1c4ad test: consolidar QA, acessibili…, 75e42fd fix(ui): aplicar flex min-width…]
- "scripts_bootstrap_admin_bootstrapfirstadmin": "bootstrapFirstAdmin()" | kind=code-symbol | source=src/scripts/bootstrap-admin.ts:L7 | neighbors=[bootstrap-admin.ts, auth-session.test.ts]
- "src_main_dashboard": "Dashboard()" | kind=code-symbol | source=web/src/main.tsx:L1610 | neighbors=[main.tsx, money()]
- "src_main_date": "date()" | kind=code-symbol | source=web/src/main.tsx:L134 | neighbors=[main.tsx, PatientRecord()]
- "src_main_doctorcalendar": "DoctorCalendar()" | kind=code-symbol | source=web/src/main.tsx:L2155 | neighbors=[main.tsx, today()]
- "src_main_patientrecord": "PatientRecord()" | kind=code-symbol | source=web/src/main.tsx:L604 | neighbors=[main.tsx, date()]
- "src_main_saleform": "SaleForm()" | kind=code-symbol | source=web/src/main.tsx:L171 | neighbors=[main.tsx, today()]
- "tests_devsec_smoke": "devsec-smoke.mjs" | kind=code-symbol | source=tests/devsec-smoke.mjs:L1 | neighbors=[0e1c4ad test: consolidar QA, acessibili…, login()]
- "auth_middleware_memoryratelimit": "memoryRateLimit" | kind=code-symbol | source=src/modules/auth/middleware.ts:L9 | neighbors=[middleware.ts]
- "auth_middleware_memorysessions": "memorySessions" | kind=code-symbol | source=src/modules/auth/middleware.ts:L10 | neighbors=[middleware.ts]
- "db_create_admin_email": "email" | kind=code-symbol | source=src/db/create-admin.ts:L6 | neighbors=[create-admin.ts]
- "domain_attachments_allowed_mime_types": "ALLOWED_MIME_TYPES" | kind=code-symbol | source=src/domain/attachments.ts:L6 | neighbors=[attachments.ts]
- "domain_attachments_allowedmimetype": "AllowedMimeType" | kind=code-symbol | source=src/domain/attachments.ts:L13 | neighbors=[attachments.ts]
- "domain_attachments_attachmentscanresult": "AttachmentScanResult" | kind=code-symbol | source=src/domain/attachments.ts:L178 | neighbors=[attachments.ts]
- "domain_attachments_attachmentstatus": "AttachmentStatus" | kind=code-symbol | source=src/domain/attachments.ts:L16 | neighbors=[attachments.ts]
- "domain_attachments_localattachmentstorage_constructor": ".constructor()" | kind=code-symbol | source=src/domain/attachments.ts:L37 | neighbors=[LocalAttachmentStorage]
- "domain_attachments_s3attachmentstorage_constructor": ".constructor()" | kind=code-symbol | source=src/domain/attachments.ts:L123 | neighbors=[S3AttachmentStorage]
- "domain_attachments_s3attachmentstorage_delete": ".delete()" | kind=code-symbol | source=src/domain/attachments.ts:L165 | neighbors=[S3AttachmentStorage]
- "domain_attachments_s3attachmentstorage_exists": ".exists()" | kind=code-symbol | source=src/domain/attachments.ts:L169 | neighbors=[S3AttachmentStorage]
- "domain_attachments_s3attachmentstorage_getbucketname": ".getBucketName()" | kind=code-symbol | source=src/domain/attachments.ts:L173 | neighbors=[S3AttachmentStorage]
- "domain_attachments_s3attachmentstorage_getstream": ".getStream()" | kind=code-symbol | source=src/domain/attachments.ts:L157 | neighbors=[S3AttachmentStorage]
- "domain_attachments_saveresult": "SaveResult" | kind=code-symbol | source=src/domain/attachments.ts:L18 | neighbors=[attachments.ts]
- "domain_csv_import_csvfinancialrow": "CsvFinancialRow" | kind=code-symbol | source=src/domain/csv-import.ts:L27 | neighbors=[csv-import.ts]
- "domain_csv_import_csvpatientrow": "CsvPatientRow" | kind=code-symbol | source=src/domain/csv-import.ts:L16 | neighbors=[csv-import.ts]
- "domain_csv_import_parsedcsv": "ParsedCsv" | kind=code-symbol | source=src/domain/csv-import.ts:L38 | neighbors=[csv-import.ts]
- "domain_doctors_calendarday": "CalendarDay" | kind=code-symbol | source=src/domain/doctors.ts:L7 | neighbors=[doctors.ts]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\milla\Documents\Projetos\Git\Fonolife\.graphify\description-instructions\batch-007.json

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
