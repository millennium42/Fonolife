# Fonolife

CRM operacional e financeiro para clínica de fonoaudiologia, com foco no acompanhamento contínuo após a venda. Pacientes, histórico, tarefas, vendas, previsões e financeiro compartilham um único núcleo operacional.

## Executar com Docker

Requer Docker Desktop com Compose. Execute `docker compose up --build --wait` e abra <http://localhost:3000>. A aplicação migra o banco antes de iniciar.

Com `DEMO_MODE=true` (padrão local), migrations e seed idempotentes rodam automaticamente. Contas: `admin@demo.local/admin123`, `operador@demo.local/operador123`, `dra.ana@demo.local/medico123` e `dr.paulo@demo.local/medico123`. Os caixas de exemplo são “Venda de Aparelhos” e “Serviços”. O seed recusa execução sem modo DEMO.

## Desenvolvimento

Use Node 24 e PostgreSQL 18. Execute `npm ci`, configure as variáveis, rode `npm run migrate`, `npm run seed` e `npm run dev`. Valide com `npm run typecheck`, `npm test`, `npm run build`, `npm audit --audit-level=high`, os smokes DevSec e, com Docker no ar, `npm run test:e2e`.

## Produção

Defina `NODE_ENV=production`, `DEMO_MODE=false`, HTTPS, `APP_ORIGIN` exata e uma `DATABASE_URL` protegida. Crie o primeiro admin com `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` (mínimo 12 caracteres) e `npm run admin:create`. Veja `docs/operacao-e-nuvem.md` e `docs/lgpd-e-seguranca.md`.
