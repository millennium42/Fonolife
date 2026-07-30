import { randomUUID } from "node:crypto";
import { config } from "../../config.js";
import { hashPassword } from "../../domain/security.js";
import { pool } from "../pool.js";

export async function seedDemo() {
  if (config.appEnv !== "demo") {
    throw new Error("Demo seed is available only when APP_ENV=demo.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Usuários (Admin, Operador e Médicos Fonoaudiólogos)
    const adminId = "10000000-0000-4000-8000-000000000001";
    const operatorId = "10000000-0000-4000-8000-000000000002";
    const doctor1Id = "10000000-0000-4000-8000-000000000003";
    const doctor2Id = "10000000-0000-4000-8000-000000000004";

    const users = [
      [adminId, "Administrador Demo", "demo-admin@demo.invalid", randomUUID(), "admin", null, null],
      [operatorId, "Operador Demo", "demo-operator@demo.invalid", randomUUID(), "operator", null, null],
      [doctor1Id, "Dr. Carlos Demo", "demo-doctor-1@demo.invalid", randomUUID(), "doctor", "CRFa 10234-SP", "Fonoaudiologia Clínica & Reabilitação"],
      [doctor2Id, "Dra. Ana Demo", "demo-doctor-2@demo.invalid", randomUUID(), "doctor", "CRFa 20567-SP", "Audiometria Infantil & Regulagem de Próteses"],
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

    // Busca IDs reais dos usuários cadastrados no banco para evitar violação de FK
    const userRows = await client.query<{ id: string; email: string }>("SELECT id, email FROM users");
    const userMap = new Map(userRows.rows.map((u) => [u.email, u.id]));

    const realAdminId = userMap.get("demo-admin@demo.invalid") || adminId;
    const realDoctor1Id = userMap.get("demo-doctor-1@demo.invalid") || doctor1Id;
    const realDoctor2Id = userMap.get("demo-doctor-2@demo.invalid") || doctor2Id;
    const realDoctor3Id = realDoctor1Id; // Fallback since demo only has 2 doctors

    // 2. Contas Jurídicas / Caixas
    const account1Id = "20000000-0000-4000-8000-000000000001";
    const account2Id = "20000000-0000-4000-8000-000000000002";

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
    const prod1Id = "30000000-0000-4000-8000-000000000001";
    const prod2Id = "30000000-0000-4000-8000-000000000002";
    const prod3Id = "30000000-0000-4000-8000-000000000003";
    const prod4Id = "30000000-0000-4000-8000-000000000004";

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
          [randomUUID(), id, realAdminId]
        );
      }
    }

    // 4. Catálogo de Serviços (Procedimentos Fonoaudiológicos com CMV e Tempo)
    const serv1Id = "40000000-0000-4000-8000-000000000001";
    const serv2Id = "40000000-0000-4000-8000-000000000002";
    const serv3Id = "40000000-0000-4000-8000-000000000003";
    const serv4Id = "40000000-0000-4000-8000-000000000004";

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
    const pat1Id = "50000000-0000-4000-8000-000000000001";
    const pat2Id = "50000000-0000-4000-8000-000000000002";
    const pat3Id = "50000000-0000-4000-8000-000000000003";
    const pat4Id = "50000000-0000-4000-8000-000000000004";
    const pat5Id = "50000000-0000-4000-8000-000000000005";
    const pat6Id = "50000000-0000-4000-8000-000000000006";
    const pat7Id = "50000000-0000-4000-8000-000000000007";
    const pat8Id = "50000000-0000-4000-8000-000000000008";
    const pat9Id = "50000000-0000-4000-8000-000000000009";
    const pat10Id = "50000000-0000-4000-8000-000000000010";
    const pat11Id = "50000000-0000-4000-8000-000000000011";
    const pat12Id = "50000000-0000-4000-8000-000000000012";

    const patientsData = [
      [pat1Id, "Dona Maria Lurdes Santos", "11987654321", "1952-04-12", "João Santos (Filho)", "referral", "adaptation", "Usuária de aparelho auditivo Phonak. Relata ótima adaptação.", "Sensibilidade a sons agudos", realDoctor1Id],
      [pat2Id, "Seu Antônio Ferreira", "11976543210", "1948-09-25", null, "whatsapp", "proposal", "Em teste comparativo de aparelhos Oticon e Phonak.", "Dificuldade motora leve nas mãos", realDoctor1Id],
      [pat3Id, "Juliana Mendes", "11965432109", "1989-02-18", null, "google", "new_lead", "Procurou a clínica após resultado de audiometria alterado.", "", realDoctor2Id],
      [pat4Id, "Sr. Roberto Alves", "11911223344", "1960-03-10", null, "google", "follow_up", "Usa aparelho há 2 anos, mas quer trocar.", "", realDoctor1Id],
      [pat5Id, "Helena Souza", "11922334455", "1992-07-21", null, "referral", "screening", "Zumbido constante no ouvido esquerdo.", "Cuidado com zumbido", realDoctor3Id],
      [pat6Id, "Jorge Martins", "11933445566", "1955-11-05", "Filha Camila", "instagram", "adaptation", "Teste de audição bilateral.", "", realDoctor2Id],
      [pat7Id, "Luciana Costa", "11944556677", "1980-08-30", null, "whatsapp", "follow_up", "Retorno anual de acompanhamento.", "", realDoctor1Id],
      [pat8Id, "Marcos Lima", "11955667788", "1975-01-14", null, "google", "screening", "Primeira consulta para avaliar perda súbita.", "", realDoctor3Id],
      [pat9Id, "Beatriz Silva", "11966778899", "1940-12-01", "Neto Carlos", "referral", "follow_up", "Adaptação de aparelho novo Oticon.", "", realDoctor2Id],
      [pat10Id, "Felipe Nogueira", "11977889900", "1985-05-19", null, "instagram", "adaptation", "Regulagem fina pós-compra.", "", realDoctor1Id],
      [pat11Id, "Sandra Dias", "11988990011", "1968-09-08", null, "whatsapp", "follow_up", "Manutenção preventiva do aparelho.", "", realDoctor3Id],
      [pat12Id, "Vítor Mendes", "11999001122", "1972-04-26", null, "google", "screening", "Consulta para orçamento de prótese.", "", realDoctor2Id],
    ] as const;

    for (const [id, name, phone, birth, guardian, source, status, notes, alert, doctorId] of patientsData) {
      await client.query(
        `INSERT INTO patients(id, name, phone, birth_date, guardian_name, contact_source, journey_status, notes, care_alert, assigned_user_id, responsible_doctor_id, created_by)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING`,
        [id, name, phone, birth, guardian, source, status, notes, alert, doctorId, doctorId, realAdminId]
      );
    }

    // Recupa ID do paciente real
    const patRows = await client.query<{ id: string; phone: string }>("SELECT id, phone FROM patients");
    const patMap = new Map(patRows.rows.map((p) => [p.phone, p.id]));
    const realPat1Id = patMap.get("11987654321") || pat1Id;

    // 6. Vendas e Lançamentos Financeiros de Demonstração
    const saleId = "60000000-0000-4000-8000-000000000001";
    const instId = "60000000-0000-4000-8000-000000000002";

    const existingSale = await client.query("SELECT 1 FROM sales WHERE id=$1", [saleId]);
    if (!existingSale.rowCount) {
      await client.query(
        `INSERT INTO sales(id, client_request_id, patient_id, product_id, product, quantity, total_amount_cents, cost_amount_cents, sold_on, company_account_id, notes, delivery_status, created_by)
         VALUES($1, $2, $3, $4, 'Aparelho Auditivo Phonak Audéo Paradise P90-R', 1, 850000, 320000, CURRENT_DATE - INTERVAL '5 days', $5, 'Venda com adaptação inclusa', 'completed', $6)`,
        [saleId, randomUUID(), realPat1Id, prod1Id, matrizAccount, realAdminId]
      );

      await client.query(
        `INSERT INTO receivable_installments(id, sale_id, amount_cents, due_on, payment_method)
         VALUES($1, $2, 850000, CURRENT_DATE - INTERVAL '5 days', 'pix')`,
        [instId, saleId]
      );

      await client.query(
        `INSERT INTO financial_entries(id, entry_type, category, description, amount_cents, competence_on, occurred_on, payment_method, company_account_id, patient_id, sale_id, receivable_installment_id, created_by)
         VALUES($1, 'income', 'hearing_aid_sale', 'Venda: Aparelho Auditivo Phonak Audéo Paradise P90-R', 850000, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days', 'pix', $2, $3, $4, $5, $6)`,
        [randomUUID(), matrizAccount, realPat1Id, saleId, instId, realAdminId]
      );
    }
    await client.query(
      "UPDATE sales SET product_id=$1,cost_amount_cents=320000 WHERE id=$2",
      [prod1Id, saleId],
    );

    // 7. Agendamentos de Demonstração (Appointments)
    const app1Id = "70000000-0000-4000-8000-000000000001";
    const app2Id = "70000000-0000-4000-8000-000000000002";
    
    // Appointment 1: Today, doctor 1, patient 1
    const existingApp1 = await client.query("SELECT 1 FROM appointments WHERE id=$1", [app1Id]);
    if (!existingApp1.rowCount) {
      await client.query(
        `INSERT INTO appointments(id, doctor_id, patient_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_by)
         VALUES($1, $2, $3, 
          CURRENT_DATE + TIME '10:00:00',
          CURRENT_DATE + TIME '11:00:00',
          'adaptation', 'scheduled', 'Primeira regulagem', $4)`,
        [app1Id, realDoctor1Id, realPat1Id, realAdminId]
      );
    }
    
    // Appointment 2: Tomorrow, doctor 2, patient 3
    const pat3MapId = patMap.get("11965432109") || pat3Id;
    const existingApp2 = await client.query("SELECT 1 FROM appointments WHERE id=$1", [app2Id]);
    if (!existingApp2.rowCount) {
      await client.query(
        `INSERT INTO appointments(id, doctor_id, patient_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_by)
         VALUES($1, $2, $3, 
          CURRENT_DATE + INTERVAL '1 day' + TIME '14:00:00',
          CURRENT_DATE + INTERVAL '1 day' + TIME '15:00:00',
          'screening', 'confirmed', 'Avaliação inicial', $4)`,
        [app2Id, realDoctor2Id, pat3MapId, realAdminId]
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

