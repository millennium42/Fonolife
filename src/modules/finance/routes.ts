import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { pool } from "../../db/pool.js";
import { validCnpj } from "../../domain/security.js";
import {
  DELIVERY_STATUSES,
  validateInstallments,
  type SaleInstallment,
} from "../../domain/sales.js";
import { validFinancialEntry } from "../../domain/finance.js";
import { audit } from "../audit/service.js";
import { admin, authenticated, loadAndAuthorizePatient } from "../patients/authorization.js";

type SaleBody = {
  clientRequestId?: string;
  patientId?: string;
  productId?: string;
  serviceId?: string;
  product?: string;
  quantity?: number;
  totalAmountCents?: number;
  soldOn?: string;
  companyAccountId?: string;
  notes?: string;
  warrantyUntil?: string;
  deliveryStatus?: string;
  installments?: SaleInstallment[];
};

type FinanceFilters = {
  from?: string;
  to?: string;
  companyAccountId?: string;
  entryType?: string;
  category?: string;
  paymentMethod?: string;
};

const financeWhere = (query: FinanceFilters, dateColumn: string) => {
  const values: unknown[] = [], terms: string[] = [];
  for (const [value, sql] of [
    [query.from, `${dateColumn} >=`], [query.to, `${dateColumn} <=`],
    [query.companyAccountId, "f.company_account_id ="], [query.entryType, "f.entry_type ="],
    [query.category, "f.category ="], [query.paymentMethod, "f.payment_method ="],
  ] as const) if (value) { values.push(value); terms.push(`${sql} $${values.length}`); }
  return { values, sql: terms.length ? `WHERE ${terms.join(" AND ")}` : "" };
};

