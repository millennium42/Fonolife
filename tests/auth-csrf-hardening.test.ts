import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.ts";
import {
  isLoginRateLimited,
  recordLoginFailure,
  revokeUserSessions,
  getRateLimitKey,
} from "../src/modules/auth/middleware.js";
import type { Pool } from "pg";

test("PROMPT 01 — Testes de Reprodução de Vulnerabilidades CSRF, Rate Limit e Sessões", async (t) => {
  const app = buildApp();

  await t.test("CSRF - Rejeitar Referer com sufixo malicioso (subdomínio atacante)", async () => {
    // Referer que inicia com a origem permitida, mas com sufixo atacante
    const resBypass = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: {
        referer: "http://localhost:5173.attacker.com/login",
        "content-type": "application/json",
      },
      payload: { email: "admin@demo.local", password: "wrongpassword123" },
    });
    // Deve ser bloqueado com 403, e NÃO passar pelo check de CSRF (retornando 401 de auth)
    assert.equal(resBypass.statusCode, 403, "Referer com sufixo atacante deve ser rejeitado com 403");
  });

  await t.test("CSRF - Rejeitar Referer com porta ou protocolo divergentes", async () => {
    const resPorta = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: {
        referer: "http://localhost:8080/login",
        "content-type": "application/json",
      },
      payload: { email: "admin@demo.local", password: "wrongpassword123" },
    });
    assert.equal(resPorta.statusCode, 403, "Porta divergente deve ser rejeitada com 403");

    const resProto = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: {
        referer: "https://localhost:5173/login",
        "content-type": "application/json",
      },
      payload: { email: "admin@demo.local", password: "wrongpassword123" },
    });
    assert.equal(resProto.statusCode, 403, "Protocolo divergente deve ser rejeitado com 403");
  });

  await t.test("CSRF - Rejeitar Referer malformado sem lançar 500", async () => {
    const resInvalid = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: {
        referer: "not-a-valid-url",
        "content-type": "application/json",
      },
      payload: { email: "admin@demo.local", password: "wrongpassword123" },
    });
    assert.equal(resInvalid.statusCode, 403, "Referer inválido deve ser tratado graciosamente e retornar 403");
  });

  await t.test("Rate Limit - Bloquear fallback silencioso em erro de banco", async () => {
    const fakePool = {
      query: async () => {
        throw new Error("DB Connection Failed");
      },
    } as unknown as Pool;

    // Em produção ou sem fallback em memória habilitado, erro de banco deve lançar exceção
    await assert.rejects(
      async () => {
        await isLoginRateLimited(fakePool, "127.0.0.1", "user@test.local", false);
      },
      /DB Connection Failed/,
      "Erro de banco no rate limit deve propagar falha quando fallback=false"
    );

    await assert.rejects(
      async () => {
        await recordLoginFailure(fakePool, "127.0.0.1", "user@test.local", false);
      },
      /DB Connection Failed/,
      "Erro de banco no registro de falha deve propagar quando fallback=false"
    );
  });

  await t.test("Revogação de Sessões - Lançar erro quando o banco falhar", async () => {
    const fakePool = {
      query: async () => {
        throw new Error("DB Connection Failed");
      },
    } as unknown as Pool;

    await assert.rejects(
      async () => {
        await revokeUserSessions(fakePool, "usr-123", undefined, false);
      },
      /DB Connection Failed/,
      "Falha no banco durante revogação de sessões deve lançar exceção"
    );
  });

  await t.test("Rate Limit Key - Utilizar Hash SHA-256 para anonimizar e-mail", () => {
    const key = getRateLimitKey("192.168.1.1", "paciente.privado@email.com");
    assert.ok(!key.includes("paciente.privado@email.com"), "Chave de rate limit não deve conter e-mail em texto puro");
    assert.ok(key.startsWith("rate_limit:"), "Chave deve manter prefixo rate_limit:");
  });
});
