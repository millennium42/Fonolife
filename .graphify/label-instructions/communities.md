# Community Labeling

Graphify is running in assistant/skill mode (no API key). You are the host
assistant (Claude Code / Codex / Gemini CLI). Read the community listing below
and write 2-5 word plain-language names for each.

## Language

Write every name in English (en). Do not switch languages.

## Communities

Community 0: LocalAttachmentStorage, S3AttachmentStorage, attachments.ts, ALLOWED_MIME_TYPES, AllowedMimeType, AttachmentScanner, AttachmentScanResult, AttachmentStatus, AttachmentStorage, calculateFileHash(, detectMimeTypeFromMagicBytes(, DevAttachmentScanner
Community 1: codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-global, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica, codex/p2-melhorias-operacionais, codex/pr-01-security-object-lgpd, codex/pr-02-secure-attachments, codex/pr-03-auth-session-reliability, codex/pr8-importacao-csv-seguranca
Community 2: pool, hashPassword(, config, middleware.ts, cleanupExpiredSessions(, clearLoginFailures(, getRateLimitKey(, isLoginRateLimited(, memoryRateLimit, memorySessions, recordLoginFailure(, revokeUserSessions(
Community 3: main.tsx, api(, App(, async(, categoryLabels, cents(, CompanyAccount, CsvImport(, Dashboard(, DashboardData, date(, DoctorCalendar(
Community 4: codex/pr-04-csv-validation, codex/pr-05-auth-csrf-hardening, main, 0b8c651 fix(csrf): endurecer validacao de origem, 1091aa4 feat(core): implementa melhorias operacionais e de q, 1524f7f test(auth): cobrir limite distribuído e revogação de, 20d3779 refactor(auth): registrar módulo e remover rotas dup, 2600ae3 feat(auth): persistir tentativas e expiração, 2945f8e refactor(import): adotar parser mantido e streaming, 4693487 fix(security): implementa correcoes criticas P0 de p, 483b27d feat(attachments): implementar upload streaming e es, 4b82016 fix(import): versionar hash e idempotência concorren
Community 5: financial_entries, restrict_sale_update(, sales, 004_sales.sql, actual, check_sale_installment_total(, company_accounts, expected, financial_entries_immutable, financial_entries_one_active_receipt, OLD.client_request_id, OLD.company_account_id
Community 6: validProduct(, inventory.ts, InventoryMovement, MOVEMENT_TYPES, MovementType, Product, validInventoryMovement(, validNonNegativeCents(, validProductBrand(, validProductModel(, validProductName(, services.ts
Community 7: restrict_follow_up_update(, 003_follow_up_tasks.sql, follow_up_tasks, follow_up_tasks_no_delete, follow_up_tasks_restrict_update, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id, OLD.title, patients
Community 8: 002_crm_patients.sql, patient_events, patient_events_immutable, patients, patients_no_delete, reject_patient_deletion(, reject_patient_event_changes(, users
Community 9: 001_base.sql, audit_events, audit_events_immutable, company_accounts, reject_audit_changes(, user_sessions, users
Community 10: finance-smoke.mjs, accounts, call(, clientRequestId, login(, payload, summary
Community 11: doctors.ts, buildCalendarDays(, CalendarDay, validLicenseNumber(, validDoctorId(, doctors.test.ts
Community 12: 007_inventory.sql, inventory_movements, prevent_inventory_movement_modification(, products, trg_prevent_inventory_movement_modification, users
Community 13: privacy.ts, anonymizePatientName(, formatLgpdExportPackage(, isAnonymized(, privacy.test.ts
Community 14: whatsapp.ts, buildWhatsAppLink(, formatE164Phone(, WHATSAPP_TEMPLATES, whatsapp.test.ts
Community 15: 006_csv_imports.sql, csv_import_errors, csv_import_jobs, users
Community 16: 009_attachments.sql, patient_attachments, patients, users
Community 17: 012_services_and_inventory.sql, products, service_products, services
Community 18: 014_lgpd_redactions.sql, patient_redactions, patients, users
Community 19: critical-flow.spec.ts, accessible(, login(
Community 20: dashboard-smoke.mjs, dashboard(, login(
Community 21: devsec-smoke.mjs, login(

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
