# Documentação 5W2H — Correção da Constraint de Chave Estrangeira no Seed Demo (Deploy Render)

## 1. Matriz 5W2H
- **What (O que):** Ajuste na resolução dinâmica de IDs de usuários e pacientes em `src/db/seed.ts` para capturar os UUIDs existentes no PostgreSQL (`SELECT id, email FROM users` e `SELECT id, phone FROM patients`), impedindo erros de violação de chave estrangeira (`inventory_movements_created_by_fkey`) durante o deploy.
- **Why (Por que):** Quando o script de seed era executado em um banco onde o usuário administrador ou paciente já havia sido cadastrado previamente, a cláusula `ON CONFLICT DO UPDATE/NOTHING` mantinha o ID original do banco, mas as queries subsequentes tentavam usar o `randomUUID()` recém-gerado localmente.
- **Where (Onde):** `src/db/seed.ts`.
- **When (Quando):** Atendimento do erro de deploy relatado pelo Render.
- **Who (Quem):** Equipe de desenvolvimento de agente de IA (Antigravity).
- **How (Como):** Criação de mapeamento dinâmico pós-inserção (`userMap` e `patMap`) direcionando `realAdminId`, `realDoctor1Id`, `realDoctor2Id` e `realPat1Id` para os registros das tabelas referenciadas.
- **How Much (Quanto Custa):** Zero custos adicionais.

## 2. Testes & Cobertura
- `npm run typecheck` e `npm test` validados com sucesso.
- Execução com idempotência garantida para reinicializações do banco.

## 3. Matriz de Riscos & Contramedidas
- **Risco:** Erro ao tentar mapear um usuário ou paciente ausente.
  - *Contramedida:* Fallback para a variável local original (`userMap.get(...) || adminId`).

## 4. Plano de Rollback
- Reverter o commit da branch `codex/fix-seed-fk-constraint`.
