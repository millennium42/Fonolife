import test from "node:test";
import assert from "node:assert/strict";
import fastify from "fastify";
import cookie from "@fastify/cookie";
import { healthRoutes } from "../src/modules/health/routes.js";
import { pool } from "../src/db/pool.js";
import { InMemoryAttachmentStorage, DevAttachmentScanner } from "../src/domain/attachments.js";
import { validateAttachmentConfig } from "../src/config.js";

test("PROMPT 03 — Reproduzir falha de readiness (/api/health retorna 200 em indisponibilidade)", async () => {
  const originalPoolQuery = pool.query;
  // Simula banco de dados inoperante
  pool.query = async () => {
    throw new Error("Conexão com PostgreSQL recusada / timeout");
  };

  const storage = new InMemoryAttachmentStorage();
  const scanner = new DevAttachmentScanner();
  const app = fastify();
  app.register(cookie);
  app.register(healthRoutes, { attachmentStorage: storage, attachmentScanner: scanner });

  try {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    const body = JSON.parse(res.payload);
    
    assert.equal(body.database, "down", "O corpo reporta database down");
    assert.equal(body.status, "unavailable", "O corpo reporta status unavailable");
    
    // NO CÓDIGO ATUAL COM DEFEITO: res.statusCode é 200, violando a regra de readiness (deveria ser 503!)
    assert.equal(res.statusCode, 503, "Readiness DEVE retornar HTTP 503 quando o banco está down (atualmente falha retornando 200)");
  } finally {
    pool.query = originalPoolQuery;
    await app.close();
  }
});

test("PROMPT 03 — Reproduzir falha em validação de semântica de produção (origem HTTP não rejeitada)", () => {
  // NO CÓDIGO ATUAL COM DEFEITO: validateAttachmentConfig aceita origin HTTP sem TLS em produção e valores numéricos inválidos
  assert.throws(
    () => {
      (validateAttachmentConfig as any)({
        production: true,
        storageProvider: "s3",
        scannerProvider: "clamav",
        s3Bucket: "prod-bucket",
        s3AccessKeyId: "key",
        s3SecretAccessKey: "secret",
        clamavHost: "localhost",
        clamavPort: 3310,
        clamavTimeoutMs: 5000,
        origin: "http://insecure-prod.fonolife.com.br", // Inserção insegura via HTTP em produção!
      });
    },
    /CONFIG ERROR.*HTTPS/i,
    "Validação no startup DEVE rejeitar APP_ORIGIN com HTTP sem criptografia de transporte em produção (atualmente não rejeita)"
  );
});
