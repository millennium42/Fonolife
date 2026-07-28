import test from "node:test";
import assert from "node:assert/strict";
import fastify from "fastify";
import cookie from "@fastify/cookie";
import { healthRoutes } from "../src/modules/health/routes.js";
import { pool } from "../src/db/pool.js";
import { InMemoryAttachmentStorage, DevAttachmentScanner, type AttachmentStorage, type AttachmentScanner } from "../src/domain/attachments.js";
import { validateAttachmentConfig } from "../src/config.js";

test("PROMPT 03 — Suíte de Regressão: Readiness, Liveness e Semântica de Produção", async (t) => {
  await t.test("1. Liveness (/api/health/live) responde 200 OK mesmo em degradação profunda", async () => {
    const originalPoolQuery = pool.query;
    pool.query = async () => { throw new Error("Database down total"); };

    const brokenStorage: AttachmentStorage = {
      save: async () => { throw new Error("Storage down"); },
      read: async () => { throw new Error("Storage down"); },
      exists: async () => false,
      delete: async () => {},
      health: async () => ({ status: "down", details: "Falha de disco/S3" }),
    };

    const brokenScanner: AttachmentScanner = {
      scan: async () => ({ status: "failed", clean: false, reason: "Scanner deamon offline" }),
      healthCheck: async () => ({ status: "down", details: "TCP connect error" }),
    };

    const app = fastify();
    app.register(cookie);
    app.register(healthRoutes, { attachmentStorage: brokenStorage, attachmentScanner: brokenScanner });

    try {
      const res = await app.inject({ method: "GET", url: "/api/health/live" });
      assert.equal(res.statusCode, 200, "Liveness DEVE retornar HTTP 200 independentemente de falhas externas");
      const body = JSON.parse(res.payload);
      assert.equal(body.status, "ok");
      assert.equal(body.live, true);
    } finally {
      pool.query = originalPoolQuery;
      await app.close();
    }
  });

  await t.test("2. Readiness (/api/health) retorna 200 somente com DB, storage e scanner utilizáveis e saudáveis", async () => {
    const originalPoolQuery = pool.query;
    pool.query = async () => ({ rows: [], rowCount: 1 }) as any;

    const healthyStorage = new InMemoryAttachmentStorage();
    const healthyScanner = new DevAttachmentScanner();

    const app = fastify();
    app.register(cookie);
    app.register(healthRoutes, { attachmentStorage: healthyStorage, attachmentScanner: healthyScanner });

    try {
      const res = await app.inject({ method: "GET", url: "/api/health" });
      assert.equal(res.statusCode, 200, "Readiness DEVE retornar 200 quando tudo operando perfeitamente");
      const body = JSON.parse(res.payload);
      assert.equal(body.status, "healthy");
      assert.equal(body.database, "ok");
      assert.equal(body.storage, "ok");
      assert.equal(body.scanner, "ok");
    } finally {
      pool.query = originalPoolQuery;
      await app.close();
    }
  });

  await t.test("3. Storage retornando false ou down no check faz readiness falhar (HTTP 503)", async () => {
    const originalPoolQuery = pool.query;
    pool.query = async () => ({ rows: [], rowCount: 1 }) as any;

    const failingStorage: AttachmentStorage = {
      save: async () => { throw new Error(); },
      read: async () => { throw new Error(); },
      exists: async () => false,
      delete: async () => {},
      health: async () => ({ status: "down" as any, details: "S3 Bucket inaccessible" }),
    };

    const app = fastify();
    app.register(cookie);
    app.register(healthRoutes, { attachmentStorage: failingStorage, attachmentScanner: new DevAttachmentScanner() });

    try {
      const res = await app.inject({ method: "GET", url: "/api/health" });
      assert.equal(res.statusCode, 503, "Storage down DEVE resultar em HTTP 503");
      const body = JSON.parse(res.payload);
      assert.equal(body.status, "unavailable");
      assert.equal(body.storage, "down");
    } finally {
      pool.query = originalPoolQuery;
      await app.close();
    }
  });

  await t.test("4. Scanner retornando failed ou infected faz readiness falhar (HTTP 503)", async () => {
    const originalPoolQuery = pool.query;
    pool.query = async () => ({ rows: [], rowCount: 1 }) as any;

    const infectedScanner: AttachmentScanner = {
      scan: async () => ({ status: "infected", clean: false, signature: "EICAR-Test-File" }),
      healthCheck: async () => ({ status: "infected" as any, details: "Assinatura de maleficência detectada em teste de prontidão" }),
    };

    const app = fastify();
    app.register(cookie);
    app.register(healthRoutes, { attachmentStorage: new InMemoryAttachmentStorage(), attachmentScanner: infectedScanner });

    try {
      const res = await app.inject({ method: "GET", url: "/api/health" });
      assert.equal(res.statusCode, 503, "Scanner reportando infected DEVE derrubar a prontidão com 503 (fail-closed)");
      const body = JSON.parse(res.payload);
      assert.equal(body.status, "unavailable");
      assert.equal(body.scanner, "infected");
    } finally {
      pool.query = originalPoolQuery;
      await app.close();
    }
  });

  await t.test("5. Indisponibilidade do PostgreSQL derruba readiness imediatamente com status 503 sem travar", async () => {
    const originalPoolQuery = pool.query;
    pool.query = async () => {
      throw new Error("Conexão recusada (ECONNREFUSED)");
    };

    const app = fastify();
    app.register(cookie);
    app.register(healthRoutes, { attachmentStorage: new InMemoryAttachmentStorage(), attachmentScanner: new DevAttachmentScanner() });

    try {
      const start = Date.now();
      const res = await app.inject({ method: "GET", url: "/api/health" });
      const duration = Date.now() - start;
      assert.ok(duration < 1000, `Resposta imediata em falha de conexão (<1000ms), obtido: ${duration}ms`);
      assert.equal(res.statusCode, 503);
      const body = JSON.parse(res.payload);
      assert.equal(body.database, "down");
      assert.equal(body.status, "unavailable");
    } finally {
      pool.query = originalPoolQuery;
      await app.close();
    }
  });

  await t.test("6. Validações estritas na inicialização do serviço com semântica unificada (APP_ENV vs NODE_ENV e HTTPS)", () => {
    // 6.1 Origem HTTP rejeitada em produção
    assert.throws(() => {
      (validateAttachmentConfig as any)({
        production: true,
        storageProvider: "s3",
        scannerProvider: "clamav",
        s3Bucket: "bucket-prod",
        s3AccessKeyId: "key",
        s3SecretAccessKey: "secret",
        clamavHost: "clamav-host",
        clamavPort: 3310,
        clamavTimeoutMs: 5000,
        origin: "http://insecure.fonolife.com",
      });
    }, /CONFIG ERROR.*HTTPS/i);

    // 6.2 Valores numéricos inválidos ou negativos/incompatíveis rejeitados no startup
    assert.throws(() => {
      (validateAttachmentConfig as any)({
        production: true,
        storageProvider: "s3",
        scannerProvider: "clamav",
        s3Bucket: "bucket-prod",
        s3AccessKeyId: "key",
        s3SecretAccessKey: "secret",
        clamavHost: "clamav-host",
        clamavPort: 3310,
        clamavTimeoutMs: -100, // Timeout negativo ou infinito
        origin: "https://app.fonolife.com.br",
      });
    }, /CONFIG ERROR.*inválida/i);
  });
});
