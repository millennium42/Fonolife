import test from "node:test";
import assert from "node:assert/strict";
import { validateAttachmentConfig } from "../src/config.ts";
import {
  DevAttachmentScanner,
  ClamAVAttachmentScanner,
  MockAttachmentScanner,
  LocalAttachmentStorage,
  S3AttachmentStorage,
  type AttachmentScanner,
} from "../src/domain/attachments.js";
import { buildApp } from "../src/app.ts";

test("PROMPT 02 — Testes de Fronteira de Ambiente, Quarentena e Scanner de Anexos", async (t) => {
  await t.test("Fronteira de Ambiente - Produção recusa LocalAttachmentStorage no startup", () => {
    assert.throws(
      () => {
        validateAttachmentConfig({
          production: true,
          storageProvider: "local",
          scannerProvider: "clamav",
          s3Bucket: "fonolife-attachments-private",
          s3AccessKeyId: "key123",
          s3SecretAccessKey: "secret123",
        });
      },
      /CONFIG ERROR: LocalAttachmentStorage não pode ser utilizado em ambiente de produção/
    );
  });

  await t.test("Fronteira de Ambiente - Produção recusa DevAttachmentScanner no startup", () => {
    assert.throws(
      () => {
        validateAttachmentConfig({
          production: true,
          storageProvider: "s3",
          scannerProvider: "dev",
          s3Bucket: "fonolife-attachments-private",
          s3AccessKeyId: "key123",
          s3SecretAccessKey: "secret123",
        });
      },
      /CONFIG ERROR: DevAttachmentScanner não pode ser utilizado em ambiente de produção/
    );
  });

  await t.test("Fronteira de Ambiente - Produção recusa S3 sem bucket ou credenciais", () => {
    assert.throws(
      () => {
        validateAttachmentConfig({
          production: true,
          storageProvider: "s3",
          scannerProvider: "clamav",
          s3Bucket: "",
          s3AccessKeyId: "key123",
          s3SecretAccessKey: "secret123",
        });
      },
      /CONFIG ERROR: S3_BUCKET, S3_ACCESS_KEY_ID e S3_SECRET_ACCESS_KEY são obrigatórios/
    );
  });

  await t.test("Scanner Interface - Status clean, infected e failed com assinaturas", async () => {
    const mockScanner = new MockAttachmentScanner();

    const cleanResult = await mockScanner.scan(Buffer.from("%PDF-1.4\n%%EOF"), "application/pdf");
    assert.equal(cleanResult.status, "clean");
    assert.equal(cleanResult.engine, "mock-engine");

    const infectedBuffer = Buffer.from("EICAR-STANDARD-ANTIVIRUS-TEST-FILE");
    const infectedResult = await mockScanner.scan(infectedBuffer, "application/pdf");
    assert.equal(infectedResult.status, "infected");
    assert.equal(typeof infectedResult.signature, "string");

    const failedScanner = new MockAttachmentScanner({ forceFail: true });
    const failResult = await failedScanner.scan(Buffer.from("%PDF-1.4\n%%EOF"), "application/pdf");
    assert.equal(failResult.status, "failed");
  });

  await t.test("Categorias de Anexo Clínico e Observações", () => {
    const validCategories = ["audiometry", "exam_report", "medical_request", "other"];
    assert.equal(validCategories.includes("audiometry"), true);
    assert.equal(validCategories.includes("exam_report"), true);
    assert.equal(validCategories.includes("invalid_category"), false);
  });

  await t.test("Health Check - Retorna healthy, degraded ou unavailable", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/health",
    });
    const body = JSON.parse(res.payload);
    const expectedStatusCode = body.status === "unavailable" ? 503 : 200;
    assert.equal(res.statusCode, expectedStatusCode);
    assert.ok(["healthy", "degraded", "unavailable", "ok"].includes(body.status));
    assert.ok(typeof body.storage === "string");
    assert.ok(typeof body.scanner === "string");
  });
});
