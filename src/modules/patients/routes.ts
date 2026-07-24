import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { pool } from "../../db/pool.js";
import { canModifyDoctorAssignment } from "../../domain/security.js";
import {
  CONTACT_SOURCES,
  isOneOf,
  normalizePhone,
  PATIENT_EVENT_TYPES,
  PATIENT_STATUSES,
  validPatientName,
  validPatientPhone,
} from "../../domain/patients.js";
import { FOLLOW_UP_FILTERS } from "../../domain/follow-ups.js";
import { ANONYMIZED_TEXT_PLACEHOLDER } from "../../domain/privacy.js";
import { audit, auditDenial } from "../audit/service.js";
import { authenticated, loadAndAuthorizePatient } from "./authorization.js";

export async function patientRoutes(app: FastifyInstance) {
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
}
