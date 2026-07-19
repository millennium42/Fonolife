# Ciclo financeiro

Valores são centavos inteiros; realizado e previsão permanecem separados. Registros realizados não são editados nem apagados: correções são compensações auditáveis. Um lançamento escolhe um único `company_account` e aparece no consolidado e no caixa escolhido.
# Venda e recebimento

A venda cria previsões cuja soma deve ser idêntica ao total. Parcelas informadas como recebidas geram lançamentos realizados na mesma transação; previsões futuras não alteram saldo. Registros financeiros são imutáveis. O cancelamento mantém a venda e cria lançamentos opostos ligados aos originais, com motivo obrigatório.

# Operação financeira

Existe um único formulário “Novo lançamento”; o campo de caixa/CNPJ determina onde o valor aparece. Admin vê realizado consolidado e por CNPJ. Previsões ficam em aba própria e nunca entram no saldo. Operador vê itens e pode baixar previsões, mas não acessa totais agregados nem estornos.

Baixar uma previsão cria um realizado idempotente. Estornar adiciona o lançamento oposto e reabre a previsão. Filtros aceitam período, CNPJ, tipo, categoria e forma de pagamento. CSV permanece incremento futuro documentado.
