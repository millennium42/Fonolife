# Arquitetura do sistema

Monólito TypeScript: React/Vite entrega a interface; Fastify expõe API JSON de mesma origem; `pg` executa SQL direto no PostgreSQL. O processo aplica migrations antes de escutar. Sessões opacas são armazenadas por hash e enviadas em cookie HttpOnly. As regras críticas pertencem ao domínio e às constraints/triggers do banco.

Pastas: `src/domain` (regras), `src/db` (pool, migração e seed), `src` (HTTP/processo), `web` (interface), `migrations`, `tests` e `docs`.

O ledger realizado, previsões e venda permanecem no mesmo banco e transação. Triggers preservam auditoria, eventos, tarefas, parcelas e lançamentos; estornos são novos lançamentos opostos. Datas civis operacionais usam `America/Sao_Paulo`; instantes são UTC.
