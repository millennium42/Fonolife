const fs = require('fs');
const crypto = require('crypto');

let code = `
    // --- INÍCIO: Expansão Global da Demonstração (Prompt 09) ---

    const filialAccount = accResult.rows.find((a) => a.short_label.includes("Filial"))?.id || account2Id;

    // 1. Patient Events (Histórico Clínico)
    const patientEvents = [
      ["80000000-0000-4000-8000-000000000201", realPat1Id, 'whatsapp', 'Mensagem enviada perguntando sobre zumbido', "now() - INTERVAL '15 days'"],
      ["80000000-0000-4000-8000-000000000202", realPat1Id, 'consultation', 'Consulta inicial realizada com sucesso', "now() - INTERVAL '14 days'"],
      ["80000000-0000-4000-8000-000000000203", realPat1Id, 'device_adjustment', 'Ajuste fino de frequências agudas', "now() - INTERVAL '7 days'"],
      ["80000000-0000-4000-8000-000000000204", realPat1Id, 'cleaning', 'Limpeza do molde', "now() - INTERVAL '2 days'"],
      ["80000000-0000-4000-8000-000000000205", realPat1Id, 'scheduled_return', 'Retorno agendado para o próximo mês', "now()"]
    ] as const;

    for (const [id, patId, type, desc, occurred] of patientEvents) {
      await client.query(
        \`INSERT INTO patient_events(id, patient_id, event_type, description, occurred_at, created_by)
         VALUES($1, $2, $3, $4, \` + occurred + \`, $5)
         ON CONFLICT (id) DO NOTHING\`,
        [id, patId, type, desc, realAdminId]
      );
    }

    // 2. Tarefas e Acompanhamento (follow_up_tasks)
    const followUps = [
      // Atrasada
      ["80000000-0000-4000-8000-000000000301", realPat2Id, 'Ligar para confirmar teste', "CURRENT_DATE - INTERVAL '3 days'", 'Paciente não atendeu.', null, null],
      // Hoje
      ["80000000-0000-4000-8000-000000000302", realPat3Id, 'Enviar orçamento final', "CURRENT_DATE", 'Verificar desconto na matriz.', null, null],
      // Futura
      ["80000000-0000-4000-8000-000000000303", realPat4Id, 'Acompanhamento adaptação', "CURRENT_DATE + INTERVAL '5 days'", 'Perguntar sobre conforto no ouvido direito.', null, null],
      // Concluída
      ["80000000-0000-4000-8000-000000000304", realPat5Id, 'Revisar laudo audiométrico', "CURRENT_DATE - INTERVAL '10 days'", '', "now() - INTERVAL '9 days'", realAdminId]
    ] as const;

    for (const [id, patId, title, dueOn, notes, completed, closedBy] of followUps) {
      await client.query(
        \`INSERT INTO follow_up_tasks(id, patient_id, title, due_on, notes, completed_at, created_by, closed_by)
         VALUES($1, $2, $3, \` + dueOn + \`, $4, \` + (completed || 'NULL') + \`, $5, $6)
         ON CONFLICT (id) DO NOTHING\`,
        [id, patId, title, notes, realAdminId, closedBy]
      );
    }

    // 3. Estoque e Catálogo
    const invMovements = [
      // Baixa por venda (Deixa o prod3Id com baixo estoque)
      ["80000000-0000-4000-8000-000000000401", prod3Id, 'sale_deduction', -18, 'Venda de cartelas de pilhas'],
      // Ajuste (perda)
      ["80000000-0000-4000-8000-000000000402", prod4Id, 'adjustment', -1, 'Produto danificado no mostruário']
    ] as const;

    for (const [id, pId, type, qty, note] of invMovements) {
      const hasStockMove = await client.query("SELECT 1 FROM inventory_movements WHERE id=$1", [id]);
      if (!hasStockMove.rowCount) {
        await client.query(
          \`INSERT INTO inventory_movements(id, product_id, movement_type, quantity, notes, created_by)
           VALUES($1, $2, $3, $4, $5, $6)\`,
          [id, pId, type, qty, note, realAdminId]
        );
      }
    }

    // 4. Vendas (Comercial)
    const saleInstallmentsId = "80000000-0000-4000-8000-000000000501"; // Venda parcelada
    const saleServiceId = "80000000-0000-4000-8000-000000000502"; // Serviço
    const salePendingId = "80000000-0000-4000-8000-000000000503"; // Venda pendente

    // Venda Parcelada (Delivered, 3x)
    const hasSale1 = await client.query("SELECT 1 FROM sales WHERE id=$1", [saleInstallmentsId]);
    if (!hasSale1.rowCount) {
      await client.query(
        \`INSERT INTO sales(id, client_request_id, patient_id, product, quantity, total_amount_cents, sold_on, company_account_id, delivery_status, created_by)
         VALUES($1, $2, $3, 'Aparelho Oticon More 1', 2, 1840000, CURRENT_DATE - INTERVAL '30 days', $4, 'delivered', $5)\`,
        [saleInstallmentsId, crypto.randomUUID(), realPat2Id, filialAccount, realAdminId]
      );
      // 3 Parcelas
      const i1 = "80000000-0000-4000-8000-000000000511";
      const i2 = "80000000-0000-4000-8000-000000000512";
      const i3 = "80000000-0000-4000-8000-000000000513";
      await client.query(
        \`INSERT INTO receivable_installments(id, sale_id, amount_cents, due_on, payment_method) VALUES
         ($1, $4, 613333, CURRENT_DATE - INTERVAL '30 days', 'credit_card'),
         ($2, $4, 613333, CURRENT_DATE, 'credit_card'),
         ($3, $4, 613334, CURRENT_DATE + INTERVAL '30 days', 'credit_card')\`,
        [i1, i2, i3, saleInstallmentsId]
      );
      // Recebimento da Parcela 1
      await client.query(
        \`INSERT INTO financial_entries(id, entry_type, category, description, amount_cents, competence_on, occurred_on, payment_method, company_account_id, sale_id, receivable_installment_id, created_by)
         VALUES($1, 'income', 'hearing_aid_sale', 'Parcela 1/3 (Oticon)', 613333, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '30 days', 'credit_card', $2, $3, $4, $5)\`,
        [crypto.randomUUID(), filialAccount, saleInstallmentsId, i1, realAdminId]
      );
    }

    // Venda Serviço
    const hasSale2 = await client.query("SELECT 1 FROM sales WHERE id=$1", [saleServiceId]);
    if (!hasSale2.rowCount) {
      await client.query(
        \`INSERT INTO sales(id, client_request_id, patient_id, product, quantity, total_amount_cents, sold_on, company_account_id, delivery_status, created_by)
         VALUES($1, $2, $3, 'Mapeamento em Ouvido Real', 1, 35000, CURRENT_DATE - INTERVAL '10 days', $4, 'completed', $5)\`,
        [saleServiceId, crypto.randomUUID(), realPat6Id, matrizAccount, realAdminId]
      );
      const iS = "80000000-0000-4000-8000-000000000521";
      await client.query(
        \`INSERT INTO receivable_installments(id, sale_id, amount_cents, due_on, payment_method) VALUES
         ($1, $2, 35000, CURRENT_DATE - INTERVAL '10 days', 'pix')\`,
        [iS, saleServiceId]
      );
      await client.query(
        \`INSERT INTO financial_entries(id, entry_type, category, description, amount_cents, competence_on, occurred_on, payment_method, company_account_id, sale_id, receivable_installment_id, created_by)
         VALUES($1, 'income', 'consultation', 'Serviço Clínico Mapeamento', 35000, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '10 days', 'pix', $2, $3, $4, $5)\`,
        [crypto.randomUUID(), matrizAccount, saleServiceId, iS, realAdminId]
      );
    }

    // Venda Pendente
    const hasSale3 = await client.query("SELECT 1 FROM sales WHERE id=$1", [salePendingId]);
    if (!hasSale3.rowCount) {
      await client.query(
        \`INSERT INTO sales(id, client_request_id, patient_id, product, quantity, total_amount_cents, sold_on, company_account_id, delivery_status, created_by)
         VALUES($1, $2, $3, 'Aparelho Phonak P90-R (Reserva)', 1, 850000, CURRENT_DATE - INTERVAL '1 day', $4, 'pending', $5)\`,
        [salePendingId, crypto.randomUUID(), realPat10Id, matrizAccount, realAdminId]
      );
      const iP = "80000000-0000-4000-8000-000000000531";
      await client.query(
        \`INSERT INTO receivable_installments(id, sale_id, amount_cents, due_on, payment_method) VALUES
         ($1, $2, 850000, CURRENT_DATE + INTERVAL '10 days', 'boleto')\`,
        [iP, salePendingId]
      );
    }

    // 5. Financeiro Adicional e Estorno
    const originalExpenseId = "80000000-0000-4000-8000-000000000601";
    const hasExpense = await client.query("SELECT 1 FROM financial_entries WHERE id=$1", [originalExpenseId]);
    if (!hasExpense.rowCount) {
      // Despesa
      await client.query(
        \`INSERT INTO financial_entries(id, entry_type, category, description, amount_cents, competence_on, occurred_on, payment_method, company_account_id, created_by)
         VALUES($1, 'expense', 'office_supplies', 'Compra Material de Escritório', 20000, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days', 'debit_card', $2, $3)\`,
        [originalExpenseId, matrizAccount, realAdminId]
      );
      // Estorno
      await client.query(
        \`INSERT INTO financial_entries(id, entry_type, category, description, amount_cents, competence_on, occurred_on, payment_method, company_account_id, reversal_of_id, reversal_reason, created_by)
         VALUES($1, 'income', 'refund', 'Estorno Material Escritório (Devolvido)', 20000, CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE - INTERVAL '4 days', 'debit_card', $2, $3, 'Produto chegou danificado e foi devolvido', $4)\`,
        [crypto.randomUUID(), matrizAccount, originalExpenseId, realAdminId]
      );
    }

    // --- FIM: Expansão Global da Demonstração (Prompt 09) ---
`;

let content = fs.readFileSync('src/db/seeds/demo.ts', 'utf8');

// Find the last COMMIT
content = content.replace(
  `await client.query("COMMIT");`,
  code + `\n\n    await client.query("COMMIT");`
);

fs.writeFileSync('src/db/seeds/demo.ts', content);
