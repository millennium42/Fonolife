import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import {
  LocalAttachmentStorage,
  S3AttachmentStorage,
  DevAttachmentScanner,
  validateBase64Strict,
  generateStorageKey,
  sanitizeFilename,
  reconcileOrphanAttachments,
  detectMimeTypeFromMagicBytes,
} from "../src/domain/attachments.js";

test("Suíte de Anexos Clínicos Duráveis e Seguros (PR-02)", async (t) => {

  await t.test("LocalAttachmentStorage: salva, lê stream, verifica existência e exclui", async () => {
    const storage = new LocalAttachmentStorage();
    const key = `test_attachment_${Date.now()}.pdf`;
    const pdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<\/Root 1 0 R>>\n%%EOF");

    const saveRes = await storage.save(key, pdfBuffer, "application/pdf");
    assert.equal(saveRes.sizeBytes, pdfBuffer.length);
    assert.equal(typeof saveRes.hash, "string");
    assert.equal(saveRes.hash.length, 64);

    const existsBefore = await storage.exists(key);
    assert.equal(existsBefore, true);

    const stream = await storage.getStream(key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const readBuffer = Buffer.concat(chunks);
    assert.equal(readBuffer.toString("utf8"), pdfBuffer.toString("utf8"));

    await storage.delete(key);
    const existsAfter = await storage.exists(key);
    assert.equal(existsAfter, false);
  });

  await t.test("S3AttachmentStorage (Contrato Mock): salva, verifica existência e lê stream", async () => {
    const s3Storage = new S3AttachmentStorage({ bucket: "fonolife-test-bucket", mockMode: true });
    const key = `attachments/s3_${Date.now()}.png`;
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    const saveRes = await s3Storage.save(key, pngBuffer, "image/png");
    assert.equal(saveRes.sizeBytes, pngBuffer.length);
    assert.equal(await s3Storage.exists(key), true);

    const stream = await s3Storage.getStream(key);
    assert.ok(stream instanceof Readable);

    await s3Storage.delete(key);
    assert.equal(await s3Storage.exists(key), false);
  });

  await t.test("DevAttachmentScanner: valida PDF, JPEG, PNG, WEBP e bloqueia executável disfarçado", async () => {
    const scanner = new DevAttachmentScanner();

    // 1. PDF Real Mínimo
    const pdfBuffer = Buffer.from("%PDF-1.4\n%%EOF");
    const pdfResult = await scanner.scan(pdfBuffer, "application/pdf");
    assert.equal(pdfResult.clean, true);
    assert.equal(pdfResult.detectedMimeType, "application/pdf");

    // 2. PNG Válido
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const pngResult = await scanner.scan(pngBuffer, "image/png");
    assert.equal(pngResult.clean, true);
    assert.equal(pngResult.detectedMimeType, "image/png");

    // 3. JPEG Válido
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const jpegResult = await scanner.scan(jpegBuffer, "image/jpeg");
    assert.equal(jpegResult.clean, true);
    assert.equal(jpegResult.detectedMimeType, "image/jpeg");

    // 4. WEBP Válido
    const webpBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    const webpResult = await scanner.scan(webpBuffer, "image/webp");
    assert.equal(webpResult.clean, true);
    assert.equal(webpResult.detectedMimeType, "image/webp");

    // 5. Executável DOS MZ disfarçado de PDF
    const exeAsPdf = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
    const exeResult = await scanner.scan(exeAsPdf, "application/pdf");
    assert.equal(exeResult.clean, false);
    assert.match(exeResult.reason ?? "", /malicioso|executável/i);

    // 6. Divergência entre MIME declarado e detectado
    const pngDeclaredAsPdf = await scanner.scan(pngBuffer, "application/pdf");
    assert.equal(pngDeclaredAsPdf.clean, false);
    assert.match(pngDeclaredAsPdf.reason ?? "", /Divergência/i);

    // 7. Arquivo Vazio (0 bytes)
    const emptyResult = await scanner.scan(Buffer.alloc(0), "application/pdf");
    assert.equal(emptyResult.clean, false);
    assert.match(emptyResult.reason ?? "", /vazio/i);
  });

  await t.test("Validação estrita de Base64 e prevenção de malformação", () => {
    const validStr = Buffer.from("Teste Conteudo Audiometria").toString("base64");
    const buf = validateBase64Strict(validStr);
    assert.equal(buf.toString("utf8"), "Teste Conteudo Audiometria");

    assert.throws(() => validateBase64Strict("Invalid!!!Base64###"), /Formato Base64 incorreto/);
    assert.throws(() => validateBase64Strict("AbC"), /Formato Base64 incorreto/);
    assert.throws(() => validateBase64Strict(""), /inválido ou ausente/);
  });

  await t.test("Geração de chave opaca e sanitização contra Path Traversal", () => {
    const key = generateStorageKey("../../secret/paciente_joao.pdf");
    assert.ok(key.startsWith("attachments/"));
    assert.ok(key.endsWith(".pdf"));
    assert.equal(key.includes("paciente_joao"), false, "A chave do storage não pode expor nome de paciente");
    assert.equal(key.includes(".."), false);

    assert.equal(sanitizeFilename("../../../var/log/audit.txt"), "audit.txt");
    assert.equal(sanitizeFilename("C:\\System32\\cmd.exe"), "cmd.exe");
  });

  await t.test("Reconciliação de arquivos órfãos no storage", async () => {
    const storage = new LocalAttachmentStorage();
    const orphanKey = `orphan_${Date.now()}.bin`;
    await storage.save(orphanKey, Buffer.from("conteudo orfao"), "application/octet-stream");

    const mockPool = {
      query: async () => ({ rows: [] }), // Nenhum anexo ativo no banco
    };

    const res = await reconcileOrphanAttachments(mockPool, storage);
    assert.equal(res.cleanedCount >= 1, true);
    assert.equal(await storage.exists(orphanKey), false);
  });

  await t.test("Compensação de falhas: remoção do storage quando a gravação falha", async () => {
    const storage = new LocalAttachmentStorage();
    const key = `compensation_test_${Date.now()}.pdf`;
    const pdfBuffer = Buffer.from("%PDF-1.4\n%%EOF");

    await storage.save(key, pdfBuffer, "application/pdf");
    assert.equal(await storage.exists(key), true);

    // Simula compensação em caso de erro na transação do banco
    await storage.delete(key);
    assert.equal(await storage.exists(key), false);
  });
});