export async function financeRoutes(app: FastifyInstance) {
  app.get("/api/company-accounts", { preHandler: authenticated }, async () => ({
    accounts: (
      await pool.query(
        "SELECT id,trade_name,cnpj,short_label,active FROM company_accounts ORDER BY short_label",
      )
    ).rows,
  }));

  app.post<{ Body: { tradeName: string; cnpj: string; shortLabel: string } }>(
    "/api/company-accounts",
    { preHandler: admin },
    async (request, reply) => {
      const digits = request.body.cnpj?.replace(/\D/g, "");
      if (!validCnpj(digits ?? ""))
        return reply.code(400).send({ title: "CNPJ inválido", status: 400 });
      const id = randomUUID();
      await pool.query(
        "INSERT INTO company_accounts(id,trade_name,cnpj,short_label) VALUES($1,$2,$3,$4)",
        [
          id,
          request.body.tradeName.trim(),
          digits,
          request.body.shortLabel.trim(),
        ],
      );
      await audit(request.currentUser!.id, "create", "company_account", id);
      return reply.code(201).send({ id });
    },
  );

  app.post<{ Body: SaleBody }>(
    "/api/sales",
    { preHandler: authenticated },
    async (request, reply) => {
      const body = request.body ?? {};
      const installments = body.installments ?? [];
      if (
        !body.clientRequestId ||
        !body.patientId ||
        !body.companyAccountId ||
        !body.product?.trim() ||
        body.product.trim().length < 2 ||
        !Number.isInteger(body.quantity) ||
        Number(body.quantity) < 1 ||
        !/^[0-9a-f-]{36}$/i.test(body.clientRequestId) ||
        !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(body.soldOn ?? "") ||
        !validateInstallments(Number(body.totalAmountCents), installments) ||
        !DELIVERY_STATUSES.includes((body.deliveryStatus ?? "pending") as never)
      )
        return reply
          .code(400)
          .type("application/problem+json")
          .send({
            title: "Confira produto, valor, data, caixa e pagamentos",
            status: 400,
          });

      const authorized = await loadAndAuthorizePatient(request, reply, body.patientId, "write");
      if (!authorized) return;

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const retry = await client.query(
          "SELECT id FROM sales WHERE client_request_id=$1",
          [body.clientRequestId],
        );
        if (retry.rowCount) {
          await client.query("COMMIT");
          return reply
            .code(200)
            .send({ id: retry.rows[0].id, idempotent: true });
        }
        const valid = await client.query(
          "SELECT p.id FROM patients p JOIN company_accounts c ON c.id=$2 AND c.active WHERE p.id=$1 AND p.archived_at IS NULL",
          [body.patientId, body.companyAccountId],
        );
        if (!valid.rowCount) {
          await client.query("ROLLBACK");
          return reply
            .code(404)
            .type("application/problem+json")
            .send({
              title: "Paciente ou caixa ativo não encontrado",
              status: 404,
            });
        }

        if (body.productId) {
          const balance = await client.query<{ stock: string }>(
            "SELECT COALESCE(SUM(quantity),0) stock FROM inventory_movements WHERE product_id=$1",
            [body.productId]
          );
          const currentStock = Number(balance.rows[0]?.stock ?? 0);
          if (currentStock < Number(body.quantity)) {
            await client.query("ROLLBACK");
            return reply
              .code(409)
              .type("application/problem+json")
              .send({
                title: `Estoque insuficiente para esta venda (Disponível: ${currentStock}, Solicitado: ${body.quantity})`,
                status: 409,
              });
          }
        }

        const saleId = randomUUID();
        await client.query(
          `INSERT INTO sales(id,client_request_id,patient_id,product,quantity,total_amount_cents,sold_on,company_account_id,notes,warranty_until,delivery_status,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            saleId,
            body.clientRequestId,
            body.patientId,
            body.product.trim(),
            body.quantity,
            body.totalAmountCents,
            body.soldOn,
            body.companyAccountId,
            body.notes?.trim() ?? "",
            body.warrantyUntil || null,
            body.deliveryStatus ?? "pending",
            request.currentUser!.id,
          ],
        );

        if (body.productId) {
          await client.query(
            "INSERT INTO inventory_movements(id,product_id,movement_type,quantity,notes,created_by) VALUES($1,$2,'sale_deduction',$3,$4,$5)",
            [
              randomUUID(),
              body.productId,
              -Math.abs(Number(body.quantity)),
              `Baixa automática pela Venda ${saleId}`,
              request.currentUser!.id,
            ]
          );
        }

        if (body.serviceId) {
          const serviceProducts = await client.query<{ product_id: string; quantity: number }>(
            "SELECT product_id, quantity FROM service_products WHERE service_id=$1",
            [body.serviceId]
          );
          for (const sp of serviceProducts.rows) {
            const deductionQty = -Math.abs(sp.quantity * Number(body.quantity));
            await client.query(
              "INSERT INTO inventory_movements(id,product_id,movement_type,quantity,notes,created_by) VALUES($1,$2,'sale_deduction',$3,$4,$5)",
              [
                randomUUID(),
                sp.product_id,
                deductionQty,
                `Consumo de insumo pelo Serviço na Venda ${saleId}`,
                request.currentUser!.id,
              ]
            );
          }
        }

        for (const item of installments) {
          const installmentId = randomUUID();
          await client.query(
            "INSERT INTO receivable_installments(id,sale_id,amount_cents,due_on,payment_method) VALUES($1,$2,$3,$4,$5)",
            [
              installmentId,
              saleId,
              item.amountCents,
              item.dueOn,
              item.paymentMethod,
            ],
          );
          if (item.receivedOn)
            await client.query(
              `INSERT INTO financial_entries(id,entry_type,category,description,amount_cents,competence_on,occurred_on,payment_method,company_account_id,patient_id,sale_id,receivable_installment_id,created_by) VALUES($1,'income','hearing_aid_sale',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
              [
                randomUUID(),
                `Venda: ${body.product.trim()}`,
                item.amountCents,
                body.soldOn,
                item.receivedOn,
                item.paymentMethod,
                body.companyAccountId,
                body.patientId,
                saleId,
                installmentId,
                request.currentUser!.id,
              ],
            );
        }
        for (const [days, title] of [
          [7, "Contato pós-venda (7 dias)"],
          [30, "Retorno pós-venda (30 dias)"],
          [90, "Acompanhamento pós-venda (90 dias)"],
        ] as const)
          await client.query(
            `INSERT INTO follow_up_tasks(id,patient_id,title,due_on,notes,created_by,sale_id) VALUES($1,$2,$3,$4::date+$5::integer,'Gerado automaticamente pela venda',$6,$7)`,
            [
              randomUUID(),
              body.patientId,
              title,
              body.soldOn,
              days,
              request.currentUser!.id,
              saleId,
            ],
          );
        await client.query(
          "UPDATE patients SET journey_status='sale_completed',version=version+1,updated_at=now() WHERE id=$1",
          [body.patientId],
        );
        await client.query(
          "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)",
          [
            request.currentUser!.id,
            "create",
            "sale",
            saleId,
            {
              patientId: body.patientId,
              totalAmountCents: body.totalAmountCents,
              installments: installments.length,
            },
          ],
        );
        await client.query("COMMIT");
        return reply.code(201).send({ id: saleId });
      } catch (error: any) {
        await client.query("ROLLBACK");
        if (error?.code === "23505") {
          const retry = await pool.query(
            "SELECT id FROM sales WHERE client_request_id=$1",
            [body.clientRequestId],
          );
          if (retry.rowCount)
            return reply
              .code(200)
              .send({ id: retry.rows[0].id, idempotent: true });
        }
        throw error;
      } finally {
        client.release();
      }
    },
  );

  app.get<{ Params: { id: string } }>(
    "/api/sales/:id",
    { preHandler: authenticated },
    async (request, reply) => {
      const sale = await pool.query(
        `SELECT s.*,p.name patient_name,c.short_label company_account_label FROM sales s JOIN patients p ON p.id=s.patient_id JOIN company_accounts c ON c.id=s.company_account_id WHERE s.id=$1`,
        [request.params.id],
      );
      if (!sale.rowCount)
        return reply
          .code(404)
          .type("application/problem+json")
          .send({ title: "Venda não encontrada", status: 404 });

      const authorized = await loadAndAuthorizePatient(request, reply, sale.rows[0].patient_id, "read");
      if (!authorized) return;

      const installments = await pool.query(
        `SELECT r.*,f.occurred_on received_on,rev.id IS NOT NULL reversed FROM receivable_installments r LEFT JOIN financial_entries f ON f.receivable_installment_id=r.id AND f.reversal_of_id IS NULL LEFT JOIN financial_entries rev ON rev.reversal_of_id=f.id WHERE r.sale_id=$1 ORDER BY r.due_on,r.id`,
        [request.params.id],
      );
      return { sale: sale.rows[0], installments: installments.rows };
    },
  );

  app.patch<{ Params: { id: string }; Body: { deliveryStatus?: string } }>(
    "/api/sales/:id/delivery",
    { preHandler: authenticated },
    async (request, reply) => {
      if (!DELIVERY_STATUSES.includes(request.body?.deliveryStatus as never))
        return reply
          .code(400)
          .type("application/problem+json")
          .send({ title: "Situação de entrega inválida", status: 400 });
      const changed = await pool.query(
        `WITH updated AS (UPDATE sales SET delivery_status=$2 WHERE id=$1 AND cancelled_at IS NULL RETURNING id),audited AS (INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) SELECT $3,'update_delivery','sale',id,jsonb_build_object('deliveryStatus',$2::text) FROM updated) SELECT id FROM updated`,
        [
          request.params.id,
          request.body.deliveryStatus,
          request.currentUser!.id,
        ],
      );
      if (!changed.rowCount)
        return reply
          .code(409)
          .type("application/problem+json")
          .send({ title: "Venda não encontrada ou cancelada", status: 409 });
      return reply.code(204).send();
    },
  );

  app.post<{ Params: { id: string }; Body: { reason?: string } }>(
    "/api/sales/:id/cancel",
    { preHandler: admin },
    async (request, reply) => {
      const reason = request.body?.reason?.trim();
      if (!reason || reason.length < 3)
        return reply
          .code(400)
          .type("application/problem+json")
          .send({ title: "Informe o motivo do cancelamento", status: 400 });
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const sale = await client.query(
          "SELECT * FROM sales WHERE id=$1 FOR UPDATE",
          [request.params.id],
        );
        if (!sale.rowCount || sale.rows[0].cancelled_at) {
          await client.query("ROLLBACK");
          return reply
            .code(409)
            .type("application/problem+json")
            .send({
              title: "Venda não encontrada ou já cancelada",
              status: 409,
            });
        }
        await client.query(
          "UPDATE sales SET cancelled_at=now(),cancelled_by=$2,cancellation_reason=$3 WHERE id=$1",
          [request.params.id, request.currentUser!.id, reason],
        );
        await client.query(
          `INSERT INTO financial_entries(id,entry_type,category,description,amount_cents,competence_on,occurred_on,payment_method,company_account_id,patient_id,sale_id,reversal_of_id,reversal_reason,created_by) SELECT gen_random_uuid(),CASE entry_type WHEN 'income' THEN 'expense' ELSE 'income' END,category,'Estorno: '||description,amount_cents,competence_on,(now() AT TIME ZONE 'America/Sao_Paulo')::date,payment_method,company_account_id,patient_id,sale_id,id,$2,$3 FROM financial_entries original WHERE sale_id=$1 AND reversal_of_id IS NULL AND NOT EXISTS(SELECT 1 FROM financial_entries reversal WHERE reversal.reversal_of_id=original.id)`,
          [request.params.id, reason, request.currentUser!.id],
        );
        await client.query(
          `UPDATE follow_up_tasks SET cancelled_at=now(),closed_by=$2 WHERE sale_id=$1 AND completed_at IS NULL AND cancelled_at IS NULL`,
          [request.params.id, request.currentUser!.id],
        );
        await client.query(
          `INSERT INTO inventory_movements(id, product_id, movement_type, quantity, notes, created_by)
           SELECT gen_random_uuid(), product_id, 'adjustment', ABS(quantity), 'Estorno por cancelamento da Venda ' || $1 || ': ' || $3, $2
           FROM inventory_movements WHERE notes LIKE '%' || $1 || '%' AND movement_type = 'sale_deduction'`,
          [request.params.id, request.currentUser!.id, reason],
        );
        await client.query(
          "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)",
          [
            request.currentUser!.id,
            "cancel",
            "sale",
            request.params.id,
            { reason },
          ],
        );
        await client.query("COMMIT");
        return reply.code(204).send();
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  );

  app.get<{ Querystring: FinanceFilters }>("/api/finance/entries", { preHandler: authenticated }, async (request) => {
    const where = financeWhere(request.query, "f.occurred_on");
    const result = await pool.query(`SELECT f.id,f.entry_type,f.category,f.description,f.amount_cents,f.competence_on,f.occurred_on,f.payment_method,f.company_account_id,c.short_label company_account_label,f.patient_id,p.name patient_name,f.sale_id,f.reversal_of_id,f.reversal_reason,f.notes,f.created_at,u.name created_by_name,EXISTS(SELECT 1 FROM financial_entries r WHERE r.reversal_of_id=f.id) reversed FROM financial_entries f JOIN company_accounts c ON c.id=f.company_account_id JOIN users u ON u.id=f.created_by LEFT JOIN patients p ON p.id=f.patient_id ${where.sql} ORDER BY f.occurred_on DESC,f.created_at DESC LIMIT 500`, where.values);
    return { entries: result.rows.map(row => ({ ...row, amount_cents: Number(row.amount_cents) })) };
  });

  app.post<{ Body: { clientRequestId?: string; entryType?: string; category?: string; description?: string; amountCents?: number; competenceOn?: string; occurredOn?: string; paymentMethod?: string; companyAccountId?: string; patientId?: string; notes?: string } }>("/api/finance/entries", { preHandler: authenticated }, async (request, reply) => {
    const body = request.body ?? {};
    if (!validFinancialEntry(body)) return reply.code(400).type("application/problem+json").send({ title: "Confira tipo, categoria, descrição, valor, datas, pagamento e caixa", status: 400 });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const retry = await client.query("SELECT id FROM financial_entries WHERE client_request_id=$1", [body.clientRequestId]);
      if (retry.rowCount) { await client.query("COMMIT"); return { id: retry.rows[0].id, idempotent: true }; }
      const account = await client.query("SELECT id FROM company_accounts WHERE id=$1 AND active", [body.companyAccountId]);
      if (!account.rowCount) { await client.query("ROLLBACK"); return reply.code(404).type("application/problem+json").send({ title: "Caixa ativo não encontrado", status: 404 }); }
      const id = randomUUID();
      await client.query(`INSERT INTO financial_entries(id,client_request_id,entry_type,category,description,amount_cents,competence_on,occurred_on,payment_method,company_account_id,patient_id,notes,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [id,body.clientRequestId,body.entryType,body.category,body.description!.trim(),body.amountCents,body.competenceOn,body.occurredOn,body.paymentMethod,body.companyAccountId,body.patientId || null,body.notes?.trim() ?? "",request.currentUser!.id]);
      await client.query("INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'create','financial_entry',$2,$3)", [request.currentUser!.id,id,{ entryType: body.entryType, amountCents: body.amountCents }]);
      await client.query("COMMIT");
      return reply.code(201).send({ id });
    } catch (error: any) {
      await client.query("ROLLBACK");
      if (error?.code === "23505") { const retry = await pool.query("SELECT id FROM financial_entries WHERE client_request_id=$1", [body.clientRequestId]); if (retry.rowCount) return { id: retry.rows[0].id, idempotent: true }; }
      throw error;
    } finally { client.release(); }
  });

  app.get<{ Querystring: { from?: string; to?: string; companyAccountId?: string; paymentMethod?: string; status?: string } }>("/api/finance/receivables", { preHandler: authenticated }, async (request) => {
    const values: unknown[] = [], terms: string[] = [];
    for (const [value, sql] of [[request.query.from,"r.due_on >="],[request.query.to,"r.due_on <="],[request.query.companyAccountId,"s.company_account_id ="],[request.query.paymentMethod,"r.payment_method ="]] as const) if (value) { values.push(value); terms.push(`${sql} $${values.length}`); }
    if (request.query.status) { values.push(request.query.status); terms.push(`CASE WHEN s.cancelled_at IS NOT NULL THEN 'cancelled' WHEN receipt.id IS NOT NULL THEN 'received' ELSE 'expected' END = $${values.length}`); }
    const result = await pool.query(`SELECT r.id,r.amount_cents,r.due_on,r.payment_method,s.id sale_id,s.product,s.patient_id,p.name patient_name,s.company_account_id,c.short_label company_account_label,receipt.id receipt_id,receipt.occurred_on received_on,CASE WHEN s.cancelled_at IS NOT NULL THEN 'cancelled' WHEN receipt.id IS NOT NULL THEN 'received' ELSE 'expected' END status FROM receivable_installments r JOIN sales s ON s.id=r.sale_id JOIN patients p ON p.id=s.patient_id JOIN company_accounts c ON c.id=s.company_account_id LEFT JOIN LATERAL (SELECT f.id,f.occurred_on FROM financial_entries f WHERE f.receivable_installment_id=r.id AND f.reversal_of_id IS NULL AND NOT EXISTS(SELECT 1 FROM financial_entries reversal WHERE reversal.reversal_of_id=f.id) ORDER BY f.created_at DESC LIMIT 1) receipt ON true ${terms.length ? `WHERE ${terms.join(" AND ")}` : ""} ORDER BY r.due_on,r.id LIMIT 500`, values);
    return { receivables: result.rows.map(row => ({ ...row, amount_cents: Number(row.amount_cents) })) };
  });

  app.post<{ Params: { id: string }; Body: { clientRequestId?: string; receivedOn?: string; companyAccountId?: string; paymentMethod?: string } }>("/api/finance/receivables/:id/settle", { preHandler: authenticated }, async (request, reply) => {
    const { clientRequestId, receivedOn, companyAccountId, paymentMethod } = request.body ?? {};
    if (!/^[0-9a-f-]{36}$/i.test(clientRequestId ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(receivedOn ?? "")) return reply.code(400).type("application/problem+json").send({ title: "Informe a data do recebimento", status: 400 });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const retry = await client.query("SELECT id FROM financial_entries WHERE client_request_id=$1", [clientRequestId]);
      if (retry.rowCount) { await client.query("COMMIT"); return { id: retry.rows[0].id, idempotent: true }; }
      const installment = await client.query(`SELECT r.*,s.product,s.sold_on,s.company_account_id,s.patient_id,s.cancelled_at FROM receivable_installments r JOIN sales s ON s.id=r.sale_id WHERE r.id=$1 FOR UPDATE OF r`, [request.params.id]);
      if (!installment.rowCount || installment.rows[0].cancelled_at) { await client.query("ROLLBACK"); return reply.code(409).type("application/problem+json").send({ title: "Parcela não encontrada ou venda cancelada", status: 409 }); }
      const retryAfterLock = await client.query("SELECT id FROM financial_entries WHERE client_request_id=$1", [clientRequestId]);
      if (retryAfterLock.rowCount) { await client.query("COMMIT"); return { id: retryAfterLock.rows[0].id, idempotent: true }; }
      const row = installment.rows[0], id = randomUUID();
      const targetAccountId = companyAccountId || row.company_account_id;
      const targetPaymentMethod = paymentMethod || row.payment_method;
      await client.query(`INSERT INTO financial_entries(id,client_request_id,entry_type,category,description,amount_cents,competence_on,occurred_on,payment_method,company_account_id,patient_id,sale_id,receivable_installment_id,created_by) VALUES($1,$2,'income','hearing_aid_sale',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [id,clientRequestId,`Venda: ${row.product}`,row.amount_cents,row.sold_on,receivedOn,targetPaymentMethod,targetAccountId,row.patient_id,row.sale_id,row.id,request.currentUser!.id]);
      await client.query("INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'settle','receivable_installment',$2,$3)", [request.currentUser!.id,row.id,{ financialEntryId:id, receivedOn, companyAccountId: targetAccountId }]);
      await client.query("COMMIT");
      return reply.code(201).send({ id });
    } catch (error: any) { await client.query("ROLLBACK"); const retry = await pool.query("SELECT id FROM financial_entries WHERE client_request_id=$1", [clientRequestId]); if (retry.rowCount) return { id: retry.rows[0].id, idempotent: true }; throw error; } finally { client.release(); }
  });

  const handleReverseEntry = async (request: FastifyRequest<{ Params: { id: string }; Body: { clientRequestId?: string; reason?: string; reversalReason?: string; occurredOn?: string } }>, reply: any) => {
    const { clientRequestId, reason, reversalReason, occurredOn } = request.body ?? {};
    const finalReason = (reason || reversalReason)?.trim();
    const finalClientRequestId = clientRequestId || randomUUID();
    const finalOccurredOn = occurredOn || new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

    if (!finalReason || finalReason.length < 3) return reply.code(400).type("application/problem+json").send({ title: "Informe a justificativa do estorno (mínimo 3 caracteres)", status: 400 });
    const result = await pool.query(
      `WITH reversed AS (
         INSERT INTO financial_entries(id,client_request_id,entry_type,category,description,amount_cents,competence_on,occurred_on,payment_method,company_account_id,patient_id,sale_id,reversal_of_id,reversal_reason,notes,created_by)
         SELECT $1,$2,CASE entry_type WHEN 'income' THEN 'expense' ELSE 'income' END,category,'Estorno: '||description,amount_cents,competence_on,$3,payment_method,company_account_id,patient_id,sale_id,id,$4,notes,$5
         FROM financial_entries original WHERE id=$6 AND reversal_of_id IS NULL AND NOT EXISTS(SELECT 1 FROM financial_entries r WHERE r.reversal_of_id=original.id)
         RETURNING id
       ),
       audited AS (
         INSERT INTO audit_events(user_id,action,entity_type,entity_id,details)
         SELECT $5,'reverse','financial_entry',id,jsonb_build_object('reversalOfId',$6::text,'reason',$4::text) FROM reversed
       )
       SELECT id FROM reversed`,
      [randomUUID(), finalClientRequestId, finalOccurredOn, finalReason, request.currentUser!.id, request.params.id]
    );
    if (!result.rowCount) return reply.code(409).type("application/problem+json").send({ title: "Lançamento não encontrado ou já estornado", status: 409 });
    return reply.code(201).send({ id: result.rows[0].id });
  };

  app.post("/api/finance/entries/:id/reverse", { preHandler: admin }, handleReverseEntry as any);
  app.post("/api/admin/finance/entries/:id/reverse", { preHandler: admin }, handleReverseEntry as any);

  app.get<{ Querystring: FinanceFilters }>("/api/finance/summary", { preHandler: admin }, async (request) => {
    const where = financeWhere(request.query, "f.occurred_on");
    const result = await pool.query(`SELECT c.id company_account_id,c.short_label company_account_label,COALESCE(sum(CASE WHEN f.entry_type='income' THEN f.amount_cents ELSE -f.amount_cents END),0) balance_cents,COALESCE(sum(f.amount_cents) FILTER(WHERE f.entry_type='income'),0) income_cents,COALESCE(sum(f.amount_cents) FILTER(WHERE f.entry_type='expense'),0) expense_cents FROM financial_entries f JOIN company_accounts c ON c.id=f.company_account_id ${where.sql} GROUP BY c.id,c.short_label ORDER BY c.short_label`, where.values);
    const byAccount = result.rows.map(row => ({ ...row, balance_cents:Number(row.balance_cents), income_cents:Number(row.income_cents), expense_cents:Number(row.expense_cents) }));
    return { consolidated: byAccount.reduce((total,row) => ({ balance_cents:total.balance_cents+row.balance_cents,income_cents:total.income_cents+row.income_cents,expense_cents:total.expense_cents+row.expense_cents }), { balance_cents:0,income_cents:0,expense_cents:0 }), byAccount };
  });

  app.get("/api/dashboard", { preHandler: authenticated }, async (request) => {
    const today = "(now() AT TIME ZONE 'America/Sao_Paulo')::date";
    const [counts, queue] = await Promise.all([
      pool.query(`SELECT
        count(*) FILTER (WHERE t.due_on < ${today})::int overdue,
        count(*) FILTER (WHERE t.due_on = ${today})::int today,
        count(*)::int open_tasks,
        (SELECT count(*)::int FROM patients WHERE archived_at IS NULL AND journey_status='adaptation') adaptation,
        (SELECT count(*)::int FROM sales WHERE cancelled_at IS NULL AND date_trunc('month',sold_on)=date_trunc('month',${today})) month_sales
        FROM follow_up_tasks t
        WHERE t.completed_at IS NULL AND t.cancelled_at IS NULL`),
      pool.query(`SELECT t.id task_id,t.patient_id,p.name patient_name,p.phone,t.title,t.due_on,
        CASE WHEN t.due_on < ${today} THEN 'overdue' WHEN t.due_on = ${today} THEN 'today' ELSE 'upcoming' END timing
        FROM follow_up_tasks t JOIN patients p ON p.id=t.patient_id
        WHERE t.completed_at IS NULL AND t.cancelled_at IS NULL AND p.archived_at IS NULL
        ORDER BY CASE WHEN t.due_on < ${today} THEN 0 WHEN t.due_on = ${today} THEN 1 ELSE 2 END,t.due_on,p.name LIMIT 12`),
    ]);
    const response: Record<string, unknown> = { ...counts.rows[0], queue: queue.rows };
    if (request.currentUser!.role === "admin") {
      const financial = await pool.query(`SELECT c.id company_account_id,c.short_label company_account_label,
        COALESCE(sum(CASE WHEN f.entry_type='income' THEN f.amount_cents ELSE -f.amount_cents END),0) balance_cents,
        COALESCE(sum(f.amount_cents) FILTER (WHERE f.entry_type='income' AND date_trunc('month',f.occurred_on)=date_trunc('month',${today})),0) month_income_cents,
        COALESCE(sum(f.amount_cents) FILTER (WHERE f.entry_type='expense' AND date_trunc('month',f.occurred_on)=date_trunc('month',${today})),0) month_expense_cents
        FROM company_accounts c LEFT JOIN financial_entries f ON f.company_account_id=c.id
        GROUP BY c.id,c.short_label ORDER BY c.short_label`);
      const byAccount = financial.rows.map((row) => ({
        ...row,
        balance_cents: Number(row.balance_cents),
        month_income_cents: Number(row.month_income_cents),
        month_expense_cents: Number(row.month_expense_cents),
      }));
      response.financial = {
        consolidated: byAccount.reduce((total, row) => ({
          balance_cents: total.balance_cents + row.balance_cents,
          month_income_cents: total.month_income_cents + row.month_income_cents,
          month_expense_cents: total.month_expense_cents + row.month_expense_cents,
        }), { balance_cents: 0, month_income_cents: 0, month_expense_cents: 0 }),
        byAccount,
      };
    }
    return response;
  });
}
