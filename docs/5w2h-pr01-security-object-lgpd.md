# Documentação 5W2H — PR 01: Autorização por Objeto e Redação LGPD Completa

## 1. Matriz 5W2H
- **What (O que):** Eliminação integral dos problemas P0 de autorização por objeto (BOLA/IDOR), LGPD e CSRF:
  1. Aplicação sistêmica das funções de autorização por objeto (`canReadPatient`, `canWritePatient`, `canExportPatientData`, `canReadAttachment`) em todas as rotas da aplicação (pacientes, prontuários, anexos, vendas, acompanhamentos, agenda médica e consultas).
  2. Redação dinâmica de descrições históricas imutáveis da tabela `patient_events` nas consultas (timeline, exportação LGPD, agenda e consultas), sem violar o trigger imutável do banco.
  3. Requisitos estritos para a rota de anonimização `/api/admin/patients/:id/anonymize` (perfil `admin`, trava otimista `version`, justificativa `reason`, confirmação `confirm: true` e validação de senha do administrador em transação única).
  4. Validação estrita de `Origin` e `Referer` em mutações autenticadas por cookie para mitigação completa de CSRF.
  5. Respostas 404/403 sem revelação desnecessária de existência de objetos e auditoria de negações sem vazamento de PII.
- **Why (Por que):** Garantir conformidade com a LGPD (Art. 18 e Art. 52), impedir acessos não autorizados por IDOR/BOLA e assegurar a integridade e privacidade do prontuário médico.
- **Where (Onde):** `src/domain/security.ts`, `src/domain/privacy.ts`, `src/app.ts`, `tests/security-object-lgpd.test.ts` e `docs/5w2h-pr01-security-object-lgpd.md`.
- **When (Quando):** Ciclo da entrega `codex/pr-01-security-object-lgpd`.
- **Who (Quem):** Equipe Antigravity.
- **How (Como):** Helper central `loadAndAuthorizePatient`, filtro SQL de pacientes por médico logado, projeção `CASE WHEN` nas consultas de eventos, validação atômica de `Origin` no hook Fastify `onRequest` e suíte de testes automatizados.
- **How Much (Quanto Custa):** Zero custo adicional de infraestrutura; manutenção do modelo monólito modular sem abstrações especulativas.

---

## 2. Categorização de Dados na Anonimização LGPD

| Categoria do Dado | Atributos Afetados | Tratamento Aplicado | Justificativa / Fundamento Legal |
|---|---|---|---|
| **Apagados / Removidos** | `guardian_name` | Definidos como `NULL` / limpos | Eliminação de PII direta (Art. 16, LGPD) |
| **Pseudonimizados** | `name`, `phone` | Substituídos por `Paciente Anonimizado <shortId>` e `5500000000000` | Pseudonimização irreversível sem chave primária |
| **Preservados** | `id`, registros de `patient_events` | Mantidos intactos no banco de dados | Obrigação legal/regulatória de guarda de prontuário e trigger imutável |
| **Redigidos** | `notes`, `care_alert`, descrições de `patient_events` em timeline, exportação e consultas | Substituídos por `[DADOS REMOVIDOS LGPD]` na atualização do paciente e dinamicamente nas projeções de leitura | Redação de histórico clínico para proibir exibição de PII mantendo rastreabilidade |

---

## 3. Matriz de Permissões de Acesso (RBAC / BOLA)

| Ação / Endpoint | Admin | Operador | Médico Vinculado | Médico Não Vinculado |
|---|---|---|---|---|
| Listagem de Pacientes (`GET /api/patients`) | Todos | Todos | Apenas vinculados (Filtro SQL) | Apenas vinculados (Filtro SQL) |
| Leitura / Ficha (`GET /api/patients/:id`) | Sim | Sim | Sim | 404 (Obscuro) |
| Edição Ficha (`PATCH /api/patients/:id`) | Sim | Sim | Sim (sem alterar médico responsável) | 404 (Obscuro) |
| Reatribuir Médico Responsável | Sim | Sim | Não (403) | Não (403) |
| Eventos / Anexos / Timeline | Sim | Sim | Sim | 404 (Obscuro) |
| Exportação LGPD (`GET /api/patients/:id/export-data`) | Sim | Não (404/403) | Sim | 404 (Obscuro) |
| Anonimização LGPD (`POST /api/admin/patients/:id/anonymize`) | Sim (Senha + Lock + Motivo) | Não (403) | Não (403) | Não (403) |

---

## 4. Testes & Cobertura
- `npm run typecheck`: 0 erros.
- `npm test`: 41 testes com aprovação de 100%.
- `npm run build`: Build de produção executado com sucesso.
- Mutações HTTP positivas e negativas com validação de Origin/CSRF.

---

## 5. Plano de Rollback
- Em caso de emergência em produção, executar `git switch main` e reverter o merge da branch `codex/pr-01-security-object-lgpd`.
- Como não há alterações destrutivas de schema nas migrações, o rollback do código preserva a integridade do banco de dados PostgreSQL.
