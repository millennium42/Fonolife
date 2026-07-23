# Graph Report - .  (2026-07-23)

## Corpus Check
- Corpus is ~41.984 words - fits in a single context window. You may not need a graph.

## Summary
- 259 nodes · 570 edges · 17 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 179 · imports: 94 · MODIFIES: 82 · ON_BRANCH: 76 · imports_from: 42 · PARENT_OF: 27 · references: 23 · reads_from: 20 · calls: 16 · triggers: 11


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 83 · Candidates: 185
- Excluded: 6 untracked · 6227 ignored · 0 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `5fe1e04`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `financial_entries` - 11 edges
2. `restrict_sale_update()` - 10 edges
3. `sales` - 8 edges
4. `restrict_follow_up_update()` - 7 edges
5. `validProduct()` - 7 edges
6. `receivable_installments` - 6 edges
7. `pool` - 6 edges
8. `normalizePhone()` - 6 edges
9. `validPatientPhone()` - 6 edges
10. `hashPassword()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `0d2db0f feat: centralizar cadastro e histórico de pacientes (#2)` --ON_BRANCH--> `codex/01-servicos-catalogo-estoque`  [EXTRACTED]
  git → git  _Bridges community 0 → community 2_
- `3f9e6cc feat: estabelecer núcleo seguro e executável da clínica Fonolife (#1)` --ON_BRANCH--> `codex/01-servicos-catalogo-estoque`  [EXTRACTED]
  git → git  _Bridges community 4 → community 2_
- `3f9e6cc feat: estabelecer núcleo seguro e executável da clínica Fonolife (#1)` --PARENT_OF--> `0d2db0f feat: centralizar cadastro e histórico de pacientes (#2)`  [EXTRACTED]
  git → git  _Bridges community 4 → community 0_
- `5fe1e04 feat(doctor): adicionar perfil médico, agenda calendário, prontuários de pacientes e atendimento clínico` --ON_BRANCH--> `codex/01-servicos-catalogo-estoque`  [EXTRACTED]
  git → git  _Bridges community 8 → community 2_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (37): 0d2db0f feat: centralizar cadastro e histórico de pacientes (#2), ALLOWED_MIME_TYPES, AllowedMimeType, calculateFileHash(), sanitizeFilename(), validFileSize(), validMimeType(), calculateCsvHash() (+29 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (22): categoryLabels, CompanyAccount, Dashboard(), DashboardData, date(), DoctorCalendar(), eventTypes, Finance() (+14 more)

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (28): codex/01-servicos-catalogo-estoque, codex/pr8-importacao-csv-seguranca, main, 0687af4 feat(privacy): implementar endpoints de exportação JSON e anonimização LGPD com auditoria (#12), 077b08e feat(privacy): adicionar migration 010 para pseudonimização LGPD e campos de auditoria de privacidade (#12), 0e1c4ad test: consolidar QA, acessibilidade e release do Fonolife (#7), 2dd873d feat: consolidar financeiro único para dois CNPJs (#5), 3a29c99 chore(deploy): preparar infraestrutura no Render com Blueprint, SSL e checagem estrita de segurança (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (25): actual, check_sale_installment_total(), company_accounts, expected, financial_entries, financial_entries_immutable, financial_entries_one_active_receipt, OLD.client_request_id (+17 more)

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (13): 3f9e6cc feat: estabelecer núcleo seguro e executável da clínica Fonolife (#1), email, migrate(), pool, seedDemo(), hashPassword(), hashToken(), scrypt (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (12): follow_up_tasks, follow_up_tasks_no_delete, follow_up_tasks_restrict_update, OLD.created_at, OLD.created_by, OLD.due_on, OLD.notes, OLD.patient_id (+4 more)

### Community 6 - "Community 6"
Cohesion: 0.30
Nodes (10): InventoryMovement, MOVEMENT_TYPES, MovementType, Product, validInventoryMovement(), validNonNegativeCents(), validProduct(), validProductBrand() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.43
Nodes (5): patient_events, patient_events_immutable, patients, patients_no_delete, users

### Community 8 - "Community 8"
Cohesion: 0.43
Nodes (4): 5fe1e04 feat(doctor): adicionar perfil médico, agenda calendário, prontuários de pacientes e atendimento clínico, buildCalendarDays(), CalendarDay, validLicenseNumber()

### Community 9 - "Community 9"
Cohesion: 0.43
Nodes (5): audit_events, audit_events_immutable, company_accounts, user_sessions, users

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (4): accounts, clientRequestId, payload, summary

### Community 11 - "Community 11"
Cohesion: 0.53
Nodes (4): inventory_movements, products, trg_prevent_inventory_movement_modification, users

### Community 12 - "Community 12"
Cohesion: 0.70
Nodes (3): anonymizePatientName(), formatLgpdExportPackage(), isAnonymized()

### Community 13 - "Community 13"
Cohesion: 0.80
Nodes (3): buildWhatsAppLink(), formatE164Phone(), WHATSAPP_TEMPLATES

### Community 14 - "Community 14"
Cohesion: 0.83
Nodes (2): FOLLOW_UP_FILTERS, saoPauloDate()

### Community 15 - "Community 15"
Cohesion: 0.83
Nodes (3): csv_import_errors, csv_import_jobs, users

### Community 16 - "Community 16"
Cohesion: 0.83
Nodes (3): patient_attachments, patients, users

## Knowledge Gaps
- **37 isolated node(s):** `company_accounts`, `User`, `FastifyRequest`, `attempts`, `email` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 14`** (2 nodes): `FOLLOW_UP_FILTERS`, `saoPauloDate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `validProduct()` connect `Community 6` to `Community 0`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `hashPassword()` connect `Community 4` to `Community 0`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `normalizePhone()` connect `Community 0` to `Community 13`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `company_accounts`, `User`, `FastifyRequest` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09131205673758866 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06507936507936508 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.14814814814814814 - nodes in this community are weakly interconnected._