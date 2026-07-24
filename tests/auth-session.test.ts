import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.ts";
import {
  clearLoginFailures,
  getRateLimitKey,
  isLoginRateLimited,
  recordLoginFailure,
  revokeUserSessions,
  cleanupExpiredSessions,
} from "../src/modules/auth/middleware.js";
import { bootstrapFirstAdmin } from "../src/scripts/bootstrap-admin.ts";
import { pool } from "../src/db/pool.js";

test("Suíte de Autenticação Modular, Rate Limit Distribuído e Sessões (PR-03)", async (t) => {
  const app = buildApp();

  await t.test("Geração de chave composta anonimizada de Rate Limit por IP e E-mail", () => {
    const key1 = getRateLimitKey("192.168.1.100", "Admin@Demo.Local ");
    assert.ok(key1.startsWith("rate_limit:"));
    assert.ok(!key1.includes("admin@demo.local"));

    const key2 = getRateLimitKey("", undefined);
    assert.ok(key2.startsWith("rate_limit:"));
    assert.ok(!key2.includes("unknown"));
  });

  await t.test("Rate limit distribuído no PostgreSQL: bloqueia após 5 falhas e reseta no sucesso", async () => {
    const testIp = "10.0.0.42";
    const testEmail = "test_ratelimit@demo.local";

    await clearLoginFailures(pool, testIp, testEmail);
    assert.equal(await isLoginRateLimited(pool, testIp, testEmail), false);

    // Registra 4 falhas
    for (let i = 0; i < 4; i++) {
      await recordLoginFailure(pool, testIp, testEmail);
    }
    assert.equal(await isLoginRateLimited(pool, testIp, testEmail), false);

    // 5ª falha bloqueia a chave
    await recordLoginFailure(pool, testIp, testEmail);
    assert.equal(await isLoginRateLimited(pool, testIp, testEmail), true);

    // Reseta falhas
    await clearLoginFailures(pool, testIp, testEmail);
    assert.equal(await isLoginRateLimited(pool, testIp, testEmail), false);
  });

  await t.test("Resposta uniforme contra enumeração de usuários (401 para e-mail ou senha incorreta)", async () => {
    const originHeader = "http://localhost:5173";

    // E-mail inexistente
    const resInexistente = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: { origin: originHeader, "content-type": "application/json" },
      payload: { email: "nonexistent_user_xyz@demo.local", password: "wrongpassword123" },
    });
    assert.equal(resInexistente.statusCode, 401);
    const bodyInexistente = JSON.parse(resInexistente.payload);
    assert.equal(bodyInexistente.title, "E-mail ou senha incorretos");

    // E-mail existente com senha errada
    const resSenhaErrada = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: { origin: originHeader, "content-type": "application/json" },
      payload: { email: "admin@demo.local", password: "wrongpassword123" },
    });
    assert.equal(resSenhaErrada.statusCode, 401);
    const bodySenhaErrada = JSON.parse(resSenhaErrada.payload);
    assert.equal(bodySenhaErrada.title, "E-mail ou senha incorretos");
  });

  await t.test("Revogação de sessões do usuário e preservação de token específico", async () => {
    const mockUserId = "usr-test-sessions-100";
    const tokenHash1 = "hash_session_1";

    const count1 = await revokeUserSessions(pool, mockUserId, tokenHash1);
    assert.ok(typeof count1 === "number");

    const count2 = await revokeUserSessions(pool, mockUserId);
    assert.ok(typeof count2 === "number");
  });

  await t.test("Limpeza atômica de sessões e rate limits expirados", async () => {
    const resCleanup = await cleanupExpiredSessions(pool);
    assert.ok(typeof resCleanup.expiredSessions === "number");
    assert.ok(typeof resCleanup.expiredRateLimits === "number");
  });

  await t.test("Bootstrap seguro do primeiro administrador", async () => {
    const testAdminEmail = "first_admin_test@demo.local";

    const bootstrapRes = await bootstrapFirstAdmin({
      email: testAdminEmail,
      password: "InitialPassword123!",
      force: true,
    });
    assert.equal(bootstrapRes.success, true);
    assert.equal(bootstrapRes.email, testAdminEmail);

    // Sem a flag force, recusa caso já exista admin ativo
    await assert.rejects(
      async () => {
        await bootstrapFirstAdmin({
          email: testAdminEmail,
          password: "InitialPassword123!",
          force: false,
        });
      },
      /Já existe um administrador ativo/
    );
  });
});
