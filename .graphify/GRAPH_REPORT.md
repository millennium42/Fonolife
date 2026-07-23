# Graph Report - .  (2026-07-23)

## Corpus Check
- Corpus is ~45.446 words - fits in a single context window. You may not need a graph.

## Summary
- 297 nodes · 836 edges · 14 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: ON_BRANCH: 264 · contains: 197 · MODIFIES: 106 · imports: 101 · imports_from: 47 · PARENT_OF: 43 · references: 25 · calls: 22 · reads_from: 20 · triggers: 11


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 93 · Candidates: 215
- Excluded: 0 untracked · 6227 ignored · 0 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `bacc003`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `financial_entries` - 11 edges
2. `restrict_sale_update()` - 10 edges
3. `sales` - 8 edges
4. `validProduct()` - 8 edges
5. `restrict_follow_up_update()` - 7 edges
6. `receivable_installments` - 6 edges
7. `pool` - 6 edges
8. `normalizePhone()` - 6 edges
9. `validPatientPhone()` - 6 edges
10. `hashPassword()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `264533a feat(services): adicionar migracao, modelo de dominio e API de servicos e CMV em produtos` --ON_BRANCH--> `codex/01-servicos-catalogo-estoque`  [EXTRACTED]
  git → git  _Bridges community 3 → community 1_
- `3f9e6cc feat: estabelecer núcleo seguro e executável da clínica Fonolife (#1)` --ON_BRANCH--> `codex/01-servicos-catalogo-estoque`  [EXTRACTED]
  git → git  _Bridges community 5 → community 1_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (41): ALLOWED_MIME_TYPES, AllowedMimeType, calculateFileHash(), sanitizeFilename(), validFileSize(), validMimeType(), calculateCsvHash(), CsvFinancialRow (+33 more)

### Community 1 - "Community 1"
Cohesion: 0.24
Nodes (43): codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-global, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/pr8-importacao-csv-seguranca, codex/quick-demo-login-buttons, main (+35 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (28): api(), categoryLabels, CompanyAccount, Dashboard(), DashboardData, date(), DoctorCalendar(), eventTypes (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (26): 264533a feat(services): adicionar migracao, modelo de dominio e API de servicos e CMV em produtos, 5fe1e04 feat(doctor): adicionar perfil médico, agenda calendário, prontuários de pacientes e atendimento clínico, d7896dd Merge branch 'codex/01-servicos-catalogo-estoque' into main, buildCalendarDays(), CalendarDay, validLicenseNumber(), InventoryMovement, MOVEMENT_TYPES (+18 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (25): actual, check_sale_installment_total(), company_accounts, expected, financial_entries, financial_entries_immutable, financial_entries_one_active_receipt, OLD.client_request_id (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.21
Nodes (13): 3f9e6cc feat: estabelecer núcleo seguro e executável da clínica Fonolife (#1), email, migrate(), pool, seedDemo(), hashPassword(), hashToken(), scrypt (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (12): follow_up_tasks, follow_up_tasks_no_delete, follow_up_tasks_restrict_update, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.43
Nodes (5): patient_events, patient_events_immutable, patients, patients_no_delete, users

### Community 8 - "Community 8"
Cohesion: 0.43
Nodes (5): audit_events, audit_events_immutable, company_accounts, user_sessions, users

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (4): accounts, clientRequestId, payload, summary

### Community 10 - "Community 10"
Cohesion: 0.53
Nodes (4): inventory_movements, products, trg_prevent_inventory_movement_modification, users

### Community 11 - "Community 11"
Cohesion: 0.80
Nodes (3): buildWhatsAppLink(), formatE164Phone(), WHATSAPP_TEMPLATES

### Community 12 - "Community 12"
Cohesion: 0.83
Nodes (3): csv_import_errors, csv_import_jobs, users

### Community 13 - "Community 13"
Cohesion: 0.83
Nodes (3): patient_attachments, patients, users

## Knowledge Gaps
- **42 isolated node(s):** `company_accounts`, `User`, `FastifyRequest`, `attempts`, `email` (+37 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `validProduct()` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `validService()` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `hashPassword()` connect `Community 5` to `Community 0`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `company_accounts`, `User`, `FastifyRequest` to the rest of the system?**
  _42 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07597402597402597 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.056025369978858354 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.11051693404634581 - nodes in this community are weakly interconnected._