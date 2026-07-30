import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { pool } from "../../db/pool.js";
import {
  CRM_ACTIVITY_TYPES,
  CRM_ACCOUNT_TYPES,
  CRM_OPPORTUNITY_PRIORITIES,
  CRM_OPPORTUNITY_STATUSES,
  integerCents,
  integerPercent,
  validAccountType,
  validActivityType,
  validCustomFields,
  validEntityType,
  validIsoDate,
  validName,
  validOpportunityPriority,
  validOpportunityStatus,
  validUuid,
} from "../../domain/crm.js";
import { sanitizeCsvCell } from "../../domain/csv-import.js";
import { audit } from "../audit/service.js";
import { admin, operatorOrAdmin } from "../patients/authorization.js";

const qLimit = (value?: string, fallback = 100, max = 500) => {
  const n = Number(value ?? fallback);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback;
};

const boolFrom = (value?: string) =>
  value === undefined ? undefined : value === "true" ? true : value === "false" ? false : undefined;

const csvCell = (value: unknown) => `"${sanitizeCsvCell(String(value ?? "")).replaceAll('"', '""')}"`;

export async function crmRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: { search?: string; accountType?: string; active?: string; limit?: string };
  }>("/api/crm/accounts", { preHandler: operatorOrAdmin }, async (request) => {
    const values: unknown[] = [];
    const terms: string[] = [];
    if (request.query.search?.trim()) {
      values.push(`%${request.query.search.trim()}%`);
      terms.push(`(a.name ILIKE $${values.length} OR a.phone ILIKE $${values.length} OR COALESCE(a.email,'') ILIKE $${values.length})`);
    }
    if (request.query.accountType && validAccountType(request.query.accountType)) {
      values.push(request.query.accountType);
      terms.push(`a.account_type = $${values.length}`);
    }
    const active = boolFrom(request.query.active);
    if (active !== undefined) {
      values.push(active);
      terms.push(`a.active = $${values.length}`);
    }
    values.push(qLimit(request.query.limit));
    const result = await pool.query(
      `SELECT a.*, u.name owner_name
       FROM crm_accounts a
       LEFT JOIN users u ON u.id = a.owner_user_id
       ${terms.length ? `WHERE ${terms.join(" AND ")}` : ""}
       ORDER BY a.name
       LIMIT $${values.length}`,
      values,
    );
    return { accounts: result.rows };
  });

  app.post<{
    Body: {
      name?: string;
      accountType?: string;
      document?: string;
      phone?: string;
      email?: string;
      ownerUserId?: string | null;
      active?: boolean;
      notes?: string;
      customFields?: Record<string, unknown>;
    };
  }>("/api/crm/accounts", { preHandler: operatorOrAdmin }, async (request, reply) => {
    const body = request.body ?? {};
    if (!validName(body.name) || !validAccountType(body.accountType) || !validCustomFields(body.customFields)) {
      return reply.code(400).type("application/problem+json").send({ title: "Confira nome, tipo e campos personalizados da conta", status: 400 });
    }
    if (body.ownerUserId && !validUuid(body.ownerUserId)) {
      return reply.code(400).type("application/problem+json").send({ title: "Responsável inválido", status: 400 });
    }
    const id = randomUUID();
    await pool.query(
      `INSERT INTO crm_accounts(id,name,account_type,document,phone,email,owner_user_id,active,notes,custom_fields,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        id,
        body.name!.trim(),
        body.accountType,
        body.document?.trim() || null,
        body.phone?.trim() || "",
        body.email?.trim() || null,
        body.ownerUserId || null,
        body.active ?? true,
        body.notes?.trim() || "",
        body.customFields ?? {},
        request.currentUser!.id,
      ],
    );
    await audit(request.currentUser!.id, "create", "crm_account", id);
    return reply.code(201).send({ id });
  });

  app.patch<{
    Params: { id: string };
    Body: {
      name?: string;
      accountType?: string;
      document?: string | null;
      phone?: string;
      email?: string | null;
      ownerUserId?: string | null;
      active?: boolean;
      notes?: string;
      customFields?: Record<string, unknown>;
    };
  }>("/api/crm/accounts/:id", { preHandler: operatorOrAdmin }, async (request, reply) => {
    const body = request.body ?? {};
    if (!validName(body.name) || !validAccountType(body.accountType) || !validCustomFields(body.customFields)) {
      return reply.code(400).type("application/problem+json").send({ title: "Confira os dados da conta", status: 400 });
    }
    const result = await pool.query(
      `UPDATE crm_accounts
       SET name=$2, account_type=$3, document=$4, phone=$5, email=$6, owner_user_id=$7, active=$8, notes=$9, custom_fields=$10, updated_at=now()
       WHERE id=$1
       RETURNING id`,
      [
        request.params.id,
        body.name!.trim(),
        body.accountType,
        body.document?.trim() || null,
        body.phone?.trim() || "",
        body.email?.trim() || null,
        body.ownerUserId || null,
        body.active ?? true,
        body.notes?.trim() || "",
        body.customFields ?? {},
      ],
    );
    if (!result.rowCount) return reply.code(404).type("application/problem+json").send({ title: "Conta CRM não encontrada", status: 404 });
    await audit(request.currentUser!.id, "update", "crm_account", request.params.id);
    return reply.code(204).send();
  });

  app.get<{
    Querystring: { search?: string; accountId?: string; patientId?: string; active?: string; limit?: string };
  }>("/api/crm/contacts", { preHandler: operatorOrAdmin }, async (request) => {
    const values: unknown[] = [];
    const terms: string[] = [];
    if (request.query.search?.trim()) {
      values.push(`%${request.query.search.trim()}%`);
      terms.push(`(c.name ILIKE $${values.length} OR c.phone ILIKE $${values.length} OR COALESCE(c.email,'') ILIKE $${values.length})`);
    }
    if (request.query.accountId && validUuid(request.query.accountId)) {
      values.push(request.query.accountId);
      terms.push(`c.account_id = $${values.length}`);
    }
    if (request.query.patientId && validUuid(request.query.patientId)) {
      values.push(request.query.patientId);
      terms.push(`c.patient_id = $${values.length}`);
    }
    const active = boolFrom(request.query.active);
    if (active !== undefined) {
      values.push(active);
      terms.push(`c.active = $${values.length}`);
    }
    values.push(qLimit(request.query.limit));
    const result = await pool.query(
      `SELECT c.*, a.name account_name, p.name patient_name, u.name owner_name
       FROM crm_contacts c
       LEFT JOIN crm_accounts a ON a.id = c.account_id
       LEFT JOIN patients p ON p.id = c.patient_id
       LEFT JOIN users u ON u.id = c.owner_user_id
       ${terms.length ? `WHERE ${terms.join(" AND ")}` : ""}
       ORDER BY c.name
       LIMIT $${values.length}`,
      values,
    );
    return { contacts: result.rows };
  });

  app.post<{
    Body: {
      accountId?: string | null;
      patientId?: string | null;
      name?: string;
      phone?: string;
      email?: string;
      roleTitle?: string;
      ownerUserId?: string | null;
      active?: boolean;
      notes?: string;
      customFields?: Record<string, unknown>;
    };
  }>("/api/crm/contacts", { preHandler: operatorOrAdmin }, async (request, reply) => {
    const body = request.body ?? {};
    if (!validName(body.name) || !validCustomFields(body.customFields)) {
      return reply.code(400).type("application/problem+json").send({ title: "Confira os dados do contato", status: 400 });
    }
    const id = randomUUID();
    await pool.query(
      `INSERT INTO crm_contacts(id,account_id,patient_id,name,phone,email,role_title,owner_user_id,active,notes,custom_fields,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        id,
        body.accountId || null,
        body.patientId || null,
        body.name!.trim(),
        body.phone?.trim() || "",
        body.email?.trim() || null,
        body.roleTitle?.trim() || "",
        body.ownerUserId || null,
        body.active ?? true,
        body.notes?.trim() || "",
        body.customFields ?? {},
        request.currentUser!.id,
      ],
    );
    await audit(request.currentUser!.id, "create", "crm_contact", id);
    return reply.code(201).send({ id });
  });

  app.patch<{
    Params: { id: string };
    Body: {
      accountId?: string | null;
      patientId?: string | null;
      name?: string;
      phone?: string;
      email?: string | null;
      roleTitle?: string;
      ownerUserId?: string | null;
      active?: boolean;
      notes?: string;
      customFields?: Record<string, unknown>;
    };
  }>("/api/crm/contacts/:id", { preHandler: operatorOrAdmin }, async (request, reply) => {
    const body = request.body ?? {};
    if (!validName(body.name) || !validCustomFields(body.customFields)) {
      return reply.code(400).type("application/problem+json").send({ title: "Confira os dados do contato", status: 400 });
    }
    const result = await pool.query(
      `UPDATE crm_contacts
       SET account_id=$2, patient_id=$3, name=$4, phone=$5, email=$6, role_title=$7, owner_user_id=$8, active=$9, notes=$10, custom_fields=$11, updated_at=now()
       WHERE id=$1
       RETURNING id`,
      [
        request.params.id,
        body.accountId || null,
        body.patientId || null,
        body.name!.trim(),
        body.phone?.trim() || "",
        body.email?.trim() || null,
        body.roleTitle?.trim() || "",
        body.ownerUserId || null,
        body.active ?? true,
        body.notes?.trim() || "",
        body.customFields ?? {},
      ],
    );
    if (!result.rowCount) return reply.code(404).type("application/problem+json").send({ title: "Contato CRM não encontrado", status: 404 });
    await audit(request.currentUser!.id, "update", "crm_contact", request.params.id);
    return reply.code(204).send();
  });

  app.get("/api/crm/pipelines", { preHandler: operatorOrAdmin }, async () => {
    const pipelines = await pool.query(
      `SELECT p.id, p.name, p.active,
              COALESCE(json_agg(json_build_object('id', s.id, 'name', s.name, 'position', s.position, 'is_terminal', s.is_terminal, 'active', s.active)
                ORDER BY s.position) FILTER (WHERE s.id IS NOT NULL), '[]') stages
       FROM crm_pipelines p
       LEFT JOIN crm_stages s ON s.pipeline_id = p.id
       GROUP BY p.id, p.name, p.active
       ORDER BY p.name`,
    );
    return { pipelines: pipelines.rows };
  });

  app.post<{ Body: { name?: string; stages?: string[] } }>("/api/crm/pipelines", { preHandler: admin }, async (request, reply) => {
    const body = request.body ?? {};
    if (!validName(body.name)) {
      return reply.code(400).type("application/problem+json").send({ title: "Informe o nome do pipeline", status: 400 });
    }
    const id = randomUUID();
    const stages = (body.stages ?? ["Novo", "Qualificado", "Proposta", "Fechado"]).map((item) => item.trim()).filter(Boolean);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("INSERT INTO crm_pipelines(id,name,created_by) VALUES($1,$2,$3)", [id, body.name!.trim(), request.currentUser!.id]);
      for (const [index, stage] of stages.entries()) {
        await client.query(
          "INSERT INTO crm_stages(id,pipeline_id,name,position,is_terminal,created_by) VALUES($1,$2,$3,$4,$5,$6)",
          [randomUUID(), id, stage, index + 1, /fechado|won|lost/i.test(stage), request.currentUser!.id],
        );
      }
      await client.query("COMMIT");
      await audit(request.currentUser!.id, "create", "crm_pipeline", id);
      return reply.code(201).send({ id });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  });

  app.patch<{ Params: { id: string }; Body: { name?: string; active?: boolean } }>("/api/crm/pipelines/:id", { preHandler: admin }, async (request, reply) => {
    const body = request.body ?? {};
    if (!validName(body.name)) return reply.code(400).type("application/problem+json").send({ title: "Informe o nome do pipeline", status: 400 });
    const result = await pool.query("UPDATE crm_pipelines SET name=$2, active=$3 WHERE id=$1 RETURNING id", [request.params.id, body.name!.trim(), body.active ?? true]);
    if (!result.rowCount) return reply.code(404).type("application/problem+json").send({ title: "Pipeline não encontrado", status: 404 });
    await audit(request.currentUser!.id, "update", "crm_pipeline", request.params.id);
    return reply.code(204).send();
  });

  app.post<{ Params: { pipelineId: string }; Body: { name?: string; position?: number; isTerminal?: boolean } }>(
    "/api/crm/pipelines/:pipelineId/stages",
    { preHandler: admin },
    async (request, reply) => {
      const body = request.body ?? {};
      if (!validName(body.name) || !Number.isInteger(body.position) || Number(body.position) < 1) {
        return reply.code(400).type("application/problem+json").send({ title: "Confira nome e posição do stage", status: 400 });
      }
      const id = randomUUID();
      await pool.query(
        "INSERT INTO crm_stages(id,pipeline_id,name,position,is_terminal,created_by) VALUES($1,$2,$3,$4,$5,$6)",
        [id, request.params.pipelineId, body.name!.trim(), body.position, body.isTerminal ?? false, request.currentUser!.id],
      );
      await audit(request.currentUser!.id, "create", "crm_stage", id);
      return reply.code(201).send({ id });
    },
  );

  app.patch<{
    Params: { pipelineId: string; stageId: string };
    Body: { name?: string; position?: number; isTerminal?: boolean; active?: boolean };
  }>("/api/crm/pipelines/:pipelineId/stages/:stageId", { preHandler: admin }, async (request, reply) => {
    const body = request.body ?? {};
    if (!validName(body.name) || !Number.isInteger(body.position) || Number(body.position) < 1) {
      return reply.code(400).type("application/problem+json").send({ title: "Confira nome e posição do stage", status: 400 });
    }
    const result = await pool.query(
      `UPDATE crm_stages SET name=$3, position=$4, is_terminal=$5, active=$6
       WHERE id=$1 AND pipeline_id=$2 RETURNING id`,
      [request.params.stageId, request.params.pipelineId, body.name!.trim(), body.position, body.isTerminal ?? false, body.active ?? true],
    );
    if (!result.rowCount) return reply.code(404).type("application/problem+json").send({ title: "Stage não encontrado", status: 404 });
    await audit(request.currentUser!.id, "update", "crm_stage", request.params.stageId);
    return reply.code(204).send();
  });

  app.get<{
    Querystring: {
      search?: string;
      pipelineId?: string;
      stageId?: string;
      ownerUserId?: string;
      priority?: string;
      status?: string;
      limit?: string;
    };
  }>("/api/crm/opportunities", { preHandler: operatorOrAdmin }, async (request) => {
    const values: unknown[] = [];
    const terms: string[] = [];
    if (request.query.search?.trim()) {
      values.push(`%${request.query.search.trim()}%`);
      terms.push(`(o.title ILIKE $${values.length} OR COALESCE(a.name,'') ILIKE $${values.length} OR COALESCE(c.name,'') ILIKE $${values.length})`);
    }
    for (const [value, field, guard] of [
      [request.query.pipelineId, "o.pipeline_id", validUuid],
      [request.query.stageId, "o.stage_id", validUuid],
      [request.query.ownerUserId, "o.owner_user_id", validUuid],
    ] as const) {
      if (value && guard(value)) {
        values.push(value);
        terms.push(`${field} = $${values.length}`);
      }
    }
    if (request.query.priority && validOpportunityPriority(request.query.priority)) {
      values.push(request.query.priority);
      terms.push(`o.priority = $${values.length}`);
    }
    if (request.query.status && validOpportunityStatus(request.query.status)) {
      values.push(request.query.status);
      terms.push(`o.status = $${values.length}`);
    }
    values.push(qLimit(request.query.limit));
    const result = await pool.query(
      `SELECT o.*, p.name pipeline_name, s.name stage_name, s.position stage_position, s.is_terminal,
              a.name account_name, c.name contact_name, patient.name patient_name, u.name owner_name
       FROM crm_opportunities o
       JOIN crm_pipelines p ON p.id = o.pipeline_id
       JOIN crm_stages s ON s.id = o.stage_id
       LEFT JOIN crm_accounts a ON a.id = o.account_id
       LEFT JOIN crm_contacts c ON c.id = o.contact_id
       LEFT JOIN patients patient ON patient.id = o.patient_id
       LEFT JOIN users u ON u.id = o.owner_user_id
       ${terms.length ? `WHERE ${terms.join(" AND ")}` : ""}
       ORDER BY p.name, s.position, o.updated_at DESC
       LIMIT $${values.length}`,
      values,
    );
    return { opportunities: result.rows };
  });

  app.get("/api/crm/opportunities.csv", { preHandler: operatorOrAdmin }, async (_request, reply) => {
    const result = await pool.query(
      `SELECT o.title, p.name pipeline_name, s.name stage_name, o.status, o.priority, o.estimated_value_cents,
              o.probability_percent, o.lead_source, o.expected_close_on, a.name account_name, c.name contact_name
       FROM crm_opportunities o
       JOIN crm_pipelines p ON p.id = o.pipeline_id
       JOIN crm_stages s ON s.id = o.stage_id
       LEFT JOIN crm_accounts a ON a.id = o.account_id
       LEFT JOIN crm_contacts c ON c.id = o.contact_id
       ORDER BY p.name, s.position, o.updated_at DESC`,
    );
    const lines = [
      ["titulo", "pipeline", "stage", "status", "prioridade", "valor_centavos", "probabilidade", "origem", "previsao", "conta", "contato"].map(csvCell).join(","),
      ...result.rows.map((row) =>
        [row.title, row.pipeline_name, row.stage_name, row.status, row.priority, row.estimated_value_cents, row.probability_percent, row.lead_source, row.expected_close_on, row.account_name, row.contact_name].map(csvCell).join(","),
      ),
    ];
    return reply.header("Content-Type", "text/csv; charset=utf-8").send(`\uFEFF${lines.join("\r\n")}\r\n`);
  });

  app.post<{
    Body: {
      pipelineId?: string;
      stageId?: string;
      accountId?: string | null;
      contactId?: string | null;
      patientId?: string | null;
      ownerUserId?: string | null;
      title?: string;
      priority?: string;
      status?: string;
      estimatedValueCents?: number;
      probabilityPercent?: number;
      leadSource?: string;
      expectedCloseOn?: string;
      notes?: string;
      customFields?: Record<string, unknown>;
    };
  }>("/api/crm/opportunities", { preHandler: operatorOrAdmin }, async (request, reply) => {
    const body = request.body ?? {};
    if (
      !validUuid(body.pipelineId) ||
      !validUuid(body.stageId) ||
      !validName(body.title) ||
      !validOpportunityPriority(body.priority ?? "medium") ||
      !validOpportunityStatus(body.status ?? "open") ||
      !integerCents(body.estimatedValueCents ?? 0) ||
      !integerPercent(body.probabilityPercent ?? 0) ||
      !validCustomFields(body.customFields) ||
      (body.expectedCloseOn && !validIsoDate(body.expectedCloseOn))
    ) {
      return reply.code(400).type("application/problem+json").send({ title: "Confira os dados da oportunidade", status: 400 });
    }
    const id = randomUUID();
    await pool.query(
      `INSERT INTO crm_opportunities(id,pipeline_id,stage_id,account_id,contact_id,patient_id,owner_user_id,title,priority,status,estimated_value_cents,probability_percent,lead_source,expected_close_on,notes,custom_fields,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        id,
        body.pipelineId,
        body.stageId,
        body.accountId || null,
        body.contactId || null,
        body.patientId || null,
        body.ownerUserId || null,
        body.title!.trim(),
        body.priority ?? "medium",
        body.status ?? "open",
        body.estimatedValueCents ?? 0,
        body.probabilityPercent ?? 0,
        body.leadSource?.trim() || "other",
        body.expectedCloseOn || null,
        body.notes?.trim() || "",
        body.customFields ?? {},
        request.currentUser!.id,
      ],
    );
    await pool.query(
      `INSERT INTO audit_events(user_id,action,entity_type,entity_id,details)
       VALUES($1,'create','crm_opportunity',$2,$3)`,
      [request.currentUser!.id, id, { stageId: body.stageId, status: body.status ?? "open" }],
    );
    return reply.code(201).send({ id });
  });

  app.patch<{
    Params: { id: string };
    Body: {
      pipelineId?: string;
      stageId?: string;
      accountId?: string | null;
      contactId?: string | null;
      patientId?: string | null;
      ownerUserId?: string | null;
      title?: string;
      priority?: string;
      status?: string;
      estimatedValueCents?: number;
      probabilityPercent?: number;
      leadSource?: string;
      expectedCloseOn?: string | null;
      notes?: string;
      customFields?: Record<string, unknown>;
    };
  }>("/api/crm/opportunities/:id", { preHandler: operatorOrAdmin }, async (request, reply) => {
    const body = request.body ?? {};
    if (
      !validUuid(body.pipelineId) ||
      !validUuid(body.stageId) ||
      !validName(body.title) ||
      !validOpportunityPriority(body.priority ?? "medium") ||
      !validOpportunityStatus(body.status ?? "open") ||
      !integerCents(body.estimatedValueCents ?? 0) ||
      !integerPercent(body.probabilityPercent ?? 0) ||
      !validCustomFields(body.customFields) ||
      (body.expectedCloseOn && !validIsoDate(body.expectedCloseOn))
    ) {
      return reply.code(400).type("application/problem+json").send({ title: "Confira os dados da oportunidade", status: 400 });
    }
    const stage = await pool.query<{ is_terminal: boolean }>("SELECT is_terminal FROM crm_stages WHERE id=$1", [body.stageId]);
    if (!stage.rowCount) return reply.code(404).type("application/problem+json").send({ title: "Stage não encontrado", status: 404 });
    if (["won", "lost"].includes(body.status ?? "open") && !stage.rows[0].is_terminal) {
      return reply.code(409).type("application/problem+json").send({ title: "Oportunidades ganhas ou perdidas exigem stage terminal", status: 409 });
    }
    const result = await pool.query(
      `UPDATE crm_opportunities
       SET pipeline_id=$2, stage_id=$3, account_id=$4, contact_id=$5, patient_id=$6, owner_user_id=$7, title=$8, priority=$9,
           status=$10, estimated_value_cents=$11, probability_percent=$12, lead_source=$13, expected_close_on=$14,
           notes=$15, custom_fields=$16, updated_at=now(), closed_at=CASE WHEN $10 IN ('won','lost') THEN now() ELSE NULL END
       WHERE id=$1
       RETURNING id`,
      [
        request.params.id,
        body.pipelineId,
        body.stageId,
        body.accountId || null,
        body.contactId || null,
        body.patientId || null,
        body.ownerUserId || null,
        body.title!.trim(),
        body.priority ?? "medium",
        body.status ?? "open",
        body.estimatedValueCents ?? 0,
        body.probabilityPercent ?? 0,
        body.leadSource?.trim() || "other",
        body.expectedCloseOn || null,
        body.notes?.trim() || "",
        body.customFields ?? {},
      ],
    );
    if (!result.rowCount) return reply.code(404).type("application/problem+json").send({ title: "Oportunidade não encontrada", status: 404 });
    await pool.query(
      `INSERT INTO audit_events(user_id,action,entity_type,entity_id,details)
       VALUES($1,'update','crm_opportunity',$2,$3)`,
      [request.currentUser!.id, request.params.id, { stageId: body.stageId, status: body.status ?? "open" }],
    );
    return reply.code(204).send();
  });

  app.post<{ Params: { id: string }; Body: { stageId?: string; status?: string } }>(
    "/api/crm/opportunities/:id/move",
    { preHandler: operatorOrAdmin },
    async (request, reply) => {
      const stageId = request.body?.stageId;
      const status = request.body?.status;
      if (!validUuid(stageId)) return reply.code(400).type("application/problem+json").send({ title: "Stage inválido", status: 400 });
      if (status && !validOpportunityStatus(status)) return reply.code(400).type("application/problem+json").send({ title: "Status inválido", status: 400 });
      const stage = await pool.query<{ is_terminal: boolean }>("SELECT is_terminal FROM crm_stages WHERE id=$1", [stageId]);
      if (!stage.rowCount) return reply.code(404).type("application/problem+json").send({ title: "Stage não encontrado", status: 404 });
      if (status && ["won", "lost"].includes(status) && !stage.rows[0].is_terminal) {
        return reply.code(409).type("application/problem+json").send({ title: "Ganhar/perder exige stage terminal", status: 409 });
      }
      const result = await pool.query(
        `UPDATE crm_opportunities
         SET stage_id=$2, status=COALESCE($3,status), updated_at=now(), closed_at=CASE WHEN COALESCE($3,status) IN ('won','lost') THEN now() ELSE NULL END
         WHERE id=$1
         RETURNING id`,
        [request.params.id, stageId, status || null],
      );
      if (!result.rowCount) return reply.code(404).type("application/problem+json").send({ title: "Oportunidade não encontrada", status: 404 });
      await pool.query(
        `INSERT INTO audit_events(user_id,action,entity_type,entity_id,details)
         VALUES($1,'move_stage','crm_opportunity',$2,$3)`,
        [request.currentUser!.id, request.params.id, { stageId, status: status ?? null }],
      );
      return reply.code(204).send();
    },
  );

  app.get<{
    Querystring: { entityType?: string; entityId?: string; ownerUserId?: string; openOnly?: string; limit?: string };
  }>("/api/crm/activities", { preHandler: operatorOrAdmin }, async (request, reply) => {
    if (request.query.entityType && !validEntityType(request.query.entityType)) {
      return reply.code(400).type("application/problem+json").send({ title: "Tipo de entidade inválido", status: 400 });
    }
    const values: unknown[] = [];
    const terms: string[] = [];
    if (request.query.entityType) {
      values.push(request.query.entityType);
      terms.push(`activity.entity_type = $${values.length}`);
    }
    if (request.query.entityId && validUuid(request.query.entityId)) {
      values.push(request.query.entityId);
      terms.push(`activity.entity_id = $${values.length}`);
    }
    if (request.query.ownerUserId && validUuid(request.query.ownerUserId)) {
      values.push(request.query.ownerUserId);
      terms.push(`activity.owner_user_id = $${values.length}`);
    }
    if (request.query.openOnly === "true") {
      terms.push("activity.completed_at IS NULL");
    }
    values.push(qLimit(request.query.limit));
    const result = await pool.query(
      `SELECT activity.*, owner.name owner_name, creator.name created_by_name
       FROM crm_activities activity
       LEFT JOIN users owner ON owner.id = activity.owner_user_id
       JOIN users creator ON creator.id = activity.created_by
       ${terms.length ? `WHERE ${terms.join(" AND ")}` : ""}
       ORDER BY activity.completed_at NULLS FIRST, activity.due_at NULLS LAST, activity.created_at DESC
       LIMIT $${values.length}`,
      values,
    );
    return { activities: result.rows };
  });

  app.post<{
    Body: {
      entityType?: string;
      entityId?: string;
      activityType?: string;
      subject?: string;
      description?: string;
      dueAt?: string;
      ownerUserId?: string | null;
    };
  }>("/api/crm/activities", { preHandler: operatorOrAdmin }, async (request, reply) => {
    const body = request.body ?? {};
    if (
      !validEntityType(body.entityType) ||
      !validUuid(body.entityId) ||
      !validActivityType(body.activityType) ||
      !validName(body.subject) ||
      (body.dueAt && !body.dueAt.includes("T"))
    ) {
      return reply.code(400).type("application/problem+json").send({ title: "Confira os dados da atividade", status: 400 });
    }
    const id = randomUUID();
    await pool.query(
      `INSERT INTO crm_activities(id,entity_type,entity_id,activity_type,subject,description,due_at,owner_user_id,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, body.entityType, body.entityId, body.activityType, body.subject!.trim(), body.description?.trim() || "", body.dueAt || null, body.ownerUserId || null, request.currentUser!.id],
    );
    await audit(request.currentUser!.id, "create", "crm_activity", id);
    return reply.code(201).send({ id });
  });

  app.patch<{ Params: { id: string }; Body: { completed?: boolean } }>("/api/crm/activities/:id", { preHandler: operatorOrAdmin }, async (request, reply) => {
    if (request.body?.completed !== true) return reply.code(400).type("application/problem+json").send({ title: "Apenas conclusão é suportada nesta etapa", status: 400 });
    const result = await pool.query(
      "UPDATE crm_activities SET completed_at=now() WHERE id=$1 AND completed_at IS NULL RETURNING id",
      [request.params.id],
    );
    if (!result.rowCount) return reply.code(409).type("application/problem+json").send({ title: "Atividade não encontrada ou já concluída", status: 409 });
    await audit(request.currentUser!.id, "complete", "crm_activity", request.params.id);
    return reply.code(204).send();
  });
}
