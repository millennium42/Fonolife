import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { pool } from "../../db/pool.js";
import { validInventoryMovement, validProduct } from "../../domain/inventory.js";
import { validService } from "../../domain/services.js";
import { audit } from "../audit/service.js";
import { admin, authenticated } from "../patients/authorization.js";

export async function catalogRoutes(app: FastifyInstance) {
  app.get("/api/products", { preHandler: authenticated }, async () => ({
    products: (
      await pool.query(
        `SELECT p.id,p.name,p.brand,p.model,p.price_cents,p.cost_cents,p.active,p.created_at,
                COALESCE(SUM(m.quantity), 0)::integer stock_balance
         FROM products p
         LEFT JOIN inventory_movements m ON m.product_id = p.id
         GROUP BY p.id ORDER BY p.name`
      )
    ).rows,
  }));

  app.post<{
    Body: { name?: string; brand?: string; model?: string; priceCents?: number; costCents?: number };
  }>("/api/admin/products", { preHandler: admin }, async (request, reply) => {
    const { name, brand, model, priceCents, costCents } = request.body ?? {};
    if (!validProduct({ name, brand, model, priceCents, costCents }))
      return reply
        .code(400)
        .type("application/problem+json")
        .send({
          title: "Confira o nome, marca, modelo, preço e CMV em centavos",
          status: 400,
        });

    const id = randomUUID();
    await pool.query(
      "INSERT INTO products(id,name,brand,model,price_cents,cost_cents) VALUES($1,$2,$3,$4,$5,$6)",
      [id, name!.trim(), brand!.trim(), model!.trim(), priceCents, costCents ?? 0]
    );
    await audit(request.currentUser!.id, "create", "product", id);
    return reply.code(201).send({ id });
  });

  app.patch<{
    Params: { id: string };
    Body: { name?: string; brand?: string; model?: string; priceCents?: number; costCents?: number; active?: boolean };
  }>("/api/admin/products/:id", { preHandler: admin }, async (request, reply) => {
    const { name, brand, model, priceCents, costCents, active } = request.body ?? {};
    const result = await pool.query(
      `UPDATE products SET
         name=COALESCE($1,name),
         brand=COALESCE($2,brand),
         model=COALESCE($3,model),
         price_cents=COALESCE($4,price_cents),
         cost_cents=COALESCE($5,cost_cents),
         active=COALESCE($6,active),
         updated_at=now()
       WHERE id=$7 RETURNING id`,
      [name?.trim() || null, brand?.trim() || null, model?.trim() || null, priceCents ?? null, costCents ?? null, active ?? null, request.params.id]
    );
    if (!result.rowCount)
      return reply
        .code(404)
        .type("application/problem+json")
        .send({ title: "Produto não encontrado", status: 404 });

    await audit(request.currentUser!.id, "update", "product", request.params.id);
    return reply.code(204).send();
  });

  app.get("/api/inventory/movements", { preHandler: authenticated }, async () => ({
    movements: (
      await pool.query(
        `SELECT m.id,m.product_id,p.name product_name,m.movement_type,m.quantity,m.notes,m.created_at,u.name created_by_name
         FROM inventory_movements m
         JOIN products p ON p.id=m.product_id
         JOIN users u ON u.id=m.created_by
         ORDER BY m.created_at DESC LIMIT 200`
      )
    ).rows,
  }));

  const handleInventoryMovement = async (request: FastifyRequest, reply: any) => {
    const { productId, movementType, quantity, notes } = (request.body as { productId?: string; movementType?: string; quantity?: number; notes?: string }) ?? {};
    if (!validInventoryMovement({ productId, movementType, quantity }))
      return reply
        .code(400)
        .type("application/problem+json")
        .send({
          title: "Confira o produto, tipo de movimentação e quantidade",
          status: 400,
        });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const prod = await client.query("SELECT 1 FROM products WHERE id=$1", [productId]);
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
        "INSERT INTO inventory_movements(id,product_id,movement_type,quantity,notes,created_by) VALUES($1,$2,$3,$4,$5,$6)",
        [id, productId, movementType, quantity, notes?.trim() || "", request.currentUser!.id]
      );
      await client.query(
        "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)",
        [request.currentUser!.id, "create", "inventory_movement", id, { productId, movementType, quantity }]
      );
      await client.query("COMMIT");
      return reply.code(201).send({ id });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  };

  app.post("/api/inventory/movements", { preHandler: authenticated }, handleInventoryMovement);
  app.post("/api/admin/inventory/movements", { preHandler: admin }, handleInventoryMovement);

  app.get("/api/services", { preHandler: authenticated }, async () => {
    const services = await pool.query(
      `SELECT s.id, s.name, s.description, s.price_cents, s.cmv_cents, s.execution_time_minutes, s.active, s.created_at, s.updated_at,
              COALESCE(
                json_agg(
                  json_build_object(
                    'productId', sp.product_id,
                    'quantity', sp.quantity,
                    'productName', p.name,
                    'unitPriceCents', p.price_cents
                  )
                ) FILTER (WHERE sp.product_id IS NOT NULL), '[]'
              ) AS products
       FROM services s
       LEFT JOIN service_products sp ON sp.service_id = s.id
       LEFT JOIN products p ON p.id = sp.product_id
       GROUP BY s.id
       ORDER BY s.name`
    );
    return { services: services.rows };
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

      if (Array.isArray(products) && products.length > 0) {
        for (const item of products) {
          if (item.productId && item.quantity > 0) {
            await client.query(
              `INSERT INTO service_products(service_id, product_id, quantity)
               VALUES($1, $2, $3)
               ON CONFLICT (service_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
              [serviceId, item.productId, item.quantity]
            );
          }
        }
      }

      await audit(request.currentUser!.id, "create", "service", serviceId);
      await client.query("COMMIT");
      return reply.code(201).send({ id: serviceId });
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
      name?: string;
      description?: string;
      priceCents?: number;
      cmvCents?: number;
      executionTimeMinutes?: number;
      active?: boolean;
      products?: { productId: string; quantity: number }[];
    };
  }>("/api/services/:id", { preHandler: authenticated }, async (request, reply) => {
    const { name, description, priceCents, cmvCents, executionTimeMinutes, active, products } = request.body ?? {};
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `UPDATE services SET
           name = COALESCE($1, name),
           description = COALESCE($2, description),
           price_cents = COALESCE($3, price_cents),
           cmv_cents = COALESCE($4, cmv_cents),
           execution_time_minutes = COALESCE($5, execution_time_minutes),
           active = COALESCE($6, active),
           updated_at = now()
         WHERE id = $7 RETURNING id`,
        [name?.trim() || null, description?.trim() || null, priceCents ?? null, cmvCents ?? null, executionTimeMinutes ?? null, active ?? null, request.params.id]
      );

      if (!result.rowCount) {
        await client.query("ROLLBACK");
        return reply.code(404).type("application/problem+json").send({ title: "Serviço não encontrado", status: 404 });
      }

      if (Array.isArray(products)) {
        await client.query("DELETE FROM service_products WHERE service_id = $1", [request.params.id]);
        for (const item of products) {
          if (item.productId && item.quantity > 0) {
            await client.query(
              `INSERT INTO service_products(service_id, product_id, quantity)
               VALUES($1, $2, $3)`,
              [request.params.id, item.productId, item.quantity]
            );
          }
        }
      }

      await audit(request.currentUser!.id, "update", "service", request.params.id);
      await client.query("COMMIT");
      return reply.code(204).send();
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });
}
