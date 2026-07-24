import { randomBytes, randomUUID } from "node:crypto";
import Fastify, { type FastifyRequest } from "fastify";
import cookie from "@fastify/cookie";
import staticFiles from "@fastify/static";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pool } from "./db/pool.js";
import { config } from "./config.js";
import {
  canExportPatientData,
  canModifyDoctorAssignment,
  canReadAttachment,
  canReadPatient,
  canWritePatient,
  hashPassword,
  hashToken,
  validCnpj,
  verifyPassword,
} from "./domain/security.js";
import {
  CONTACT_SOURCES,
  isOneOf,
  normalizePhone,
  PATIENT_EVENT_TYPES,
  PATIENT_STATUSES,
  validPatientName,
  validPatientPhone,
} from "./domain/patients.js";
import { FOLLOW_UP_FILTERS } from "./domain/follow-ups.js";
import {
  DELIVERY_STATUSES,
  validateInstallments,
  type SaleInstallment,
} from "./domain/sales.js";
import { validFinancialEntry } from "./domain/finance.js";
import {
  calculateCsvHash,
  parseCsv,
  validateFinancialCsvRow,
  validatePatientCsvRow,
} from "./domain/csv-import.js";
import {
  validInventoryMovement,
  validProduct,
} from "./domain/inventory.js";
import { validService } from "./domain/services.js";
import {
  calculateFileHash,
  sanitizeFilename,
  validFileSize,
  validMimeType,
  generateStorageKey,
  validateBase64Strict,
  reconcileOrphanAttachments,
  LocalAttachmentStorage,
  S3AttachmentStorage,
  DevAttachmentScanner,
  ClamAVAttachmentScanner,
  MockAttachmentScanner,
  type AttachmentStorage,
  type AttachmentScanner,
} from "./domain/attachments.js";
import {
  ANONYMIZED_PHONE,
  ANONYMIZED_TEXT_PLACEHOLDER,
  anonymizePatientName,
  formatLgpdExportPackage,
} from "./domain/privacy.js";

import { authRoutes } from "./modules/auth/routes.js";
import { importRoutes } from "./modules/import/routes.js";
import { revokeUserSessions } from "./modules/auth/middleware.js";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator" | "doctor";
  license_number?: string | null;
  specialty?: string | null;
  must_change_password: boolean;
};
declare module "fastify" {
  interface FastifyRequest {
    currentUser?: User;
  }
}

