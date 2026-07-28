import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.ts";
import { hashPassword, verifyPassword } from "../src/domain/security.js";
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

  await t.test("Troca de senha (sucesso): atualiza hash, revoga demais sessões e preserva sessão atual", async () => {
    const app = buildApp();
    const originalQuery = pool.query.bind(pool);
    const originalConnect = pool.connect.bind(pool);

    let currentDbHash = await hashPassword("OldPassword123!");
    let activeStatus = true;
    let auditRecorded = false;
    let otherSessionDeleted = false;

    pool.connect = (async () => ({
      query: pool.query,
      release: () => {},
    })) as any;

    pool.query = (async (sql: any, params?: any[]) => {
      const text = typeof sql === "string" ? sql : sql?.text || "";
      if (text.includes("DELETE FROM user_sessions")) {
        otherSessionDeleted = true;
        return { rowCount: 2, rows: [] };
      }
      if (text.includes("SELECT") && text.includes("FROM user_sessions")) {
        return {
          rows: [{
            id: "user-id-pwd-test",
            name: "User Password Test",
            email: "user_pwd@demo.local",
            role: "operator",
            must_change_password: false,
            active: activeStatus,
          }],
          rowCount: 1,
        };
      }
      if (text.includes("SELECT password_hash FROM users")) {
        return { rows: activeStatus ? [{ password_hash: currentDbHash }] : [], rowCount: activeStatus ? 1 : 0 };
      }
      if (text.includes("UPDATE users SET password_hash")) {
        if (activeStatus) {
          currentDbHash = params![0];
          return { rowCount: 1, rows: [] };
        }
        return { rowCount: 0, rows: [] };
      }
      if (text.includes("INSERT INTO audit_events") && text.includes("change_password")) {
        auditRecorded = true;
        return { rowCount: 1, rows: [] };
      }
      return { rows: [], rowCount: 0 };
    }) as any;

    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/change-password",
        headers: { origin: "http://localhost:5173", "content-type": "application/json", cookie: "fonolife_session=token-pwd-valid" },
        payload: { currentPassword: "OldPassword123!", newPassword: "NewPassword456!" },
      });

      assert.equal(res.statusCode, 204, `Esperado 204 na troca de senha, obtido ${res.statusCode}`);
      assert.equal(otherSessionDeleted, true, "Sessões paralelas deveriam ser revogadas");
      assert.equal(auditRecorded, true, "Auditoria de change_password deveria ser registrada");

      const oldVerify = await verifyPassword("OldPassword123!", currentDbHash);
      const newVerify = await verifyPassword("NewPassword456!", currentDbHash);
      assert.equal(oldVerify, false, "A senha antiga não deve mais ser válida com o novo hash");
      assert.equal(newVerify, true, "A nova senha deve ser validada com sucesso pelo hash no banco");
    } finally {
      pool.query = originalQuery;
      pool.connect = originalConnect;
      await app.close();
    }
  });

  await t.test("Troca de senha (falha no banco): exceção no UPDATE aborta transação e não retorna 204 nem auditoria", async () => {
    const app = buildApp();
    const originalQuery = pool.query.bind(pool);
    const originalConnect = pool.connect.bind(pool);

    const oldHash = await hashPassword("OldPassword123!");
    let currentDbHash = oldHash;
    let auditRecorded = false;
    let rollbackCalled = false;

    pool.connect = (async () => ({
      query: pool.query,
      release: () => {},
    })) as any;

    pool.query = (async (sql: any) => {
      const text = typeof sql === "string" ? sql : sql?.text || "";
      if (text.includes("SELECT") && text.includes("FROM user_sessions")) {
        return {
          rows: [{ id: "usr-err-1", name: "Err User", email: "err@demo.local", role: "operator", active: true }],
          rowCount: 1,
        };
      }
      if (text.includes("SELECT password_hash FROM users")) {
        return { rows: [{ password_hash: currentDbHash }], rowCount: 1 };
      }
      if (text.includes("UPDATE users SET password_hash")) {
        throw new Error("ERRO SIMULADO DO POSTGRESQL: falha no update");
      }
      if (text.includes("ROLLBACK")) {
        rollbackCalled = true;
        return { rowCount: 0, rows: [] };
      }
      if (text.includes("INSERT INTO audit_events") && text.includes("change_password")) {
        auditRecorded = true;
        return { rowCount: 1, rows: [] };
      }
      return { rows: [], rowCount: 0 };
    }) as any;

    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/change-password",
        headers: { origin: "http://localhost:5173", "content-type": "application/json", cookie: "fonolife_session=token-err" },
        payload: { currentPassword: "OldPassword123!", newPassword: "NewPassword456!" },
      });

      assert.notEqual(res.statusCode, 204, "A resposta NUNCA deve ser 204 se o UPDATE falhar");
      assert.equal(res.statusCode, 500);
      assert.equal(rollbackCalled, true, "Deve executar ROLLBACK na transação");
      assert.equal(auditRecorded, false, "Nenhum evento falso de auditoria deve ser gerado");
      assert.equal(currentDbHash, oldHash, "O hash da senha no banco não pode ter mudado");
    } finally {
      pool.query = originalQuery;
      pool.connect = originalConnect;
      await app.close();
    }
  });

  await t.test("Troca de senha (usuário inativado concorre ao update): rowCount=0 aborta transação com 409", async () => {
    const app = buildApp();
    const originalQuery = pool.query.bind(pool);
    const originalConnect = pool.connect.bind(pool);

    const oldHash = await hashPassword("OldPassword123!");
    let auditRecorded = false;
    let rollbackCalled = false;

    pool.connect = (async () => ({
      query: pool.query,
      release: () => {},
    })) as any;

    pool.query = (async (sql: any) => {
      const text = typeof sql === "string" ? sql : sql?.text || "";
      if (text.includes("SELECT") && text.includes("FROM user_sessions")) {
        return {
          rows: [{ id: "usr-inac-1", name: "Inac User", email: "inac@demo.local", role: "operator", active: true }],
          rowCount: 1,
        };
      }
      if (text.includes("SELECT password_hash FROM users")) {
        return { rows: [{ password_hash: oldHash }], rowCount: 1 };
      }
      if (text.includes("UPDATE users SET password_hash")) {
        return { rowCount: 0, rows: [] };
      }
      if (text.includes("ROLLBACK")) {
        rollbackCalled = true;
        return { rowCount: 0, rows: [] };
      }
      if (text.includes("INSERT INTO audit_events") && text.includes("change_password")) {
        auditRecorded = true;
        return { rowCount: 1, rows: [] };
      }
      return { rows: [], rowCount: 0 };
    }) as any;

    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/change-password",
        headers: { origin: "http://localhost:5173", "content-type": "application/json", cookie: "fonolife_session=token-inac" },
        payload: { currentPassword: "OldPassword123!", newPassword: "NewPassword456!" },
      });

      assert.equal(res.statusCode, 409, "Deve responder 409 se rowCount do UPDATE for 0");
      const body = JSON.parse(res.payload);
      assert.equal(body.title, "Não foi possível atualizar a senha. Tente novamente.");
      assert.equal(rollbackCalled, true, "Deve executar ROLLBACK na transação");
      assert.equal(auditRecorded, false, "Nenhum evento falso de auditoria deve ser gerado");
    } finally {
      pool.query = originalQuery;
      pool.connect = originalConnect;
      await app.close();
    }
  });
});
