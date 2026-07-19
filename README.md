# Fonolife

CRM operacional e financeiro para clínica de fonoaudiologia, com foco no acompanhamento contínuo após a venda. Esta primeira entrega contém base executável, autenticação, usuários, caixas/CNPJs e navegação inicial; CRM, pós-atendimento, vendas e financeiro chegam nas PRs seguintes.

## Executar com Docker

Requer Docker Desktop com Compose. Execute `docker compose up --build --wait` e abra <http://localhost:3000>. A aplicação migra o banco antes de iniciar.

Para popular a demonstração: `docker compose exec app node dist/db/seed.js`. Contas: `admin@demo.local/admin123` e `operador@demo.local/operador123`. O seed recusa execução sem `DEMO_MODE=true`.

## Desenvolvimento

Use Node 24 e PostgreSQL 18. Copie `.env.example` para `.env`, execute `npm ci`, `npm run migrate`, `npm run seed` e `npm run dev`. Valide com `npm run typecheck && npm test && npm run build`.

## Produção

Defina `NODE_ENV=production`, `DEMO_MODE=false`, HTTPS, `APP_ORIGIN` exata e uma `DATABASE_URL` protegida. Veja `docs/operacao-e-nuvem.md`.
