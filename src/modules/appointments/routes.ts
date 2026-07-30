import type { FastifyInstance } from "fastify";
import { pool } from "../../db/pool.js";
import { authenticated } from "../patients/authorization.js";
import { lastDayOfMonth } from "../../domain/calendar.js";

export async function appointmentRoutes(app: FastifyInstance) {
  
  app.get<{ Querystring: { year?: string; month?: string; doctorId?: string } }>(
    "/api/appointments",
    { preHandler: authenticated },
    async (request, reply) => {
      const year = Number(request.query.year);
      const month = Number(request.query.month);

      if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
        return reply.code(400).type("application/problem+json").send({ title: "Ano ou mês inválido", status: 400 });
      }

      let doctorId = request.query.doctorId;
      
      if (request.currentUser!.role === "doctor") {
        doctorId = request.currentUser!.id;
      }

      const lastDay = lastDayOfMonth(year, month);
      const startDate = `${year}-${String(month).padStart(2, "0")}-01T00:00:00-03:00`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}T23:59:59.999-03:00`;

      const values: unknown[] = [startDate, endDate];
      let sql = `
        SELECT 
          id, patient_id as "patientId", doctor_id as "doctorId", 
          scheduled_start as "scheduledAt", 
          EXTRACT(EPOCH FROM (scheduled_end - scheduled_start))/60 as "durationMinutes", 
          appointment_type as "type", status, notes 
        FROM appointments
        WHERE scheduled_start >= $1 AND scheduled_start <= $2
      `;

      if (doctorId) {
        values.push(doctorId);
        sql += ` AND doctor_id = $${values.length}`;
      }

      sql += ` ORDER BY scheduled_start ASC`;

      const { rows } = await pool.query(sql, values);
      return { appointments: rows };
    }
  );

  app.post<{ Body: { patientId: string; doctorId: string; scheduledAt: string; durationMinutes: number; type: string; status: string; notes?: string } }>(
    "/api/appointments",
    { preHandler: authenticated },
    async (request, reply) => {
      const b = request.body;
      
      if (!b.patientId || !b.doctorId || !b.scheduledAt || !b.durationMinutes || !b.type || !b.status) {
        return reply.code(400).type("application/problem+json").send({ title: "Campos obrigatórios ausentes", status: 400 });
      }
      
      if (!Number.isInteger(b.durationMinutes) || b.durationMinutes <= 0) {
        return reply.code(400).type("application/problem+json").send({ title: "Duração inválida", status: 400 });
      }

      if (!['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'].includes(b.status)) {
        return reply.code(400).type("application/problem+json").send({ title: "Status inválido", status: 400 });
      }

      if (request.currentUser!.role === "doctor" && b.doctorId !== request.currentUser!.id) {
        return reply.code(403).type("application/problem+json").send({ title: "Acesso negado", status: 403 });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        
        const pat = await client.query("SELECT id FROM patients WHERE id = $1", [b.patientId]);
        if (pat.rowCount === 0) {
          await client.query("ROLLBACK");
          return reply.code(404).type("application/problem+json").send({ title: "Paciente não encontrado", status: 404 });
        }

        const doc = await client.query("SELECT id FROM users WHERE id = $1 AND role = 'doctor' AND active = true", [b.doctorId]);
        if (doc.rowCount === 0) {
          await client.query("ROLLBACK");
          return reply.code(404).type("application/problem+json").send({ title: "Médico não encontrado ou inativo", status: 404 });
        }
        
        const { rows } = await client.query(`
          INSERT INTO appointments (patient_id, doctor_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_by)
          VALUES ($1, $2, $3, $3::timestamptz + ($4 || ' minutes')::interval, $5, $6, $7, $8)
          RETURNING id, patient_id as "patientId", doctor_id as "doctorId", scheduled_start as "scheduledAt", EXTRACT(EPOCH FROM (scheduled_end - scheduled_start))/60 as "durationMinutes", appointment_type as "type", status, notes
        `, [b.patientId, b.doctorId, b.scheduledAt, String(b.durationMinutes), b.type, b.status, b.notes || null, request.currentUser!.id]);
        
        await client.query("COMMIT");
        return reply.code(201).send(rows[0]);
      } catch (e: any) {
        await client.query("ROLLBACK");
        return reply.code(400).type("application/problem+json").send({ title: e.message, status: 400 });
      } finally {
        client.release();
      }
    }
  );

  app.patch<{ Params: { id: string }; Body: { scheduledAt?: string; durationMinutes?: number; type?: string; status?: string; notes?: string } }>(
    "/api/appointments/:id",
    { preHandler: authenticated },
    async (request, reply) => {
      const id = request.params.id;
      const b = request.body;

      if (b.durationMinutes !== undefined && (!Number.isInteger(b.durationMinutes) || b.durationMinutes <= 0)) {
        return reply.code(400).type("application/problem+json").send({ title: "Duração inválida", status: 400 });
      }
      
      if (b.status !== undefined && !['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'].includes(b.status)) {
        return reply.code(400).type("application/problem+json").send({ title: "Status inválido", status: 400 });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const existing = await client.query("SELECT doctor_id FROM appointments WHERE id = $1", [id]);
        
        if (existing.rowCount === 0) {
          await client.query("ROLLBACK");
          return reply.code(404).type("application/problem+json").send({ title: "Agendamento não encontrado", status: 404 });
        }

        if (request.currentUser!.role === "doctor" && existing.rows[0].doctor_id !== request.currentUser!.id) {
          await client.query("ROLLBACK");
          return reply.code(403).type("application/problem+json").send({ title: "Acesso negado", status: 403 });
        }

        const updates: string[] = [];
        const values: unknown[] = [];
        let i = 1;

        if (b.scheduledAt !== undefined) {
          updates.push(`scheduled_start = $${i++}`);
          values.push(b.scheduledAt);
        }
        if (b.durationMinutes !== undefined) {
          // If scheduledAt is updated, we use the new scheduledAt, else we reference the existing one
          if (b.scheduledAt !== undefined) {
             updates.push(`scheduled_end = $${i-1}::timestamptz + interval '${b.durationMinutes} minutes'`);
          } else {
             updates.push(`scheduled_end = scheduled_start + interval '${b.durationMinutes} minutes'`);
          }
        } else if (b.scheduledAt !== undefined) {
          // If only scheduled_start is updated, we keep the existing duration
          updates.push(`scheduled_end = $${i-1}::timestamptz + (scheduled_end - scheduled_start)`);
        }
        if (b.type !== undefined) {
          updates.push(`appointment_type = $${i++}`);
          values.push(b.type);
        }
        if (b.status !== undefined) {
          updates.push(`status = $${i++}`);
          values.push(b.status);
        }
        if (b.notes !== undefined) {
          updates.push(`notes = $${i++}`);
          values.push(b.notes);
        }

        if (updates.length === 0) {
          await client.query("ROLLBACK");
          return reply.code(400).type("application/problem+json").send({ title: "Nenhum campo para atualizar", status: 400 });
        }

        updates.push(`updated_at = now()`);
        values.push(id);
        
        const { rows } = await client.query(`
          UPDATE appointments SET ${updates.join(", ")}
          WHERE id = $${i}
          RETURNING id, patient_id as "patientId", doctor_id as "doctorId", scheduled_start as "scheduledAt", EXTRACT(EPOCH FROM (scheduled_end - scheduled_start))/60 as "durationMinutes", appointment_type as "type", status, notes
        `, values);

        await client.query("COMMIT");
        return reply.send(rows[0]);
      } catch (e: any) {
        await client.query("ROLLBACK");
        return reply.code(400).type("application/problem+json").send({ title: e.message, status: 400 });
      } finally {
        client.release();
      }
    }
  );
}
