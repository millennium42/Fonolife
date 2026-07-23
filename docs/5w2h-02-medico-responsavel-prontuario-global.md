# Documentação 5W2H — Entrega 2: Médico Responsável pelo Paciente & Venda de Serviços

## 1. Matriz 5W2H
- **What (O que):** Adição de migração para vínculo de médico responsável (`responsible_doctor_id`) na tabela de pacientes, suporte nos endpoints REST de consulta e atualização de pacientes, criação da rota `/api/doctors` e baixa automática de insumos ao vender serviços.
- **Why (Por que):** Atribuir responsabilidade clínica aos médicos cadastrados e permitir a venda de serviços com consumo automático dos produtos vinculados.
- **Where (Onde):** `migrations/013_responsible_doctor.sql`, `src/domain/patients.ts`, `src/app.ts` e `tests/doctors.test.ts`.
- **When (Quando):** Ciclo da PR 2 da entrega Fonolife.
- **Who (Quem):** Equipe de desenvolvimento de agente de IA (Antigravity).
- **How (Como):** Campo `responsible_doctor_id uuid REFERENCES users(id)` na tabela `patients`, junção LEFT JOIN com a tabela `users` nas rotas de pacientes e transação de baixa em `inventory_movements`.
- **How Much (Quanto Custa):** Zero custos adicionais.

## 2. Testes & Cobertura
- `tests/doctors.test.ts`: validações de UUID do médico responsável.
- `npm run typecheck` e `npm test` validados com sucesso.

## 3. Matriz de Riscos & Contramedidas
- **Risco:** Desvínculo acidental de médicos cadastrados ao arquivar paciente.
  - *Contramedida:* O relacionamento utiliza chave estrangeira `ON DELETE RESTRICT/SET NULL` preservando o histórico clínico.

## 4. Plano de Rollback
- Reverter o commit da branch `codex/02-medico-responsavel-prontuario-global` e executar rollback da migração 013.
