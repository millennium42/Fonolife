# 5W2H: Correção de Falha Silenciosa e Atomicidade em Troca de Senha

## 1. O que foi feito (What)
Correção da falha silenciosa e implementação de transação atômica na rota `POST /api/auth/change-password`. Anteriormente, exceções geradas pelo comando `UPDATE users SET password_hash=...` eram ignoradas por um bloco `try {} catch {}` vazio. A operação foi refatorada para utilizar uma transação explícita (`BEGIN` / `COMMIT` / `ROLLBACK`), envolvendo a atualização do hash, revogação das sessões concorrentes e inserção do evento na tabela de auditoria (`audit_events`).

## 2. Por que foi feito (Why)
Para eliminar a vulnerabilidade na qual falhas temporárias do banco (conexão, contenção, indisponibilidade parcial) ou tentativas de atualizar senha de usuário desativado simulavam sucesso (status HTTP 204) e desconectavam as sessões paralelas do usuário sem ter alterado a senha de fato. 

## 3. Onde foi aplicado (Where)
- `src/modules/auth/routes.ts`: remoção do bloco de captura silenciosa em torno de `UPDATE users` e introdução do controle transacional atômico usando `PoolClient` (`pool.connect()`). Retorno explícito do status 409 em caso de concorrência ou registro inativado durante o processamento (`rowCount === 0`).
- `src/modules/auth/middleware.ts`: assinatura de `revokeUserSessions` estendida para aceitar `Pool | PoolClient`, permitindo interagir sob a mesma transação iniciada no handler.
- `tests/auth-session.test.ts`: inclusão de 3 novos cenários de testes unitários/integração validando sucesso, falha no banco de dados com rollback e erro de concorrência/registro inativado.

## 4. Quando foi executado (When)
Em Julho/2026, como parte das correções e endurecimento do pipeline de segurança do sistema clínico Fonolife.

## 5. Quem foi responsável (Who)
Equipe de Engenharia e Arquitetura Fonolife (via condução assistida com IA sob diretrizes AGENTS.md e m1nd-first).

## 6. Como foi feito (How)
1. Conectando um cliente transacional do pool PostgreSQL (`pool.connect()`).
2. Abrindo transação atômica com `client.query("BEGIN")`.
3. Executando o `UPDATE users SET password_hash=$1...` verificando obrigatoriamente se `updateResult.rowCount` é maior que zero (caso contrário, executa `ROLLBACK` e retorna erro `409 Conflict`).
4. Repassando o cliente da transação (`client`) para o método `revokeUserSessions`, assegurando a revogação seletiva das sessões sem afetar o token original e inserindo no mesmo escopo o log imutável de auditoria em `audit_events`.
5. Fechando o fluxo de gravação com `COMMIT` e garantindo o retorno ao pool `client.release()`.
6. Blindando com suíte de testes em `tests/auth-session.test.ts`.

## 7. Quanto custou / Recursos (How Much)
- Custo de infraestrutura: R$ 0,00 (alteração estrutural puramente aplicacional no Node.js/Fastify e queries SQL já contratadas).
- Impacto de runtime: Negligenciável; elimina inconsistências que antes exigiriam acionamento manual de suporte por "perda de senha".

---

## Análise de Risco
- **Risco Técnico:** Falhas pontuais no pool ou queda no meio do processamento transacional causarão abortamento total da transação.
- **Mitigações:** Utilização rigorosa do bloco `finally { client.release(); }` assegurando que os recursos e conexões com o banco são libertados em cenários de exceção, sem provocar vazamentos no pool do Fastify/PG.

## Plano de Rollback
Em caso de anomalias inesperadas ou regressão em Produção:
1. Executar reversão de Git: `git revert <hash-do-commit>`.
2. O contrato do banco de dados não teve migração DDL associada nem mudança de estrutura em tabelas; portanto, o rollback do código restaurará o funcionamento anterior imediatamente após reimplante da aplicação.
3. Executar o pipeline de testes em `main` com `npm test` e verificar convergência na suíte PR-03.
