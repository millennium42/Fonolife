# Community Labeling

Graphify is running in assistant/skill mode (no API key). You are the host
assistant (Claude Code / Codex / Gemini CLI). Read the community listing below
and write 2-5 word plain-language names for each.

## Language

LANGUAGE: each community line ends with a `[lang=…]` marker giving the
language of its source nodes. Write that community's name in EXACTLY that
language. Do not normalize every name to one common language.

## Communities

Community 0: main.tsx, api(, App(, categoryLabels, cents(, CompanyAccount, CsvImport(, Dashboard(, DashboardData, date(, eventTypes, Finance( [lang=en]
Community 1: check_sale_installment_total(, financial_entries, receivable_installments, restrict_sale_update(, sales, 004_sales.sql, actual, company_accounts, expected, financial_entries_immutable, financial_entries_one_active_receipt, OLD.client_request_id [lang=en]
Community 2: pool, hashPassword(, config, 3f9e6cc feat: estabelecer núcleo seguro e executável da clín, create-admin.ts, email, migrate.ts, migrate(, pool.ts, seed.ts, seedDemo(, security.ts [lang=pt]
Community 3: codex/pr8-importacao-csv-seguranca, main, 0d2db0f feat: centralizar cadastro e histórico de pacientes , 0e1c4ad test: consolidar QA, acessibilidade e release do Fon, 2dd873d feat: consolidar financeiro único para dois CNPJs (#, 4de92ce Graphify, 68c033b chore: inicializar main para entregas independentes, a56a353 feat: priorizar filas acionáveis no dashboard (#6, a740db5 feat: registrar vendas com parcelas e pós-venda auto, ff35345 feat: tornar o pós-atendimento uma fila acionável (#, critical-flow.spec.ts, accessible( [lang=pt]
Community 4: follow-ups.ts, FOLLOW_UP_FILTERS, saoPauloDate(, patients.ts, CONTACT_SOURCES, ContactSource, isOneOf(, normalizePhone(, PATIENT_EVENT_TYPES, PATIENT_STATUSES, PatientEventType, PatientStatus [lang=en]
Community 5: follow_up_tasks, restrict_follow_up_update(, 003_follow_up_tasks.sql, follow_up_tasks_no_delete, follow_up_tasks_restrict_update, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id, OLD.title, patients [lang=en]
Community 6: finance.ts, ENTRY_TYPES, FINANCE_CATEGORIES, validFinancialEntry(, sales.ts, DELIVERY_STATUSES, PAYMENT_METHODS, SaleInstallment, splitMonthly(, validateInstallments(, validCents(, finance.test.ts [lang=en]
Community 7: 002_crm_patients.sql, patient_events, patient_events_immutable, patients, patients_no_delete, reject_patient_deletion(, reject_patient_event_changes(, users [lang=en]
Community 8: 001_base.sql, audit_events, audit_events_immutable, company_accounts, reject_audit_changes(, user_sessions, users [lang=en]
Community 9: finance-smoke.mjs, accounts, call(, clientRequestId, login(, payload, summary [lang=en]

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
