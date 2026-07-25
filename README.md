# Fonolife

CRM operacional e financeiro para clínica de fonoaudiologia, com foco no acompanhamento contínuo após a venda. Pacientes, histórico, tarefas, vendas, previsões e financeiro compartilham um único núcleo operacional.

## Executar com Docker

Requer Docker Desktop com Compose. Execute `docker compose up --build --wait` e abra <http://localhost:3000>. A aplicação migra o banco antes de iniciar.

O Compose usa `APP_ENV=demo`, banco `fonolife_demo` e dados exclusivamente sintéticos. A tela oferece atalhos de perfis; nenhuma senha demonstrativa é enviada ao navegador.

## Desenvolvimento

Use Node 24 e PostgreSQL 18. Defina `APP_ENV=development`, execute `npm ci`, configure as variáveis, rode `npm run migrate` e `npm run dev`. Seeds de desenvolvimento são opcionais e manuais. Valide com `npm run ci:check` e, com Docker no ar, `npm run ci:check:full`.

## Produção

Defina `NODE_ENV=production`, `APP_ENV=production`, HTTPS, `APP_ORIGIN` exata e uma `DATABASE_URL` protegida. Crie o primeiro admin com `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` (mínimo 12 caracteres) e `npm run admin:create`. Veja `docs/operacao-e-nuvem.md` e `docs/demo-environment.md`.
