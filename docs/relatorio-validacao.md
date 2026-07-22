# Relatório de validação

## PR 1

Escopo: compilação TypeScript, testes de senha/token/CNPJ, migrador, autenticação, autorização e Docker.

- `npm run typecheck`: aprovado.
- `npm test`: 5/5 aprovados.
- `npm run build`: aprovado.
- `docker compose up --build --wait`: `app` e PostgreSQL 18 saudáveis.
- `/api/health`: HTTP 200.
- Seed automático com `DEMO_MODE=true`: Admin e Operador autenticaram após subida limpa.
- RBAC: Operador recebeu HTTP 403 em `/api/admin/users`.
- Revisão independente: quatro P1 iniciais corrigidos; a proteção concorrente do último administrador passou a usar advisory lock transacional.

Limitação consciente: os testes de PostgreSQL real ainda são smoke do Compose; a suíte de integração será ampliada nas entregas que introduzem CRM e ledger. CRM, vendas e financeiro não pertencem a esta PR.

## PR 2

- Typecheck, 6 testes e build aprovados.
- Domínio valida nome, telefone, status, origem e tipos de evento.
- Migration cria pacientes arquiváveis e eventos imutáveis.
- API cobre busca/filtro, cadastro, ficha, edição com conflito 409, arquivamento, interação e timeline.
- Interface cobre cadastro básico, campos adicionais progressivos, lista e ficha responsiva.

## PR 3

- Typecheck, testes de datas em São Paulo e build aprovados.
- Tarefas preservam histórico e não aceitam exclusão.
- Próximo contato é derivado da tarefa aberta mais próxima.
- Filas cobrem hoje, atrasados, próximos, adaptação e 90 dias sem contato.
# Evidência da PR 4

Em 18/07/2026, `npm run typecheck` passou sem erros e `npm test` aprovou 9/9 testes. Os testes de venda cobrem soma exata em centavos e parcelamento mensal determinístico com ajuste do último dia do mês. A integração PostgreSQL/Docker permanece para a validação consolidada da release.

## PR 5

- Typecheck, 10/10 testes e build aprovados.
- Realizado e previsão são separados; saldo usa somente realizado ativo.
- Baixa é idempotente e estorno é exclusivo de Admin.
- Operador recebe 403 em resumo agregado e estorno.
- Filtros cobrem período, CNPJ, tipo, categoria e pagamento.

## PR 6

- Dashboard consulta atrasados, hoje, tarefas abertas, adaptação, vendas do mês e fila priorizada.
- A resposta do Operador não contém `financial`; o Admin recebe realizado consolidado, por CNPJ e entradas/saídas do mês.
- Cards levam ao Acompanhamento e itens da fila abrem a ficha do paciente; não há gráficos.
- `npm run typecheck`, 11/11 testes e `npm run build`: aprovados.

## PR 7 — QA e release

- Docker 29.6.1 e Compose: `app` e PostgreSQL 18 saudáveis.
- Migrações e seed DEMO executados duas vezes sem duplicação ou divergência.
- `npm audit`: zero vulnerabilidades.
- Smokes HTTP de dashboard e financeiro: aprovados.
- Playwright + axe: 3/3 jornadas aprovadas em 360, 768 e 1440 px, sem violação automatizável ou rolagem horizontal.
- Jornada E2E: login, cadastro, venda integral, follow-ups gerados e Financeiro.
- P1 encontrados no loop: cast D+7/D+30/D+90, formatação de data PostgreSQL e feedback pós-venda; todos corrigidos e revalidados.
- DevSec smoke: CSP/HSTS/nosniff, cookie HttpOnly/Secure/SameSite, CSRF por Origin, sessão invalidada no logout, RBAC, Problem Details, consulta parametrizada e rate limit aprovados.
- Dependências: `npm audit --audit-level=high` sem vulnerabilidades; CI limita `packages: write` ao job de publicação.
- Graphify estrutural atualizado; documentação semântica permanece sem backend externo e não faz parte do produto.

## PR 8 — Importação CSV Idempotente de Pacientes e Finanças

- `npm run typecheck`: aprovado (0 erros).
- `npm test`: 16/16 testes aprovados.
- `npm run build`: aprovado (bundle Fastify + Vite compilados com sucesso).
- `npm audit`: 0 vulnerabilidades (vulnerabilidade `fast-uri` corrigida).
- Idempotência: verificada via hash SHA-256 com reenvio de arquivo retornando payload de lote anterior sem duplicação no PostgreSQL.
- Segurança e Sanitização: sanitização de fórmulas CSV (CSV Injection) prefixando `'` em células iniciadas com `=`, `+`, `-`, `@`.
- RBAC: perfil Operador bloqueado com HTTP 403; exclusivo para perfil Admin.
- Defeitos: P0 = 0, P1 = 0, P2 = 0.

