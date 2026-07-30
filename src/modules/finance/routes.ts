import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { pool } from "../../db/pool.js";
import { idempotencyFingerprint } from "../../domain/idempotency.js";
import { validCnpj } from "../../domain/security.js";
import {
  DELIVERY_STATUSES,
  validateInstallments,
  type SaleInstallment,
} from "../../domain/sales.js";
import { validFinancialEntry } from "../../domain/finance.js";
import { sanitizeCsvCell } from "../../domain/csv-import.js";
import { validPayableDraft } from "../../domain/payables.js";
import { audit } from "../audit/service.js";
import { admin, authenticated, loadAndAuthorizePatient, operatorOrAdmin } from "../patients/authorization.js";

type SaleBody = {
  clientRequestId?: string;
  patientId?: string;
  appointmentId?: string;
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
  limit?: string;
  offset?: string;
};

const pagination = (limitValue?: string, offsetValue?: string) => {
  const requestedLimit = Number(limitValue ?? 25);
  const requestedOffset = Number(offsetValue ?? 0);
  return {
    limit: Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 25,
    offset: Number.isInteger(requestedOffset) && requestedOffset >= 0 ? requestedOffset : 0,
  };
};

const idempotencyRetry = (
  reply: any,
  row: { id: string; request_fingerprint: string | null },
  requestFingerprint: string,
) =>
  row.request_fingerprint === requestFingerprint
    ? reply.code(200).send({ id: row.id, idempotent: true })
    : reply.code(409).type("application/problem+json").send({
        title: "Chave de idempotÃªncia reutilizada com payload diferente",
        status: 409,
      });

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
  app.get("/api/company-accounts", { preHandler: operatorOrAdmin }, async () => ({
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
        return reply.code(400).send({ title: "CNPJ invÃ¡lido", status: 400 });
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
    { preHandler: operatorOrAdmin },
    async (request, reply) => {
      const body = request.body ?? {};
      const installments = body.installments ?? [];
      if (
        !body.clientRequestId ||
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

      if (body.patientId) {
        const authorized = await loadAndAuthorizePatient(request, reply, body.patientId, "write");
        if (!authorized) return;
      }

      const requestFingerprint = idempotencyFingerprint({
        patientId: body.patientId,
        appointmentId: body.appointmentId || null,
        productId: body.productId || null,
        serviceId: body.serviceId || null,
        product: body.product.trim(),
        quantity: body.quantity,
        totalAmountCents: body.totalAmountCents,
        soldOn: body.soldOn,
        companyAccountId: body.companyAccountId,
        notes: body.notes?.trim() ?? "",
        warrantyUntil: body.warrantyUntil || null,
        deliveryStatus: body.deliveryStatus ?? "pending",
        installments,
      });
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const retry = await client.query(
          "SELECT id,request_fingerprint FROM sales WHERE client_request_id=$1",
          [body.clientRequestId],
        );
        if (retry.rowCount) {
          await client.query("COMMIT");
          return idempotencyRetry(reply, retry.rows[0], requestFingerprint);
        }
        const valid = await client.query(
          body.patientId
            ? "SELECT p.id FROM patients p JOIN company_accounts c ON c.id=$2 AND c.active WHERE p.id=$1 AND p.archived_at IS NULL"
            : "SELECT c.id FROM company_accounts c WHERE c.id=$1 AND c.active",
          body.patientId ? [body.patientId, body.companyAccountId] : [body.companyAccountId],
        );
        if (!valid.rowCount) {
          await client.query("ROLLBACK");
          return reply
            .code(404)
            .type("application/problem+json")
            .send({
              title: body.patientId ? "Paciente ou caixa ativo não encontrado" : "Caixa ativo não encontrado",
              status: 404,
            });
        }
        if (body.appointmentId) {
          const appointment = await client.query(
            `SELECT id, patient_id, status
             FROM appointments
             WHERE id=$1`,
            [body.appointmentId],
          );
          if (!appointment.rowCount || ["cancelled", "no_show"].includes(appointment.rows[0].status)) {
            await client.query("ROLLBACK");
            return reply.code(404).type("application/problem+json").send({ title: "Appointment nÃ£o encontrado para vincular a venda", status: 404 });
          }
          if (body.patientId && appointment.rows[0].patient_id && appointment.rows[0].patient_id !== body.patientId) {
            await client.query("ROLLBACK");
            return reply.code(409).type("application/problem+json").send({ title: "Appointment pertence a outro paciente", status: 409 });
          }
        }

        if (body.productId && body.serviceId) {
          await client.query("ROLLBACK");
          return reply.code(400).type("application/problem+json").send({
            title: "Selecione produto ou serviÃ§o, nÃ£o ambos",
            status: 400,
          });
        }
        let costAmountCents = 0;
        let serviceProducts: { product_id: string; quantity: number }[] = [];
        if (body.productId) {
          const product = await client.query<{ cost_cents: string }>(
            "SELECT cost_cents FROM products WHERE id=$1 AND active FOR UPDATE",
            [body.productId],
          );
          if (!product.rowCount) {
            await client.query("ROLLBACK");
            return reply.code(404).type("application/problem+json").send({
              title: "Produto ativo nÃ£o encontrado",
              status: 404,
            });
          }
          costAmountCents = Number(product.rows[0].cost_cents) * Number(body.quantity);
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
        if (body.serviceId) {
          const service = await client.query<{ cmv_cents: string }>(
            "SELECT cmv_cents FROM services WHERE id=$1 AND active FOR SHARE",
            [body.serviceId],
          );
          if (!service.rowCount) {
            await client.query("ROLLBACK");
            return reply.code(404).type("application/problem+json").send({
              title: "Serviço ativo não encontrado",
              status: 404,
            });
          }
          costAmountCents = Number(service.rows[0].cmv_cents) * Number(body.quantity);
          const related = await client.query<{ product_id: string; quantity: number }>(
            `SELECT sp.product_id,sp.quantity
             FROM service_products sp
             JOIN products p ON p.id=sp.product_id
             WHERE sp.service_id=$1
             ORDER BY p.id
             FOR UPDATE OF p`,
            [body.serviceId],
          );
          serviceProducts = related.rows;
          for (const item of serviceProducts) {
            const balance = await client.query<{ stock: string }>(
              "SELECT COALESCE(SUM(quantity),0) stock FROM inventory_movements WHERE product_id=$1",
              [item.product_id],
            );
            const requested = item.quantity * Number(body.quantity);
            if (Number(balance.rows[0]?.stock ?? 0) < requested) {
              await client.query("ROLLBACK");
              return reply.code(409).type("application/problem+json").send({
                title: "Estoque insuficiente para os insumos do serviço",
                status: 409,
              });
            }
          }
        }

        const saleId = randomUUID();
        await client.query(
          `INSERT INTO sales(id,client_request_id,request_fingerprint,patient_id,appointment_id,product_id,service_id,product,quantity,total_amount_cents,cost_amount_cents,sold_on,company_account_id,notes,warranty_until,delivery_status,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
          [
            saleId,
            body.clientRequestId,
            requestFingerprint,
            body.patientId,
            body.appointmentId || null,
            body.productId || null,
            body.serviceId || null,
            body.product.trim(),
            body.quantity,
            body.totalAmountCents,
            costAmountCents,
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
              `Baixa automÃ¡tica pela Venda ${saleId}`,
              request.currentUser!.id,
            ]
          );
        }

        if (body.serviceId) {
          for (const sp of serviceProducts) {
            const deductionQty = -Math.abs(sp.quantity * Number(body.quantity));
            await client.query(
              "INSERT INTO inventory_movements(id,product_id,movement_type,quantity,notes,created_by) VALUES($1,$2,'sale_deduction',$3,$4,$5)",
              [
                randomUUID(),
                sp.product_id,
                deductionQty,
                `Consumo de insumo pelo ServiÃ§o na Venda ${saleId}`,
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
                body.patientId || null,
                saleId,
                installmentId,
                request.currentUser!.id,
              ],
            );
        }
        if (body.patientId) {
          for (const [days, title] of [
            [7, "Contato pÃ³s-venda (7 dias)"],
            [30, "Retorno pÃ³s-venda (30 dias)"],
            [90, "Acompanhamento pÃ³s-venda (90 dias)"],
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
        }
        await client.query(
          "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)",
          [
            request.currentUser!.id,
            "create",
            "sale",
            saleId,
            {
              patientId: body.patientId,
              appointmentId: body.appointmentId || null,
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
            "SELECT id,request_fingerprint FROM sales WHERE client_request_id=$1",
            [body.clientRequestId],
          );
          if (retry.rowCount)
            return idempotencyRetry(reply, retry.rows[0], requestFingerprint);
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
        `SELECT s.*,COALESCE(p.name,'Atendimento avulso') patient_name,c.short_label company_account_label
         FROM sales s
         LEFT JOIN patients p ON p.id=s.patient_id
         JOIN company_accounts c ON c.id=s.company_account_id
         WHERE s.id=$1`,
        [request.params.id],
      );
      if (!sale.rowCount)
        return reply
          .code(404)
          .type("application/problem+json")
          .send({ title: "Venda nÃ£o encontrada", status: 404 });

      if (sale.rows[0].patient_id) {
        const authorized = await loadAndAuthorizePatient(request, reply, sale.rows[0].patient_id, "read");
        if (!authorized) return;
      }

      const installments = await pool.query(
        `SELECT r.*,f.occurred_on received_on,rev.id IS NOT NULL reversed FROM receivable_installments r LEFT JOIN financial_entries f ON f.receivable_installment_id=r.id AND f.reversal_of_id IS NULL LEFT JOIN financial_entries rev ON rev.reversal_of_id=f.id WHERE r.sale_id=$1 ORDER BY r.due_on,r.id`,
        [request.params.id],
      );
      return { sale: sale.rows[0], installments: installments.rows };
    },
  );

  app.get<{ Params: { id: string } }>(
    "/api/patients/:id/commercial",
    { preHandler: authenticated },
    async (request, reply) => {
      const authorized = await loadAndAuthorizePatient(request, reply, request.params.id, "read");
      if (!authorized) return;
      const [sales, receivables] = await Promise.all([
        pool.query(
          `SELECT id,product,quantity,total_amount_cents,cost_amount_cents,sold_on,delivery_status,cancelled_at
           FROM sales WHERE patient_id=$1 ORDER BY sold_on DESC,created_at DESC`,
          [request.params.id],
        ),
        pool.query(
          `SELECT r.id,r.amount_cents,r.due_on,r.payment_method,s.product,
                  CASE WHEN s.cancelled_at IS NOT NULL THEN 'cancelled'
                       WHEN EXISTS(SELECT 1 FROM financial_entries f WHERE f.receivable_installment_id=r.id AND f.reversal_of_id IS NULL) THEN 'received'
                       ELSE 'expected' END status
           FROM receivable_installments r
           JOIN sales s ON s.id=r.sale_id
           WHERE s.patient_id=$1
           ORDER BY r.due_on DESC,r.id`,
          [request.params.id],
        ),
      ]);
      return {
        sales: sales.rows.map((row) => ({
          ...row,
          total_amount_cents: Number(row.total_amount_cents),
          cost_amount_cents: Number(row.cost_amount_cents),
        })),
        receivables: receivables.rows.map((row) => ({
          ...row,
          amount_cents: Number(row.amount_cents),
        })),
      };
    },
  );

  app.patch<{ Params: { id: string }; Body: { deliveryStatus?: string } }>(
    "/api/sales/:id/delivery",
    { preHandler: operatorOrAdmin },
    async (request, reply) => {
      if (!DELIVERY_STATUSES.includes(request.body?.deliveryStatus as never))
        return reply
          .code(400)
          .type("application/problem+json")
          .send({ title: "SituaÃ§Ã£o de entrega invÃ¡lida", status: 400 });
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
          .send({ title: "Venda nÃ£o encontrada ou cancelada", status: 409 });
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
              title: "Venda nÃ£o encontrada ou jÃ¡ cancelada",
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

  app.get<{ Querystring: FinanceFilters }>("/api/finance/entries", { preHandler: operatorOrAdmin }, async (request) => {
    const where = financeWhere(request.query, "f.occurred_on");
    const page = pagination(request.query.limit, request.query.offset);
    where.values.push(page.limit + 1, page.offset);
    const result = await pool.query(`SELECT f.id,f.entry_type,f.category,f.description,f.amount_cents,f.competence_on,f.occurred_on,f.payment_method,f.company_account_id,c.short_label company_account_label,f.patient_id,p.name patient_name,f.sale_id,f.reversal_of_id,f.reversal_reason,f.notes,f.created_at,u.name created_by_name,EXISTS(SELECT 1 FROM financial_entries r WHERE r.reversal_of_id=f.id) reversed FROM financial_entries f JOIN company_accounts c ON c.id=f.company_account_id JOIN users u ON u.id=f.created_by LEFT JOIN patients p ON p.id=f.patient_id ${where.sql} ORDER BY f.occurred_on DESC,f.created_at DESC LIMIT $${where.values.length - 1} OFFSET $${where.values.length}`, where.values);
    const rows = result.rows.slice(0, page.limit);
    return {
      entries: rows.map(row => ({ ...row, amount_cents: Number(row.amount_cents) })),
      pagination: { ...page, count: rows.length, hasMore: result.rows.length > page.limit },
    };
  });

  app.get<{ Querystring: FinanceFilters }>("/api/finance/entries.csv", { preHandler: operatorOrAdmin }, async (request, reply) => {
    const where = financeWhere(request.query, "f.occurred_on");
    const result = await pool.query(
      `SELECT f.occurred_on,f.entry_type,f.category,f.description,f.amount_cents,c.short_label company_account_label,f.payment_method,p.name patient_name
       FROM financial_entries f
       JOIN company_accounts c ON c.id=f.company_account_id
       LEFT JOIN patients p ON p.id=f.patient_id
       ${where.sql}
       ORDER BY f.occurred_on DESC,f.created_at DESC
       LIMIT 5000`,
      where.values,
    );
    const cell = (value: unknown) => `"${sanitizeCsvCell(String(value ?? "")).replaceAll('"', '""')}"`;
    const lines = [
      ["data", "tipo", "categoria", "descricao", "valor_centavos", "conta", "pagamento", "paciente"].map(cell).join(","),
      ...result.rows.map((row) => [
        row.occurred_on,
        row.entry_type,
        row.category,
        row.description,
        row.amount_cents,
        row.company_account_label,
        row.payment_method,
        row.patient_name,
      ].map(cell).join(",")),
    ];
    return reply
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", 'attachment; filename="fonolife-financeiro.csv"')
      .send(`\uFEFF${lines.join("\r\n")}\r\n`);
  });

  app.post<{ Body: { clientRequestId?: string; entryType?: string; category?: string; description?: string; amountCents?: number; competenceOn?: string; occurredOn?: string; paymentMethod?: string; companyAccountId?: string; patientId?: string; notes?: string } }>("/api/finance/entries", { preHandler: operatorOrAdmin }, async (request, reply) => {
    const body = request.body ?? {};
    if (!validFinancialEntry(body)) return reply.code(400).type("application/problem+json").send({ title: "Confira tipo, categoria, descriÃ§Ã£o, valor, datas, pagamento e caixa", status: 400 });
    const requestFingerprint = idempotencyFingerprint({
      entryType: body.entryType,
      category: body.category,
      description: body.description!.trim(),
      amountCents: body.amountCents,
      competenceOn: body.competenceOn,
      occurredOn: body.occurredOn,
      paymentMethod: body.paymentMethod,
      companyAccountId: body.companyAccountId,
      patientId: body.patientId || null,
      notes: body.notes?.trim() ?? "",
    });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const retry = await client.query("SELECT id,request_fingerprint FROM financial_entries WHERE client_request_id=$1", [body.clientRequestId]);
      if (retry.rowCount) { await client.query("COMMIT"); return idempotencyRetry(reply, retry.rows[0], requestFingerprint); }
      const account = await client.query("SELECT id FROM company_accounts WHERE id=$1 AND active", [body.companyAccountId]);
      if (!account.rowCount) { await client.query("ROLLBACK"); return reply.code(404).type("application/problem+json").send({ title: "Caixa ativo nÃ£o encontrado", status: 404 }); }
      const id = randomUUID();
      await client.query(`INSERT INTO financial_entries(id,client_request_id,request_fingerprint,entry_type,category,description,amount_cents,competence_on,occurred_on,payment_method,company_account_id,patient_id,notes,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [id,body.clientRequestId,requestFingerprint,body.entryType,body.category,body.description!.trim(),body.amountCents,body.competenceOn,body.occurredOn,body.paymentMethod,body.companyAccountId,body.patientId || null,body.notes?.trim() ?? "",request.currentUser!.id]);
      await client.query("INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'create','financial_entry',$2,$3)", [request.currentUser!.id,id,{ entryType: body.entryType, amountCents: body.amountCents }]);
      await client.query("COMMIT");
      return reply.code(201).send({ id });
    } catch (error: any) {
      await client.query("ROLLBACK");
      if (error?.code === "23505") { const retry = await pool.query("SELECT id,request_fingerprint FROM financial_entries WHERE client_request_id=$1", [body.clientRequestId]); if (retry.rowCount) return idempotencyRetry(reply, retry.rows[0], requestFingerprint); }
      throw error;
    } finally { client.release(); }
  });

  app.get<{ Querystring: { from?: string; to?: string; companyAccountId?: string; paymentMethod?: string; status?: string; limit?: string; offset?: string } }>("/api/finance/receivables", { preHandler: operatorOrAdmin }, async (request) => {
    const values: unknown[] = [], terms: string[] = [];
    for (const [value, sql] of [[request.query.from,"r.due_on >="],[request.query.to,"r.due_on <="],[request.query.companyAccountId,"s.company_account_id ="],[request.query.paymentMethod,"r.payment_method ="]] as const) if (value) { values.push(value); terms.push(`${sql} $${values.length}`); }
    if (request.query.status) { values.push(request.query.status); terms.push(`CASE WHEN s.cancelled_at IS NOT NULL THEN 'cancelled' WHEN receipt.id IS NOT NULL THEN 'received' ELSE 'expected' END = $${values.length}`); }
    const page = pagination(request.query.limit, request.query.offset);
    values.push(page.limit + 1, page.offset);
    const result = await pool.query(`SELECT r.id,r.amount_cents,r.due_on,r.payment_method,s.id sale_id,s.product,s.patient_id,COALESCE(p.name,'Atendimento avulso') patient_name,s.company_account_id,c.short_label company_account_label,receipt.id receipt_id,receipt.occurred_on received_on,CASE WHEN s.cancelled_at IS NOT NULL THEN 'cancelled' WHEN receipt.id IS NOT NULL THEN 'received' ELSE 'expected' END status FROM receivable_installments r JOIN sales s ON s.id=r.sale_id LEFT JOIN patients p ON p.id=s.patient_id JOIN company_accounts c ON c.id=s.company_account_id LEFT JOIN LATERAL (SELECT f.id,f.occurred_on FROM financial_entries f WHERE f.receivable_installment_id=r.id AND f.reversal_of_id IS NULL AND NOT EXISTS(SELECT 1 FROM financial_entries reversal WHERE reversal.reversal_of_id=f.id) ORDER BY f.created_at DESC LIMIT 1) receipt ON true ${terms.length ? `WHERE ${terms.join(" AND ")}` : ""} ORDER BY r.due_on,r.id LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    const rows = result.rows.slice(0, page.limit);
    return {
      receivables: rows.map(row => ({ ...row, amount_cents: Number(row.amount_cents) })),
      pagination: { ...page, count: rows.length, hasMore: result.rows.length > page.limit },
    };
  });

  app.post<{ Params: { id: string }; Body: { clientRequestId?: string; receivedOn?: string; companyAccountId?: string; paymentMethod?: string } }>("/api/finance/receivables/:id/settle", { preHandler: operatorOrAdmin }, async (request, reply) => {
    const { clientRequestId, receivedOn, companyAccountId, paymentMethod } = request.body ?? {};
    if (!/^[0-9a-f-]{36}$/i.test(clientRequestId ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(receivedOn ?? "")) return reply.code(400).type("application/problem+json").send({ title: "Informe a data do recebimento", status: 400 });
    const requestFingerprint = idempotencyFingerprint({
      receivableId: request.params.id,
      receivedOn,
      companyAccountId: companyAccountId || null,
      paymentMethod: paymentMethod || null,
    });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const retry = await client.query("SELECT id,request_fingerprint FROM financial_entries WHERE client_request_id=$1", [clientRequestId]);
      if (retry.rowCount) { await client.query("COMMIT"); return idempotencyRetry(reply, retry.rows[0], requestFingerprint); }
      const installment = await client.query(`SELECT r.*,s.product,s.sold_on,s.company_account_id,s.patient_id,s.cancelled_at FROM receivable_installments r JOIN sales s ON s.id=r.sale_id WHERE r.id=$1 FOR UPDATE OF r`, [request.params.id]);
      if (!installment.rowCount || installment.rows[0].cancelled_at) { await client.query("ROLLBACK"); return reply.code(409).type("application/problem+json").send({ title: "Parcela nÃ£o encontrada ou venda cancelada", status: 409 }); }
      const retryAfterLock = await client.query("SELECT id,request_fingerprint FROM financial_entries WHERE client_request_id=$1", [clientRequestId]);
      if (retryAfterLock.rowCount) { await client.query("COMMIT"); return idempotencyRetry(reply, retryAfterLock.rows[0], requestFingerprint); }
      const row = installment.rows[0], id = randomUUID();
      const targetAccountId = companyAccountId || row.company_account_id;
      const targetPaymentMethod = paymentMethod || row.payment_method;
      await client.query(`INSERT INTO financial_entries(id,client_request_id,request_fingerprint,entry_type,category,description,amount_cents,competence_on,occurred_on,payment_method,company_account_id,patient_id,sale_id,receivable_installment_id,created_by) VALUES($1,$2,$3,'income','hearing_aid_sale',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [id,clientRequestId,requestFingerprint,`Venda: ${row.product}`,row.amount_cents,row.sold_on,receivedOn,targetPaymentMethod,targetAccountId,row.patient_id,row.sale_id,row.id,request.currentUser!.id]);
      await client.query("INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'settle','receivable_installment',$2,$3)", [request.currentUser!.id,row.id,{ financialEntryId:id, receivedOn, companyAccountId: targetAccountId }]);
      await client.query("COMMIT");
      return reply.code(201).send({ id });
    } catch (error: any) { await client.query("ROLLBACK"); const retry = await pool.query("SELECT id,request_fingerprint FROM financial_entries WHERE client_request_id=$1", [clientRequestId]); if (retry.rowCount) return idempotencyRetry(reply, retry.rows[0], requestFingerprint); throw error; } finally { client.release(); }
  });

  app.get<{ Querystring: { from?: string; to?: string; companyAccountId?: string; status?: string; limit?: string; offset?: string } }>("/api/finance/payables", { preHandler: operatorOrAdmin }, async (request) => {
    const values: unknown[] = [];
    const terms: string[] = [];
    if (request.query.from) { values.push(request.query.from); terms.push(`p.due_on >= $${values.length}`); }
    if (request.query.to) { values.push(request.query.to); terms.push(`p.due_on <= $${values.length}`); }
    if (request.query.companyAccountId) { values.push(request.query.companyAccountId); terms.push(`p.company_account_id = $${values.length}`); }
    if (request.query.status) {
      values.push(request.query.status);
      terms.push(`CASE
        WHEN p.cancelled_at IS NOT NULL THEN 'cancelled'
        WHEN COALESCE(active_settlements.settled_amount_cents,0) >= p.amount_cents THEN 'settled'
        WHEN COALESCE(active_settlements.settled_amount_cents,0) > 0 THEN 'partially_settled'
        ELSE 'open'
      END = $${values.length}`);
    }
    const page = pagination(request.query.limit, request.query.offset);
    values.push(page.limit + 1, page.offset);
    const result = await pool.query(
      `SELECT p.*, c.short_label company_account_label, v.name vendor_account_name,
              COALESCE(active_settlements.settled_amount_cents,0) settled_amount_cents,
              CASE
                WHEN p.cancelled_at IS NOT NULL THEN 'cancelled'
                WHEN COALESCE(active_settlements.settled_amount_cents,0) >= p.amount_cents THEN 'settled'
                WHEN COALESCE(active_settlements.settled_amount_cents,0) > 0 THEN 'partially_settled'
                ELSE 'open'
              END status
       FROM accounts_payable p
       JOIN company_accounts c ON c.id = p.company_account_id
       LEFT JOIN crm_accounts v ON v.id = p.vendor_account_id
       LEFT JOIN LATERAL (
         SELECT COALESCE(sum(f.amount_cents),0) settled_amount_cents
         FROM financial_entries f
         WHERE f.payable_id = p.id
           AND f.entry_type = 'expense'
           AND f.reversal_of_id IS NULL
           AND NOT EXISTS(SELECT 1 FROM financial_entries reversal WHERE reversal.reversal_of_id = f.id)
       ) active_settlements ON true
       ${terms.length ? `WHERE ${terms.join(" AND ")}` : ""}
       ORDER BY p.due_on, p.created_at
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    const rows = result.rows.slice(0, page.limit).map((row) => ({
      ...row,
      amount_cents: Number(row.amount_cents),
      settled_amount_cents: Number(row.settled_amount_cents),
    }));
    return { payables: rows, pagination: { ...page, count: rows.length, hasMore: result.rows.length > page.limit } };
  });

  app.get("/api/finance/payables.csv", { preHandler: operatorOrAdmin }, async (_request, reply) => {
    const result = await pool.query(
      `SELECT p.due_on, p.vendor_name, p.description, p.category, p.amount_cents, c.short_label company_account_label,
              CASE
                WHEN p.cancelled_at IS NOT NULL THEN 'cancelled'
                WHEN COALESCE(active_settlements.settled_amount_cents,0) >= p.amount_cents THEN 'settled'
                WHEN COALESCE(active_settlements.settled_amount_cents,0) > 0 THEN 'partially_settled'
                ELSE 'open'
              END status
       FROM accounts_payable p
       JOIN company_accounts c ON c.id = p.company_account_id
       LEFT JOIN LATERAL (
         SELECT COALESCE(sum(f.amount_cents),0) settled_amount_cents
         FROM financial_entries f
         WHERE f.payable_id = p.id
           AND f.entry_type = 'expense'
           AND f.reversal_of_id IS NULL
           AND NOT EXISTS(SELECT 1 FROM financial_entries reversal WHERE reversal.reversal_of_id = f.id)
       ) active_settlements ON true
       ORDER BY p.due_on, p.created_at`,
    );
    const cell = (value: unknown) => `"${sanitizeCsvCell(String(value ?? "")).replaceAll('"', '""')}"`;
    const lines = [
      ["vencimento", "fornecedor", "descricao", "categoria", "valor_centavos", "caixa", "status"].map(cell).join(","),
      ...result.rows.map((row) => [row.due_on, row.vendor_name, row.description, row.category, row.amount_cents, row.company_account_label, row.status].map(cell).join(",")),
    ];
    return reply.header("Content-Type", "text/csv; charset=utf-8").send(`\uFEFF${lines.join("\r\n")}\r\n`);
  });

  app.post<{ Body: { clientRequestId?: string; vendorAccountId?: string | null; vendorName?: string; companyAccountId?: string; description?: string; category?: string; amountCents?: number; competenceOn?: string; dueOn?: string; paymentMethod?: string; notes?: string } }>("/api/finance/payables", { preHandler: operatorOrAdmin }, async (request, reply) => {
    const body = request.body ?? {};
    if (!validPayableDraft(body)) {
      return reply.code(400).type("application/problem+json").send({ title: "Confira fornecedor, datas, caixa, valor e categoria da conta a pagar", status: 400 });
    }
    const requestFingerprint = idempotencyFingerprint({
      vendorAccountId: body.vendorAccountId || null,
      vendorName: body.vendorName!.trim(),
      companyAccountId: body.companyAccountId,
      description: body.description!.trim(),
      category: body.category,
      amountCents: body.amountCents,
      competenceOn: body.competenceOn,
      dueOn: body.dueOn,
      paymentMethod: body.paymentMethod,
      notes: body.notes?.trim() ?? "",
    });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const retry = await client.query("SELECT id,request_fingerprint FROM accounts_payable WHERE client_request_id=$1", [body.clientRequestId]);
      if (retry.rowCount) { await client.query("COMMIT"); return idempotencyRetry(reply, retry.rows[0], requestFingerprint); }
      const account = await client.query("SELECT id FROM company_accounts WHERE id=$1 AND active", [body.companyAccountId]);
      if (!account.rowCount) { await client.query("ROLLBACK"); return reply.code(404).type("application/problem+json").send({ title: "Caixa ativo nÃ£o encontrado", status: 404 }); }
      const id = randomUUID();
      await client.query(
        `INSERT INTO accounts_payable(id,client_request_id,request_fingerprint,vendor_account_id,vendor_name,company_account_id,description,category,amount_cents,competence_on,due_on,payment_method,notes,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [id, body.clientRequestId, requestFingerprint, body.vendorAccountId || null, body.vendorName!.trim(), body.companyAccountId, body.description!.trim(), body.category, body.amountCents, body.competenceOn, body.dueOn, body.paymentMethod, body.notes?.trim() ?? "", request.currentUser!.id],
      );
      await client.query("INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'create','account_payable',$2,$3)", [request.currentUser!.id, id, { amountCents: body.amountCents }]);
      await client.query("COMMIT");
      return reply.code(201).send({ id });
    } catch (error: any) {
      await client.query("ROLLBACK");
      if (error?.code === "23505") {
        const retry = await pool.query("SELECT id,request_fingerprint FROM accounts_payable WHERE client_request_id=$1", [body.clientRequestId]);
        if (retry.rowCount) return idempotencyRetry(reply, retry.rows[0], requestFingerprint);
      }
      throw error;
    } finally {
      client.release();
    }
  });

  app.post<{ Params: { id: string }; Body: { clientRequestId?: string; amountCents?: number; occurredOn?: string; companyAccountId?: string; paymentMethod?: string } }>("/api/finance/payables/:id/settle", { preHandler: operatorOrAdmin }, async (request, reply) => {
    const { clientRequestId, amountCents, occurredOn, companyAccountId, paymentMethod } = request.body ?? {};
    if (!/^[0-9a-f-]{36}$/i.test(clientRequestId ?? "") || !Number.isSafeInteger(amountCents) || Number(amountCents) <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(occurredOn ?? "")) {
      return reply.code(400).type("application/problem+json").send({ title: "Informe chave, valor e data vÃ¡lidos para a baixa", status: 400 });
    }
    const requestFingerprint = idempotencyFingerprint({
      payableId: request.params.id,
      amountCents,
      occurredOn,
      companyAccountId: companyAccountId || null,
      paymentMethod: paymentMethod || null,
    });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const retry = await client.query("SELECT id,request_fingerprint FROM financial_entries WHERE client_request_id=$1", [clientRequestId]);
      if (retry.rowCount) { await client.query("COMMIT"); return idempotencyRetry(reply, retry.rows[0], requestFingerprint); }
      const payable = await client.query(
        "SELECT * FROM accounts_payable WHERE id=$1 FOR UPDATE",
        [request.params.id],
      );
      if (!payable.rowCount || payable.rows[0].cancelled_at) {
        await client.query("ROLLBACK");
        return reply.code(404).type("application/problem+json").send({ title: "Conta a pagar nÃ£o encontrada ou cancelada", status: 404 });
      }
      const row = payable.rows[0];
      const settlements = await client.query<{ settled_amount_cents: string }>(
        `SELECT COALESCE(sum(f.amount_cents),0) settled_amount_cents
         FROM financial_entries f
         WHERE f.payable_id = $1
           AND f.entry_type='expense'
           AND f.reversal_of_id IS NULL
           AND NOT EXISTS(SELECT 1 FROM financial_entries reversal WHERE reversal.reversal_of_id=f.id)`,
        [request.params.id],
      );
      const settledAmountCents = Number(settlements.rows[0]?.settled_amount_cents ?? 0);
      const remaining = Number(row.amount_cents) - settledAmountCents;
      if (Number(amountCents) > remaining) {
        await client.query("ROLLBACK");
        return reply.code(409).type("application/problem+json").send({ title: "Valor da baixa excede o saldo pendente", status: 409 });
      }
      const targetAccountId = companyAccountId || row.company_account_id;
      const targetPaymentMethod = paymentMethod || row.payment_method;
      const id = randomUUID();
      await client.query(
        `INSERT INTO financial_entries(id,client_request_id,request_fingerprint,entry_type,category,description,amount_cents,competence_on,occurred_on,payment_method,company_account_id,payable_id,notes,created_by)
         VALUES($1,$2,$3,'expense',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [id, clientRequestId, requestFingerprint, row.category, `Baixa de conta a pagar: ${row.description}`, amountCents, row.competence_on, occurredOn, targetPaymentMethod, targetAccountId, request.params.id, row.notes, request.currentUser!.id],
      );
      await client.query("INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'settle','account_payable',$2,$3)", [request.currentUser!.id, request.params.id, { financialEntryId: id, amountCents }]);
      await client.query("COMMIT");
      return reply.code(201).send({ id });
    } catch (error: any) {
      await client.query("ROLLBACK");
      const retry = await pool.query("SELECT id,request_fingerprint FROM financial_entries WHERE client_request_id=$1", [clientRequestId]);
      if (retry.rowCount) return idempotencyRetry(reply, retry.rows[0], requestFingerprint);
      throw error;
    } finally {
      client.release();
    }
  });

  app.post<{ Params: { id: string }; Body: { clientRequestId?: string; reason?: string; reversalReason?: string; occurredOn?: string } }>("/api/finance/payables/:id/reverse", { preHandler: admin }, async (request, reply) => {
    const { clientRequestId, reason, reversalReason, occurredOn } = request.body ?? {};
    const finalReason = (reason || reversalReason)?.trim();
    const finalClientRequestId = clientRequestId || randomUUID();
    const finalOccurredOn = occurredOn || new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
    if (!finalReason || finalReason.length < 3 || !/^[0-9a-f-]{36}$/i.test(finalClientRequestId) || !/^\d{4}-\d{2}-\d{2}$/.test(finalOccurredOn)) {
      return reply.code(400).type("application/problem+json").send({ title: "Confira justificativa, chave e data do estorno da conta a pagar", status: 400 });
    }
    const requestFingerprint = idempotencyFingerprint({ payableId: request.params.id, reason: finalReason, occurredOn: finalOccurredOn });
    const retry = await pool.query("SELECT id,request_fingerprint FROM financial_entries WHERE client_request_id=$1", [finalClientRequestId]);
    if (retry.rowCount) return idempotencyRetry(reply, retry.rows[0], requestFingerprint);
    const result = await pool.query(
      `WITH source AS (
         SELECT *
         FROM financial_entries original
         WHERE original.payable_id=$1
           AND original.entry_type='expense'
           AND original.reversal_of_id IS NULL
           AND NOT EXISTS(SELECT 1 FROM financial_entries reversal WHERE reversal.reversal_of_id=original.id)
         ORDER BY original.created_at DESC
         LIMIT 1
       ),
       reversed AS (
         INSERT INTO financial_entries(id,client_request_id,request_fingerprint,entry_type,category,description,amount_cents,competence_on,occurred_on,payment_method,company_account_id,payable_id,reversal_of_id,reversal_reason,notes,created_by)
         SELECT gen_random_uuid(),$2,$3,'income',category,'Estorno: '||description,amount_cents,competence_on,$4,payment_method,company_account_id,payable_id,id,$5,notes,$6
         FROM source
         RETURNING id
       )
       SELECT id FROM reversed`,
      [request.params.id, finalClientRequestId, requestFingerprint, finalOccurredOn, finalReason, request.currentUser!.id],
    );
    if (!result.rowCount) return reply.code(409).type("application/problem+json").send({ title: "Conta a pagar sem baixa ativa para estornar", status: 409 });
    await pool.query("INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'reverse','account_payable',$2,$3)", [request.currentUser!.id, request.params.id, { reason: finalReason }]);
    return reply.code(201).send({ id: result.rows[0].id });
  });

  app.get<{ Querystring: { doctorId?: string; patientId?: string; from?: string; to?: string } }>("/api/finance/appointment-costing", { preHandler: operatorOrAdmin }, async (request) => {
    const values: unknown[] = [];
    const terms: string[] = [];
    if (request.query.doctorId) { values.push(request.query.doctorId); terms.push(`c.doctor_id = $${values.length}`); }
    if (request.query.patientId) { values.push(request.query.patientId); terms.push(`c.patient_id = $${values.length}`); }
    if (request.query.from) { values.push(request.query.from); terms.push(`a.scheduled_start >= $${values.length}::timestamptz`); }
    if (request.query.to) { values.push(request.query.to); terms.push(`a.scheduled_end <= $${values.length}::timestamptz`); }
    const result = await pool.query(
      `SELECT c.*, a.scheduled_start, a.scheduled_end, a.appointment_type, patient.name patient_name, doctor.name doctor_name
       FROM appointment_costings c
       JOIN appointments a ON a.id = c.appointment_id
       LEFT JOIN patients patient ON patient.id = c.patient_id
       JOIN users doctor ON doctor.id = c.doctor_id
       ${terms.length ? `WHERE ${terms.join(" AND ")}` : ""}
       ORDER BY a.scheduled_start DESC, c.created_at DESC`,
      values,
    );
    return {
      costings: result.rows.map((row) => ({
        ...row,
        service_revenue_cents: Number(row.service_revenue_cents),
        product_revenue_cents: Number(row.product_revenue_cents),
        total_revenue_cents: Number(row.total_revenue_cents),
        honorarium_cents: Number(row.honorarium_cents),
        supply_cost_cents: Number(row.supply_cost_cents),
        other_cost_cents: Number(row.other_cost_cents),
        total_cost_cents: Number(row.total_cost_cents),
        margin_cents: Number(row.margin_cents),
      })),
    };
  });

  const handleReverseEntry = async (request: FastifyRequest<{ Params: { id: string }; Body: { clientRequestId?: string; reason?: string; reversalReason?: string; occurredOn?: string } }>, reply: any) => {
    const { clientRequestId, reason, reversalReason, occurredOn } = request.body ?? {};
    const finalReason = (reason || reversalReason)?.trim();
    const finalClientRequestId = clientRequestId || randomUUID();
    const finalOccurredOn = occurredOn || new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

    if (!finalReason || finalReason.length < 3) return reply.code(400).type("application/problem+json").send({ title: "Informe a justificativa do estorno (mÃ­nimo 3 caracteres)", status: 400 });
    if (!/^[0-9a-f-]{36}$/i.test(finalClientRequestId) || !/^\d{4}-\d{2}-\d{2}$/.test(finalOccurredOn)) return reply.code(400).type("application/problem+json").send({ title: "Confira a chave e a data do estorno", status: 400 });
    const requestFingerprint = idempotencyFingerprint({
      financialEntryId: request.params.id,
      occurredOn: finalOccurredOn,
      reason: finalReason,
    });
    const retry = await pool.query("SELECT id,request_fingerprint FROM financial_entries WHERE client_request_id=$1", [finalClientRequestId]);
    if (retry.rowCount) return idempotencyRetry(reply, retry.rows[0], requestFingerprint);
    try {
      const result = await pool.query(
        `WITH reversed AS (
           INSERT INTO financial_entries(id,client_request_id,request_fingerprint,entry_type,category,description,amount_cents,competence_on,occurred_on,payment_method,company_account_id,patient_id,sale_id,reversal_of_id,reversal_reason,notes,created_by)
           SELECT $1,$2,$3,CASE entry_type WHEN 'income' THEN 'expense' ELSE 'income' END,category,'Estorno: '||description,amount_cents,competence_on,$4,payment_method,company_account_id,patient_id,sale_id,id,$5,notes,$6
           FROM financial_entries original WHERE id=$7 AND reversal_of_id IS NULL AND NOT EXISTS(SELECT 1 FROM financial_entries r WHERE r.reversal_of_id=original.id)
           RETURNING id
         ),
         audited AS (
           INSERT INTO audit_events(user_id,action,entity_type,entity_id,details)
           SELECT $6,'reverse','financial_entry',id,jsonb_build_object('reversalOfId',$7::text,'reason',$5::text) FROM reversed
         )
         SELECT id FROM reversed`,
        [randomUUID(), finalClientRequestId, requestFingerprint, finalOccurredOn, finalReason, request.currentUser!.id, request.params.id]
      );
      if (!result.rowCount) return reply.code(409).type("application/problem+json").send({ title: "LanÃ§amento nÃ£o encontrado ou jÃ¡ estornado", status: 409 });
      return reply.code(201).send({ id: result.rows[0].id });
    } catch (error: any) {
      if (error?.code === "23505") {
        const concurrentRetry = await pool.query("SELECT id,request_fingerprint FROM financial_entries WHERE client_request_id=$1", [finalClientRequestId]);
        if (concurrentRetry.rowCount) return idempotencyRetry(reply, concurrentRetry.rows[0], requestFingerprint);
      }
      throw error;
    }
  };

  app.post("/api/finance/entries/:id/reverse", { preHandler: admin }, handleReverseEntry as any);
  app.post("/api/admin/finance/entries/:id/reverse", { preHandler: admin }, handleReverseEntry as any);

  app.get<{ Querystring: FinanceFilters }>("/api/finance/summary", { preHandler: admin }, async (request) => {
    const where = financeWhere(request.query, "f.occurred_on");
    const result = await pool.query(`SELECT c.id company_account_id,c.short_label company_account_label,COALESCE(sum(CASE WHEN f.entry_type='income' THEN f.amount_cents ELSE -f.amount_cents END),0) balance_cents,COALESCE(sum(f.amount_cents) FILTER(WHERE f.entry_type='income'),0) income_cents,COALESCE(sum(f.amount_cents) FILTER(WHERE f.entry_type='expense'),0) expense_cents FROM financial_entries f JOIN company_accounts c ON c.id=f.company_account_id ${where.sql} GROUP BY c.id,c.short_label ORDER BY c.short_label`, where.values);
    const saleValues: unknown[] = [], saleTerms = ["cancelled_at IS NULL"];
    for (const [value, sql] of [
      [request.query.from, "sold_on >="],
      [request.query.to, "sold_on <="],
      [request.query.companyAccountId, "company_account_id ="],
    ] as const) if (value) {
      saleValues.push(value);
      saleTerms.push(`${sql} $${saleValues.length}`);
    }
    const costs = await pool.query(
      `SELECT company_account_id,COALESCE(sum(total_amount_cents),0) sales_revenue_cents,COALESCE(sum(cost_amount_cents),0) cmv_cents
       FROM sales WHERE ${saleTerms.join(" AND ")}
       GROUP BY company_account_id`,
      saleValues,
    );
    const costsByAccount = new Map(costs.rows.map((row) => [
      row.company_account_id,
      { revenue: Number(row.sales_revenue_cents), cost: Number(row.cmv_cents) },
    ]));
    const byAccount = result.rows.map(row => {
      const incomeCents = Number(row.income_cents);
      const sale = costsByAccount.get(row.company_account_id) ?? { revenue: 0, cost: 0 };
      return {
        ...row,
        balance_cents: Number(row.balance_cents),
        income_cents: incomeCents,
        expense_cents: Number(row.expense_cents),
        sales_revenue_cents: sale.revenue,
        cmv_cents: sale.cost,
        margin_cents: sale.revenue - sale.cost,
      };
    });
    return {
      consolidated: byAccount.reduce(
        (total,row) => ({
          balance_cents: total.balance_cents + row.balance_cents,
          income_cents: total.income_cents + row.income_cents,
          expense_cents: total.expense_cents + row.expense_cents,
          sales_revenue_cents: total.sales_revenue_cents + row.sales_revenue_cents,
          cmv_cents: total.cmv_cents + row.cmv_cents,
          margin_cents: total.margin_cents + row.margin_cents,
        }),
        { balance_cents:0,income_cents:0,expense_cents:0,sales_revenue_cents:0,cmv_cents:0,margin_cents:0 },
      ),
      byAccount,
    };
  });

  app.get("/api/dashboard", { preHandler: authenticated }, async (request) => {
    const today = "(now() AT TIME ZONE 'America/Sao_Paulo')::date";
    const doctorId = request.currentUser!.role === "doctor" ? request.currentUser!.id : null;
    const doctorParams = doctorId ? [doctorId] : [];
    const doctorScope = (alias: string) => doctorId
      ? `AND (${alias}.responsible_doctor_id=$1 OR ${alias}.assigned_user_id=$1)`
      : "";
    const [counts, queue] = await Promise.all([
      pool.query(`SELECT
        count(*) FILTER (WHERE t.due_on < ${today})::int overdue,
        count(*) FILTER (WHERE t.due_on = ${today})::int today,
        count(*)::int open_tasks,
        (SELECT count(*)::int FROM patients p2 WHERE p2.archived_at IS NULL AND p2.journey_status='adaptation' ${doctorScope("p2")}) adaptation,
        (SELECT count(*)::int FROM sales s JOIN patients p3 ON p3.id=s.patient_id WHERE s.cancelled_at IS NULL AND date_trunc('month',s.sold_on)=date_trunc('month',${today}) ${doctorScope("p3")}) month_sales
        FROM follow_up_tasks t JOIN patients p ON p.id=t.patient_id
        WHERE t.completed_at IS NULL AND t.cancelled_at IS NULL ${doctorScope("p")}`, doctorParams),
      pool.query(`SELECT t.id task_id,t.patient_id,p.name patient_name,p.phone,t.title,t.due_on,
        CASE WHEN t.due_on < ${today} THEN 'overdue' WHEN t.due_on = ${today} THEN 'today' ELSE 'upcoming' END timing
        FROM follow_up_tasks t JOIN patients p ON p.id=t.patient_id
        WHERE t.completed_at IS NULL AND t.cancelled_at IS NULL AND p.archived_at IS NULL
        ${doctorScope("p")}
        ORDER BY CASE WHEN t.due_on < ${today} THEN 0 WHEN t.due_on = ${today} THEN 1 ELSE 2 END,t.due_on,p.name LIMIT 12`, doctorParams),
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

