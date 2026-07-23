import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.ts";
import { pool } from "../src/db/pool.ts";
import { hashToken } from "../src/domain/security.ts";

test("suíte de segurança e LGPD (PR-01)", async (t) => {
  const app = buildApp();

  await t.test("CSRF: mutação sem Origin ou com Origin incorreto retorna 403", async () => {
    const resNoOrigin = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: { "content-type": "application/json" },
      payload: { email: "admin@demo.local", password: "wrong" },
    });
    assert.equal(resNoOrigin.statusCode, 403);

    const resWrongOrigin = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: {
        origin: "https://attacker.com",
        "content-type": "application/json",
      },
      payload: { email: "admin@demo.local", password: "wrong" },
    });
    assert.equal(resWrongOrigin.statusCode, 403);
  });
});