## PR 9 — Catálogo e Controle de Estoque de Aparelhos

- `npm run typecheck`: aprovado (0 erros).
- `npm test`: 19/19 testes aprovados.
- `npm run build`: aprovado (bundle Fastify + Vite compilados com sucesso).
- `npm audit`: 0 vulnerabilidades.
- Imutabilidade & Append-only: trigger PostgreSQL `trg_prevent_inventory_movement_modification` bloqueando qualquer UPDATE/DELETE na tabela `inventory_movements`.
- Saldo Não-Negativo: validação transacional impedindo vendas ou ajustes que resultem em saldo negativo no estoque.
- Baixa Automática em Vendas: integração transacional na API de Vendas gerando baixa automática `sale_deduction`.
- RBAC: perfil Operador bloqueado em rotas administrativas de catálogo/movimentação (HTTP 403).
- Defeitos: P0 = 0, P1 = 0, P2 = 0.

## PR 10 — Atalhos Rápidos WhatsApp de Comunicação Direta

- `npm run typecheck`: aprovado (0 erros).
- `npm test`: 22/22 testes aprovados.
- `npm run build`: aprovado (bundle Fastify + Vite compilados com sucesso).
- `npm audit`: 0 vulnerabilidades.
- Segurança de URL: codificação estrita com `encodeURIComponent` contra injeção de parâmetros maliciosos ou scripts em links `wa.me`.
- Formatação E.164: normalização garantida com código internacional `55` e validação de 11 dígitos com DDD.
- Auditoria de Comunicação: clique do atalho gera evento atômico em `patient_events` (tipo `whatsapp`) e em `audit_events`.
- Defeitos: P0 = 0, P1 = 0, P2 = 0.

## PR 11 — Anexos de Exames & Audiometrias com Armazenamento Seguro

- `npm run typecheck`: aprovado (0 erros).
- `npm test`: 26/26 testes aprovados.
- `npm run build`: aprovado (bundle Fastify + Vite compilados com sucesso).
- `npm audit`: 0 vulnerabilidades.
- Proteção Path Traversal: sanitização rigorosa via `sanitizeFilename` e isolamento dos arquivos em `storage/attachments/` com UUIDs imutáveis.
- Restrição de MIME & Tamanho: autorização exclusiva para PDF, JPEG, PNG e WEBP até o limite de 10MB.
- Integridade & Auditoria: geração de hash SHA-256 e gravação em `patient_events` e `audit_events`.
- Cabeçalhos de Segurança HTTP: respostas de download contendo `Content-Security-Policy: default-src 'none'` e `X-Content-Type-Options: nosniff`.
- Defeitos: P0 = 0, P1 = 0, P2 = 0.

## PR 12 — Governança de Dados, Portabilidade e Anonimização LGPD

- `npm run typecheck`: aprovado (0 erros).
- `npm test`: 29/29 testes aprovados.
- `npm run build`: aprovado (bundle Fastify + Vite compilados com sucesso).
- `npm audit`: 0 vulnerabilidades.
- Portabilidade (Art. 18 LGPD): geração de pacote JSON estruturado contendo prontuário completo do paciente com log de auditoria.
- Anonimização Segura: substituição de PII por pseudônimos e mascaramentos em transação SQL mantendo a integridade contábil e fiscal das vendas e lançamentos financeiros append-only.
- RBAC: endpoint de anonimização restrito ao perfil Admin com trava de versão optimistic lock.
- Defeitos: P0 = 0, P1 = 0, P2 = 0.

---

### Resumo Consolidado da Release de Evolução (PR 1 a PR 12)

- **Total de PRs Entregues**: 12/12 (100% da Roadmap Concluído).
- **Métricas de Qualidade Final**: **P0 = 0, P1 = 0, P2 = 0**.
- **Segurança & Auditoria**: Rastreabilidade atômica em `audit_events`, RBAC restrito, HSTS, CSP, nosniff, sanitização contra CSV Injection e Path Traversal.
- **Suíte de Testes**: **29/29 testes unitários verdes**.
- **Integração Grafo AST**: Graphify sincronizado e atualizado.
