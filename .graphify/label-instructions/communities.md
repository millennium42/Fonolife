# Community Labeling

Graphify is running in assistant/skill mode (no API key). You are the host
assistant (Claude Code / Codex / Gemini CLI). Read the community listing below
and write 2-5 word plain-language names for each.

## Language

LANGUAGE: each community line ends with a `[lang=…]` marker giving the
language of its source nodes. Write that community's name in EXACTLY that
language. Do not normalize every name to one common language.

## Communities

Community 0: normalizePhone(, validPatientPhone(, 98e15b2 feat: implementar importação CSV idempotente com aud, csv-import.ts, calculateCsvHash(, CsvFinancialRow, CsvPatientRow, parseCsv(, ParsedCsv, sanitizeCsvCell(, validateFinancialCsvRow(, validatePatientCsvRow( [lang=pt]
Community 1: codex/pr8-importacao-csv-seguranca, main, 0687af4 feat(privacy): implementar endpoints de exportação J, 077b08e feat(privacy): adicionar migration 010 para pseudoni, 0d2db0f feat: centralizar cadastro e histórico de pacientes , 0e1c4ad test: consolidar QA, acessibilidade e release do Fon, 2dd873d feat: consolidar financeiro único para dois CNPJs (#, 4de92ce Graphify, 68c033b chore: inicializar main para entregas independentes, 7fdb702 feat(attachments): adicionar seção de exames na fich, 9c8e9de feat(attachments): implementar endpoints de upload, , a56a353 feat: priorizar filas acionáveis no dashboard (#6 [lang=pt]
Community 2: main.tsx, api(, App(, categoryLabels, cents(, CompanyAccount, CsvImport(, Dashboard(, DashboardData, date(, eventTypes, Finance( [lang=en]
Community 3: financial_entries, receivable_installments, restrict_sale_update(, sales, 004_sales.sql, actual, check_sale_installment_total(, company_accounts, expected, financial_entries_immutable, financial_entries_one_active_receipt, OLD.client_request_id [lang=en]
Community 4: hashPassword(, 3f9e6cc feat: estabelecer núcleo seguro e executável da clín, create-admin.ts, email, migrate.ts, migrate(, pool.ts, pool, seed.ts, seedDemo(, security.ts, hashToken( [lang=pt]
Community 5: validProduct(, bb925aa feat: implementar catálogo e controle de estoque de , inventory.ts, InventoryMovement, MOVEMENT_TYPES, MovementType, Product, validInventoryMovement(, validProductBrand(, validProductModel(, validProductName(, 007_inventory.sql [lang=nl]
Community 6: follow_up_tasks, restrict_follow_up_update(, 003_follow_up_tasks.sql, follow_up_tasks_no_delete, follow_up_tasks_restrict_update, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id, OLD.title, patients [lang=en]
Community 7: a7b6a8a feat(attachments): adicionar validação de exames, ti, attachments.ts, ALLOWED_MIME_TYPES, AllowedMimeType, calculateFileHash(, sanitizeFilename(, validFileSize(, validMimeType(, attachments.test.ts [lang=pt]
Community 8: 002_crm_patients.sql, patient_events, patient_events_immutable, patients, patients_no_delete, reject_patient_deletion(, reject_patient_event_changes(, users [lang=en]
Community 9: 5ccde91 feat: implementar atalhos rápidos de comunicação via, whatsapp.ts, buildWhatsAppLink(, formatE164Phone(, WHATSAPP_TEMPLATES, 008_whatsapp_shortcuts.sql, whatsapp.test.ts [lang=pt]
Community 10: 001_base.sql, audit_events, audit_events_immutable, company_accounts, reject_audit_changes(, user_sessions, users [lang=en]
Community 11: finance-smoke.mjs, accounts, call(, clientRequestId, login(, payload, summary [lang=en]
Community 12: 006_csv_imports.sql, csv_import_errors, csv_import_jobs, users [lang=en]
Community 13: 009_attachments.sql, patient_attachments, patients, users [lang=en]

## Instructions

Write a single JSON object mapping each community id (as a string) to its
2-5 word name to: C:\Users\milla\Documents\Projetos\Git\Fonolife\.graphify\label-instructions\communities.json

Example:
```json
{
  "0": "Authentication Flow",
  "1": "Authentication Flow",
  "2": "Authentication Flow"
}
```

Then re-run `graphify update` (or `graphify label`) to ingest the names.
