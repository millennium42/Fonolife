# LGPD e segurança operacional

Este documento é um controle técnico e operacional; não substitui avaliação jurídica, encarregado, inventário corporativo ou certificação.

## Princípios aplicados

- Finalidade e minimização: Médico recebe somente paciente, data, item e valor das vendas/serviços associados. Não recebe alertas, observações clínicas, timeline, saldos ou registros de terceiros.
- Necessidade e menor privilégio: Admin configura e audita; Operador cuida da operação sem retirar do caixa; Médico tem área própria somente leitura.
- Segurança e prevenção: sessão opaca em cookie `HttpOnly`, `Secure` em produção e `SameSite=Lax`; origem obrigatória nas mutações; scrypt para senha; rate limit no login; consultas parametrizadas; CSP, HSTS e `nosniff`.
- Qualidade e integridade: histórico clínico-operacional, auditoria e financeiro são preservados; correção financeira é compensatória e vínculos de médico são validados no domínio e banco.
- Responsabilização: ações sensíveis e consultas da área médica são auditadas sem copiar o conteúdo clínico para o log.

## Operação obrigatória antes de produção

1. Identificar controlador, operador, encarregado/canal do titular, bases legais e finalidades no inventário/ROPA da clínica.
2. Definir aviso de privacidade, procedimento de acesso/correção/portabilidade/eliminação quando juridicamente aplicável e prazo de resposta.
3. Definir tabela de retenção para cadastro, atendimento, contrato, garantia, fiscal, auditoria e backup. O produto não apaga automaticamente porque prazos dependem da obrigação aplicável.
4. Criptografar tráfego com TLS e dados/backups no provedor; restringir `DATABASE_URL` e segredos a cofre; rotacionar credenciais e desativar usuário no desligamento.
5. Executar backup diário e teste periódico de restauração. Registrar responsável, RPO/RTO e evidência fora do banco primário.
6. Manter resposta a incidente com contenção, preservação de evidência, análise de risco, comunicação interna e avaliação de notificações aplicáveis.
7. Usar somente dados sintéticos em desenvolvimento, suporte, IA, screenshots e testes. Produção deve ter acesso nominal; contas compartilhadas são proibidas.

## Verificações DevSec por entrega

- RBAC e IDOR: testar rotas permitidas, negadas e tentativa de consultar ID alheio para cada papel.
- Autenticação: login válido/inválido, rate limit, expiração, logout, cookie e redefinição de senha.
- Aplicação: CSRF/Origin, Problem Details sem detalhes internos, SQL injection, XSS armazenado/refletido, CSP e ausência de dados pessoais nos logs.
- Cadeia de suprimentos: `npm ci`, lockfile, `npm audit --audit-level=high`, imagem mínima, ações fixadas/revisadas e permissões mínimas no CI.
- Banco: migrations e seed duas vezes, constraints, triggers de imutabilidade, idempotência, transação e restore testado.
- Interface: teclado, foco preso no diálogo, fechamento por Escape, contraste AA, axe, 200% de zoom e 360/768/1440 px sem rolagem horizontal da página.

## Limites conscientes

Não há prontuário clínico completo, assinatura eletrônica, anexos, integração WhatsApp, anonimização automática, DLP ou gestão jurídica de consentimento. Esses itens só entram após definição formal de finalidade, base legal, retenção e risco; não são adicionados como campos especulativos.
