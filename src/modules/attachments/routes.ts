import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { pool } from "../../db/pool.js";
import { config } from "../../config.js";
import {
  sanitizeFilename,
  validFileSize,
  validMimeType,
  generateStorageKey,
  validateBase64Strict,
  reconcileOrphanAttachments,
  type AttachmentStorage,
  type AttachmentScanner,
} from "../../domain/attachments.js";
import { audit } from "../audit/service.js";
import { admin, authenticated, loadAndAuthorizePatient } from "../patients/authorization.js";

export async function attachmentRoutes(
  app: FastifyInstance,
  opts: { attachmentStorage: AttachmentStorage; attachmentScanner: AttachmentScanner }
) {
  const { attachmentStorage, attachmentScanner } = opts;

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
}
