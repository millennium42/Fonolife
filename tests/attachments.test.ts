import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateFileHash,
  detectMimeTypeFromMagicBytes,
  MAX_FILE_SIZE_BYTES,
  sanitizeFilename,
  validFileSize,
  validMimeType,
} from "../src/domain/attachments.js";

test("sanitiza nome do arquivo contra ataques de Path Traversal", () => {
  assert.equal(sanitizeFilename("../../../etc/passwd"), "passwd");
  assert.equal(sanitizeFilename("C:\\Windows\\System32\\cmd.exe"), "cmd.exe");
  assert.equal(sanitizeFilename("audiometria paciente #1.pdf"), "audiometria_paciente__1.pdf");
});

test("valida tipos MIME autorizados para exames audiométricos", () => {
  assert.equal(validMimeType("application/pdf"), true);
  assert.equal(validMimeType("image/jpeg"), true);
  assert.equal(validMimeType("image/png"), true);
  assert.equal(validMimeType("image/webp"), true);
  assert.equal(validMimeType("application/x-executable"), false);
  assert.equal(validMimeType("text/html"), false);
});

test("valida limite de tamanho de arquivo (máximo 10MB)", () => {
  assert.equal(validFileSize(1024), true); // 1KB
  assert.equal(validFileSize(MAX_FILE_SIZE_BYTES), true); // 10MB
  assert.equal(validFileSize(MAX_FILE_SIZE_BYTES + 1), false);
  assert.equal(validFileSize(0), false);
  assert.equal(validFileSize(-500), false);
});

test("calcula hash SHA-256 do conteúdo do anexo", () => {
  const hash = calculateFileHash("conteudo-exemplo-audiometria");
  assert.equal(typeof hash, "string");
  assert.equal(hash.length, 64);
});

test("detecta tipo MIME real através de magic bytes", () => {
  const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
  const fakeHeader = Buffer.from([0x4d, 0x5a, 0x90, 0x00]); // DOS MZ header

  assert.equal(detectMimeTypeFromMagicBytes(pdfHeader), "application/pdf");
  assert.equal(detectMimeTypeFromMagicBytes(pngHeader), "image/png");
  assert.equal(detectMimeTypeFromMagicBytes(fakeHeader), null);
});

