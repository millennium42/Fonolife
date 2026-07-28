import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.ts";
import { pool } from "../src/db/pool.js";
import { hashPassword } from "../src/domain/security.js";

test("PROMPT 07 — Suíte de Regressão: Login, Sessão e Logout Atômicos e Fail-Closed", async (t) => {
  const app = buildApp();
  const originHeader = "http://localhost:5173";

  await t.test("1. Login falha sem definir cookie se gravação da sessão ou auditoria falhar (não retorna 200)", async () => {
    const originalQuery = pool.query.bind(pool);
    const originalConnect = pool.connect.bind(pool);
    const validPasswordHash = await hashPassword("ValidPassword123!");
    let insertSessionAttempted = false;
    let rollbackCalled = false;

    pool.connect = (async () => ({
      query: pool.query,
      release: () => {},
    })) as any;

    pool.query = (async (sql: any, params?: any[]) => {
      const text = typeof sql === "string" ? sql : sql?.text || "";
      if (text.includes("SELECT") && text.includes("FROM login_rate_limits")) {
        return { rows: [], rowCount: 0 };
      }
      if (text.includes("SELECT * FROM users WHERE email=")) {
        return {
          rows: [{
            id: "usr-atomic-1",
            name: "Dr. Atomic",
            email: "atomic@demo.local",
            role: "doctor",
            password_hash: validPasswordHash,
            active: true,
            must_change_password: false,
          }],
          rowCount: 1,
        };
      }
      if (text.includes("DELETE FROM login_rate_limits")) {
        return { rows: [], rowCount: 0 };
      }
      if (text.includes("INSERT INTO user_sessions")) {
        insertSessionAttempted = true;
        throw new Error("POSTGRESQL ERROR: disco cheio ou tabela travada na gravação de user_sessions");
      }
      if (text.includes("ROLLBACK")) {
        rollbackCalled = true;
        return { rows: [], rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    }) as any;

    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        headers: { origin: originHeader, "content-type": "application/json" },
        payload: { email: "atomic@demo.local", password: "ValidPassword123!" },
      });

      assert.equal(insertSessionAttempted, true, "Tentou inserir a sessão no banco");
      assert.notEqual(res.statusCode, 200, "NUNCA deve retornar 200 OK se a gravação de user_sessions falhou!");
      assert.ok(res.statusCode === 500 || res.statusCode === 503, `Esperado erro de servidor 500/503, obtido ${res.statusCode}`);
      
      const setCookieHeader = res.headers["set-cookie"];
      assert.ok(!setCookieHeader, `NÃO pode definir o cookie de sessão se falhou no banco, obtido: ${setCookieHeader}`);
    } finally {
      pool.query = originalQuery;
      pool.connect = originalConnect;
    }
  });

  await t.test("2. Indisponibilidade do banco na busca de usuário em login retorna erro operacional, não 401 credencial inválida", async () => {
    const originalQuery = pool.query.bind(pool);
    let recordFailureCalled = false;

    pool.query = (async (sql: any) => {
      const text = typeof sql === "string" ? sql : sql?.text || "";
      if (text.includes("SELECT") && text.includes("FROM login_rate_limits")) {
        return { rows: [], rowCount: 0 };
      }
      if (text.includes("SELECT * FROM users WHERE email=")) {
        throw new Error("POSTGRESQL ERROR: conexão caiu ou timeout no select users");
      }
      if (text.includes("INSERT INTO login_rate_limits") || text.includes("ON CONFLICT")) {
        recordFailureCalled = true;
        return { rows: [], rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    }) as any;

    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        headers: { origin: originHeader, "content-type": "application/json" },
        payload: { email: "doctor@demo.local", password: "SomePassword123!" },
      });

      assert.notEqual(res.statusCode, 401, "Indisponibilidade de BD não deve ser disfarçada como 401 E-mail/senha incorretos");
      assert.equal(recordFailureCalled, false, "Falha de infraestrutura do banco não deve contar como tentativa de login fracassada no rate limit");
      assert.ok(res.statusCode === 500 || res.statusCode === 503, `Esperado 500 ou 503, obtido ${res.statusCode}`);
    } finally {
      pool.query = originalQuery;
    }
  });

  await t.test("3. Logout é idempotente e bem-sucedido (204) mesmo sem sessão válida ou com cookie expirado/revogado no banco", async () => {
    const originalQuery = pool.query.bind(pool);

    // Quando o middleware de autenticação (onRequest in app.ts) procurar a sessão, ela já foi excluída ou não existe
    pool.query = (async (sql: any) => {
      const text = typeof sql === "string" ? sql : sql?.text || "";
      if (text.includes("SELECT") && text.includes("FROM user_sessions")) {
        return { rows: [], rowCount: 0 }; // sessão não existe / expirada / revogada
      }
      if (text.includes("DELETE FROM user_sessions")) {
        return { rows: [], rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    }) as any;

    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/logout",
        headers: { origin: originHeader, cookie: "fonolife_session=token-que-ja-nao-existe" },
      });

      assert.equal(res.statusCode, 204, `Logout deve ser idempotente (204) mesmo sem usuário autenticado na sessão, obtido ${res.statusCode}`);
      
      const setCookie = res.headers["set-cookie"];
      assert.ok(setCookie, "Deve enviar cabeçalho limpando o cookie de sessão localmente");
      const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : setCookie;
      assert.ok(cookieStr.includes("fonolife_session="), "O cookie fonolife_session deve estar sendo limpo/zerado");
      assert.ok(cookieStr.includes("Path=/") || cookieStr.includes("path=/"), "Opção path=/ deve estar centralizada e presente na limpeza do cookie");
    } finally {
      pool.query = originalQuery;
    }
  });

  await t.test("4. Política de senha centralizada responde 400 problem JSON em rotas de criação no admin (não erro 500)", async () => {
    const originalQuery = pool.query.bind(pool);

    pool.query = (async (sql: any) => {
      const text = typeof sql === "string" ? sql : sql?.text || "";
      if (text.includes("SELECT") && text.includes("FROM user_sessions")) {
        return {
          rows: [{
            id: "usr-admin-atomic",
            name: "Admin Atomic",
            email: "admin@demo.local",
            role: "admin",
            active: true,
            must_change_password: false,
          }],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 0 };
    }) as any;

    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/admin/users",
        headers: { origin: originHeader, "content-type": "application/json", cookie: "fonolife_session=valid-admin-token" },
        payload: {
          name: "Novo Medico",
          email: "novo.medico@demo.local",
          role: "doctor",
          password: "123", // senha fraca < 8 caracteres
        },
      });

      assert.equal(res.statusCode, 400, `Esperado erro 400 de validação de senha, obtido ${res.statusCode}`);
      const body = JSON.parse(res.payload);
      assert.equal(body.status, 400);
      assert.ok(body.title && body.title.includes("8 caracteres"), `Título do problema deve indicar requisito de senha: ${body.title}`);
    } finally {
      pool.query = originalQuery;
    }
  });

  await t.test("fechamento de instância de teste", async () => {
    await app.close();
  });
});
