import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { pool } from "../../db/pool.js";
import { ANONYMIZED_TEXT_PLACEHOLDER } from "../../domain/privacy.js";
import { authenticated, loadAndAuthorizePatient } from "../patients/authorization.js";

export async function doctorRoutes(app: FastifyInstance) {
  app.get("/api/doctors", { preHandler: authenticated }, async () => ({
    doctors: (
      await pool.query(
        "SELECT id, name, email, role, license_number, specialty FROM users WHERE role IN ('doctor', 'admin') AND active ORDER BY name"
      )
    ).rows,
  }));

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
}
