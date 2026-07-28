import { randomBytes, randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { pool } from "../../db/pool.js";
import { config } from "../../config.js";
import { hashPassword, hashToken, verifyPassword } from "../../domain/security.js";
import {
  clearLoginFailures,
  isLoginRateLimited,
  recordLoginFailure,
  revokeUserSessions,
} from "./middleware.js";

export async function authRoutes(app: FastifyInstance) {
  const authenticated = async (request: FastifyRequest) => {
    if (!request.currentUser) {
      throw Object.assign(new Error("Faça login para continuar"), { statusCode: 401 });
    }
  };

  if (config.demo) {
    app.post<{ Body: { role?: "admin" | "operator" | "doctor" } }>(
      "/api/demo/session",
      async (request, reply) => {
        const role = request.body?.role;
        const ip = request.ip || "127.0.0.1";
        const rateLimitKey = role ? `demo:${role}` : "demo:invalid";

        if (!role || !["admin", "operator", "doctor"].includes(role)) {
          return reply.code(400).type("application/problem+json").send({
            title: "Perfil demonstrativo inválido",
            status: 400,
          });
        }
        if (await isLoginRateLimited(pool, ip, rateLimitKey)) {
          return reply.code(429).type("application/problem+json").send({
            title: "Muitas tentativas. Aguarde 15 minutos.",
            status: 429,
          });
        }

        const result = await pool.query<{
          id: string;
          name: string;
          email: string;
          role: "admin" | "operator" | "doctor";
          must_change_password: boolean;
        }>(
          "SELECT id,name,email,role,must_change_password FROM users WHERE role=$1 AND email LIKE $2 AND active ORDER BY email LIMIT 1",
          [role, "%@demo.invalid"],
        );
        const user = result.rows[0];
        if (!user) {
          await recordLoginFailure(pool, ip, rateLimitKey);
          return reply.code(503).type("application/problem+json").send({
            title: "Perfil demonstrativo indisponível",
            status: 503,
          });
        }

        await clearLoginFailures(pool, ip, rateLimitKey);
        const token = randomBytes(32).toString("base64url");
        await pool.query(
          `INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '8 hours')`,
          [randomUUID(), user.id, hashToken(token)],
        );
        await pool.query(
          "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'demo_session','user',$2,$3)",
          [user.id, user.id, { ip, role }],
        );
        reply.setCookie("fonolife_session", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: config.secureRuntime,
          path: "/",
          maxAge: 28_800,
        });
        return { user: { ...user, mustChangePassword: user.must_change_password } };
      },
    );
  }

  app.post<{ Body: { email?: string; password?: string } }>(
    "/api/auth/login",
    async (request, reply) => {
      const ip = request.ip || "127.0.0.1";
      const email = request.body?.email?.trim().toLowerCase();
      const password = request.body?.password;

      // Rate limit distribuído via PostgreSQL (chave composta por IP + e-mail normalizado)
      if (await isLoginRateLimited(pool, ip, email)) {
        return reply
          .code(429)
          .type("application/problem+json")
          .send({ title: "Muitas tentativas de login falhas. Aguarde 15 minutos.", status: 429 });
      }

      let user: {
        id: string;
        name: string;
        email: string;
        role: "admin" | "operator" | "doctor";
        password_hash: string;
        active: boolean;
        must_change_password: boolean;
      } | undefined;

      try {
        const result = email
          ? await pool.query<{
              id: string;
              name: string;
              email: string;
              role: "admin" | "operator" | "doctor";
              password_hash: string;
              active: boolean;
              must_change_password: boolean;
            }>("SELECT * FROM users WHERE email=$1 AND active", [email])
          : { rows: [] };
        user = result.rows[0];
      } catch {}

      const isPasswordValid = user && password
        ? await verifyPassword(password, user.password_hash).catch(() => false)
        : false;

      if (!user || !password || !isPasswordValid) {
        await recordLoginFailure(pool, ip, email);
        return reply
          .code(401)
          .type("application/problem+json")
          .send({ title: "E-mail ou senha incorretos", status: 401 });
      }

      // Reseta falhas acumuladas após autenticação bem-sucedida
      await clearLoginFailures(pool, ip, email);

      const token = randomBytes(32).toString("base64url");
      const tokenHash = hashToken(token);
      try {
        await pool.query(
          `INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '8 hours')`,
          [randomUUID(), user.id, tokenHash]
        );
        await pool.query(
          "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'login','user',$2,$3)",
          [user.id, user.id, { ip }]
        );
      } catch {
        // Ignora erros de persistência em modo offline
      }

      reply.setCookie("fonolife_session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: config.secureRuntime,
        path: "/",
        maxAge: 28_800,
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.must_change_password,
        },
      };
    }
  );

  app.post("/api/auth/logout", { preHandler: authenticated }, async (request, reply) => {
    const token = request.cookies.fonolife_session;
    if (token) {
      try {
        await pool.query("DELETE FROM user_sessions WHERE token_hash=$1", [hashToken(token)]);
      } catch {}
    }
    if (request.currentUser) {
      try {
        await pool.query(
          "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'logout','user',$2,$3)",
          [request.currentUser.id, request.currentUser.id, {}]
        );
      } catch {}
    }
    reply.clearCookie("fonolife_session", { path: "/" });
    return reply.code(204).send();
  });

  app.get("/api/auth/me", { preHandler: authenticated }, async (request) => ({
    user: request.currentUser,
  }));

  app.post<{ Body: { currentPassword?: string; newPassword?: string } }>(
    "/api/auth/change-password",
    { preHandler: authenticated },
    async (request, reply) => {
      const { currentPassword, newPassword } = request.body ?? {};
      if (!currentPassword || !newPassword || newPassword.length < 8) {
        return reply.code(400).type("application/problem+json").send({
          title: "A nova senha deve possuir ao menos 8 caracteres",
          status: 400,
        });
      }

      let storedHash: string | undefined;
      try {
        const userRes = await pool.query<{ password_hash: string }>(
          "SELECT password_hash FROM users WHERE id=$1 AND active",
          [request.currentUser!.id]
        );
        storedHash = userRes.rows[0]?.password_hash;
      } catch {}

      const isValid = storedHash
        ? await verifyPassword(currentPassword, storedHash).catch(() => false)
        : false;

      if (!isValid) {
        return reply.code(401).type("application/problem+json").send({
          title: "Senha atual incorreta",
          status: 401,
        });
      }

      const newHash = await hashPassword(newPassword);
      const currentToken = request.cookies.fonolife_session;
      const currentTokenHash = currentToken ? hashToken(currentToken) : undefined;

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const updateResult = await client.query(
          "UPDATE users SET password_hash=$1, must_change_password=false, updated_at=now() WHERE id=$2 AND active",
          [newHash, request.currentUser!.id]
        );
        if (!updateResult.rowCount) {
          await client.query("ROLLBACK");
          return reply.code(409).type("application/problem+json").send({
            title: "Não foi possível atualizar a senha. Tente novamente.",
            status: 409,
          });
        }
        await revokeUserSessions(client, request.currentUser!.id, currentTokenHash, true);
        await client.query(
          "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'change_password','user',$2,$3)",
          [request.currentUser!.id, request.currentUser!.id, { revokedOtherSessions: true }]
        );
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
      } finally {
        client.release();
      }

      return reply.code(204).send();
    }
  );
}
