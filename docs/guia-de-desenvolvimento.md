# Guia de desenvolvimento

Use Node 24, npm e PostgreSQL 18. Instale com `npm ci`; rode `npm run dev`; valide `npm run typecheck`, `npm test`, `npm run build` e `npm audit --audit-level=high`. Com o Compose saudável, rode os smokes de integração/DevSec e `npm run test:e2e`; o spec cobre login, cadastro, venda, financeiro, axe e 360/768/1440 px.

Migrations SQL são ordenadas, transacionais, verificadas por SHA-256 e protegidas por advisory lock. Nunca altere migration aplicada: crie outra aditiva. APIs retornam Problem Details e mutações validam origem. Toda rota nova começa negada e recebe explicitamente os papéis mínimos. Teste sempre o acesso permitido e o negado, incluindo tentativa de acessar identificador de outro usuário.

Antes do merge, valide: dados financeiros append-only; dinheiro em centavos; serviço e retorno com médico; Operador sem saída de caixa; Médico sem CRM, financeiro agregado, configurações ou registros de terceiros; respostas sem observações clínicas desnecessárias; logs sem corpo ou dados pessoais; CSP, HSTS, cookie, CSRF, rate limit e dependências sem vulnerabilidade alta.
