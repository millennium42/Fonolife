import { randomBytes, randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { pool } from "../../db/pool.js";
import { config } from "../../config.js";
import { hashPassword, hashToken, verifyPassword } from "../../domain/security.js";

export async function authRoutes(app: FastifyInstance) {
  const attempts = new Map<string, { count: number; reset: number }>();

  const authenticated = async (request: FastifyRequest) => {
    if (!request.currentUser) {
      throw Object.assign(new Error("Faça login para continuar"), { statusCode: 401 });
    }
  };

  app.post<{ Body: { email?: string; password?: string } }>(
    "/api/auth/login",
    async (request, reply) => {
      const key = request.ip;
      const now = Date.now();
      const state = attempts.get(key);
      if (state && state.reset <= now) attempts.delete(key);
      if (state && state.reset > now && state.count >= 5) {
        return reply.code(429).send({ title: "Muitas tentativas. Aguarde 15 minutos.", status: 429 });
      }

      const email = request.body?.email?.trim().toLowerCase();
      const password = request.body?.password;
      const result = email
        ? await pool.query("SELECT * FROM users WHERE email=$1 AND active", [email])
        : { rows: [] };
      const user = result.rows[0];

      if (!user || !password || !(await verifyPassword(password, user.password_hash))) {
        attempts.set(key, {
          count: state?.reset && state.reset > now ? state.count + 1 : 1,
          reset: now + 900_000,
        });
        return reply.code(401).send({ title: "E-mail ou senha incorretos", status: 401 });
      }

      attempts.delete(key);
      const token = randomBytes(32).toString("base64url");
      await pool.query(
        `INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '8 hours')`,
        [randomUUID(), user.id, hashToken(token)]
      );
      await pool.query(
        "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'login','user',$2,$3)",
        [user.id, user.id, {}]
      );

      reply.setCookie("fonolife_session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: config.production,
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
      await pool.query("DELETE FROM user_sessions WHERE token_hash=$1", [hashToken(token)]);
    }
    await pool.query(
      "INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,'logout','user',$2,$3)",
      [request.currentUser!.id, request.currentUser!.id, {}]
    );
    reply.clearCookie("fonolife_session", { path: "/" });
    return reply.code(204).send();
  });

  app.get("/api/auth/me", { preHandler: authenticated }, async (request) => ({
    user: request.currentUser,
  }));
}
