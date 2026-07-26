import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { pool } from "../../db/pool.js";
import { idempotencyFingerprint } from "../../domain/idempotency.js";
import { validInventoryMovement, validProduct } from "../../domain/inventory.js";
import { validService } from "../../domain/services.js";
import { audit } from "../audit/service.js";
import { admin, authenticated } from "../patients/authorization.js";

export async function catalogRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { lowStock?: string; search?: string } }>(
    "/api/products",
    { preHandler: authenticated },
    async (request) => {
      const { lowStock, search } = request.query;
      const terms: string[] = [];
      const values: unknown[] = [];

      if (search?.trim()) {
        values.push(`%${search.trim()}%`);
        terms.push(`(p.name ILIKE $${values.length} OR p.brand ILIKE $${values.length} OR p.model ILIKE $${values.length} OR p.sku ILIKE $${values.length})`);
      }

      const havingClause = lowStock === "true" ? "HAVING COALESCE(SUM(m.quantity), 0) <= p.min_stock" : "";

      const query = `
        SELECT p.id, p.name, p.brand, p.model, p.sku, p.price_cents, p.cost_cents, p.min_stock, p.active, p.version, p.created_at, p.updated_at,
               COALESCE(SUM(m.quantity), 0)::integer AS stock_balance
        FROM products p
        LEFT JOIN inventory_movements m ON m.product_id = p.id
        ${terms.length ? "WHERE " + terms.join(" AND ") : ""}
        GROUP BY p.id
        ${havingClause}
        ORDER BY p.name
      `;

      const products = await pool.query(query, values);
      return { products: products.rows };
    }
  );

  app.post<{
    Body: { name?: string; brand?: string; model?: string; sku?: string; priceCents?: number; costCents?: number; minStock?: number };
  }>("/api/admin/products", { preHandler: admin }, async (request, reply) => {
    const { name, brand, model, sku, priceCents, costCents, minStock } = request.body ?? {};
    if (!validProduct({ name, brand, model, priceCents, costCents, sku, minStock }))
      return reply
        .code(400)
        .type("application/problem+json")
        .send({
          title: "Confira o nome, marca, modelo, preço, SKU, estoque mínimo e CMV em centavos",
          status: 400,
        });

    const id = randomUUID();
    await pool.query(
      "INSERT INTO products(id,name,brand,model,sku,price_cents,cost_cents,min_stock) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
      [id, name!.trim(), brand!.trim(), model!.trim(), sku?.trim() || null, priceCents, costCents ?? 0, minStock ?? 0]
    );
    await audit(request.currentUser!.id, "create", "product", id);
    return reply.code(201).send({ id });
  });

  app.patch<{
    Params: { id: string };
    Body: { version?: number; name?: string; brand?: string; model?: string; sku?: string; priceCents?: number; costCents?: number; minStock?: number; active?: boolean };
  }>("/api/admin/products/:id", { preHandler: admin }, async (request, reply) => {
    const { version, name, brand, model, sku, priceCents, costCents, minStock, active } = request.body ?? {};

    if (version !== undefined && !Number.isInteger(version)) {
      return reply.code(400).type("application/problem+json").send({ title: "Versão deve ser um número inteiro", status: 400 });
    }

    const versionCheck = version !== undefined ? "AND version = $8" : "";
    const params = [
      name?.trim() || null,
      brand?.trim() || null,
      model?.trim() || null,
      sku?.trim() || null,
      priceCents ?? null,
      costCents ?? null,
      minStock ?? null,
      active ?? null,
      request.params.id,
    ];
    if (version !== undefined) params.push(version);

    const result = await pool.query(
      `UPDATE products SET
         name=COALESCE($1,name),
         brand=COALESCE($2,brand),
         model=COALESCE($3,model),
         sku=COALESCE($4,sku),
         price_cents=COALESCE($5,price_cents),
         cost_cents=COALESCE($6,cost_cents),
         min_stock=COALESCE($7,min_stock),
         active=COALESCE($8,active),
         version=version+1,
         updated_at=now()
       WHERE id=$9 ${versionCheck} RETURNING id, version`,
      [name?.trim() || null, brand?.trim() || null, model?.trim() || null, sku?.trim() || null, priceCents ?? null, costCents ?? null, minStock ?? null, active ?? null, request.params.id, ...(version !== undefined ? [version] : [])]
    );

    if (!result.rowCount) {
      const exists = await pool.query("SELECT 1 FROM products WHERE id=$1", [request.params.id]);
      return reply
        .code(exists.rowCount ? 409 : 404)
        .type("application/problem+json")
        .send({
          title: exists.rowCount
            ? "Produto alterado por outro usuário. Recarregue os dados."
            : "Produto não encontrado",
          status: exists.rowCount ? 409 : 404,
        });
    }

    await audit(request.currentUser!.id, "update", "product", request.params.id);
    return reply.code(200).send({ version: result.rows[0].version });
  });

  app.get("/api/inventory/movements", { preHandler: authenticated }, async () => ({
    movements: (
      await pool.query(
        `SELECT m.id,m.product_id,p.name product_name,p.sku product_sku,m.movement_type,m.quantity,m.notes,m.client_request_id,m.created_at,u.name created_by_name
         FROM inventory_movements m
         JOIN products p ON p.id=m.product_id
         JOIN users u ON u.id=m.created_by
         ORDER BY m.created_at DESC LIMIT 200`
      )
    ).rows,
  }));

  const handleInventoryMovement = async (request: FastifyRequest, reply: any) => {
    const { productId, movementType, quantity, notes, clientRequestId } = (request.body as { productId?: string; movementType?: string; quantity?: number; notes?: string; clientRequestId?: string }) ?? {};
    if (!validInventoryMovement({ productId, movementType, quantity, notes }))
      return reply
        .code(400)
        .type("application/problem+json")
        .send({
          title: "Confira o produto, tipo de movimentação, quantidade e justificativa",
          status: 400,
        });

    const requestFingerprint = idempotencyFingerprint({
      productId,
      movementType,
      quantity,
      notes: notes?.trim() || "",
    });
    const handleRetry = (row: { id: string; request_fingerprint: string | null }) =>
      row.request_fingerprint === requestFingerprint
        ? reply.code(200).send({ id: row.id, idempotent: true })
        : reply.code(409).type("application/problem+json").send({
            title: "Chave de idempotência reutilizada com payload diferente",
            status: 409,
          });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Idempotência
      if (clientRequestId) {
        const retry = await client.query("SELECT id,request_fingerprint FROM inventory_movements WHERE client_request_id=$1", [clientRequestId]);
        if (retry.rowCount) {
          await client.query("COMMIT");
          return handleRetry(retry.rows[0]);
        }
      }

      // Lock determinístico do produto para prevenir concorrência
      const prod = await client.query("SELECT id FROM products WHERE id=$1 FOR UPDATE", [productId]);
      if (!prod.rowCount) {
        await client.query("ROLLBACK");
        return reply
          .code(404)
          .type("application/problem+json")
          .send({ title: "Produto não encontrado", status: 404 });
      }

      if (quantity! < 0) {
        const balance = await client.query<{ stock: string }>(
          "SELECT COALESCE(SUM(quantity),0) stock FROM inventory_movements WHERE product_id=$1",
          [productId]
        );
        const currentStock = Number(balance.rows[0].stock);
        if (currentStock + quantity! < 0) {
          await client.query("ROLLBACK");
          return reply
            .code(409)
            .type("application/problem+json")
            .send({
              title: `Saldo em estoque insuficiente (Atual: ${currentStock}, Tentativa de baixa: ${Math.abs(quantity!)})`,
              status: 409,
            });
        }
      }

      const id = randomUUID();
      await client.query(
        "INSERT INTO inventory_movements(id,product_id,movement_type,quantity,notes,client_request_id,request_fingerprint,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [id, productId, movementType, quantity, notes?.trim() || "", clientRequestId || null, clientRequestId ? requestFingerprint : null, request.currentUser!.id]
      );
      await client.query(
        "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)",
        [request.currentUser!.id, "create", "inventory_movement", id, { productId, movementType, quantity, notes }]
      );
      await client.query("COMMIT");
      return reply.code(201).send({ id });
    } catch (err: any) {
      await client.query("ROLLBACK");
      if (err?.code === "23505" && clientRequestId) {
        const retry = await pool.query("SELECT id,request_fingerprint FROM inventory_movements WHERE client_request_id=$1", [clientRequestId]);
        if (retry.rowCount) return handleRetry(retry.rows[0]);
      }
      throw err;
    } finally {
      client.release();
    }
  };

  app.post("/api/inventory/movements", { preHandler: authenticated }, handleInventoryMovement);
  app.post("/api/admin/inventory/movements", { preHandler: admin }, handleInventoryMovement);

  app.get("/api/services", { preHandler: authenticated }, async () => {
    const services = await pool.query(
      `SELECT s.id, s.name, s.description, s.price_cents, s.cmv_cents, s.execution_time_minutes, s.active, s.version, s.created_at, s.updated_at,
              COALESCE(SUM(sp.quantity * p.cost_cents), s.cmv_cents)::bigint AS derived_cmv_cents,
              COALESCE(
                json_agg(
                  json_build_object(
                    'productId', sp.product_id,
                    'quantity', sp.quantity,
                    'productName', p.name,
                    'unitPriceCents', p.price_cents,
                    'unitCostCents', p.cost_cents
                  )
                ) FILTER (WHERE sp.product_id IS NOT NULL), '[]'
              ) AS products
       FROM services s
       LEFT JOIN service_products sp ON sp.service_id = s.id
       LEFT JOIN products p ON p.id = sp.product_id
       GROUP BY s.id
       ORDER BY s.name`
    );
    return { services: services.rows.map(s => ({ ...s, cmv_cents: Number(s.derived_cmv_cents ?? s.cmv_cents) })) };
  });

  app.post<{
    Body: {
      name?: string;
      description?: string;
      priceCents?: number;
      cmvCents?: number;
      executionTimeMinutes?: number;
      products?: { productId: string; quantity: number }[];
    };
  }>("/api/services", { preHandler: authenticated }, async (request, reply) => {
    const { name, description, priceCents, cmvCents, executionTimeMinutes, products } = request.body ?? {};
    if (!validService({ name, priceCents, cmvCents, executionTimeMinutes })) {
      return reply
        .code(400)
        .type("application/problem+json")
        .send({ title: "Confira o nome, preço, CMV e tempo de execução do serviço", status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const serviceId = randomUUID();
      await client.query(
        `INSERT INTO services(id, name, description, price_cents, cmv_cents, execution_time_minutes)
         VALUES($1, $2, $3, $4, $5, $6)`,
        [serviceId, name!.trim(), description?.trim() || "", priceCents, cmvCents ?? 0, executionTimeMinutes ?? 0]
      );

      let computedCmv = cmvCents ?? 0;
      if (Array.isArray(products) && products.length > 0) {
        computedCmv = 0;
        for (const item of products) {
          if (item.productId && item.quantity > 0) {
            await client.query(
              `INSERT INTO service_products(service_id, product_id, quantity)
               VALUES($1, $2, $3)
               ON CONFLICT (service_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
              [serviceId, item.productId, item.quantity]
            );
            const prodCost = await client.query<{ cost_cents: string }>("SELECT cost_cents FROM products WHERE id=$1", [item.productId]);
            if (prodCost.rowCount) {
              computedCmv += Number(prodCost.rows[0].cost_cents) * item.quantity;
            }
          }
        }
        await client.query("UPDATE services SET cmv_cents=$1 WHERE id=$2", [computedCmv, serviceId]);
      }

      await audit(request.currentUser!.id, "create", "service", serviceId);
      await client.query("COMMIT");
      return reply.code(201).send({ id: serviceId, cmvCents: computedCmv });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  app.put<{
    Params: { id: string };
    Body: {
      version?: number;
      name?: string;
      description?: string;
      priceCents?: number;
      cmvCents?: number;
      executionTimeMinutes?: number;
      active?: boolean;
      products?: { productId: string; quantity: number }[];
    };
  }>("/api/services/:id", { preHandler: authenticated }, async (request, reply) => {
    const { version, name, description, priceCents, cmvCents, executionTimeMinutes, active, products } = request.body ?? {};
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const versionCheck = version !== undefined ? "AND version = $8" : "";
      const result = await client.query(
        `UPDATE services SET
           name = COALESCE($1, name),
           description = COALESCE($2, description),
           price_cents = COALESCE($3, price_cents),
           cmv_cents = COALESCE($4, cmv_cents),
           execution_time_minutes = COALESCE($5, execution_time_minutes),
           active = COALESCE($6, active),
           version = version + 1,
           updated_at = now()
         WHERE id = $7 ${versionCheck} RETURNING id, version`,
        [name?.trim() || null, description?.trim() || null, priceCents ?? null, cmvCents ?? null, executionTimeMinutes ?? null, active ?? null, request.params.id, ...(version !== undefined ? [version] : [])]
      );

      if (!result.rowCount) {
        await client.query("ROLLBACK");
        const exists = await pool.query("SELECT 1 FROM services WHERE id=$1", [request.params.id]);
        return reply.code(exists.rowCount ? 409 : 404).type("application/problem+json").send({
          title: exists.rowCount ? "Serviço alterado por outro usuário. Recarregue a página." : "Serviço não encontrado",
          status: exists.rowCount ? 409 : 404,
        });
      }

      if (Array.isArray(products)) {
        await client.query("DELETE FROM service_products WHERE service_id = $1", [request.params.id]);
        let computedCmv = 0;
        for (const item of products) {
          if (item.productId && item.quantity > 0) {
            await client.query(
              `INSERT INTO service_products(service_id, product_id, quantity)
               VALUES($1, $2, $3)`,
              [request.params.id, item.productId, item.quantity]
            );
            const prodCost = await client.query<{ cost_cents: string }>("SELECT cost_cents FROM products WHERE id=$1", [item.productId]);
            if (prodCost.rowCount) {
              computedCmv += Number(prodCost.rows[0].cost_cents) * item.quantity;
            }
          }
        }
        await client.query("UPDATE services SET cmv_cents=$1 WHERE id=$2", [computedCmv, request.params.id]);
      }

      await audit(request.currentUser!.id, "update", "service", request.params.id);
      await client.query("COMMIT");
      return reply.code(200).send({ version: result.rows[0].version });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });
}
