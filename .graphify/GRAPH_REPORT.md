# Graph Report - .  (2026-07-23)

## Corpus Check
- 96 files · ~50.617 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 314 nodes · 962 edges · 17 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: ON_BRANCH: 352 · contains: 208 · MODIFIES: 115 · imports: 110 · imports_from: 47 · PARENT_OF: 47 · references: 27 · calls: 25 · reads_from: 20 · triggers: 11


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 96 · Candidates: 226
- Excluded: 2 untracked · 6227 ignored · 0 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `4693487`
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
- `3f9e6cc feat: estabelecer núcleo seguro e executável da clínica Fonolife (#1)` --ON_BRANCH--> `codex/01-servicos-catalogo-estoque`  [EXTRACTED]
  git → git  _Bridges community 3 → community 0_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.25
Nodes (50): codex/01-servicos-catalogo-estoque, codex/02-medico-responsavel-prontuario-global, codex/03-caixa-pdv-relatorio-financeiro, codex/04-design-system-seed-demo, codex/fix-seed-fk-constraint, codex/p0-correcoes-criticas, codex/p1-refatoracao-tecnica, codex/pr8-importacao-csv-seguranca (+42 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (38): calculateCsvHash(), CsvFinancialRow, CsvPatientRow, parseCsv(), ParsedCsv, sanitizeCsvCell(), validateFinancialCsvRow(), validatePatientCsvRow() (+30 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (28): api(), categoryLabels, CompanyAccount, Dashboard(), DashboardData, date(), DoctorCalendar(), eventTypes (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (21): 3f9e6cc feat: estabelecer núcleo seguro e executável da clínica Fonolife (#1), 4693487 fix(security): implementa correcoes criticas P0 de producao, LGPD e autorizacao por objeto, email, migrate(), pool, seedDemo(), canExportPatientData(), canReadAttachment() (+13 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (25): actual, check_sale_installment_total(), company_accounts, expected, financial_entries, financial_entries_immutable, financial_entries_one_active_receipt, OLD.client_request_id (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (16): InventoryMovement, MOVEMENT_TYPES, MovementType, Product, validInventoryMovement(), validNonNegativeCents(), validProduct(), validProductBrand() (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (12): follow_up_tasks, follow_up_tasks_no_delete, follow_up_tasks_restrict_update, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.36
Nodes (7): ALLOWED_MIME_TYPES, AllowedMimeType, calculateFileHash(), detectMimeTypeFromMagicBytes(), sanitizeFilename(), validFileSize(), validMimeType()

### Community 8 - "Community 8"
Cohesion: 0.43
Nodes (5): patient_events, patient_events_immutable, patients, patients_no_delete, users

### Community 9 - "Community 9"
Cohesion: 0.43
Nodes (5): audit_events, audit_events_immutable, company_accounts, user_sessions, users

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (4): accounts, clientRequestId, payload, summary

### Community 11 - "Community 11"
Cohesion: 0.47
Nodes (4): buildCalendarDays(), CalendarDay, validLicenseNumber(), validDoctorId()

### Community 12 - "Community 12"
Cohesion: 0.53
Nodes (4): inventory_movements, products, trg_prevent_inventory_movement_modification, users

### Community 13 - "Community 13"
Cohesion: 0.83
Nodes (3): csv_import_errors, csv_import_jobs, users

### Community 14 - "Community 14"
Cohesion: 0.83
Nodes (3): patient_attachments, patients, users

### Community 15 - "Community 15"
Cohesion: 0.83
Nodes (3): products, service_products, services

### Community 16 - "Community 16"
Cohesion: 0.83
Nodes (3): patient_redactions, patients, users

## Knowledge Gaps
- **45 isolated node(s):** `company_accounts`, `User`, `FastifyRequest`, `attempts`, `email` (+40 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `validProduct()` connect `Community 5` to `Community 1`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `validService()` connect `Community 5` to `Community 1`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `hashPassword()` connect `Community 3` to `Community 1`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `company_accounts`, `User`, `FastifyRequest` to the rest of the system?**
  _45 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08200290275761973 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.056025369978858354 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.14838709677419354 - nodes in this community are weakly interconnected._