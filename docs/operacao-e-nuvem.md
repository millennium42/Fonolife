# Operação e nuvem

Publique a imagem GHCR do SHA validado em um serviço web containerizado e use PostgreSQL 18 gerenciado. Configure HTTPS/TLS, backup diário com restauração testada, health check `/api/health`, `DATABASE_URL`, `APP_ORIGIN`, `NODE_ENV=production` e `DEMO_MODE=false`. A aplicação migra antes do start; migrations são aditivas.

Antes do go-live, execute uma única vez `npm run admin:create` com `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` de ao menos 12 caracteres e, opcionalmente, `INITIAL_ADMIN_NAME`. O comando recusa credenciais DEMO e o primeiro login exige troca de senha. Não exponha essas variáveis após o bootstrap.

Rollback usa a imagem do SHA anterior. Faça backup antes do deploy; inconsistência de schema recebe nova migration corretiva. Nunca reverta apagando auditoria ou futuros lançamentos financeiros.
