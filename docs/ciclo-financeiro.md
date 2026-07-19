# Ciclo financeiro

Planejado para PRs de vendas e financeiro. Valores serão centavos inteiros; realizado e previsão permanecerão separados. Registros realizados não serão editados nem apagados: correções serão compensações auditáveis. Um lançamento escolherá um único `company_account` e aparecerá no consolidado e no caixa escolhido.
# Venda e recebimento

A venda cria previsões cuja soma deve ser idêntica ao total. Parcelas informadas como recebidas geram lançamentos realizados na mesma transação; previsões futuras não alteram saldo. Registros financeiros são imutáveis. O cancelamento mantém a venda e cria lançamentos opostos ligados aos originais, com motivo obrigatório.
