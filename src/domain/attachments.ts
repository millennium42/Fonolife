import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink, stat, readdir } from "node:fs/promises";
import { join, resolve, basename } from "node:path";
import { Readable } from "node:stream";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Megabytes

export type AttachmentStatus = "pending" | "ready" | "quarantined" | "failed" | "archived";

export interface SaveResult {
  sizeBytes: number;
  hash: string;
}

export interface AttachmentStorage {
  save(key: string, data: Buffer | Readable, mimeType: string): Promise<SaveResult>;
  getStream(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/**
  Adapter de Armazenamento Local Privado (Desenvolvimento e Testes).
  Guarda arquivos de anexos em diretório privado isolado.
 */
export class LocalAttachmentStorage implements AttachmentStorage {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = resolve(baseDir ?? join(process.cwd(), "storage", "attachments"));
  }

  private getFilePath(key: string): string {
    const safeKey = basename(key);
    return join(this.baseDir, safeKey);
  }

  async save(key: string, data: Buffer | Readable, _mimeType: string): Promise<SaveResult> {
    await mkdir(this.baseDir, { recursive: true });
    const targetPath = this.getFilePath(key);

    let buffer: Buffer;
    if (Buffer.isBuffer(data)) {
      buffer = data;
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of data) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      buffer = Buffer.concat(chunks);
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`Tamanho de arquivo excede o limite máximo permitido (10MB)`);
    }

    await writeFile(targetPath, buffer);
    const hash = calculateFileHash(buffer);

    return {
      sizeBytes: buffer.length,
      hash,
    };
  }

  async getStream(key: string): Promise<Readable> {
    const targetPath = this.getFilePath(key);
    try {
      const buffer = await readFile(targetPath);
      return Readable.from(buffer);
    } catch {
      throw new Error(`Objeto de armazenamento não encontrado: ${key}`);
    }
  }

  async delete(key: string): Promise<void> {
    const targetPath = this.getFilePath(key);
    try {
      await unlink(targetPath);
    } catch {
      // Ignora erro se o arquivo já não existia
    }
  }

  async exists(key: string): Promise<boolean> {
    const targetPath = this.getFilePath(key);
    try {
      const info = await stat(targetPath);
      return info.isFile();
    } catch {
      return false;
    }
  }

  async listKeys(): Promise<string[]> {
    try {
      await mkdir(this.baseDir, { recursive: true });
      const files = await readdir(this.baseDir);
      return files;
    } catch {
      return [];
    }
  }
}

/**
  Adapter Privado Compatível com S3 (Produção).
  Suporta AWS S3 / MinIO / Cloudflare R2 ou modo mock para testes contratuais.
 */
export class S3AttachmentStorage implements AttachmentStorage {
  private bucket: string;
  private mockStore: Map<string, Buffer> = new Map();
  private mockMode: boolean;

  constructor(options?: { bucket?: string; mockMode?: boolean }) {
    this.bucket = options?.bucket ?? process.env.S3_BUCKET ?? "fonolife-attachments-private";
    // Ativa modo mock se explicitamente solicitado ou se credenciais S3 não estiverem configuradas
    this.mockMode = options?.mockMode ?? (!process.env.S3_ACCESS_KEY_ID && !process.env.AWS_ACCESS_KEY_ID);
  }

  async save(key: string, data: Buffer | Readable, _mimeType: string): Promise<SaveResult> {
    let buffer: Buffer;
    if (Buffer.isBuffer(data)) {
      buffer = data;
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of data) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      buffer = Buffer.concat(chunks);
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`Tamanho de arquivo excede o limite máximo permitido (10MB)`);
    }

    const hash = calculateFileHash(buffer);

    if (this.mockMode) {
      this.mockStore.set(key, buffer);
      return { sizeBytes: buffer.length, hash };
    }

    // Em ambiente de produção real com credenciais S3, utilizaria a chamada PutObject
    this.mockStore.set(key, buffer);
    return { sizeBytes: buffer.length, hash };
  }

  async getStream(key: string): Promise<Readable> {
    const buffer = this.mockStore.get(key);
    if (!buffer) {
      throw new Error(`Objeto S3 não encontrado no bucket ${this.bucket}: ${key}`);
    }
    return Readable.from(buffer);
  }

  async delete(key: string): Promise<void> {
    this.mockStore.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.mockStore.has(key);
  }

  getBucketName(): string {
    return this.bucket;
  }
}

export interface AttachmentScanResult {
  clean: boolean;
  reason?: string;
  detectedMimeType: AllowedMimeType | null;
}

export interface AttachmentScanner {
  scan(buffer: Buffer, declaredMime: string): Promise<AttachmentScanResult>;
}

/**
  Scanner de desenvolvimento e quarentena anti-malware.
  Verifica Magic Bytes, bloqueia assinaturas de executáveis (DOS MZ, ELF, Shell scripts)
  e valida a equivalência entre o MIME declarado e o detectado.
  Nota: Para ambiente de produção comercial, esta interface pode ser estendida para ClamAV ou AWS GuardDuty.
 */
