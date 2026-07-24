import type { FastifyInstance } from "fastify";
import { pool } from "../../db/pool.js";
import { verifyPassword } from "../../domain/security.js";
import {
  ANONYMIZED_PHONE,
  ANONYMIZED_TEXT_PLACEHOLDER,
  anonymizePatientName,
  formatLgpdExportPackage,
} from "../../domain/privacy.js";
import { audit } from "../audit/service.js";
import { admin, authenticated, loadAndAuthorizePatient } from "../patients/authorization.js";

export async function privacyRoutes(app: FastifyInstance) {
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

        await client.query(
          "INSERT INTO patient_redactions(patient_id, reason, requested_by) VALUES($1, $2, $3)",
          [request.params.id, reason.trim(), request.currentUser!.id]
        );

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
}
