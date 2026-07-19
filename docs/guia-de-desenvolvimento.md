# Guia de desenvolvimento

Use Node 24, npm e PostgreSQL 18. Instale com `npm ci`; rode `npm run dev`; valide `npm run typecheck`, `npm test` e `npm run build`. Migrations SQL são ordenadas, transacionais, verificadas por SHA-256 e protegidas por advisory lock. Nunca altere migration aplicada: crie outra aditiva. APIs retornam erro no formato Problem Details e mutações validam origem.
