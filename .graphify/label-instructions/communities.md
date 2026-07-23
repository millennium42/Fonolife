# Community Labeling

Graphify is running in assistant/skill mode (no API key). You are the host
assistant (Claude Code / Codex / Gemini CLI). Read the community listing below
and write 2-5 word plain-language names for each.

## Language

LANGUAGE: each community line ends with a `[lang=…]` marker giving the
language of its source nodes. Write that community's name in EXACTLY that
language. Do not normalize every name to one common language.

## Communities

Community 0: codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-global, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica, codex/p2-melhorias-operacionais, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, codex/pr8-importacao-csv-seguranca, codex/quick-demo-login-buttons [lang=en]
Community 1: csv-import.ts, calculateCsvHash(, CsvFinancialRow, CsvPatientRow, parseCsv(, ParsedCsv, sanitizeCsvCell(, validateFinancialCsvRow(, validatePatientCsvRow(, finance.ts, ENTRY_TYPES, FINANCE_CATEGORIES [lang=en]
Community 2: main.tsx, api(, App(, async(, categoryLabels, cents(, CompanyAccount, CsvImport(, Dashboard(, DashboardData, date(, DoctorCalendar( [lang=en]
Community 3: LocalAttachmentStorage, S3AttachmentStorage, 483b27d feat(attachments): implementar upload streaming e es, 5b76b07 chore(graphify): atualizar grafo de conhecimento e d, c45b42d refactor(attachments): introduzir contrato de armaze, d183f47 test(attachments): reproduzir spoofing, órfãos e ace, dbdb5db docs(attachments): registrar retenção, storage e rol, e517fa0 refactor(core): implementa correcoes de confiabilida, attachments.ts, ALLOWED_MIME_TYPES, AllowedMimeType, AttachmentScanner [lang=en]
Community 4: pool, hashPassword(, routes.ts, authRoutes(, 0b8c651 fix(csrf): endurecer validacao de origem, 3f9e6cc feat: estabelecer núcleo seguro e executável da clín, 4693487 fix(security): implementa correcoes criticas P0 de p, a01c4f0 fix(security): centralizar carregamento e autorizaca, cbaee24 docs(security): documentar matriz de acesso e anonim, create-admin.ts, email, migrate.ts [lang=nl]
Community 5: financial_entries, receivable_installments, restrict_sale_update(, sales, 004_sales.sql, actual, check_sale_installment_total(, company_accounts, expected, financial_entries_immutable, financial_entries_one_active_receipt, OLD.client_request_id [lang=en]
Community 6: validProduct(, inventory.ts, InventoryMovement, MOVEMENT_TYPES, MovementType, Product, validInventoryMovement(, validNonNegativeCents(, validProductBrand(, validProductModel(, validProductName(, services.ts [lang=en]
Community 7: restrict_follow_up_update(, 003_follow_up_tasks.sql, follow_up_tasks, follow_up_tasks_no_delete, follow_up_tasks_restrict_update, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id, OLD.title, patients [lang=en]
Community 8: 002_crm_patients.sql, patient_events, patient_events_immutable, patients, patients_no_delete, reject_patient_deletion(, reject_patient_event_changes(, users [lang=en]
Community 9: 001_base.sql, audit_events, audit_events_immutable, company_accounts, reject_audit_changes(, user_sessions, users [lang=en]
Community 10: finance-smoke.mjs, accounts, call(, clientRequestId, login(, payload, summary [lang=en]
Community 11: doctors.ts, buildCalendarDays(, CalendarDay, validLicenseNumber(, validDoctorId(, doctors.test.ts [lang=en]
Community 12: 007_inventory.sql, inventory_movements, prevent_inventory_movement_modification(, products, trg_prevent_inventory_movement_modification, users [lang=en]
Community 13: 006_csv_imports.sql, csv_import_errors, csv_import_jobs, users [lang=en]
Community 14: 009_attachments.sql, patient_attachments, patients, users [lang=en]
Community 15: 012_services_and_inventory.sql, products, service_products, services [lang=en]
Community 16: 014_lgpd_redactions.sql, patient_redactions, patients, users [lang=en]
Community 17: critical-flow.spec.ts, accessible(, login( [lang=en]
Community 18: dashboard-smoke.mjs, dashboard(, login( [lang=en]
Community 19: devsec-smoke.mjs, login( [lang=en]

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
