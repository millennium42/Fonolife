import type { FastifyRequest, FastifyReply } from "fastify";
import { pool } from "../../db/pool.js";
import {
  canExportPatientData,
  canReadAttachment,
  canReadPatient,
  canWritePatient,
} from "../../domain/security.js";
import { auditDenial } from "../audit/service.js";

export const authenticated = async (request: FastifyRequest) => {
  if (!request.currentUser)
    throw Object.assign(new Error("Faça login para continuar"), {
      statusCode: 401,
    });
};

export const admin = async (request: FastifyRequest) => {
  await authenticated(request);
  if (request.currentUser?.role !== "admin")
    throw Object.assign(new Error("Acesso restrito ao administrador"), {
      statusCode: 403,
    });
};

export const operatorOrAdmin = async (request: FastifyRequest) => {
  await authenticated(request);
  if (!["admin", "operator"].includes(request.currentUser!.role))
    throw Object.assign(new Error("Acesso restrito à operação financeira"), {
      statusCode: 403,
    });
};

export const loadAndAuthorizePatient = async (
  request: FastifyRequest,
  reply: FastifyReply,
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