export function buildApp(customStorage?: AttachmentStorage, customScanner?: AttachmentScanner) {
  const app = Fastify({ logger: true, trustProxy: true });
  app.register(authRoutes);
  app.register(importRoutes);

  const attachmentStorage: AttachmentStorage = customStorage ?? (
    config.storageProvider === "s3"
      ? new S3AttachmentStorage({ bucket: config.s3Bucket })
      : config.storageProvider === "demo"
      ? new S3AttachmentStorage({ bucket: config.s3Bucket, mockMode: true })
      : new LocalAttachmentStorage()
  );
  const attachmentScanner: AttachmentScanner = customScanner ?? (
    config.scannerProvider === "clamav"
      ? new ClamAVAttachmentScanner()
      : config.scannerProvider === "mock"
      ? new MockAttachmentScanner()
      : new DevAttachmentScanner()
  );
  app.register(cookie);
  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("x-content-type-options", "nosniff");
    reply.header("referrer-policy", "no-referrer");
    reply.header("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    if (config.production) reply.header("strict-transport-security", "max-age=31536000; includeSubDomains");
    return payload;
  });
  app.setErrorHandler((error, request, reply) => {
    const failure = error as Error & { statusCode?: number };
    const status = Number(failure.statusCode ?? 500);
    request.log.error(error);
    reply
      .status(status)
      .type("application/problem+json")
      .send({
        type: "about:blank",
        title: status >= 500 ? "Erro interno" : failure.message,
        status,
      });
  });
  app.addHook("onRequest", async (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      const origin = request.headers.origin;
      const referer = request.headers.referer;

      let allowedOrigin = config.origin;
      try {
        allowedOrigin = new URL(config.origin).origin;
      } catch {}

      let validOrigin = false;
      if (origin) {
        try {
          validOrigin = new URL(origin).origin === allowedOrigin;
        } catch {
          validOrigin = false;
        }
      }

      let validReferer = false;
      if (!origin && referer) {
        try {
          validReferer = new URL(referer).origin === allowedOrigin;
        } catch {
          validReferer = false;
        }
      }

      if (!validOrigin && !validReferer) {
        throw Object.assign(new Error("Origem não permitida ou ausente para mutações"), {
          statusCode: 403,
        });
      }
    }
    const token = request.cookies.fonolife_session;
    if (!token) return;
    const result = await pool.query<User>(
      `SELECT u.id,u.name,u.email,u.role,u.license_number,u.specialty,u.must_change_password FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active`,
      [hashToken(token)],
    );
    request.currentUser = result.rows[0];
    if (
      request.currentUser?.must_change_password &&
      ![
        "/api/auth/me",
        "/api/auth/change-password",
        "/api/auth/logout",
      ].includes(request.url)
    )
      throw Object.assign(
        new Error("Troque a senha temporária para continuar"),
        { statusCode: 403 },
      );
  });
  const authenticated = async (request: FastifyRequest) => {
    if (!request.currentUser)
      throw Object.assign(new Error("Faça login para continuar"), {
        statusCode: 401,
      });
  };
  const admin = async (request: FastifyRequest) => {
    await authenticated(request);
    if (request.currentUser?.role !== "admin")
      throw Object.assign(new Error("Acesso restrito ao administrador"), {
        statusCode: 403,
      });
  };
  const audit = (
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
    details = {},
  ) =>
    pool.query(
      "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)",
      [userId, action, entityType, entityId ?? null, details],
    );

  const auditDenial = async (
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
  ) => {
    try {
      await pool.query(
        "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)",
        [userId, action, entityType, entityId ?? null, { denied: true }],
      );
    } catch (_) {
      // Auditoria da negativa não pode quebrar ou transformar erro em 500
    }
  };

  const loadAndAuthorizePatient = async (
    request: FastifyRequest,
    reply: any,
    patientId: string,
    action: "read" | "write" | "export" | "attachment",
  ) => {
    const res = await pool.query<{
      id: string;
      responsible_doctor_id: string | null;
      assigned_user_id: string | null;
      archived_at: Date | null;
      anonymized_at: Date | null;
    }>(
      "SELECT id, responsible_doctor_id, assigned_user_id, archived_at, anonymized_at FROM patients WHERE id=$1",
      [patientId],
    );
    if (!res.rowCount) {
      reply.code(404).type("application/problem+json").send({
        title: "Paciente não encontrado",
        status: 404,
      });
      return null;
    }
    const patient = res.rows[0];
    const user = request.currentUser!;
    const target = {
      id: patient.id,
      responsible_doctor_id: patient.responsible_doctor_id,
      assigned_user_id: patient.assigned_user_id,
    };

    let allowed = false;
    if (action === "read") allowed = canReadPatient(user, target);
    else if (action === "write") allowed = canWritePatient(user, target);
    else if (action === "export") allowed = canExportPatientData(user, target);
    else if (action === "attachment") allowed = canReadAttachment(user, target);

    if (!allowed) {
      await auditDenial(user.id, `${action}_access_denied`, "patient", patientId);
      reply.code(404).type("application/problem+json").send({
        title: "Paciente não encontrado",
        status: 404,
      });
      return null;
    }
    return patient;
  };

  app.get("/api/health", async () => {
    let dbStatus = "ok";
    try {
      await pool.query("SELECT 1");
    } catch {
      dbStatus = "down";
    }

    let storageStatus = "ok";
    try {
      await attachmentStorage.exists("__health_check__");
    } catch {
      storageStatus = "degraded";
    }

    let scannerStatus = "ok";
    try {
      await attachmentScanner.scan(Buffer.from("%PDF-1.4\n%%EOF"), "application/pdf");
    } catch {
      scannerStatus = "degraded";
    }

    let overallStatus: "healthy" | "degraded" | "unavailable" = "healthy";
    if (dbStatus === "down") {
      overallStatus = "unavailable";
    } else if (storageStatus === "degraded" || scannerStatus === "degraded") {
      overallStatus = "degraded";
    }

    return {
      status: overallStatus,
      database: dbStatus,
      storage: storageStatus,
      scanner: scannerStatus,
      storageProvider: config.storageProvider,
      scannerProvider: config.scannerProvider,
    };
  });
  app.get("/api/config", async () => {
    return { demoMode: config.demo };
  });

  app.get("/api/admin/users", { preHandler: admin }, async () => ({
    users: (
      await pool.query(
        "SELECT id,name,email,role,active,must_change_password,created_at FROM users ORDER BY name",
      )
    ).rows,
  }));
  app.post<{
    Body: {
      name: string;
      email: string;
      password: string;
      role: "admin" | "operator";
    };
  }>("/api/admin/users", { preHandler: admin }, async (request, reply) => {
    const { name, email, password, role } = request.body;
    if (
      !name?.trim() ||
      !email?.includes("@") ||
      !["admin", "operator"].includes(role)
    )
      return reply
        .code(400)
        .send({ title: "Confira nome, e-mail e perfil", status: 400 });
    const id = randomUUID();
    await pool.query(
      "INSERT INTO users(id,name,email,password_hash,role,must_change_password) VALUES($1,$2,$3,$4,$5,true)",
      [
        id,
        name.trim(),
        email.trim().toLowerCase(),
        await hashPassword(password),
        role,
      ],
    );
    await audit(request.currentUser!.id, "create", "user", id, { role });
    return reply.code(201).send({ id });
  });

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

  // Endpoints para Catálogo de Serviços
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

  app.get("/api/doctors", { preHandler: authenticated }, async () => ({
    doctors: (
      await pool.query(
        "SELECT id, name, email, role, license_number, specialty FROM users WHERE role IN ('doctor', 'admin') AND active ORDER BY name"
      )
    ).rows,
  }));

  app.get<{
    Querystring: {
      search?: string;
      status?: string;
      overdue?: string;
      archived?: string;
      limit?: string;
      offset?: string;
    };
  }>("/api/patients", { preHandler: authenticated }, async (request) => {
    const { search = "", status, overdue, archived, limit, offset } = request.query;
    if (status && !isOneOf(status, PATIENT_STATUSES))
      throw Object.assign(new Error("Status inválido"), { statusCode: 400 });
    const terms: string[] = [];
    const values: unknown[] = [];
    if (archived !== "true") terms.push("p.archived_at IS NULL");
    if (request.currentUser!.role === "doctor") {
      values.push(request.currentUser!.id);
      terms.push(`(p.responsible_doctor_id = $${values.length} OR p.assigned_user_id = $${values.length})`);
    }
    if (status) {
      values.push(status);
      terms.push(`p.journey_status=$${values.length}`);
    }
    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      terms.push(
        `(p.name ILIKE $${values.length} OR p.phone LIKE regexp_replace($${values.length}, '\\D', '', 'g'))`,
      );
    }
    if (overdue === "true")
      terms.push(
        "next_task.due_on < (now() AT TIME ZONE 'America/Sao_Paulo')::date",
      );

    const limitNum = Math.min(Math.max(Number(limit ?? 200), 1), 500);
    const offsetNum = Math.max(Number(offset ?? 0), 0);
    values.push(limitNum, offsetNum);

    const patients = await pool.query(
      `SELECT p.id,p.name,p.phone,p.journey_status,p.contact_source,p.care_alert,p.responsible_doctor_id,doc.name responsible_doctor_name,next_task.due_on next_contact_on,p.archived_at,p.version,u.name assigned_user_name FROM patients p JOIN users u ON u.id=p.assigned_user_id LEFT JOIN users doc ON doc.id=p.responsible_doctor_id LEFT JOIN LATERAL (SELECT due_on FROM follow_up_tasks WHERE patient_id=p.id AND completed_at IS NULL AND cancelled_at IS NULL ORDER BY due_on LIMIT 1) next_task ON true ${terms.length ? "WHERE " + terms.join(" AND ") : ""} ORDER BY (next_task.due_on < (now() AT TIME ZONE 'America/Sao_Paulo')::date) DESC,next_task.due_on NULLS LAST,p.name LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    return { patients: patients.rows, pagination: { limit: limitNum, offset: offsetNum, count: patients.rowCount } };
  });

  app.post<{
    Body: {
      name?: string;
      phone?: string;
      birthDate?: string;
      guardianName?: string;
      contactSource?: string;
      status?: string;
      notes?: string;
      careAlert?: string;
      nextContactOn?: string;
      assignedUserId?: string;
      responsibleDoctorId?: string | null;
    };
  }>("/api/patients", { preHandler: authenticated }, async (request, reply) => {
    const body = request.body ?? {};
    const phone = normalizePhone(body.phone);
    const source = body.contactSource ?? "other";
    const status = body.status ?? "new_lead";
    if (
      !validPatientName(body.name) ||
      !validPatientPhone(phone) ||
      !isOneOf(source, CONTACT_SOURCES) ||
      !isOneOf(status, PATIENT_STATUSES)
    )
      return reply
        .code(400)
        .type("application/problem+json")
        .send({
          title: "Informe nome, telefone válido, origem e status",
          status: 400,
        });

    if (body.responsibleDoctorId && !canModifyDoctorAssignment(request.currentUser!) && body.responsibleDoctorId !== request.currentUser!.id) {
      await auditDenial(request.currentUser!.id, "modify_doctor_assignment_denied", "patient");
      return reply
        .code(403)
        .type("application/problem+json")
        .send({ title: "Apenas perfis autorizados podem atribuir médico responsável", status: 403 });
    }

    const assigned = body.assignedUserId ?? request.currentUser!.id;
    const duplicate = await pool.query(
      "SELECT id,name FROM patients WHERE phone=$1 AND archived_at IS NULL LIMIT 1",
      [phone],
    );
    const id = randomUUID();
    await pool.query(
      `WITH created AS (INSERT INTO patients(id,name,phone,birth_date,guardian_name,contact_source,journey_status,notes,care_alert,assigned_user_id,responsible_doctor_id,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id) INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) SELECT $12,'create','patient',id,jsonb_build_object('status',$6::text) FROM created`,
      [
        id,
        body.name!.trim(),
        phone,
        body.birthDate || null,
        body.guardianName?.trim() || null,
        source,
        status,
        body.notes?.trim() || "",
        body.careAlert?.trim() || "",
        assigned,
        body.responsibleDoctorId || null,
        request.currentUser!.id,
      ],
    );
    return reply
      .code(201)
      .send({
        id,
        warning: duplicate.rows[0]
          ? `Telefone também usado por ${duplicate.rows[0].name}`
          : null,
      });
  });

  app.get<{ Params: { id: string } }>(
    "/api/patients/:id",
    { preHandler: authenticated },
    async (request, reply) => {
      const authorized = await loadAndAuthorizePatient(request, reply, request.params.id, "read");
      if (!authorized) return;
      const patient = await pool.query(
        `SELECT p.*,doc.name responsible_doctor_name,next_task.due_on next_contact_on,u.name assigned_user_name FROM patients p JOIN users u ON u.id=p.assigned_user_id LEFT JOIN users doc ON doc.id=p.responsible_doctor_id LEFT JOIN LATERAL (SELECT due_on FROM follow_up_tasks WHERE patient_id=p.id AND completed_at IS NULL AND cancelled_at IS NULL ORDER BY due_on LIMIT 1) next_task ON true WHERE p.id=$1`,
        [request.params.id],
      );
      return { patient: patient.rows[0] };
    },
  );

  app.patch<{
    Params: { id: string };
    Body: {
      version?: number;
      name?: string;
      phone?: string;
      birthDate?: string | null;
      guardianName?: string | null;
      contactSource?: string;
      status?: string;
      notes?: string;
      careAlert?: string;
      nextContactOn?: string | null;
      assignedUserId?: string;
      responsibleDoctorId?: string | null;
    };
  }>(
    "/api/patients/:id",
    { preHandler: authenticated },
    async (request, reply) => {
      const authorized = await loadAndAuthorizePatient(request, reply, request.params.id, "write");
      if (!authorized) return;
      const body = request.body ?? {};
      const phone = normalizePhone(body.phone);
      if (
        !Number.isInteger(body.version) ||
        !validPatientName(body.name) ||
        !validPatientPhone(phone) ||
        !isOneOf(body.contactSource, CONTACT_SOURCES) ||
        !isOneOf(body.status, PATIENT_STATUSES)
      )
        return reply
          .code(400)
          .type("application/problem+json")
          .send({ title: "Confira os dados do paciente", status: 400 });

      if (
        body.responsibleDoctorId !== undefined &&
        body.responsibleDoctorId !== authorized.responsible_doctor_id &&
        !canModifyDoctorAssignment(request.currentUser!) &&
        body.responsibleDoctorId !== request.currentUser!.id
      ) {
        await auditDenial(request.currentUser!.id, "modify_doctor_assignment_denied", "patient", request.params.id);
        return reply
          .code(403)
          .type("application/problem+json")
          .send({ title: "Apenas perfis autorizados podem alterar médico responsável", status: 403 });
      }

      const result = await pool.query(
        `WITH updated AS (UPDATE patients SET name=$1,phone=$2,birth_date=$3,guardian_name=$4,contact_source=$5,journey_status=$6,notes=$7,care_alert=$8,assigned_user_id=COALESCE($9,assigned_user_id),responsible_doctor_id=$10,version=version+1,updated_at=now() WHERE id=$11 AND version=$12 AND archived_at IS NULL RETURNING id,version), audited AS (INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) SELECT $13,'update','patient',id,jsonb_build_object('version',version) FROM updated) SELECT version FROM updated`,
        [
          body.name!.trim(),
          phone,
          body.birthDate || null,
          body.guardianName?.trim() || null,
          body.contactSource,
          body.status,
          body.notes?.trim() || "",
          body.careAlert?.trim() || "",
          body.assignedUserId || null,
          body.responsibleDoctorId || null,
          request.params.id,
          body.version,
          request.currentUser!.id,
        ],
      );
      if (!result.rowCount) {
        const exists = await pool.query("SELECT 1 FROM patients WHERE id=$1", [
          request.params.id,
        ]);
        return reply
          .code(exists.rowCount ? 409 : 404)
          .type("application/problem+json")
          .send({
            title: exists.rowCount
              ? "Esta ficha foi alterada por outra pessoa. Recarregue antes de salvar."
              : "Paciente não encontrado",
            status: exists.rowCount ? 409 : 404,
          });
      }
      return { version: result.rows[0].version };
    },
  );

  app.post<{ Params: { id: string }; Body: { version?: number } }>(
    "/api/patients/:id/archive",
    { preHandler: authenticated },
    async (request, reply) => {
      const authorized = await loadAndAuthorizePatient(request, reply, request.params.id, "write");
      if (!authorized) return;
      if (!Number.isInteger(request.body?.version))
        return reply
          .code(400)
          .type("application/problem+json")
          .send({ title: "Versão da ficha obrigatória", status: 400 });
      const result = await pool.query(
        `WITH archived AS (UPDATE patients SET archived_at=now(),journey_status='inactive',version=version+1,updated_at=now() WHERE id=$1 AND version=$2 AND archived_at IS NULL RETURNING id), audited AS (INSERT INTO audit_events(user_id,action,entity_type,entity_id) SELECT $3,'archive','patient',id FROM archived) SELECT id FROM archived`,
        [request.params.id, request.body.version, request.currentUser!.id],
      );
      if (!result.rowCount) {
        const exists = await pool.query("SELECT 1 FROM patients WHERE id=$1", [
          request.params.id,
        ]);
        return reply
          .code(exists.rowCount ? 409 : 404)
          .type("application/problem+json")
          .send({
            title: exists.rowCount
              ? "A ficha mudou. Recarregue antes de arquivar."
              : "Paciente não encontrado",
            status: exists.rowCount ? 409 : 404,
          });
      }
      return reply.code(204).send();
    },
  );

  app.post<{
    Params: { id: string };
    Body: { eventType?: string; description?: string; occurredAt?: string };
  }>(
    "/api/patients/:id/events",
    { preHandler: authenticated },
    async (request, reply) => {
      const authorized = await loadAndAuthorizePatient(request, reply, request.params.id, "write");
      if (!authorized) return;
      const { eventType, description, occurredAt } = request.body ?? {};
      if (
        !isOneOf(eventType, PATIENT_EVENT_TYPES) ||
        !description?.trim() ||
        description.trim().length < 2
      )
        return reply
          .code(400)
          .type("application/problem+json")
          .send({
            title: "Escolha o tipo e descreva a interação",
            status: 400,
          });
      const event = await pool.query(
        `WITH created AS (INSERT INTO patient_events(id,patient_id,event_type,description,occurred_at,created_by) SELECT $1,p.id,$3,$4,COALESCE($5::timestamptz,now()),$6 FROM patients p WHERE p.id=$2 AND p.archived_at IS NULL RETURNING id), audited AS (INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) SELECT $6,'create','patient_event',id,jsonb_build_object('patientId',$2::text,'eventType',$3::text) FROM created) SELECT id FROM created`,
        [
          randomUUID(),
          request.params.id,
          eventType,
          description.trim(),
          occurredAt || null,
          request.currentUser!.id,
        ],
      );
      if (!event.rowCount)
        return reply
          .code(404)
          .type("application/problem+json")
          .send({ title: "Paciente não encontrado", status: 404 });
      return reply.code(201).send({ id: event.rows[0].id });
    },
  );

  app.post<{
    Params: { id: string };
    Body: { messageText?: string };
  }>(
    "/api/patients/:id/whatsapp-click",
    { preHandler: authenticated },
    async (request, reply) => {
      const authorized = await loadAndAuthorizePatient(request, reply, request.params.id, "write");
      if (!authorized) return;
      const { messageText } = request.body ?? {};
      const description = messageText?.trim()
        ? `Contato iniciado via WhatsApp: "${messageText.trim().slice(0, 100)}..."`
        : "Contato iniciado via WhatsApp";

      const event = await pool.query(
        `WITH created AS (
           INSERT INTO patient_events(id,patient_id,event_type,description,occurred_at,created_by)
           SELECT $1,p.id,'whatsapp',$3,now(),$4 FROM patients p WHERE p.id=$2 AND p.archived_at IS NULL RETURNING id
         ), audited AS (
           INSERT INTO audit_events(user_id,action,entity_type,entity_id,details)
           SELECT $4,'create','patient_event',id,jsonb_build_object('patientId',$2::text,'eventType','whatsapp') FROM created
         ) SELECT id FROM created`,
        [randomUUID(), request.params.id, description, request.currentUser!.id]
      );

      if (!event.rowCount)
        return reply
          .code(404)
          .type("application/problem+json")
          .send({ title: "Paciente não encontrado", status: 404 });
      return reply.code(201).send({ id: event.rows[0].id });
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/patients/:id/attachments",
    { preHandler: authenticated },
    async (request, reply) => {
      const authorized = await loadAndAuthorizePatient(request, reply, request.params.id, "attachment");
      if (!authorized) return;
      const attachments = await pool.query(
        `SELECT a.id,a.original_name,a.mime_type,a.size_bytes,a.file_hash,a.status,a.created_at,u.name created_by_name
         FROM patient_attachments a
         JOIN users u ON u.id=a.created_by
         WHERE a.patient_id=$1 AND a.archived_at IS NULL AND a.status != 'failed'
         ORDER BY a.created_at DESC`,
        [request.params.id]
      );
      return { attachments: attachments.rows };
    }
  );

  app.post<{
    Params: { id: string };
    Body: { fileName?: string; mimeType?: string; contentBase64?: string };
  }>(
    "/api/patients/:id/attachments",
    { preHandler: authenticated },
    async (request, reply) => {
      const authorized = await loadAndAuthorizePatient(request, reply, request.params.id, "write");
      if (!authorized) return;
      const { fileName, mimeType, contentBase64 } = request.body ?? {};
      if (!fileName || !mimeType || !contentBase64)
        return reply
          .code(400)
          .type("application/problem+json")
          .send({ title: "Arquivo, tipo MIME e conteúdo base64 são obrigatórios", status: 400 });

      if (!validMimeType(mimeType))
        return reply
          .code(400)
          .type("application/problem+json")
          .send({ title: "Tipo de arquivo não permitido (Aceitos: PDF, JPEG, PNG, WEBP)", status: 400 });

      let buffer: Buffer;
      try {
        buffer = validateBase64Strict(contentBase64);
      } catch (err: any) {
        return reply
          .code(400)
          .type("application/problem+json")
          .send({ title: err?.message || "Conteúdo base64 inválido", status: 400 });
      }

      if (!validFileSize(buffer.length))
        return reply
          .code(400)
          .type("application/problem+json")
          .send({ title: "Tamanho de arquivo excede o limite seguro de 10MB", status: 400 });

      // Inspeciona Magic Bytes e valida integridade via scanner
      const scanResult = await attachmentScanner.scan(buffer, mimeType);
      if (!scanResult.clean) {
        return reply
          .code(400)
          .type("application/problem+json")
          .send({ title: `Falha na verificação de segurança do anexo: ${scanResult.reason}`, status: 400 });
      }

      const sanitizedOriginal = sanitizeFilename(fileName);
      const attachmentId = randomUUID();
      const storageKey = generateStorageKey(sanitizedOriginal);
      const providerName = config.storageProvider;

      // Persiste o arquivo fisicamente no storage privado com compensação em caso de falha no banco
      let saveRes: { sizeBytes: number; hash: string };
      try {
        saveRes = await attachmentStorage.save(storageKey, buffer, mimeType);
      } catch (err: any) {
        return reply
          .code(500)
          .type("application/problem+json")
          .send({ title: `Falha no armazenamento do anexo: ${err?.message}`, status: 500 });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const pat = await client.query("SELECT 1 FROM patients WHERE id=$1 AND archived_at IS NULL", [request.params.id]);
        if (!pat.rowCount) {
          await client.query("ROLLBACK");
          await attachmentStorage.delete(storageKey);
          return reply.code(404).type("application/problem+json").send({ title: "Paciente não encontrado", status: 404 });
        }

        await client.query(
          `INSERT INTO patient_attachments(id,patient_id,file_name,original_name,mime_type,size_bytes,file_hash,storage_provider,storage_key,status,detected_mime_type,scanned_at,created_by)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now(),$12)`,
          [
            attachmentId,
            request.params.id,
            storageKey,
            sanitizedOriginal,
            mimeType,
            saveRes.sizeBytes,
            saveRes.hash,
            providerName,
            storageKey,
            "ready",
            scanResult.detectedMimeType ?? mimeType,
            request.currentUser!.id,
          ]
        );

        // Registra evento na timeline do paciente
        await client.query(
          "INSERT INTO patient_events(id,patient_id,event_type,description,created_by) VALUES($1,$2,'clinical_note',$3,$4)",
          [randomUUID(), request.params.id, `Laudo/Anexo adicionado: ${sanitizedOriginal}`, request.currentUser!.id]
        );

        await client.query(
          "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'create','patient_attachment',$2,$3)",
          [request.currentUser!.id, attachmentId, { patientId: request.params.id, originalName: sanitizedOriginal, mimeType, fileHash: saveRes.hash, storageKey }]
        );

        await client.query("COMMIT");
        return reply.code(201).send({ id: attachmentId, status: "ready" });
      } catch (err) {
        await client.query("ROLLBACK");
        // Compensação: desfaz arquivo no storage se a transação do banco falhar
        await attachmentStorage.delete(storageKey);
        throw err;
      } finally {
        client.release();
      }
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/attachments/:id/download",
    { preHandler: authenticated },
    async (request, reply) => {
      const att = await pool.query(
        "SELECT * FROM patient_attachments WHERE id=$1 AND archived_at IS NULL",
        [request.params.id]
      );
      if (!att.rowCount)
        return reply.code(404).type("application/problem+json").send({ title: "Anexo não encontrado", status: 404 });

      const file = att.rows[0];
      if (file.status !== "ready") {
        return reply
          .code(403)
          .type("application/problem+json")
          .send({ title: `Anexo não disponível para download (situação: ${file.status})`, status: 403 });
      }

      const authorized = await loadAndAuthorizePatient(request, reply, file.patient_id, "attachment");
      if (!authorized) return;

      const key = file.storage_key || file.file_name;
      try {
        const stream = await attachmentStorage.getStream(key);
        reply
          .header("Content-Type", file.detected_mime_type || file.mime_type)
          .header("Content-Disposition", `inline; filename="${file.original_name}"`)
          .header("X-Content-Type-Options", "nosniff")
          .header("Content-Security-Policy", "default-src 'none'");
        return reply.send(stream);
      } catch {
        return reply.code(404).type("application/problem+json").send({ title: "Arquivo físico não encontrado", status: 404 });
      }
    }
  );

  app.post<{ Params: { id: string } }>(
    "/api/attachments/:id/archive",
    { preHandler: authenticated },
    async (request, reply) => {
      const att = await pool.query(
        "SELECT patient_id, original_name FROM patient_attachments WHERE id=$1 AND archived_at IS NULL",
        [request.params.id]
      );
      if (!att.rowCount)
        return reply.code(404).type("application/problem+json").send({ title: "Anexo não encontrado ou já arquivado", status: 404 });

      const authorized = await loadAndAuthorizePatient(request, reply, att.rows[0].patient_id, "write");
      if (!authorized) return;

      await pool.query(
        "UPDATE patient_attachments SET archived_at=now(), status='archived' WHERE id=$1",
        [request.params.id]
      );

      await audit(request.currentUser!.id, "archive", "patient_attachment", request.params.id, {
        patientId: att.rows[0].patient_id,
        originalName: att.rows[0].original_name,
      });

      return reply.code(204).send();
    }
  );

  app.post("/api/admin/reconcile-attachments", { preHandler: admin }, async (_request, _reply) => {
    const result = await reconcileOrphanAttachments(pool, attachmentStorage as any);
    return result;
  });

  app.get<{ Params: { id: string } }>(
    "/api/patients/:id/export-data",
    { preHandler: authenticated },
    async (request, reply) => {
      const authorized = await loadAndAuthorizePatient(request, reply, request.params.id, "export");
      if (!authorized) return;

      const patientRes = await pool.query(
        "SELECT * FROM patients WHERE id=$1 AND archived_at IS NULL",
        [request.params.id]
      );
      const patient = patientRes.rows[0];

      const [timeline, sales, financial, attachments] = await Promise.all([
        pool.query(
          `SELECT e.id,e.event_type,
                  CASE WHEN EXISTS(SELECT 1 FROM patient_redactions pr WHERE pr.patient_id=e.patient_id) OR $2::timestamptz IS NOT NULL THEN '${ANONYMIZED_TEXT_PLACEHOLDER}' ELSE e.description END AS description,
                  e.occurred_at,e.created_at
           FROM patient_events e WHERE e.patient_id=$1 ORDER BY e.occurred_at DESC`,
          [request.params.id, patient.anonymized_at]
        ),
        pool.query(
          "SELECT id,product,quantity,total_amount_cents,sold_on,delivery_status,created_at FROM sales WHERE patient_id=$1 ORDER BY sold_on DESC",
          [request.params.id]
        ),
        pool.query(
          "SELECT id,entry_type,category,description,amount_cents,competence_on,occurred_on FROM financial_entries WHERE patient_id=$1 ORDER BY occurred_on DESC",
          [request.params.id]
        ),
        pool.query(
          "SELECT id,original_name,mime_type,size_bytes,file_hash,created_at FROM patient_attachments WHERE patient_id=$1 AND archived_at IS NULL ORDER BY created_at DESC",
          [request.params.id]
        ),
      ]);

      const pkg = formatLgpdExportPackage(
        patient,
        timeline.rows,
        sales.rows,
        financial.rows,
        attachments.rows
      );

      await audit(request.currentUser!.id, "export_lgpd_data", "patient", request.params.id, {
        patientId: request.params.id,
      });

      return reply
        .header("Content-Type", "application/json; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="export_lgpd_${request.params.id.slice(0, 8)}.json"`)
        .send(pkg);
    }
  );

  app.post<{
    Params: { id: string };
    Body: { version?: number; reason?: string; confirm?: boolean; password?: string };
  }>(
    "/api/admin/patients/:id/anonymize",
    { preHandler: admin },
    async (request, reply) => {
      const { version, reason, confirm, password } = request.body ?? {};
      if (typeof version !== "number")
        return reply.code(400).type("application/problem+json").send({ title: "Versão do paciente é obrigatória para optimistic lock", status: 400 });

      if (!reason || typeof reason !== "string" || reason.trim().length < 3)
        return reply.code(400).type("application/problem+json").send({ title: "Justificativa obrigatória para anonimização LGPD", status: 400 });

      if (confirm !== true)
        return reply.code(400).type("application/problem+json").send({ title: "Confirmação explícita obrigatória", status: 400 });

      if (!password)
        return reply.code(401).type("application/problem+json").send({ title: "Confirme sua senha de administrador para prosseguir com a anonimização", status: 401 });

      const adminUser = await pool.query<{ password_hash: string }>(
        "SELECT password_hash FROM users WHERE id=$1",
        [request.currentUser!.id]
      );
      if (!adminUser.rowCount || !(await verifyPassword(password, adminUser.rows[0].password_hash))) {
        return reply.code(401).type("application/problem+json").send({ title: "Senha do administrador incorreta", status: 401 });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const pat = await client.query(
          "SELECT id,version,anonymized_at FROM patients WHERE id=$1 AND archived_at IS NULL FOR UPDATE",
          [request.params.id]
        );

        if (!pat.rowCount) {
          await client.query("ROLLBACK");
          return reply.code(404).type("application/problem+json").send({ title: "Paciente não encontrado", status: 404 });
        }

        if (pat.rows[0].version !== version) {
          await client.query("ROLLBACK");
          return reply.code(409).type("application/problem+json").send({ title: "Registro modificado por outro usuário. Recarregue a página.", status: 409 });
        }

        if (pat.rows[0].anonymized_at) {
          await client.query("ROLLBACK");
          return reply.code(409).type("application/problem+json").send({ title: "Paciente já foi anonimizado anteriormente.", status: 409 });
        }

        const anonymizedName = anonymizePatientName(request.params.id);

        // Atualiza os dados identificáveis do paciente substituindo por pseudônimo e limpando PII
        await client.query(
          `UPDATE patients SET
             name=$1,
             phone=$2,
             guardian_name=NULL,
             notes=$3,
             care_alert='',
             anonymized_at=now(),
             version=version+1,
             updated_at=now()
           WHERE id=$4`,
          [anonymizedName, ANONYMIZED_PHONE, ANONYMIZED_TEXT_PLACEHOLDER, request.params.id]
        );

        // Registra a redação LGPD sem violar o trigger imutável de patient_events
        await client.query(
          "INSERT INTO patient_redactions(patient_id, reason, requested_by) VALUES($1, $2, $3)",
          [request.params.id, reason.trim(), request.currentUser!.id]
        );

        // Registra evento de auditoria sem PII
        await client.query(
          "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'anonymize_lgpd','patient',$2,$3)",
          [request.currentUser!.id, request.params.id, { reason: reason.trim() }]
        );

        await client.query("COMMIT");
        return reply.code(200).send({ message: "Paciente anonimizado com sucesso conforme LGPD." });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/patients/:id/timeline",
    { preHandler: authenticated },
    async (request, reply) => {
      const authorized = await loadAndAuthorizePatient(request, reply, request.params.id, "read");
      if (!authorized) return;

      const items = await pool.query(
        `SELECT e.id::text,'event' kind,e.event_type type,
                CASE WHEN EXISTS(SELECT 1 FROM patient_redactions pr WHERE pr.patient_id=e.patient_id) OR p.anonymized_at IS NOT NULL THEN '${ANONYMIZED_TEXT_PLACEHOLDER}' ELSE e.description END description,
                e.occurred_at occurred_at,u.name author
         FROM patient_events e
         JOIN patients p ON p.id=e.patient_id
         JOIN users u ON u.id=e.created_by
         WHERE e.patient_id=$1
         UNION ALL
         SELECT t.id::text,'follow_up','follow_up_scheduled',t.title||' — '||to_char(t.due_on,'DD/MM/YYYY'),t.created_at,u.name
         FROM follow_up_tasks t
         JOIN users u ON u.id=t.created_by
         WHERE t.patient_id=$1
         UNION ALL
         SELECT t.id::text||'-closed','follow_up',CASE WHEN t.completed_at IS NOT NULL THEN 'follow_up_completed' ELSE 'follow_up_cancelled' END,t.title,COALESCE(t.completed_at,t.cancelled_at),u.name
         FROM follow_up_tasks t
         JOIN users u ON u.id=t.closed_by
         WHERE t.patient_id=$1 AND t.closed_by IS NOT NULL
         UNION ALL
         SELECT s.id::text,'sale',CASE WHEN s.cancelled_at IS NULL THEN 'sale' ELSE 'sale_cancelled' END,s.product||' · '||s.quantity||' un. · R$ '||to_char(s.total_amount_cents/100.0,'FM999G999G990D00'),COALESCE(s.cancelled_at,s.created_at),u.name
         FROM sales s
         JOIN users u ON u.id=COALESCE(s.cancelled_by,s.created_by)
         WHERE s.patient_id=$1
         UNION ALL
         SELECT p.id::text,'patient_created','patient_created','Paciente cadastrado',p.created_at,u.name
         FROM patients p
         JOIN users u ON u.id=p.created_by
         WHERE p.id=$1
         ORDER BY occurred_at DESC`,
        [request.params.id]
      );
      return { items: items.rows };
    }
  );

  app.get<{ Querystring: { filter?: string } }>(
    "/api/follow-ups",
    { preHandler: authenticated },
    async (request, reply) => {
      const filter = request.query.filter ?? "today";
      if (!isOneOf(filter, FOLLOW_UP_FILTERS))
        return reply
          .code(400)
          .type("application/problem+json")
          .send({ title: "Filtro de acompanhamento inválido", status: 400 });
      const today = "(now() AT TIME ZONE 'America/Sao_Paulo')::date";
      const conditions: Record<string, string> = {
        today: `t.due_on = ${today}`,
        overdue: `t.due_on < ${today}`,
        upcoming: `t.due_on > ${today} AND t.due_on <= ${today} + 30`,
        adaptation: "p.journey_status = 'adaptation'",
        "no-contact": `(COALESCE(last_event.occurred_on,p.created_at) AT TIME ZONE 'America/Sao_Paulo')::date <= ${today} - 90`,
      };
      const values: unknown[] = [];
      let docFilter = "";
      if (request.currentUser!.role === "doctor") {
        values.push(request.currentUser!.id);
        docFilter = `AND (p.responsible_doctor_id = $${values.length} OR p.assigned_user_id = $${values.length})`;
      }
      const tasks =
        await pool.query(`SELECT p.id patient_id,p.name patient_name,p.phone,p.journey_status,t.id task_id,t.title,t.due_on,
      CASE WHEN t.due_on < ${today} THEN 'overdue' WHEN t.due_on = ${today} THEN 'today' ELSE 'upcoming' END timing,
      last_event.occurred_on last_contact_at
      FROM patients p
      LEFT JOIN LATERAL (SELECT id,title,due_on FROM follow_up_tasks WHERE patient_id=p.id AND completed_at IS NULL AND cancelled_at IS NULL ORDER BY due_on LIMIT 1) t ON true
      LEFT JOIN LATERAL (SELECT max(occurred_at) occurred_on FROM patient_events WHERE patient_id=p.id) last_event ON true
      WHERE p.archived_at IS NULL ${docFilter} AND ${conditions[filter]} AND (${filter === "adaptation" || filter === "no-contact" ? "true" : "t.id IS NOT NULL"})
      ORDER BY t.due_on NULLS FIRST,p.name LIMIT 200`, values);
      return { items: tasks.rows };
    },
  );

  app.post<{
    Body: {
      patientId?: string;
      title?: string;
      dueOn?: string;
      notes?: string;
    };
  }>(
    "/api/follow-ups",
    { preHandler: authenticated },
    async (request, reply) => {
      const { patientId, title, dueOn, notes } = request.body ?? {};
      if (
        !patientId ||
        !title?.trim() ||
        title.trim().length < 2 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dueOn ?? "")
      )
        return reply
          .code(400)
          .type("application/problem+json")
          .send({ title: "Informe paciente, tarefa e data", status: 400 });

      const authorized = await loadAndAuthorizePatient(request, reply, patientId, "write");
      if (!authorized) return;

      const id = randomUUID();
      const created = await pool.query(
        `WITH task AS (INSERT INTO follow_up_tasks(id,patient_id,title,due_on,notes,created_by) SELECT $1,p.id,$3,$4::date,$5,$6 FROM patients p WHERE p.id=$2 AND p.archived_at IS NULL RETURNING id), audited AS (INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) SELECT $6,'create','follow_up_task',id,jsonb_build_object('patientId',$2::text,'dueOn',$4::text) FROM task) SELECT id FROM task`,
        [
          id,
          patientId,
          title.trim(),
          dueOn,
          notes?.trim() ?? "",
          request.currentUser!.id,
        ],
      );
      if (!created.rowCount)
        return reply
          .code(404)
          .type("application/problem+json")
          .send({ title: "Paciente não encontrado", status: 404 });
      return reply.code(201).send({ id });
    },
  );

  async function closeFollowUp(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: any,
    action: "complete" | "cancel",
  ) {
    const taskRes = await pool.query<{ patient_id: string }>(
      "SELECT patient_id FROM follow_up_tasks WHERE id=$1 AND completed_at IS NULL AND cancelled_at IS NULL",
      [request.params.id]
    );
    if (!taskRes.rowCount)
      return reply
        .code(409)
        .type("application/problem+json")
        .send({ title: "Tarefa não encontrada ou já encerrada", status: 409 });

    const authorized = await loadAndAuthorizePatient(request, reply, taskRes.rows[0].patient_id, "write");
    if (!authorized) return;

    const column = action === "complete" ? "completed_at" : "cancelled_at";
    const result = await pool.query(
      `WITH closed AS (UPDATE follow_up_tasks SET ${column}=now(),closed_by=$2 WHERE id=$1 AND completed_at IS NULL AND cancelled_at IS NULL RETURNING id,patient_id), audited AS (INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) SELECT $2,$3,'follow_up_task',id,jsonb_build_object('patientId',patient_id::text) FROM closed) SELECT id FROM closed`,
      [request.params.id, request.currentUser!.id, action],
    );
    if (!result.rowCount)
      return reply
        .code(409)
        .type("application/problem+json")
        .send({ title: "Tarefa não encontrada ou já encerrada", status: 409 });
    return reply.code(204).send();
  }

  app.post<{ Params: { id: string } }>(
    "/api/follow-ups/:id/complete",
    { preHandler: authenticated },
    (request, reply) => closeFollowUp(request, reply, "complete"),
  );
  app.post<{ Params: { id: string } }>(
    "/api/follow-ups/:id/cancel",
    { preHandler: authenticated },
    (request, reply) => closeFollowUp(request, reply, "cancel"),
  );

  app.patch<{
    Params: { id: string };
    Body: {
      active?: boolean;
      role?: "admin" | "operator";
      temporaryPassword?: string;
    };
  }>("/api/admin/users/:id", { preHandler: admin }, async (request, reply) => {
    const { active, role, temporaryPassword } = request.body ?? {};
    if (role !== undefined && !["admin", "operator"].includes(role))
      return reply
        .code(400)
        .type("application/problem+json")
        .send({ title: "Perfil inválido", status: 400 });
    if (temporaryPassword !== undefined && temporaryPassword.length < 8)
      return reply
        .code(400)
        .type("application/problem+json")
        .send({
          title: "A senha temporária deve ter ao menos 8 caracteres",
          status: 400,
        });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock($1)", [740_043]);
      const target = await client.query<{ role: string; active: boolean }>(
        "SELECT role,active FROM users WHERE id=$1 FOR UPDATE",
        [request.params.id],
      );
      if (!target.rowCount) {
        await client.query("ROLLBACK");
        return reply
          .code(404)
          .type("application/problem+json")
          .send({ title: "Usuário não encontrado", status: 404 });
      }
      const removesAdmin =
        target.rows[0].role === "admin" &&
        target.rows[0].active &&
        (active === false || role === "operator");
      if (removesAdmin) {
        const count = await client.query<{ count: string }>(
          "SELECT count(*) FROM users WHERE role='admin' AND active",
        );
        if (Number(count.rows[0].count) <= 1) {
          await client.query("ROLLBACK");
          return reply
            .code(409)
            .type("application/problem+json")
            .send({
              title: "Não é possível remover o último administrador",
              status: 409,
            });
        }
      }
      await client.query(
        "UPDATE users SET active=COALESCE($1,active),role=COALESCE($2,role),password_hash=COALESCE($3,password_hash),must_change_password=CASE WHEN $3 IS NULL THEN must_change_password ELSE true END WHERE id=$4",
        [
          active ?? null,
          role ?? null,
          temporaryPassword ? await hashPassword(temporaryPassword) : null,
          request.params.id,
        ],
      );

      // Invalidação imediata de sessões ativas se o usuário for desativado, tiver a senha alterada ou perfil modificado
      if (active === false || temporaryPassword || role !== undefined) {
        await client.query("DELETE FROM user_sessions WHERE user_id=$1", [request.params.id]);
      }

      await client.query(
        "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)",
        [
          request.currentUser!.id,
          "update",
          "user",
          request.params.id,
          { active, role, passwordReset: Boolean(temporaryPassword) },
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
  });

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

        // Se a venda for vinculada a um produto do catálogo, valida saldo em estoque
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

        // Se houver produto do catálogo, registra a baixa de estoque automática
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

        // Se houver serviço do catálogo com produtos relacionados, efetua baixas automáticas de estoque dos insumos do serviço
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

  type FinanceFilters = { from?: string; to?: string; companyAccountId?: string; entryType?: string; category?: string; paymentMethod?: string };
  const financeWhere = (query: FinanceFilters, dateColumn: string) => {
    const values: unknown[] = [], terms: string[] = [];
    for (const [value, sql] of [
      [query.from, `${dateColumn} >=`], [query.to, `${dateColumn} <=`],
      [query.companyAccountId, "f.company_account_id ="], [query.entryType, "f.entry_type ="],
      [query.category, "f.category ="], [query.paymentMethod, "f.payment_method ="],
    ] as const) if (value) { values.push(value); terms.push(`${sql} $${values.length}`); }
    return { values, sql: terms.length ? `WHERE ${terms.join(" AND ")}` : "" };
  };

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

  app.post<{ Params: { id: string }; Body: { clientRequestId?: string; receivedOn?: string } }>("/api/finance/receivables/:id/settle", { preHandler: authenticated }, async (request, reply) => {
    const { clientRequestId, receivedOn } = request.body ?? {};
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
      await client.query(`INSERT INTO financial_entries(id,client_request_id,entry_type,category,description,amount_cents,competence_on,occurred_on,payment_method,company_account_id,patient_id,sale_id,receivable_installment_id,created_by) VALUES($1,$2,'income','hearing_aid_sale',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [id,clientRequestId,`Venda: ${row.product}`,row.amount_cents,row.sold_on,receivedOn,row.payment_method,row.company_account_id,row.patient_id,row.sale_id,row.id,request.currentUser!.id]);
      await client.query("INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'settle','receivable_installment',$2,$3)", [request.currentUser!.id,row.id,{ financialEntryId:id, receivedOn }]);
      await client.query("COMMIT");
      return reply.code(201).send({ id });
    } catch (error: any) { await client.query("ROLLBACK"); const retry = await pool.query("SELECT id FROM financial_entries WHERE client_request_id=$1", [clientRequestId]); if (retry.rowCount) return { id: retry.rows[0].id, idempotent: true }; throw error; } finally { client.release(); }
  });

  app.post<{ Params: { id: string }; Body: { clientRequestId?: string; reason?: string; occurredOn?: string } }>("/api/finance/entries/:id/reverse", { preHandler: admin }, async (request, reply) => {
    const { clientRequestId, reason, occurredOn } = request.body ?? {};
    if (!/^[0-9a-f-]{36}$/i.test(clientRequestId ?? "") || !reason?.trim() || reason.trim().length < 3 || !/^\d{4}-\d{2}-\d{2}$/.test(occurredOn ?? "")) return reply.code(400).type("application/problem+json").send({ title: "Informe data e motivo do estorno", status: 400 });
    const result = await pool.query(`WITH reversed AS (INSERT INTO financial_entries(id,client_request_id,entry_type,category,description,amount_cents,competence_on,occurred_on,payment_method,company_account_id,patient_id,sale_id,reversal_of_id,reversal_reason,notes,created_by) SELECT $1,$2,CASE entry_type WHEN 'income' THEN 'expense' ELSE 'income' END,category,'Estorno: '||description,amount_cents,competence_on,$3,payment_method,company_account_id,patient_id,sale_id,id,$4,notes,$5 FROM financial_entries original WHERE id=$6 AND reversal_of_id IS NULL AND NOT EXISTS(SELECT 1 FROM financial_entries r WHERE r.reversal_of_id=original.id) RETURNING id),audited AS (INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) SELECT $5,'reverse','financial_entry',id,jsonb_build_object('reversalOfId',$6::text,'reason',$4::text) FROM reversed) SELECT id FROM reversed`, [randomUUID(),clientRequestId,occurredOn,reason.trim(),request.currentUser!.id,request.params.id]);
    if (!result.rowCount) return reply.code(409).type("application/problem+json").send({ title: "Lançamento não encontrado ou já estornado", status: 409 });
    return reply.code(201).send({ id: result.rows[0].id });
  });

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

  app.get<{ Querystring: { year?: string; month?: string } }>(
    "/api/doctor/schedule",
    { preHandler: authenticated },
    async (request) => {
      const year = Number(request.query.year ?? new Date().getFullYear());
      const month = Number(request.query.month ?? new Date().getMonth() + 1);
      const doctorId = request.currentUser!.id;
      const isAdminOrOperator = ["admin", "operator"].includes(request.currentUser!.role);

      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

      const tasks = await pool.query(
        `SELECT t.id task_id, t.patient_id, p.name patient_name, p.phone, t.title, t.due_on, t.completed_at,
          CASE WHEN t.due_on < (now() AT TIME ZONE 'America/Sao_Paulo')::date AND t.completed_at IS NULL THEN 'overdue'
               WHEN t.due_on = (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN 'today'
               ELSE 'scheduled' END status
         FROM follow_up_tasks t
         JOIN patients p ON p.id = t.patient_id
         WHERE t.cancelled_at IS NULL AND p.archived_at IS NULL
           AND t.due_on >= $1 AND t.due_on <= $2
           ${isAdminOrOperator ? "" : "AND (p.responsible_doctor_id = $3 OR p.assigned_user_id = $3)"}
         ORDER BY t.due_on, p.name`,
        isAdminOrOperator ? [startDate, endDate] : [startDate, endDate, doctorId],
      );

      const events = await pool.query(
        `SELECT e.id event_id, e.patient_id, p.name patient_name, p.phone, e.event_type,
                CASE WHEN EXISTS(SELECT 1 FROM patient_redactions pr WHERE pr.patient_id=e.patient_id) OR p.anonymized_at IS NOT NULL THEN '${ANONYMIZED_TEXT_PLACEHOLDER}' ELSE e.description END description,
                e.created_at
         FROM patient_events e
         JOIN patients p ON p.id = e.patient_id
         WHERE p.archived_at IS NULL
           AND (e.created_at AT TIME ZONE 'America/Sao_Paulo')::date >= $1
           AND (e.created_at AT TIME ZONE 'America/Sao_Paulo')::date <= $2
           ${isAdminOrOperator ? "" : "AND (p.responsible_doctor_id = $3 OR p.assigned_user_id = $3)"}
         ORDER BY e.created_at DESC`,
        isAdminOrOperator ? [startDate, endDate] : [startDate, endDate, doctorId],
      );

      return { year, month, tasks: tasks.rows, events: events.rows };
    },
  );

  app.get("/api/doctor/patients", { preHandler: authenticated }, async (request) => {
    const doctorId = request.currentUser!.id;
    const isAdminOrOperator = ["admin", "operator"].includes(request.currentUser!.role);
    const result = await pool.query(
      `SELECT DISTINCT p.id, p.name, p.phone, p.journey_status, p.next_contact_on, p.care_alert, p.notes, p.updated_at
       FROM patients p
       WHERE p.archived_at IS NULL
         ${isAdminOrOperator ? "" : "AND (p.responsible_doctor_id = $1 OR p.assigned_user_id = $1)"}
       ORDER BY p.name LIMIT 200`,
      isAdminOrOperator ? [] : [doctorId],
    );
    return { patients: result.rows };
  });

  app.post<{ Body: { patientId?: string; eventType?: string; description?: string; nextContactOn?: string } }>(
    "/api/doctor/consultations",
    { preHandler: authenticated },
    async (request, reply) => {
      const { patientId, eventType, description, nextContactOn } = request.body ?? {};
      if (!patientId || !description || description.trim().length < 3) {
        return reply.code(400).type("application/problem+json").send({ title: "Informe o paciente e a observação clínica", status: 400 });
      }

      const authorized = await loadAndAuthorizePatient(request, reply, patientId, "write");
      if (!authorized) return;

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const patient = await client.query("SELECT id FROM patients WHERE id=$1 AND archived_at IS NULL FOR UPDATE", [patientId]);
        if (!patient.rowCount) {
          await client.query("ROLLBACK");
          return reply.code(404).type("application/problem+json").send({ title: "Paciente não encontrado", status: 404 });
        }
        const eventId = randomUUID();
        await client.query(
          `INSERT INTO patient_events(id, patient_id, user_id, doctor_id, event_type, description) VALUES($1, $2, $3, $3, $4, $5)`,
          [eventId, patientId, request.currentUser!.id, eventType || "consultation", description.trim()],
        );
        if (nextContactOn) {
          await client.query(`UPDATE patients SET next_contact_on=$2, updated_at=now() WHERE id=$1`, [patientId, nextContactOn]);
        }
        await client.query(
          `INSERT INTO audit_events(user_id, action, entity_type, entity_id, details) VALUES($1, 'doctor_consultation', 'patient', $2, $3)`,
          [request.currentUser!.id, patientId, { eventType: eventType || "consultation", nextContactOn }],
        );
        await client.query("COMMIT");
        return reply.code(201).send({ id: eventId });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  );

  const publicDir = resolve("dist/public");
  if (existsSync(publicDir)) {
    app.register(staticFiles, { root: publicDir });
    app.setNotFoundHandler((request, reply) =>
      request.url.startsWith("/api/")
        ? reply.code(404).send({ title: "Não encontrado", status: 404 })
        : reply.sendFile("index.html"),
    );
  }
  return app;
}
