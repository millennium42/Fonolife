import test from "node:test";
import assert from "node:assert/strict";
import { S3AttachmentStorage } from "../src/domain/attachments.js";

test("PROMPT 01 — Reprodução: S3AttachmentStorage em código atual usa Map em memória e assinatura mock", async (t) => {
  await t.test("Duas instâncias do adaptador S3 compartilham o mesmo storage (falha no mock in-memory atual)", async () => {
    // No código atual antes da correção, S3AttachmentStorage grava num Map em memória (this.mockStore).
    // Duas réplicas do processo ou duas instâncias conectadas ao mesmo bucket deveriam enxergar o mesmo objeto.
    // Como atualmente é um Map privado na classe, esta verificação falhará!
    const storageA = new S3AttachmentStorage({ bucket: "test-repro-bucket" });
    const storageB = new S3AttachmentStorage({ bucket: "test-repro-bucket" });

    const key = "attachments/test_share.pdf";
    const data = Buffer.from("%PDF-1.4\n%%EOF");
    await storageA.save(key, data, "application/pdf");

    // storageB deve ser capaz de verificar que o arquivo existe no bucket de armazenamento compartilhado
    // (no código atual sem S3 real, isso retorna false e falha a asserção)
    const existsInB = await storageB.exists(key);
    assert.equal(existsInB, true, "Falha reproduzida: duas instâncias de S3AttachmentStorage não enxergam o mesmo arquivo por usarem Map volátil in-memory");
  });

  await t.test("getSignedUrl gera uma assinatura criptográfica real e não um mock embutido no S3AttachmentStorage", async () => {
    const storage = new S3AttachmentStorage({ bucket: "test-repro-bucket" });
    const key = "attachments/test_sig.pdf";
    await storage.save(key, Buffer.from("test"), "application/pdf");

    const url = await storage.getSignedUrl(key);
    assert.equal(url.includes("signature=mock"), false, "Falha reproduzida: a URL retornada contém assinatura mock inautêntica ('signature=mock')");
    assert.equal(url.includes("X-Amz-Signature=") || url.includes("X-Amz-Credential="), true, "Falha reproduzida: URL não é assinada com padrão real AWS Signature V4 (X-Amz-Signature)");
  });
});
