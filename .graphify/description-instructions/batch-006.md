# Node Description Batch 7 of 8

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

- "domain_security_patienttarget": "PatientTarget" | kind=code-symbol | source=src/domain/security.ts:L37 | neighbors=[security.ts]
- "domain_security_userrole": "UserRole" | kind=code-symbol | source=src/domain/security.ts:L30 | neighbors=[security.ts]
- "domain_security_usersubject": "UserSubject" | kind=code-symbol | source=src/domain/security.ts:L32 | neighbors=[security.ts]
- "domain_services_serviceinput": "ServiceInput" | kind=code-symbol | source=src/domain/services.ts:L8 | neighbors=[services.ts]
- "domain_services_serviceitem": "ServiceItem" | kind=code-symbol | source=src/domain/services.ts:L17 | neighbors=[services.ts]
- "domain_services_serviceproductinput": "ServiceProductInput" | kind=code-symbol | source=src/domain/services.ts:L3 | neighbors=[services.ts]
- "e2e_critical_flow_spec_accessible": "accessible()" | kind=code-symbol | source=tests/e2e/critical-flow.spec.ts:L12 | neighbors=[critical-flow.spec.ts]
- "e2e_critical_flow_spec_login": "login()" | kind=code-symbol | source=tests/e2e/critical-flow.spec.ts:L4 | neighbors=[critical-flow.spec.ts]
- "migrations_001_base_company_accounts": "company_accounts" | kind=code-symbol | source=migrations/001_base.sql:L23 | neighbors=[001_base.sql]
- "migrations_001_base_reject_audit_changes": "reject_audit_changes()" | kind=code-symbol | source=migrations/001_base.sql:L42 | neighbors=[001_base.sql]
- "migrations_002_crm_patients_reject_patient_deletion": "reject_patient_deletion()" | kind=code-symbol | source=migrations/002_crm_patients.sql:L24 | neighbors=[002_crm_patients.sql]
- "migrations_002_crm_patients_reject_patient_event_changes": "reject_patient_event_changes()" | kind=code-symbol | source=migrations/002_crm_patients.sql:L41 | neighbors=[002_crm_patients.sql]
- "migrations_003_follow_up_tasks_reject_follow_up_deletion": "reject_follow_up_deletion()" | kind=code-symbol | source=migrations/003_follow_up_tasks.sql:L19 | neighbors=[003_follow_up_tasks.sql]
- "migrations_004_sales_reject_financial_changes": "reject_financial_changes()" | kind=code-symbol | source=migrations/004_sales.sql:L58 | neighbors=[004_sales.sql]
- "migrations_004_sales_reject_installment_changes": "reject_installment_changes()" | kind=code-symbol | source=migrations/004_sales.sql:L79 | neighbors=[004_sales.sql]
- "migrations_005_finance": "005_finance.sql" | kind=code-symbol | source=migrations/005_finance.sql:L1 | neighbors=[2dd873d feat: consolidar financeiro úni…]
- "migrations_007_inventory_prevent_inventory_movement_modification": "prevent_inventory_movement_modification()" | kind=code-symbol | source=migrations/007_inventory.sql:L24 | neighbors=[007_inventory.sql]
- "migrations_008_whatsapp_shortcuts": "008_whatsapp_shortcuts.sql" | kind=code-symbol | source=migrations/008_whatsapp_shortcuts.sql:L1 | neighbors=[5ccde91 feat: implementar atalhos rápid…]
- "migrations_010_lgpd_privacy": "010_lgpd_privacy.sql" | kind=code-symbol | source=migrations/010_lgpd_privacy.sql:L1 | neighbors=[077b08e feat(privacy): adicionar migrat…]
- "migrations_011_doctor_schedule": "011_doctor_schedule.sql" | kind=code-symbol | source=migrations/011_doctor_schedule.sql:L1 | neighbors=[5fe1e04 feat(doctor): adicionar perfil …]
- "src_app_attempts": "attempts" | kind=code-symbol | source=src/app.ts:L75 | neighbors=[app.ts]
- "src_app_fastifyrequest": "FastifyRequest" | kind=code-symbol | source=src/app.ts:L71 | neighbors=[app.ts]
- "src_app_user": "User" | kind=code-symbol | source=src/app.ts:L61 | neighbors=[app.ts]
- "src_main_app": "App()" | kind=code-symbol | source=web/src/main.tsx:L1974 | neighbors=[main.tsx]
- "src_main_async": "async()" | kind=code-symbol | source=web/src/main.tsx:L1656 | neighbors=[main.tsx]
- "src_main_categorylabels": "categoryLabels" | kind=code-symbol | source=web/src/main.tsx:L1157 | neighbors=[main.tsx]
- "src_main_cents": "cents()" | kind=code-symbol | source=web/src/main.tsx:L151 | neighbors=[main.tsx]
- "src_main_companyaccount": "CompanyAccount" | kind=code-symbol | source=web/src/main.tsx:L51 | neighbors=[main.tsx]
- "src_main_csvimport": "CsvImport()" | kind=code-symbol | source=web/src/main.tsx:L1852 | neighbors=[main.tsx]
- "src_main_dashboarddata": "DashboardData" | kind=code-symbol | source=web/src/main.tsx:L114 | neighbors=[main.tsx]
- "src_main_doctorconsultationform": "DoctorConsultationForm()" | kind=code-symbol | source=web/src/main.tsx:L2316 | neighbors=[main.tsx]
- "src_main_doctorpatients": "DoctorPatients()" | kind=code-symbol | source=web/src/main.tsx:L2277 | neighbors=[main.tsx]
- "src_main_eventtypes": "eventTypes" | kind=code-symbol | source=web/src/main.tsx:L122 | neighbors=[main.tsx]
- "src_main_financesummary": "FinanceSummary" | kind=code-symbol | source=web/src/main.tsx:L100 | neighbors=[main.tsx]
- "src_main_financialentry": "FinancialEntry" | kind=code-symbol | source=web/src/main.tsx:L57 | neighbors=[main.tsx]
- "src_main_followup": "FollowUp" | kind=code-symbol | source=web/src/main.tsx:L40 | neighbors=[main.tsx]
- "src_main_followups": "FollowUps()" | kind=code-symbol | source=web/src/main.tsx:L862 | neighbors=[main.tsx]
- "src_main_globalpatientmodal": "GlobalPatientModal()" | kind=code-symbol | source=web/src/main.tsx:L219 | neighbors=[main.tsx]
- "src_main_if": "if()" | kind=code-symbol | source=web/src/main.tsx:L534 | neighbors=[main.tsx]
- "src_main_inventory": "Inventory()" | kind=code-symbol | source=web/src/main.tsx:L1665 | neighbors=[main.tsx]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: C:\Users\milla\Documents\Projetos\Git\Fonolife\.graphify\description-instructions\batch-006.json

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
