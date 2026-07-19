# Orientações para agentes

- Ponytail full: implemente somente a menor solução correta.
- Um monólito modular e um fluxo operacional; sem ORM, microserviço ou abstração especulativa.
- Regras e invariantes ficam no domínio ou no PostgreSQL, nunca somente na interface.
- Dinheiro futuro usa centavos inteiros e histórico financeiro será append-only.
- Não inclua dados clínicos, credenciais reais ou identificadores de pacientes em prompts ou logs.
- Investigue primeiro com m1nd e consulte `graphify-out` quando existir. Após alterações relevantes, execute `graphify update .`.
- Toda entrega nasce de `main` em `codex/<entrega>`, documenta 5W2H, testes, riscos e rollback.
