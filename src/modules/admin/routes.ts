import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { pool } from "../../db/pool.js";
import { hashPassword } from "../../domain/security.js";
import { audit } from "../audit/service.js";
import { admin } from "../patients/authorization.js";

export async function adminRoutes(app: FastifyInstance) {
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
}
