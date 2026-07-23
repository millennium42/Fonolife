# Community Labeling

Graphify is running in assistant/skill mode (no API key). You are the host
assistant (Claude Code / Codex / Gemini CLI). Read the community listing below
and write 2-5 word plain-language names for each.

## Language

LANGUAGE: each community line ends with a `[lang=…]` marker giving the
language of its source nodes. Write that community's name in EXACTLY that
language. Do not normalize every name to one common language.

## Communities

Community 0: codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-global, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica, codex/p2-melhorias-operacionais, codex/pr-01-security-object-lgpd, codex/pr8-importacao-csv-seguranca, codex/quick-demo-login-buttons, main [lang=en]
Community 1: normalizePhone(, 0b8c651 fix(csrf): endurecer validacao de origem, 1091aa4 feat(core): implementa melhorias operacionais e de q, 55ec728 Merge branch 'main' of https://github.com/millennium, a01c4f0 fix(security): centralizar carregamento e autorizaca, cbaee24 docs(security): documentar matriz de acesso e anonim, e517fa0 refactor(core): implementa correcoes de confiabilida, attachments.ts, ALLOWED_MIME_TYPES, AllowedMimeType, calculateFileHash(, detectMimeTypeFromMagicBytes( [lang=nl]
Community 2: main.tsx, api(, App(, async(, categoryLabels, cents(, CompanyAccount, CsvImport(, Dashboard(, DashboardData, date(, DoctorCalendar( [lang=en]
Community 3: pool, hashPassword(, config, routes.ts, authRoutes(, 3f9e6cc feat: estabelecer núcleo seguro e executável da clín, 4693487 fix(security): implementa correcoes criticas P0 de p, create-admin.ts, email, migrate.ts, migrate(, pool.ts [lang=en]
Community 4: financial_entries, receivable_installments, restrict_sale_update(, sales, 004_sales.sql, actual, check_sale_installment_total(, company_accounts, expected, financial_entries_immutable, financial_entries_one_active_receipt, OLD.client_request_id [lang=en]
Community 5: validProduct(, inventory.ts, InventoryMovement, MOVEMENT_TYPES, MovementType, Product, validInventoryMovement(, validNonNegativeCents(, validProductBrand(, validProductModel(, validProductName(, services.ts [lang=en]
Community 6: restrict_follow_up_update(, 003_follow_up_tasks.sql, follow_up_tasks, follow_up_tasks_no_delete, follow_up_tasks_restrict_update, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id, OLD.title, patients [lang=en]
Community 7: 002_crm_patients.sql, patient_events, patient_events_immutable, patients, patients_no_delete, reject_patient_deletion(, reject_patient_event_changes(, users [lang=en]
Community 8: 001_base.sql, audit_events, audit_events_immutable, company_accounts, reject_audit_changes(, user_sessions, users [lang=en]
Community 9: finance-smoke.mjs, accounts, call(, clientRequestId, login(, payload, summary [lang=en]
Community 10: doctors.ts, buildCalendarDays(, CalendarDay, validLicenseNumber(, validDoctorId(, doctors.test.ts [lang=en]
Community 11: 007_inventory.sql, inventory_movements, prevent_inventory_movement_modification(, products, trg_prevent_inventory_movement_modification, users [lang=en]
Community 12: privacy.ts, anonymizePatientName(, formatLgpdExportPackage(, isAnonymized(, privacy.test.ts [lang=en]
Community 13: whatsapp.ts, buildWhatsAppLink(, formatE164Phone(, WHATSAPP_TEMPLATES, whatsapp.test.ts [lang=en]
Community 14: 006_csv_imports.sql, csv_import_errors, csv_import_jobs, users [lang=en]
Community 15: 009_attachments.sql, patient_attachments, patients, users [lang=en]
Community 16: 012_services_and_inventory.sql, products, service_products, services [lang=en]
Community 17: 014_lgpd_redactions.sql, patient_redactions, patients, users [lang=en]
Community 18: critical-flow.spec.ts, accessible(, login( [lang=en]
Community 19: dashboard-smoke.mjs, dashboard(, login( [lang=en]
Community 20: devsec-smoke.mjs, login( [lang=en]

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
