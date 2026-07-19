# Operação e nuvem

Publique a imagem em um serviço web containerizado e use PostgreSQL 18 gerenciado. Configure HTTPS/TLS, backup diário testado, health check `/api/health`, `DATABASE_URL`, `APP_ORIGIN`, `NODE_ENV=production` e `DEMO_MODE=false`. A aplicação migra antes do start; migrations são aditivas. Crie o primeiro admin por procedimento explícito antes do go-live (incremento da fase de release).

Rollback usa a imagem do SHA anterior. Faça backup antes do deploy; inconsistência de schema recebe nova migration corretiva. Nunca reverta apagando auditoria ou futuros lançamentos financeiros.
