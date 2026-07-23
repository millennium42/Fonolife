import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { hashPassword } from "../domain/security.js";
import { pool } from "./pool.js";

export async function seedDemo(force = false) {
  if (!config.demo && !force && process.env.NODE_ENV !== "test") {
    // Permite seed em ambiente dev / demo
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Usuários (Admin, Operador e Médicos Fonoaudiólogos)
    const adminId = randomUUID();
    const operatorId = randomUUID();
    const doctor1Id = randomUUID();
    const doctor2Id = randomUUID();

    const users = [
      [adminId, "Administrador Fonolife", "admin@fonolife.com.br", "admin123", "admin", null, null],
      [operatorId, "Operador Balcão / Caixa", "operador@fonolife.com.br", "operador123", "operator", null, null],
      [doctor1Id, "Dr. Carlos Eduardo Silva", "carlos.fonolife@gmail.com", "medico123", "doctor", "CRFa 10234-SP", "Fonoaudiologia Clínica & Reabilitação"],
      [doctor2Id, "Dra. Ana Paula Oliveira", "ana.fonolife@gmail.com", "medico123", "doctor", "CRFa 20567-SP", "Audiometria Infantil & Regulagem de Próteses"],
    ] as const;

    for (const [id, name, email, password, role, license, specialty] of users) {
      await client.query(
        `INSERT INTO users(id, name, email, password_hash, role, license_number, specialty, must_change_password)
         VALUES($1, $2, $3, $4, $5, $6, $7, false)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           license_number = EXCLUDED.license_number,
           specialty = EXCLUDED.specialty`,
        [id, name, email, await hashPassword(password), role, license, specialty]
      );
    }

    // 2. Contas Jurídicas / Caixas
    const account1Id = randomUUID();
    const account2Id = randomUUID();

    await client.query(
      `INSERT INTO company_accounts(id, trade_name, cnpj, short_label)
       VALUES($1, 'Fonolife Serviços Auditivos Ltda (Matriz)', '12345678000190', 'Matriz Centro')
       ON CONFLICT (cnpj) DO NOTHING`,
      [account1Id]
    );

    await client.query(
      `INSERT INTO company_accounts(id, trade_name, cnpj, short_label)
       VALUES($1, 'Fonolife Aparelhos Auditivos Eireli (Filial)', '98765432000110', 'Filial Jardins')
       ON CONFLICT (cnpj) DO NOTHING`,
      [account2Id]
    );

    // Recupera os IDs reais das contas
    const accResult = await client.query<{ id: string; short_label: string }>("SELECT id, short_label FROM company_accounts");
    const matrizAccount = accResult.rows.find((a) => a.short_label.includes("Matriz"))?.id || account1Id;

    // 3. Catálogo de Produtos (Aparelhos Auditivos e Insumos com CMV)
    const prod1Id = randomUUID();
    const prod2Id = randomUUID();
    const prod3Id = randomUUID();
    const prod4Id = randomUUID();

    const productsData = [
      [prod1Id, "Aparelho Auditivo Phonak Audéo Paradise P90-R", "Phonak", "Audéo P90-R", 850000, 320000],
      [prod2Id, "Aparelho Auditivo Oticon More 1 MiniRITE", "Oticon", "More 1", 920000, 380000],
      [prod3Id, "Pilha Auditiva Rayovac 13 Cartela c/ 6", "Rayovac", "Tam 13", 3500, 1200],
      [prod4Id, "Kit Limpeza e Secagem Elétrica PerfectDry", "FonolifeCare", "PD-200", 28000, 9000],
    ] as const;

    for (const [id, name, brand, model, price, cost] of productsData) {
      await client.query(
        `INSERT INTO products(id, name, brand, model, price_cents, cost_cents)
         VALUES($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [id, name, brand, model, price, cost]
      );

      // Garante saldo inicial em estoque via movimentação auditada
      const hasStock = await client.query("SELECT 1 FROM inventory_movements WHERE product_id=$1", [id]);
      if (!hasStock.rowCount) {
        await client.query(
          `INSERT INTO inventory_movements(id, product_id, movement_type, quantity, notes, created_by)
           VALUES($1, $2, 'entry', 20, 'Estoque inicial para demonstração em deploy', $3)`,
          [randomUUID(), id, adminId]
        );
      }
    }

    // 4. Catálogo de Serviços (Procedimentos Fonoaudiológicos com CMV e Tempo)
    const serv1Id = randomUUID();
    const serv2Id = randomUUID();
    const serv3Id = randomUUID();
    const serv4Id = randomUUID();

    const servicesData = [
      [serv1Id, "Consulta Fonoaudiológica & Anamnese Completa", "Avaliação clínica inicial com anamnese e exame otoscópico.", 30000, 5000, 60],
      [serv2Id, "Audiometria Tonal e Vocal com Impedanciometria", "Exame audiométrico de alta precisão em cabine acústica.", 25000, 3000, 45],
      [serv3Id, "Mapeamento em Ouvido Real com Microfone Sonda", "Calibração e verificação em ouvido real (REEM).", 35000, 6000, 45],
      [serv4Id, "Regulagem & Adaptação de Prótese Auditiva", "Ajuste fino de frequências e higienização com kit.", 20000, 2000, 30],
    ] as const;

    for (const [id, name, desc, price, cmv, timeMin] of servicesData) {
      await client.query(
        `INSERT INTO services(id, name, description, price_cents, cmv_cents, execution_time_minutes)
         VALUES($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [id, name, desc, price, cmv, timeMin]
      );
    }

    // Associar insumos aos serviços (ex: Regulagem consome Kit Limpeza)
    await client.query(
      `INSERT INTO service_products(service_id, product_id, quantity)
       VALUES($1, $2, 1)
       ON CONFLICT (service_id, product_id) DO NOTHING`,
      [serv4Id, prod4Id]
    );

    // 5. Cadastro de Pacientes Reais para Demonstração
    const pat1Id = randomUUID();
    const pat2Id = randomUUID();
    const pat3Id = randomUUID();

    const patientsData = [
      [pat1Id, "Dona Maria Lurdes Santos", "11987654321", "1952-04-12", "João Santos (Filho)", "referral", "adaptation", "Usuária de aparelho auditivo Phonak. Relata ótima adaptação.", "Sensibilidade a sons agudos", doctor1Id],
      [pat2Id, "Seu Antônio Ferreira", "11976543210", "1948-09-25", null, "whatsapp", "proposal", "Em teste comparativo de aparelhos Oticon e Phonak.", "Dificuldade motora leve nas mãos", doctor1Id],
      [pat3Id, "Juliana Mendes", "11965432109", "1989-02-18", null, "google", "new_lead", "Procurou a clínica após resultado de audiometria alterado.", "", doctor2Id],
    ] as const;

    for (const [id, name, phone, birth, guardian, source, status, notes, alert, doctorId] of patientsData) {
      await client.query(
        `INSERT INTO patients(id, name, phone, birth_date, guardian_name, contact_source, journey_status, notes, care_alert, assigned_user_id, responsible_doctor_id, created_by)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING`,
        [id, name, phone, birth, guardian, source, status, notes, alert, doctorId, doctorId, adminId]
      );
    }

    // 6. Vendas e Lançamentos Financeiros de Demonstração
    const saleId = randomUUID();
    const instId = randomUUID();

    const existingSale = await client.query("SELECT 1 FROM sales WHERE id=$1", [saleId]);
    if (!existingSale.rowCount) {
      await client.query(
        `INSERT INTO sales(id, client_request_id, patient_id, product, quantity, total_amount_cents, sold_on, company_account_id, notes, delivery_status, created_by)
         VALUES($1, $2, $3, 'Aparelho Auditivo Phonak Audéo Paradise P90-R', 1, 850000, CURRENT_DATE - INTERVAL '5 days', $4, 'Venda com adaptação inclusa', 'completed', $5)`,
        [saleId, randomUUID(), pat1Id, matrizAccount, adminId]
      );

      await client.query(
        `INSERT INTO receivable_installments(id, sale_id, amount_cents, due_on, payment_method)
         VALUES($1, $2, 850000, CURRENT_DATE - INTERVAL '5 days', 'pix')`,
        [instId, saleId]
      );

      await client.query(
        `INSERT INTO financial_entries(id, entry_type, category, description, amount_cents, competence_on, occurred_on, payment_method, company_account_id, patient_id, sale_id, receivable_installment_id, created_by)
         VALUES($1, 'income', 'hearing_aid_sale', 'Venda: Aparelho Auditivo Phonak Audéo Paradise P90-R', 850000, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days', 'pix', $2, $3, $4, $5, $6)`,
        [randomUUID(), matrizAccount, pat1Id, saleId, instId, adminId]
      );
    }

    await client.query("COMMIT");
    console.log("✅ Banco de Dados Fonolife povoado com sucesso com dados realistas de demonstração!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Erro ao povoar Banco de Dados:", err);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  seedDemo(true).then(() => pool.end()).catch((error) => { console.error(error); process.exitCode = 1; });
}
