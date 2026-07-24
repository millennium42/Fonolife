# Node Description Batch 9 of 11

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

- "tests_devsec_smoke": "devsec-smoke.mjs" | kind=code-symbol | source=tests/devsec-smoke.mjs:L1 | neighbors=[0e1c4ad test: consolidar QA, acessibili…, login()]
- "auth_middleware_memoryratelimit": "memoryRateLimit" | kind=code-symbol | source=src/modules/auth/middleware.ts:L17 | neighbors=[middleware.ts]
- "auth_middleware_memorysessions": "memorySessions" | kind=code-symbol | source=src/modules/auth/middleware.ts:L18 | neighbors=[middleware.ts]
- "db_create_admin_email": "email" | kind=code-symbol | source=src/db/create-admin.ts:L6 | neighbors=[create-admin.ts]
- "domain_attachments_allowed_mime_types": "ALLOWED_MIME_TYPES" | kind=code-symbol | source=src/domain/attachments.ts:L6 | neighbors=[attachments.ts]
- "domain_attachments_allowedmimetype": "AllowedMimeType" | kind=code-symbol | source=src/domain/attachments.ts:L13 | neighbors=[attachments.ts]
- "domain_attachments_attachmentscanresult": "AttachmentScanResult" | kind=code-symbol | source=src/domain/attachments.ts:L180 | neighbors=[attachments.ts]
- "domain_attachments_attachmentstatus": "AttachmentStatus" | kind=code-symbol | source=src/domain/attachments.ts:L16 | neighbors=[attachments.ts]
- "domain_attachments_clamavattachmentscanner_constructor": ".constructor()" | kind=code-symbol | source=src/domain/attachments.ts:L276 | neighbors=[ClamAVAttachmentScanner]
- "domain_attachments_clamavattachmentscanner_scan": ".scan()" | kind=code-symbol | source=src/domain/attachments.ts:L282 | neighbors=[ClamAVAttachmentScanner]
- "domain_attachments_localattachmentstorage_constructor": ".constructor()" | kind=code-symbol | source=src/domain/attachments.ts:L38 | neighbors=[LocalAttachmentStorage]
- "domain_attachments_mockattachmentscanner_constructor": ".constructor()" | kind=code-symbol | source=src/domain/attachments.ts:L329 | neighbors=[MockAttachmentScanner]
- "domain_attachments_mockattachmentscanner_scan": ".scan()" | kind=code-symbol | source=src/domain/attachments.ts:L333 | neighbors=[MockAttachmentScanner]
- "domain_attachments_s3attachmentstorage_constructor": ".constructor()" | kind=code-symbol | source=src/domain/attachments.ts:L124 | neighbors=[S3AttachmentStorage]
- "domain_attachments_s3attachmentstorage_delete": ".delete()" | kind=code-symbol | source=src/domain/attachments.ts:L158 | neighbors=[S3AttachmentStorage]
- "domain_attachments_s3attachmentstorage_exists": ".exists()" | kind=code-symbol | source=src/domain/attachments.ts:L162 | neighbors=[S3AttachmentStorage]
- "domain_attachments_s3attachmentstorage_getbucketname": ".getBucketName()" | kind=code-symbol | source=src/domain/attachments.ts:L175 | neighbors=[S3AttachmentStorage]
- "domain_attachments_s3attachmentstorage_getsignedurl": ".getSignedUrl()" | kind=code-symbol | source=src/domain/attachments.ts:L166 | neighbors=[S3AttachmentStorage]
- "domain_attachments_s3attachmentstorage_getstream": ".getStream()" | kind=code-symbol | source=src/domain/attachments.ts:L150 | neighbors=[S3AttachmentStorage]
- "domain_attachments_saveresult": "SaveResult" | kind=code-symbol | source=src/domain/attachments.ts:L18 | neighbors=[attachments.ts]
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
- "domain_security_userrole": "UserRole" | kind=code-symbol | source=src/domain/security.ts:L30 | neighbors=[security.ts]
- "domain_services_serviceinput": "ServiceInput" | kind=code-symbol | source=src/domain/services.ts:L8 | neighbors=[services.ts]
- "domain_services_serviceitem": "ServiceItem" | kind=code-symbol | source=src/domain/services.ts:L17 | neighbors=[services.ts]
- "domain_services_serviceproductinput": "ServiceProductInput" | kind=code-symbol | source=src/domain/services.ts:L3 | neighbors=[services.ts]
- "e2e_critical_flow_spec_accessible": "accessible()" | kind=code-symbol | source=tests/e2e/critical-flow.spec.ts:L12 | neighbors=[critical-flow.spec.ts]
- "e2e_critical_flow_spec_login": "login()" | kind=code-symbol | source=tests/e2e/critical-flow.spec.ts:L4 | neighbors=[critical-flow.spec.ts]
- "migrations_001_base_company_accounts": "company_accounts" | kind=code-symbol | source=migrations/001_base.sql:L23 | neighbors=[001_base.sql]
- "migrations_001_base_reject_audit_changes": "reject_audit_changes()" | kind=code-symbol | source=migrations/001_base.sql:L42 | neighbors=[001_base.sql]
- "migrations_002_crm_patients_reject_patient_deletion": "reject_patient_deletion()" | kind=code-symbol | source=migrations/002_crm_patients.sql:L24 | neighbors=[002_crm_patients.sql]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\milla\Documents\Projetos\Git\Fonolife\.graphify\description-instructions\batch-008.json

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
