# Guia de desenvolvimento

Use Node 24, npm e PostgreSQL 18. Instale com `npm ci`; rode `npm run dev`; valide `npm run typecheck`, `npm test`, `npm run build` e `npm audit`. Com o Compose saudável, rode `npm run test:e2e`; o spec cobre login, cadastro, venda, financeiro, axe e 360/768/1440 px. Migrations SQL são ordenadas, transacionais, verificadas por SHA-256 e protegidas por advisory lock. Nunca altere migration aplicada: crie outra aditiva. APIs retornam Problem Details e mutações validam origem.
