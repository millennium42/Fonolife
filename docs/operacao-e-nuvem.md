# Operação e nuvem

Publique a imagem GHCR do SHA validado em um serviço web containerizado e use PostgreSQL 18 gerenciado. Configure HTTPS/TLS, backup diário com restauração testada, health check `/api/health`, `DATABASE_URL`, `APP_ORIGIN`, `NODE_ENV=production` e `DEMO_MODE=false`. A aplicação migra antes do start; migrations são aditivas.

Use banco e rede privados, TLS também na conexão PostgreSQL, criptografia de volume/backup, cofre do provedor para segredos e identidade nominal para cada pessoa. Restrinja acesso administrativo por menor privilégio e MFA no provedor/GitHub; a aplicação ainda não implementa MFA. Envie logs sem corpo da requisição para retenção controlada e alerte sobre repetição de 401/403, erro de migration e indisponibilidade. Consulte `lgpd-e-seguranca.md` para o checklist de produção e resposta a incidente.

Antes do go-live, execute uma única vez `npm run admin:create` com `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` de ao menos 12 caracteres e, opcionalmente, `INITIAL_ADMIN_NAME`. O comando recusa credenciais DEMO e o primeiro login exige troca de senha. Não exponha essas variáveis após o bootstrap.

Rollback usa a imagem do SHA anterior. Faça backup antes do deploy e valide uma restauração em ambiente isolado; inconsistência de schema recebe nova migration corretiva. Nunca reverta apagando auditoria, tarefas, vendas ou lançamentos financeiros.
