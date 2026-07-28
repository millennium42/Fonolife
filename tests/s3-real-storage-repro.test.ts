import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { AddressInfo } from "node:net";
import { S3AttachmentStorage } from "../src/domain/attachments.js";

function createS3TestEndpoint() {
  const store = new Map<string, Buffer>();
  const buckets = new Set(["test-repro-bucket", "fonolife-attachments-private"]);

  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);
    const parts = pathname.split("/").filter(Boolean);
    const bucket = parts[0];
    const key = parts.slice(1).join("/");

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
        res.writeHead(200, { ETag: '"abc123hash"' });
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
  };
}

test("PROMPT 01 — Reprodução e verificação da correção do S3AttachmentStorage real", async (t) => {
  const endpointHelper = createS3TestEndpoint();
  const endpoint = process.env.TEST_S3_ENDPOINT || await endpointHelper.start();

  t.after(async () => {
    if (!process.env.TEST_S3_ENDPOINT) {
      await endpointHelper.stop();
    }
  });

  const commonOpts = {
    bucket: "test-repro-bucket",
    endpoint,
    region: "us-east-1",
    accessKeyId: "test_minio_key",
    secretAccessKey: "test_minio_secret",
    forcePathStyle: true,
  };

  await t.test("Duas instâncias do adaptador S3 compartilham o mesmo storage (verificado via chamadas HTTP reais)", async () => {
    const storageA = new S3AttachmentStorage(commonOpts);
    const storageB = new S3AttachmentStorage(commonOpts);

    const key = "attachments/test_share.pdf";
    const data = Buffer.from("%PDF-1.4\n%%EOF");
    await storageA.save(key, data, "application/pdf");

    // storageB consulta via HEAD request ao serviço de storage e constata a presença real do objeto
    const existsInB = await storageB.exists(key);
    assert.equal(existsInB, true, "Duas instâncias de S3AttachmentStorage enxergam o mesmo arquivo externamente no bucket");
  });

  await t.test("getSignedUrl gera uma assinatura criptográfica real e não um mock embutido no S3AttachmentStorage", async () => {
    const storage = new S3AttachmentStorage(commonOpts);
    const key = "attachments/test_sig.pdf";
    await storage.save(key, Buffer.from("test"), "application/pdf");

    const url = await storage.getSignedUrl!(key);
    assert.equal(url.includes("signature=mock"), false, "A URL retornada não pode conter assinatura mock inautêntica ('signature=mock')");
    assert.equal(
      url.includes("X-Amz-Signature=") || url.includes("X-Amz-Credential="),
      true,
      "URL assinada com padrão real AWS Signature V4"
    );
  });
});
