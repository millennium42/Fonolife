import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { AddressInfo } from "node:net";
import { S3AttachmentStorage, InMemoryAttachmentStorage } from "../src/domain/attachments.js";
import { validateAttachmentConfig } from "../src/config.js";

function createS3TestServer() {
  const store = new Map<string, Buffer>();
  const buckets = new Set(["test-bucket-prod", "fonolife-attachments-private"]);

  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);
    const parts = pathname.split("/").filter(Boolean);
    const bucket = parts[0];
    const key = parts.slice(1).join("/");

    const auth = req.headers.authorization || url.searchParams.get("X-Amz-Credential") || "";
    if (auth.includes("invalid_key")) {
      res.writeHead(403, { "Content-Type": "application/xml" });
      res.end("<Error><Code>InvalidAccessKeyId</Code><Message>The AWS Access Key Id you provided does not exist in our records.</Message></Error>");
      return;
    }

    if (!buckets.has(bucket)) {
      res.writeHead(404, { "Content-Type": "application/xml" });
      res.end("<Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist</Message></Error>");
      return;
    }

    if (!key && req.method === "HEAD") {
      res.writeHead(200);
      res.end();
      return;
    }

    const storagePath = `${bucket}/${key}`;
    if (req.method === "PUT") {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        store.set(storagePath, Buffer.concat(chunks));
        res.writeHead(200, { ETag: '"e3b0c44298fc1c149afbf4c8996fb92427ae41e"' });
        res.end();
      });
      return;
    }

    if (req.method === "HEAD" || req.method === "GET") {
      if (store.has(storagePath)) {
        const data = store.get(storagePath)!;
        res.writeHead(200, { "Content-Length": data.length.toString(), "Content-Type": "application/octet-stream" });
        if (req.method === "GET") res.end(data);
        else res.end();
      } else {
        res.writeHead(404, { "Content-Type": "application/xml" });
        res.end("<Error><Code>NoSuchKey</Code><Message>The specified key does not exist.</Message></Error>");
      }
      return;
    }

    if (req.method === "DELETE") {
      store.delete(storagePath);
      res.writeHead(204);
      res.end();
      return;
    }

    res.writeHead(405);
    res.end();
  });

  return {
    start: (): Promise<string> => new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const port = (server.address() as AddressInfo).port;
        resolve(`http://127.0.0.1:${port}`);
      });
    }),
    stop: (): Promise<void> => new Promise((resolve) => server.close(() => resolve())),
    store,
  };
}