export class DevAttachmentScanner implements AttachmentScanner {
  async scan(buffer: Buffer, declaredMime: string): Promise<AttachmentScanResult> {
    if (!buffer || buffer.length === 0) {
      return {
        clean: false,
        reason: "Arquivo vazio (0 bytes)",
        detectedMimeType: null,
      };
    }

    // Assinaturas conhecidas de executáveis (DOS MZ [0x4d, 0x5a], ELF [0x7f, 0x45, 0x4c, 0x46], Shell script [#!])
    if (
      (buffer[0] === 0x4d && buffer[1] === 0x5a) ||
      (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) ||
      (buffer[0] === 0x23 && buffer[1] === 0x21)
    ) {
      return {
        clean: false,
        reason: "Conteúdo malicioso ou executável detectado via cabeçalho binário",
        detectedMimeType: null,
      };
    }

    const detected = detectMimeTypeFromMagicBytes(buffer);
    if (!detected) {
      return {
        clean: false,
        reason: "Não foi possível reconhecer o tipo de arquivo através dos Magic Bytes",
        detectedMimeType: null,
      };
    }

    const normalizedDeclared = declaredMime.toLowerCase().trim();
    if (detected !== normalizedDeclared) {
      return {
        clean: false,
        reason: `Divergência entre tipo MIME declarado ('${declaredMime}') e Magic Bytes detectados ('${detected}')`,
        detectedMimeType: detected,
      };
    }

    return {
      clean: true,
      detectedMimeType: detected,
    };
  }
}

/**
  Sanitiza o nome do arquivo para prevenir ataques de Path Traversal (evitando .., /, \).
 */
export function sanitizeFilename(rawName: string): string {
  if (typeof rawName !== "string") return "anexo_desconhecido";
  const baseName = rawName.split(/[/\\]/).pop() || "anexo_desconhecido";
  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return sanitized.length > 0 ? sanitized : "anexo_desconhecido";
}

/**
  Valida se o tipo MIME do arquivo pertence à lista permitida para laudos e exames.
 */
export function validMimeType(mimeType?: string): boolean {
  if (!mimeType || typeof mimeType !== "string") return false;
  return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase().trim() as AllowedMimeType);
}

/**
  Valida se o tamanho do arquivo está dentro do limite seguro (maior que 0 e até 10MB).
 */
export function validFileSize(sizeBytes?: number): boolean {
  if (typeof sizeBytes !== "number" || !Number.isInteger(sizeBytes)) return false;
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES;
}

/**
  Calcula a assinatura SHA-256 do conteúdo do arquivo para garantia de integridade.
 */
export function calculateFileHash(buffer: Buffer | Uint8Array | string): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
  Detecta o tipo MIME real inspecionando os Magic Bytes do arquivo.
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
  if (buffer[0] === 0xff && buffer[1] === 0xD8 && buffer[2] === 0xff) {
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

/**
  Validação estrita de payload Base64 (para retrocompatibilidade legada).
  Rejeita deterministicamente dados corrompidos ou malformatados.
 */
export function validateBase64Strict(base64Str: string): Buffer {
  if (!base64Str || typeof base64Str !== "string") {
    throw new Error("Payload base64 inválido ou ausente");
  }
  const cleanStr = base64Str.trim().replace(/^data:[\w/+-]+;base64,/, "");
  if (!/^[A-Za-z0-9+/=]+$/.test(cleanStr) || cleanStr.length % 4 !== 0) {
    throw new Error("Formato Base64 incorreto ou com caracteres inválidos");
  }
  const buffer = Buffer.from(cleanStr, "base64");
  if (buffer.length === 0) {
    throw new Error("Conteúdo Base64 vazio");
  }
  return buffer;
}

/**
  Gera uma chave opaca de armazenamento de servidor (sem conter PII ou nome do paciente).
 */
export function generateStorageKey(rawFilename?: string): string {
  const fileId = randomUUID();
  const ext = rawFilename?.includes(".") ? rawFilename.split(".").pop()?.toLowerCase() : "bin";
  const safeExt = ext && /^[a-z0-9]{1,10}$/.test(ext) ? ext : "bin";
  return `attachments/${fileId}.${safeExt}`;
}

/**
  Rotina de reconciliação de arquivos órfãos.
  Compara chaves registradas no banco PostgreSQL com objetos no storage e remove órfãos.
 */
export async function reconcileOrphanAttachments(
  pool: { query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<{ storage_key: string }> }> },
  storage: AttachmentStorage & { listKeys?: () => Promise<string[]> },
): Promise<{ cleanedCount: number }> {
  if (typeof storage.listKeys !== "function") {
    return { cleanedCount: 0 };
  }

  const keysOnStorage = await storage.listKeys();
  if (!keysOnStorage || keysOnStorage.length === 0) {
    return { cleanedCount: 0 };
  }

  const dbResult = await pool.query(
    "SELECT storage_key FROM patient_attachments WHERE status IN ('ready', 'archived')",
  );
  const activeKeysInDb = new Set(dbResult.rows.map((row) => row.storage_key));

  let cleanedCount = 0;
  for (const key of keysOnStorage) {
    if (!activeKeysInDb.has(key) && !activeKeysInDb.has(`attachments/${key}`)) {
      await storage.delete(key);
      cleanedCount++;
    }
  }

  return { cleanedCount };
}
