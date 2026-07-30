# Fonolife

CRM operacional e financeiro para clínica de fonoaudiologia, com foco no acompanhamento contínuo após a venda. Pacientes, histórico, tarefas, vendas, previsões e financeiro compartilham um único núcleo operacional.

## Demonstração local em 3 passos

Requer Docker Desktop com Compose. Nenhuma instalação de Node ou PostgreSQL na máquina host é necessária.

1. **Limpar execuções anteriores (opcional):** Execute `npm run demo:clean` (ou `docker compose down -v --remove-orphans`).
2. **Subir a aplicação:** Execute `npm run demo:up` (ou `docker compose up --build --wait`). O banco migra e popula sozinho na inicialização.
3. **Acessar e usar:** Abra <http://localhost:3000> e use os botões de atalho da tela de login para acessar.

> **Aviso:** Todos os dados populados são estritamente **sintéticos**. O contêiner usa a configuração `APP_ENV=demo` com um banco efêmero isolado (`fonolife_demo`). Nenhuma senha real é exposta no ambiente do navegador.

## Desenvolvimento

Use Node 24 e PostgreSQL 18. Defina `APP_ENV=development`, execute `npm ci`, configure as variáveis, rode `npm run migrate` e `npm run dev`. Seeds de desenvolvimento são opcionais e manuais. Valide com `npm run ci:check` e, com Docker no ar, `npm run ci:check:full`.

Defina `NODE_ENV=production`, `APP_ENV=production`, HTTPS, `APP_ORIGIN` exata e uma `DATABASE_URL` protegida. Crie o primeiro admin com `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` (mínimo 12 caracteres) e `npm run admin:create`. Veja `docs/operacao-e-nuvem.md` e `docs/demo-environment.md`.
