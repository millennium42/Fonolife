import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { pool } from "../../db/pool.js";
import { validMedicalReport } from "../../domain/reports.js";
import { audit } from "../audit/service.js";
import { authenticated, loadAndAuthorizePatient } from "../patients/authorization.js";

type CreateReportBody = {
  title?: string;
  diagnosis?: string;
  audiometricFindings?: string;
  recommendation?: string;
  conclusion?: string;
};

export async function reportRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>(
    "/api/patients/:id/medical-reports",
    { preHandler: authenticated },
    async (request, reply) => {
      const authorized = await loadAndAuthorizePatient(request, reply, request.params.id, "read");
      if (!authorized) return;

      const result = await pool.query(
        `SELECT r.*, u.name as doctor_name, u.license_number as doctor_license, u.specialty as doctor_specialty
         FROM medical_reports r
         JOIN users u ON u.id = r.issued_by
         WHERE r.patient_id = $1 AND r.archived_at IS NULL
         ORDER BY r.issued_at DESC`,
        [request.params.id]
      );

      return { reports: result.rows };
    }
  );

  app.post<{ Params: { id: string }; Body: CreateReportBody }>(
    "/api/patients/:id/medical-reports",
    { preHandler: authenticated },
    async (request, reply) => {
      const authorized = await loadAndAuthorizePatient(request, reply, request.params.id, "write");
      if (!authorized) return;

      const userRes = await pool.query("SELECT id, name, license_number, specialty FROM users WHERE id = $1", [request.currentUser!.id]);
      const user = userRes.rows[0];

      if (!user?.license_number?.trim()) {
        return reply.code(400).type("application/problem+json").send({
          title: "Profissional deve possuir número de registro CRM ou CRFa para emitir laudo formal",
          status: 400,
        });
      }

      const { title, diagnosis, audiometricFindings, recommendation, conclusion } = request.body ?? {};

      if (!validMedicalReport({ title, diagnosis, recommendation, professionalLicense: user.license_number })) {
        return reply.code(400).type("application/problem+json").send({
          title: "Preencha todos os campos obrigatórios do laudo (Título, Diagnóstico, Conduta/Recomendação)",
          status: 400,
        });
      }

      const reportId = randomUUID();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        await client.query(
          `INSERT INTO medical_reports(id, patient_id, title, diagnosis, audiometric_findings, recommendation, conclusion, professional_name, professional_license, issued_by)
           VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            reportId,
            request.params.id,
            title!.trim(),
            diagnosis!.trim(),
            (audiometricFindings || "").trim(),
            recommendation!.trim(),
            (conclusion || "").trim(),
            user.name,
            user.license_number,
            user.id,
          ]
        );

        await client.query(
          "INSERT INTO patient_events(id, patient_id, event_type, description, created_by) VALUES($1, $2, 'clinical_note', $3, $4)",
          [randomUUID(), request.params.id, `Laudo Clínico Emitido: ${title!.trim()} por ${user.name} (${user.license_number})`, user.id]
        );

        await client.query(
          "INSERT INTO audit_events(user_id, action, entity_type, entity_id, details) VALUES($1, 'create', 'medical_report', $2, $3)",
          [user.id, reportId, { patientId: request.params.id, title: title!.trim(), license: user.license_number }]
        );

        await client.query("COMMIT");
        return reply.code(201).send({ id: reportId, title: title!.trim() });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/medical-reports/:id",
    { preHandler: authenticated },
    async (request, reply) => {
      const result = await pool.query(
        `SELECT r.*, p.name as patient_name, p.phone as patient_phone, p.birth_date as patient_birth_date
         FROM medical_reports r
         JOIN patients p ON p.id = r.patient_id
         WHERE r.id = $1 AND r.archived_at IS NULL`,
        [request.params.id]
      );

      if (!result.rowCount) return reply.code(404).type("application/problem+json").send({ title: "Laudo não encontrado", status: 404 });

      const report = result.rows[0];
      const authorized = await loadAndAuthorizePatient(request, reply, report.patient_id, "read");
      if (!authorized) return;

      return report;
    }
  );

  app.post<{ Params: { id: string } }>(
    "/api/medical-reports/:id/print-audit",
    { preHandler: authenticated },
    async (request, reply) => {
      const result = await pool.query("SELECT patient_id, title FROM medical_reports WHERE id = $1", [request.params.id]);
      if (!result.rowCount) return reply.code(404).type("application/problem+json").send({ title: "Laudo não encontrado", status: 404 });

      const report = result.rows[0];
      const authorized = await loadAndAuthorizePatient(request, reply, report.patient_id, "read");
      if (!authorized) return;

      await audit(request.currentUser!.id, "print", "medical_report", request.params.id, {
        patientId: report.patient_id,
        title: report.title,
      });

      return reply.code(204).send();
    }
  );
}
