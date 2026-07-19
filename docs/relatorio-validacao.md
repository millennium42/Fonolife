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

Backlog P2: importação CSV idempotente, estoque/catálogo, WhatsApp, anexos, prontuário clínico completo e configuração dos prazos. Nenhum item bloqueia os critérios desta release.

## PR 8 — Médicos, serviços, UX e LGPD

- `npm run typecheck`, 14/14 testes de domínio/estrutura, build e `npm audit --audit-level=high`: aprovados; zero vulnerabilidades.
- Docker 29.6.1: imagem reconstruída na partição C; app e PostgreSQL 18 saudáveis. Migration e seed executados duas vezes sobre volume existente. Um PostgreSQL 18 temporário e vazio confirmou 7 migrations, 2 médicos e 2 caixas, também sem duplicação; contêiner e rede de prova foram removidos ao final.
- Smokes de dashboard e financeiro: aprovados. Smoke PostgreSQL em transação comprovou rejeição de serviço/retorno sem médico, médico inativo e `UPDATE` financeiro.
- DevSec: CSP/HSTS/nosniff, cookie, CSRF/Origin, SQL injection, Operador sem saída, Médico sem IDOR para CRM/financeiro/configuração, projeção mínima LGPD, logout e rate limit aprovados.
- Playwright + axe: 6/6 jornadas em 360/768/1440 px. Cobriu fluxo paciente-venda-financeiro, XSS armazenado não executado, diálogos, login Médico, ausência de navegação privilegiada e recarga da sessão médica.
- P1 encontrados no loop: trigger genérico acessava coluna inexistente de `sales`; refresh do Médico era bloqueado junto aos assets. Ambos receberam correção e regressão automatizada. Um feedback duplicado de sucesso também foi removido.
- Revisão implementador/revisor: evidência de agentes independentes, sem alegação de aprovação humana. Resultado final exige zero P0/P1; P2 permanece backlog documentado.
