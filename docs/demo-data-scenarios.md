# Cenários de Demonstração (Seed Demo)

Os dados de demonstração foram estruturados no `demo.ts` para prover uma visão realista do Fonolife durante demonstrações de vendas ou testes. Eles abrangem todos os módulos essenciais da aplicação:

## 1. CRM e Pacientes
- **Pacientes Diversos:** 12 pacientes no total, cobrindo múltiplas idades, status (`active`, `adaptation`, `new_lead`) e care alerts ativos/inativos.
- **Histórico Clínico (Timeline):** O paciente principal possui uma régua cronológica contínua com eventos de WhatsApp (15 dias atrás), consulta (14 dias), ajuste (7 dias), limpeza (2 dias) e retorno agendado para o mesmo mês.

## 2. Acompanhamento (Tarefas)
Para simular o painel de atendimento e follow-up do dia a dia, temos tarefas em 4 estágios distintos:
- **Atrasada:** Tarefa vencida há 3 dias (Contato sem sucesso).
- **Hoje:** Tarefa com vencimento para o dia atual (Orçamento pendente).
- **Futura:** Acompanhamento agendado para daqui 5 dias.
- **Concluída:** Histórico de revisão de laudo, mostrando que a operação do dia anterior foi realizada e assinada.

## 3. Estoque e Catálogo
- **Produtos:** Catálogo contendo Aparelhos (Audéo, Oticon), Pilhas e Kits.
- **Movimentação:** Saldo inicial gerado por `entry`. O produto "Pilhas" possui uma baixa massiva (`sale_deduction`) que o deixa em estado de **Estoque Baixo** (2 unidades restantes) para disparar avisos na tela.
- **Ajustes:** Registramos uma perda (`adjustment`) de mostruário no Kit de Secagem.

## 4. Comercial (Vendas e Parcelamento)
Foram inseridas vendas nos diversos cenários de negociação:
- **Venda à vista / Serviço:** Serviço concluído e pago via PIX.
- **Venda Parcelada (Oticon):** Aparelhos faturados em 3x no cartão. A primeira parcela foi paga (mês passado), a segunda vence hoje e a terceira no mês seguinte. O status logístico encontra-se em `delivered` ou `adaptation`.
- **Venda Pendente:** Venda recente (reserva) aguardando faturamento.

## 5. Financeiro
- **Múltiplos Caixas (CNPJs):** Lançamentos divididos entre a Matriz (Matriz Centro) e a Filial (Filial Jardins).
- **Receitas e Despesas:** Receitas provenientes dos pagamentos de parcelas (`income`) e registros de despesa operacional (`expense` para Material de Escritório).
- **Estornos e Compensação:** Para provar a integridade financeira, a despesa de Material de Escritório sofreu uma devolução integral (`reversal_of_id`) no valor de R$ 200,00, mantendo o histórico financeiro imutável.

## Notas Técnicas
- As datas são baseadas na função relativa `CURRENT_DATE`, garantindo que o calendário da demonstração acompanhe a data real da execução.
- As execuções são completamente idempotentes através de `ON CONFLICT DO NOTHING`.
