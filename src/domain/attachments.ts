import { createHash } from "node:crypto";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Megabytes

/**
 * Sanitiza o nome do arquivo para prevenir ataques de Path Traversal (evitando .., /, \).
 */
export function sanitizeFilename(rawName: string): string {
  if (typeof rawName !== "string") return "anexo_desconhecido";
  // Remove caminhos de diretório e caracteres perigosos
  const baseName = rawName.split(/[/\\]/).pop() || "anexo_desconhecido";
  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return sanitized.length > 0 ? sanitized : "anexo_desconhecido";
}

/**
 * Valida se o tipo MIME do arquivo pertence à lista permitida para laudos e exames.
 */
export function validMimeType(mimeType?: string): boolean {
  if (!mimeType || typeof mimeType !== "string") return false;
  return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase().trim() as AllowedMimeType);
}

/**
 * Valida se o tamanho do arquivo está dentro do limite seguro (maior que 0 e até 10MB).
 */
export function validFileSize(sizeBytes?: number): boolean {
  if (typeof sizeBytes !== "number" || !Number.isInteger(sizeBytes)) return false;
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES;
}

/**
 * Calcula a assinatura SHA-256 do conteúdo do arquivo para garantia de integridade e deduplicação.
 */
export function calculateFileHash(buffer: Buffer | Uint8Array | string): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Detecta o tipo MIME real inspecionando os Magic Bytes do arquivo (prevenindo spoofing de extensão/header).
 */
export function detectMimeTypeFromMagicBytes(buffer: Buffer): AllowedMimeType | null {
  if (!buffer || buffer.length < 4) return null;
  // PDF (%PDF)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "application/pdf";
  }
  // PNG (\x89PNG)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  // JPEG (\xFF\xD8\xFF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // WEBP (RIFF...WEBP)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

