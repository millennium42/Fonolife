# Desenvolvimento com IA assistida

1. Nasça da `main` atualizada em `codex/<entrega>` e confirme árvore limpa.
2. Oriente-se com m1nd e Graphify antes de busca ampla; trate o resultado como mapa, depois prove no código, banco, testes e runtime.
3. Defina invariantes, autorização negativa e rollback antes de editar. Regra crítica fica no domínio e, quando possível, também no PostgreSQL.
4. Separe implementador e revisor independente. A revisão por agente é evidência técnica, nunca aprovação humana.
5. Não envie dados clínicos, credenciais reais, telefone, nome ou identificador de paciente a prompts, ferramentas externas, screenshots ou logs. Use somente dados DEMO sintéticos.
6. Aplique Ponytail full: biblioteca nativa e alteração direta antes de dependência ou abstração. Simplicidade não reduz validação, segurança, acessibilidade ou auditoria.
7. Valide em camadas: typecheck; testes de domínio; PostgreSQL real; API com casos permitidos e negados; DevSec; build; Docker; E2E desktop/mobile/teclado/axe.
8. Após mudança relevante execute `graphify update .`; se o filesystem não suportar atualização incremental, regenere em modo estrutural e registre a limitação.
9. Atualize arquitetura, guia, módulo afetado, 5W2H e relatório de validação no mesmo commit. Registre P2 em backlog; só amplie escopo para impedir perda de dados, falha de segurança, inconsistência financeira ou quebra do aceite.
10. A PR descreve contexto, 5W2H, evidências reproduzíveis, riscos, rollback, revisão e checklist. Só sai de draft com CI verde e zero P0/P1.