test("PROMPT 01 — Suíte de Regressões e Casos de Borda do Storage S3 Real", async (t) => {
  const s3Server = createS3TestServer();
  const endpoint = process.env.TEST_S3_ENDPOINT || await s3Server.start();

  t.after(async () => {
    if (!process.env.TEST_S3_ENDPOINT) {
      await s3Server.stop();
    }
  });

  const baseOpts = {
    bucket: "test-bucket-prod",
    endpoint,
    region: "us-east-1",
    accessKeyId: "valid_access_key",
    secretAccessKey: "valid_secret_key",
    forcePathStyle: true,
  };

  await t.test("Ciclo de vida completo em ambiente S3: upload, reinício da aplicação, download e verificação de hash idêntico", async () => {
    const appInstanceBeforeRestart = new S3AttachmentStorage(baseOpts);
    const key = "clinical_docs/laudo_audiometria_2026.pdf";
    const originalContent = Buffer.from("Conteúdo autêntico e persistente do laudo clínico em S3", "utf-8");

    const saveResult = await appInstanceBeforeRestart.save(key, originalContent, "application/pdf");
    assert.equal(saveResult.sizeBytes, originalContent.length);
    assert.ok(saveResult.hash, "Hash SHA-256 gerado no upload");

    // Simular reinício completo da aplicação re-instanciando o storage (sem cache na memória em tempo de execução)
    const appInstanceAfterRestart = new S3AttachmentStorage(baseOpts);
    const existsAfterRestart = await appInstanceAfterRestart.exists(key);
    assert.equal(existsAfterRestart, true, "Objeto permanece disponível externamente no S3 após reinício do processo");

    const stream = await appInstanceAfterRestart.getStream(key);
    const downloadedChunks: Buffer[] = [];
    for await (const chunk of stream) {
      downloadedChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const downloadedContent = Buffer.concat(downloadedChunks);
    assert.equal(downloadedContent.toString("utf-8"), originalContent.toString("utf-8"), "Download após reinício preserva conteúdo idêntico");
  });

  await t.test("Exclusão de objeto e verificação de comportamento para objeto ausente no S3", async () => {
    const storage = new S3AttachmentStorage(baseOpts);
    const key = "temp_docs/anexo_exclusao.png";
    await storage.save(key, Buffer.from("temp"), "image/png");

    assert.equal(await storage.exists(key), true);
    await storage.delete(key);
    assert.equal(await storage.exists(key), false, "Após delete(), exists() deve retornar false sem lançar exceção incontrolada");

    await assert.rejects(
      async () => storage.getStream(key),
      (err: any) => {
        assert.ok(err.notFound || err.name === "NoSuchKey" || (err.message && err.message.includes("does not exist")));
        return true;
      },
      "getStream em arquivo excluído/ausente rejeita adequadamente"
    );
  });

  await t.test("Comportamento determinístico para credencial inválida (erros de permissão / 403)", async () => {
    const badCredsStorage = new S3AttachmentStorage({
      ...baseOpts,
      accessKeyId: "invalid_key_id",
      secretAccessKey: "wrong_secret",
    });

    const healthResult = await badCredsStorage.health();
    assert.equal(healthResult.status, "down", "health() deve acusar status 'down' diante de erro de credenciais");
    assert.ok(healthResult.details && healthResult.details.includes("InvalidAccessKeyId"), "Detalhes exibem causa do erro");
  });

  await t.test("Comportamento determinístico para bucket inexistente no S3", async () => {
    const noBucketStorage = new S3AttachmentStorage({
      ...baseOpts,
      bucket: "bucket-invalido-que-nao-existe-123",
    });

    const healthResult = await noBucketStorage.health();
    assert.equal(healthResult.status, "down", "health() deve retornar status 'down' para bucket inexistente");
    assert.ok(
      healthResult.details && (healthResult.details.includes("NoSuchBucket") || healthResult.details.includes("does not exist") || healthResult.details.includes("NotFound")),
      "Detalhes de health identificam ausência de bucket"
    );
  });

  await t.test("Quarentena e limites de ambiente no startup (validateAttachmentConfig e isolamento demo/prod)", async () => {
    // 1. Em produção, provider diferente de 's3' (como 'local', 'demo' ou 'memory') falha o startup
    assert.throws(
      () => validateAttachmentConfig({ production: true, storageProvider: "demo", scannerProvider: "clamav" }),
      /CONFIG ERROR: Provider de storage 'demo' não pode ser utilizado em ambiente de produção/
    );

    assert.throws(
      () => validateAttachmentConfig({ production: true, storageProvider: "memory", scannerProvider: "clamav" }),
      /CONFIG ERROR: Provider de storage 'memory' não pode ser utilizado em ambiente de produção/
    );

    assert.throws(
      () => validateAttachmentConfig({ production: true, storageProvider: "local", scannerProvider: "clamav" }),
      /CONFIG ERROR: LocalAttachmentStorage não pode ser utilizado em ambiente de produção/
    );

    // 2. Em produção, ausência de credenciais sem provider chain de IAM lança erro de startup
    const originalRoleArn = process.env.AWS_ROLE_ARN;
    delete process.env.AWS_ROLE_ARN;
    try {
      assert.throws(
        () => validateAttachmentConfig({ production: true, storageProvider: "s3", scannerProvider: "clamav", s3Bucket: "prod-bucket" }),
        /CONFIG ERROR: S3_BUCKET, S3_ACCESS_KEY_ID e S3_SECRET_ACCESS_KEY são obrigatórios/
      );
    } finally {
      if (originalRoleArn !== undefined) process.env.AWS_ROLE_ARN = originalRoleArn;
    }

    // 3. Verifica isolamento sintético de InMemoryAttachmentStorage
    const memStorage = new InMemoryAttachmentStorage();
    const memHealth = await memStorage.health();
    assert.equal(memHealth.status, "ok");
    assert.equal(memHealth.details, "in-memory-isolated");
  });
});
