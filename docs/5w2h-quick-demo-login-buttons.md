# Documentação 5W2H — Botões de Acesso Rápido / Perfis Demo na Tela de Login

## 1. Matriz 5W2H
- **What (O que):** Implementação de botões de atalho rápido de login para os 3 perfis de demonstração (Administrador, Operador de Balcão / Caixa e Médico Fonoaudiólogo) na tela de autenticação do Fonolife.
- **Why (Por que):** Permitir o acesso instantâneo às diferentes visões e perfis de usuário do sistema em demonstrações e testes sem necessidade de digitar credenciais manualmente.
- **Where (Onde):** `web/src/main.tsx`.
- **When (Quando):** Atendimento da solicitação do usuário para preservar e aprimorar os botões de atalho de login demo.
- **Who (Quem):** Equipe de desenvolvimento de agente de IA (Antigravity).
- **How (Como):** Criação do componente `LoginForm` em React com botões estilizados que definem as credenciais e efetuam login via `api("/api/auth/login", ...)`.
- **How Much (Quanto Custa):** Zero custos adicionais.

## 2. Testes & Cobertura
- `npm run typecheck` e `npm test` validados com sucesso.
- Testes manuais do formulário de autenticação e preenchimento automático.

## 3. Matriz de Riscos & Contramedidas
- **Risco:** Falha de comunicação de API ao clicar em botão demo.
  - *Contramedida:* Exibição de mensagem de erro amigável (`role="alert"`) em caso de falha de requisição ou credencial inválida.

## 4. Plano de Rollback
- Reverter o commit da branch `codex/quick-demo-login-buttons`.
