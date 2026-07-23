# Community Labeling

Graphify is running in assistant/skill mode (no API key). You are the host
assistant (Claude Code / Codex / Gemini CLI). Read the community listing below
and write 2-5 word plain-language names for each.

## Language

LANGUAGE: each community line ends with a `[lang=…]` marker giving the
language of its source nodes. Write that community's name in EXACTLY that
language. Do not normalize every name to one common language.

## Communities

Community 0: codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-global, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica, codex/p2-melhorias-operacionais, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, codex/pr-03-auth-session-reliability, codex/pr8-importacao-csv-seguranca [lang=en]
Community 1: csv-import.ts, calculateCsvHash(, CsvFinancialRow, CsvPatientRow, parseCsv(, ParsedCsv, sanitizeCsvCell(, validateFinancialCsvRow(, validatePatientCsvRow(, finance.ts, ENTRY_TYPES, FINANCE_CATEGORIES [lang=en]
Community 2: pool, hashPassword(, middleware.ts, cleanupExpiredSessions(, clearLoginFailures(, getRateLimitKey(, isLoginRateLimited(, memoryRateLimit, memorySessions, recordLoginFailure(, revokeUserSessions(, routes.ts [lang=en]
Community 3: main.tsx, api(, App(, async(, categoryLabels, cents(, CompanyAccount, CsvImport(, Dashboard(, DashboardData, date(, DoctorCalendar( [lang=en]
Community 4: LocalAttachmentStorage, S3AttachmentStorage, e517fa0 refactor(core): implementa correcoes de confiabilida, attachments.ts, ALLOWED_MIME_TYPES, AllowedMimeType, AttachmentScanner, AttachmentScanResult, AttachmentStatus, AttachmentStorage, calculateFileHash(, detectMimeTypeFromMagicBytes( [lang=nl]
Community 5: financial_entries, receivable_installments, restrict_sale_update(, sales, 004_sales.sql, actual, check_sale_installment_total(, company_accounts, expected, financial_entries_immutable, financial_entries_one_active_receipt, OLD.client_request_id [lang=en]
Community 6: validProduct(, inventory.ts, InventoryMovement, MOVEMENT_TYPES, MovementType, Product, validInventoryMovement(, validNonNegativeCents(, validProductBrand(, validProductModel(, validProductName(, services.ts [lang=en]
Community 7: restrict_follow_up_update(, 003_follow_up_tasks.sql, follow_up_tasks, follow_up_tasks_no_delete, follow_up_tasks_restrict_update, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id, OLD.title, patients [lang=en]
Community 8: 1524f7f test(auth): cobrir limite distribuído e revogação de, 20d3779 refactor(auth): registrar módulo e remover rotas dup, 2600ae3 feat(auth): persistir tentativas e expiração, 483b27d feat(attachments): implementar upload streaming e es, 733ff41 docs(auth): documentar sessão, proxy e recuperação, 80a2483 feat(admin): criar bootstrap seguro do primeiro admi, c45b42d refactor(attachments): introduzir contrato de armaze, c8ba103 chore(graphify): atualizar grafo de conhecimento apo, dbdb5db docs(attachments): registrar retenção, storage e rol, 015_secure_attachments.sql, 016_auth_sessions.sql, login_rate_limits [lang=pt]
Community 9: 002_crm_patients.sql, patient_events, patient_events_immutable, patients, patients_no_delete, reject_patient_deletion(, reject_patient_event_changes(, users [lang=en]
Community 10: 001_base.sql, audit_events, audit_events_immutable, company_accounts, reject_audit_changes(, user_sessions, users [lang=en]
Community 11: finance-smoke.mjs, accounts, call(, clientRequestId, login(, payload, summary [lang=en]
Community 12: doctors.ts, buildCalendarDays(, CalendarDay, validLicenseNumber(, validDoctorId(, doctors.test.ts [lang=en]
Community 13: 007_inventory.sql, inventory_movements, prevent_inventory_movement_modification(, products, trg_prevent_inventory_movement_modification, users [lang=en]
Community 14: 006_csv_imports.sql, csv_import_errors, csv_import_jobs, users [lang=en]
Community 15: 009_attachments.sql, patient_attachments, patients, users [lang=en]
Community 16: 012_services_and_inventory.sql, products, service_products, services [lang=en]
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
