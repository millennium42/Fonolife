import { pool } from "../../db/pool.js";

export const audit = (
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details = {},
  queryable: { query: Function } = pool,
) =>
  queryable.query(
    "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)",
    [userId, action, entityType, entityId ?? null, details],
  );

export const auditDenial = async (
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
