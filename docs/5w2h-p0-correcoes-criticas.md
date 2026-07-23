# Documentação 5W2H — Entrega: Correções Críticas P0 (Produção, LGPD e Segurança BOLA)

## 1. Matriz 5W2H
- **What (O que):** Implementação das correções de prioridade P0:
  1. Desativação do modo demonstração em produção (`render.yaml`, `src/config.ts`, endpoint `/api/config` e UI).
  2. Solução de anonimização LGPD compatível com a imutabilidade de `patient_events` (migration `014_lgpd_redactions.sql` e camada de redação na leitura).
  3. Políticas centrais de autorização por objeto (*BOLA/IDOR*) em `src/domain/security.ts` com restrição de visibilidade por perfil (especialmente `doctor` vinculado) e auditoria de acessos negados.
- **Why (Por que):** Impedir vazamento de credenciais/dados em produção, falhas de transação no banco ao anonimizar pacientes e acesso não autorizado por UUID a prontuários, anexos e exportações.
- **Where (Onde):** `render.yaml`, `src/config.ts`, `src/app.ts`, `src/domain/privacy.ts`, `src/domain/security.ts`, `web/src/main.tsx`, `migrations/014_lgpd_redactions.sql` e suíte de testes.
- **When (Quando):** Ciclo da entrega `codex/p0-correcoes-criticas`.
- **Who (Quem):** Equipe Antigravity.
- **How (Como):** Migrações aditivas PostgreSQL, verificações de segurança no arranque e em todas as rotas de pacientes/prontuários/anexos, e renderização condicional dinâmica no frontend.
- **How Much (Quanto Custa):** Zero custo adicional; preservação do monólito modular existente.

## 2. Testes & Cobertura
- `npm run typecheck`
- `npm test` (incluindo testes de integração para LGPD redaction e matriz RBAC BOLA)
- `docker compose up --build --wait` & `npm run test:e2e`

## 3. Matriz de Riscos & Contramedidas
- **Risco:** Transação de anonimização falhar devido ao trigger imutável em `patient_events`.
  - *Contramedida:* Inserção em `patient_redactions` e aplicação de redação dinâmica em tempo de consulta, preservando a trigger imutável.
- **Risco:** Usuário com perfil `doctor` acessar prontuários de pacientes não vinculados.
  - *Contramedida:* Checagem obrigatória de `canReadPatient`/`canWritePatient` em todas as rotas com auditoria atômica de acessos negados em `audit_events`.

## 4. Plano de Rollback
- Reverter commit da branch `codex/p0-correcoes-criticas`. Caso a migration `014_lgpd_redactions.sql` tenha sido aplicada em banco, aplicar migration corretiva mantendo a tabela `patient_redactions` inativa.
