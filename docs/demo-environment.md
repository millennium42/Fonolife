# Ambiente de demonstração

## Fronteira

`APP_ENV` aceita somente `test`, `development`, `demo` e `production`. Recursos demonstrativos existem apenas em `demo`; qualquer variável `DEMO_*` ou `DEMO_MODE=true` faz o processo de produção falhar no startup.

O Blueprint mantém duas topologias sem recursos compartilhados:

| Ambiente | Serviço | PostgreSQL | Storage | Sessão |
|---|---|---|---|---|
| Produção | `fonolife` | `fonolife-db` / `fonolife` | bucket S3 privado de produção | login normal |
| Demo | `fonolife-demo` | `fonolife-demo-db` / `fonolife_demo` | provider demo isolado | `POST /api/demo/session` |

O endpoint demo recebe apenas `admin`, `operator` ou `doctor`, aplica rate limit, seleciona uma identidade sintética no servidor, cria a sessão e registra `demo_session` na auditoria. Ele não é registrado nos demais ambientes e nunca retorna senha.

## Seeds

- `bootstrap`: não cria dados fictícios; o primeiro administrador usa `npm run admin:create`;
- `test`: fixtures determinísticas pertencem a cada teste;
- `development`: opcional e manual;
- `demo`: conjunto sintético completo, com IDs estáveis e execução idempotente.

O servidor executa seed automático somente em `APP_ENV=demo`. Banco vazio em produção permanece vazio até o bootstrap administrativo explícito.

## Reset controlado

Execute somente contra um banco dedicado cujo nome termine em `_demo` e corresponda a `DEMO_DATABASE_NAME`:

```bash
APP_ENV=demo \
DEMO_DATABASE_NAME=fonolife_demo \
DEMO_DATABASE_HOST='<host-exclusivo-da-demo>' \
DEMO_RESET_CONFIRM=RESET_DEMO \
DEMO_OPERATION_TOKEN='<segredo-operacional>' \
DEMO_RESET_TOKEN='<segredo-operacional>' \
npm run demo:reset
```

O comando valida ambiente, confirmação, token, hostname lógico via `DATABASE_URL` e nome do banco; recria o schema, reaplica migrations e refaz o seed. Início e conclusão são registrados sem dados clínicos ou credenciais.

## Riscos e rollback

O reset é destrutivo apenas para o banco demo validado. Revogue o token operacional se houver suspeita de exposição. Para rollback de aplicação, publique o SHA anterior; não conecte a demo ao banco, storage ou secrets de produção.
