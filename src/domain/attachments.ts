import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink, stat, readdir } from "node:fs/promises";
import { join, resolve, basename } from "node:path";
import { Readable } from "node:stream";
import net from "node:net";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Megabytes

export type AttachmentStatus = "pending" | "ready" | "quarantined" | "failed" | "archived";

export const ATTACHMENT_CATEGORIES = ["audiometry", "exam_report", "medical_request", "other"] as const;
export type AttachmentCategory = (typeof ATTACHMENT_CATEGORIES)[number];

export interface SaveResult {
  sizeBytes: number;
  hash: string;
}

export interface AttachmentStorage {
  save(key: string, data: Buffer | Readable, mimeType: string): Promise<SaveResult>;
  getStream(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getSignedUrl?(key: string, ttlSeconds?: number): Promise<string>;
  health(): Promise<{ status: "ok" | "degraded" | "down"; details?: string }>;
}

/**
  Adapter de Armazenamento Volátil em Memória.
  Permitido unicamente nos ambientes de 'test' e 'demo'.
 */
export class InMemoryAttachmentStorage implements AttachmentStorage {
  private store: Map<string, { buffer: Buffer; mimeType: string }> = new Map();

  async save(key: string, data: Buffer | Readable, mimeType: string): Promise<SaveResult> {
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
    this.store.set(key, { buffer, mimeType });
    return { sizeBytes: buffer.length, hash };
  }

  async getStream(key: string): Promise<Readable> {
    const item = this.store.get(key);
    if (!item) {
      const err = new Error(`Objeto não encontrado no storage em memória: ${key}`);
      (err as any).notFound = true;
      (err as any).code = "ENOENT";
      throw err;
    }
    return Readable.from(item.buffer);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async getSignedUrl(key: string, ttlSeconds = 300): Promise<string> {
    if (!await this.exists(key)) {
      const err = new Error(`Objeto não encontrado para gerar URL assinada: ${key}`);
      (err as any).notFound = true;
      throw err;
    }
    const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
    const safeKey = encodeURIComponent(key);
    return `https://demo-inmemory.fonolife.local/${safeKey}?expires=${expires}&signature=demo_inmemory_${randomUUID()}`;
  }

  async health(): Promise<{ status: "ok" | "degraded" | "down"; details?: string }> {
    return { status: "ok", details: "in-memory-isolated" };
  }

  async listKeys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }
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
    } catch (err: any) {
      if (err?.code === "ENOENT") {
        const error = new Error(`Objeto de armazenamento não encontrado: ${key}`);
        (error as any).notFound = true;
        (error as any).code = "ENOENT";
        throw error;
      }
      const unavailErr = new Error(`Storage local indisponível ao ler (${key}): ${err?.message || err}`);
      (unavailErr as any).unavailable = true;
      throw unavailErr;
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

  async health(): Promise<{ status: "ok" | "degraded" | "down"; details?: string }> {
    try {
      await mkdir(this.baseDir, { recursive: true });
      return { status: "ok" };
    } catch (err: any) {
      return { status: "degraded", details: err?.message || "Falha ao acessar diretório local de armazenamento" };
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

export interface S3AttachmentStorageOptions {
  bucket?: string;
  region?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  accessKeyId?: string;
  secretAccessKey?: string;
  client?: S3Client;
}

/**
  Adapter Privado Compatível com S3 (Produção).
  Suporta AWS S3 / MinIO / Cloudflare R2 utilizando AWS SDK v3 oficial.
 */
export class S3AttachmentStorage implements AttachmentStorage {
  private bucket: string;
  private s3Client: S3Client;

  constructor(options?: S3AttachmentStorageOptions) {
    this.bucket = options?.bucket ?? process.env.S3_BUCKET ?? "fonolife-attachments-private";
    if (!this.bucket) {
      throw new Error("CONFIG ERROR: S3_BUCKET ausente ao inicializar S3AttachmentStorage.");
    }
    if ((options as any)?.mockMode) {
      throw new Error("CONFIG ERROR: mockMode foi removido de S3AttachmentStorage. Utilize InMemoryAttachmentStorage para test/demo.");
    }

    if (options?.client) {
      this.s3Client = options.client;
    } else {
      const region = options?.region ?? process.env.S3_REGION ?? process.env.AWS_REGION ?? "us-east-1";
      const endpoint = options?.endpoint ?? process.env.S3_ENDPOINT ?? process.env.AWS_ENDPOINT;
      const forcePathStyle = options?.forcePathStyle ?? (process.env.S3_FORCE_PATH_STYLE === "true" || !!endpoint);
      const accessKeyId = options?.accessKeyId ?? process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = options?.secretAccessKey ?? process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;

      const clientConfig: any = {
        region,
        forcePathStyle,
      };

      if (endpoint) {
        clientConfig.endpoint = endpoint;
      }

      // Utiliza credenciais explícitas se configuradas ou delega à provider chain oficial da AWS se adotada no ambiente
      if (accessKeyId && secretAccessKey) {
        clientConfig.credentials = { accessKeyId, secretAccessKey };
      }

      this.s3Client = new S3Client(clientConfig);
    }
  }

  async save(key: string, data: Buffer | Readable, mimeType: string): Promise<SaveResult> {
    let buffer: Buffer;
    if (Buffer.isBuffer(data)) {
      buffer = data;
    } else {
      const chunks: Buffer[] = [];
      let totalLength = 0;
      for await (const chunk of data) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalLength += buf.length;
        if (totalLength > MAX_FILE_SIZE_BYTES) {
          throw new Error(`Tamanho de arquivo excede o limite máximo permitido (10MB)`);
        }
        chunks.push(buf);
      }
      buffer = Buffer.concat(chunks);
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`Tamanho de arquivo excede o limite máximo permitido (10MB)`);
    }

    const hash = calculateFileHash(buffer);

    const putParams: any = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ContentLength: buffer.length,
      ServerSideEncryption: "AES256",
    };

    await this.s3Client.send(new PutObjectCommand(putParams));
    return { sizeBytes: buffer.length, hash };
  }

  private isNotFoundError(err: any): boolean {
    const name = err?.name || err?.Code || err?.code;
    const status = err?.$metadata?.httpStatusCode || err?.statusCode;
    return (
      name === "NoSuchKey" ||
      name === "NotFound" ||
      status === 404 ||
      (typeof err?.message === "string" && (err.message.includes("NoSuchKey") || err.message.includes("NotFound") || err.message.includes("404")))
    );
  }

  async getStream(key: string): Promise<Readable> {
    try {
      const res = await this.s3Client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      if (!res.Body) {
        const err = new Error(`Corpo do objeto S3 está vazio: ${key}`);
        (err as any).notFound = true;
        (err as any).code = "ENOENT";
        throw err;
      }
      if (res.Body instanceof Readable) {
        return res.Body;
      }
      if (typeof (res.Body as any).transformToByteArray === "function") {
        const bytes = await (res.Body as any).transformToByteArray();
        return Readable.from(Buffer.from(bytes));
      }
      return Readable.from(res.Body as any);
    } catch (err: any) {
      if (this.isNotFoundError(err)) {
        const notFoundErr = new Error(`Arquivo físico não encontrado no storage S3: ${key}`);
        (notFoundErr as any).notFound = true;
        (notFoundErr as any).code = "ENOENT";
        throw notFoundErr;
      }
      const unavailErr = new Error(`Storage S3 indisponível ao ler objeto (${key}): ${err?.message || err}`);
      (unavailErr as any).unavailable = true;
      throw unavailErr;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
    } catch (err: any) {
      if (this.isNotFoundError(err)) {
        return;
      }
      throw new Error(`Storage S3 indisponível ao excluir objeto (${key}): ${err?.message || err}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return true;
    } catch (err: any) {
      if (this.isNotFoundError(err)) {
        return false;
      }
      throw new Error(`Storage S3 indisponível ao verificar existência de (${key}): ${err?.message || err}`);
    }
  }

  async getSignedUrl(key: string, ttlSeconds = 300): Promise<string> {
    if (!await this.exists(key)) {
      const notFoundErr = new Error(`Objeto não encontrado para gerar URL assinada: ${key}`);
      (notFoundErr as any).notFound = true;
      (notFoundErr as any).code = "ENOENT";
      throw notFoundErr;
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return awsGetSignedUrl(this.s3Client, command, { expiresIn: ttlSeconds });
  }

  async health(): Promise<{ status: "ok" | "degraded" | "down"; details?: string }> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return { status: "ok" };
    } catch (err: any) {
      const statusCode = err?.$metadata?.httpStatusCode;
      const errName = err?.name || err?.Code || "";
      const errMsg = String(err?.message || "");
      const isFatal =
        statusCode === 404 ||
        statusCode === 403 ||
        statusCode === 401 ||
        ["NoSuchBucket", "NotFound", "InvalidAccessKeyId", "AccessDenied", "CredentialsProviderError", "Forbidden"].some(
          (token) => errName.includes(token) || errMsg.includes(token) || errMsg.includes("does not exist")
        );

      if (isFatal) {
        let cause = `Bucket inexistente ou falha de credenciais no storage S3 (${errName || errMsg})`;
        if (statusCode === 404 || ["NoSuchBucket", "NotFound"].some((t) => errName.includes(t) || errMsg.includes(t) || errMsg.includes("does not exist"))) {
          cause = `NoSuchBucket / NotFound: bucket '${this.bucket}' inexistente ou inacessível (${errName || errMsg})`;
        } else if (statusCode === 403 || statusCode === 401 || ["InvalidAccessKeyId", "AccessDenied", "CredentialsProviderError", "Forbidden"].some((t) => errName.includes(t) || errMsg.includes(t))) {
          cause = `InvalidAccessKeyId / Forbidden: credenciais inválidas ou acesso negado no S3 (${errName || errMsg})`;
        }
        return {
          status: "down",
          details: cause,
        };
      }

      return {
        status: "degraded",
        details: errMsg || "Falha transitória na verificação do bucket S3 (HeadBucket)",
      };
    }
  }

  async listKeys(): Promise<string[]> {
    try {
      const res = await this.s3Client.send(new ListObjectsV2Command({ Bucket: this.bucket }));
      if (!res.Contents) return [];
      return res.Contents.map((item) => item.Key || "").filter(Boolean);
    } catch (err: any) {
      throw new Error(`Storage S3 indisponível ao listar chaves: ${err?.message || err}`);
    }
  }

  getBucketName(): string {
    return this.bucket;
  }
}

export interface AttachmentScanResult {
  status: "clean" | "infected" | "failed";
  engine: string;
  signature?: string;
  clean?: boolean; // Retrocompatibilidade
  reason?: string;
  detectedMimeType?: AllowedMimeType | null;
}

export interface AttachmentScanner {
  scan(data: Buffer | Readable, declaredMime?: string): Promise<AttachmentScanResult>;
  healthCheck?(): Promise<{ status: "ok" | "degraded" | "down"; details?: string }>;
}

/**
  Scanner de desenvolvimento e quarentena anti-malware via Magic Bytes.
 */
export class DevAttachmentScanner implements AttachmentScanner {
  async scan(data: Buffer | Readable, declaredMime?: string): Promise<AttachmentScanResult> {
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

    if (!buffer || buffer.length === 0) {
      return {
        status: "infected",
        clean: false,
        engine: "dev-magic-bytes",
        reason: "Arquivo vazio (0 bytes)",
        detectedMimeType: null,
      };
    }

    // Assinaturas conhecidas de executáveis (DOS MZ, ELF, Shell script)
    if (
      (buffer[0] === 0x4d && buffer[1] === 0x5a) ||
      (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) ||
      (buffer[0] === 0x23 && buffer[1] === 0x21)
    ) {
      return {
        status: "infected",
        clean: false,
        engine: "dev-magic-bytes",
        signature: "Malicious-Executable-Header",
        reason: "Conteúdo malicioso ou executável detectado via cabeçalho binário",
        detectedMimeType: null,
      };
    }

    const detected = detectMimeTypeFromMagicBytes(buffer);
    if (!detected) {
      return {
        status: "infected",
        clean: false,
        engine: "dev-magic-bytes",
        reason: "Não foi possível reconhecer o tipo de arquivo através dos Magic Bytes",
        detectedMimeType: null,
      };
    }

    if (declaredMime) {
      const normalizedDeclared = declaredMime.toLowerCase().trim();
      if (detected !== normalizedDeclared) {
        return {
          status: "infected",
          clean: false,
          engine: "dev-magic-bytes",
          reason: `Divergência entre tipo MIME declarado ('${declaredMime}') e Magic Bytes detectados ('${detected}')`,
          detectedMimeType: detected,
        };
      }
    }

    return {
      status: "clean",
      clean: true,
      engine: "dev-magic-bytes",
      detectedMimeType: detected,
    };
  }
}

/**
  Adapter do Scanner Antivírus ClamAV para ambiente de Produção.
 */
export class ClamAVAttachmentScanner implements AttachmentScanner {
  private host: string;
  private port: number;
  private timeoutMs: number;

  constructor(options?: { host?: string; port?: number; timeoutMs?: number }) {
    this.host = options?.host ?? process.env.CLAMAV_HOST ?? "localhost";
    this.port = options?.port ?? Number(process.env.CLAMAV_PORT ?? 3310);
    this.timeoutMs = options?.timeoutMs ?? Number(process.env.CLAMAV_TIMEOUT_MS ?? 10000);
  }

  async healthCheck(): Promise<{ status: "ok" | "degraded" | "down"; details?: string }> {
    try {
      const response = await this.executeCommand("zPING\0");
      if (response.includes("PONG")) {
        return { status: "ok" };
      }
      return { status: "degraded", details: `Resposta inesperada do ClamAV no PING: ${response}` };
    } catch (err: any) {
      return { status: "down", details: `ClamAV indisponível: ${err?.message || err}` };
    }
  }

  async ping(): Promise<boolean> {
    const res = await this.healthCheck();
    return res.status === "ok";
  }

  private executeCommand(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: this.host, port: this.port });
      let response = "";

      const cleanup = () => {
        socket.removeAllListeners();
        if (!socket.destroyed) {
          socket.destroy();
        }
      };

      socket.setTimeout(this.timeoutMs, () => {
        cleanup();
        reject(new Error("Timeout de conexão/leitura ao comunicar com ClamAV daemon"));
      });

      socket.on("error", (err) => {
        cleanup();
        reject(err);
      });

      socket.on("connect", () => {
        socket.write(Buffer.from(cmd, "binary"));
      });

      socket.on("data", (chunk) => {
        response += chunk.toString("utf-8");
        if (response.endsWith("\0") || response.endsWith("\n") || response.includes("PONG")) {
          cleanup();
          resolve(response.replace(/[\r\n\0]/g, "").trim());
        }
      });

      socket.on("end", () => {
        cleanup();
        resolve(response.replace(/[\r\n\0]/g, "").trim());
      });
    });
  }

  async scan(data: Buffer | Readable, declaredMime?: string): Promise<AttachmentScanResult> {
    // 1. Validação estrutural com Magic Bytes mantida como camada de proteção estrutural e de tamanho
    let buffer: Buffer;
    if (Buffer.isBuffer(data)) {
      buffer = data;
    } else {
      const chunks: Buffer[] = [];
      let totalLength = 0;
      for await (const chunk of data) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalLength += buf.length;
        if (totalLength > MAX_FILE_SIZE_BYTES) {
          return {
            status: "failed",
            clean: false,
            engine: "clamav",
            reason: `Tamanho do stream excede limite máximo permitido de ${MAX_FILE_SIZE_BYTES} bytes`,
          };
        }
        chunks.push(buf);
      }
      buffer = Buffer.concat(chunks);
    }

    if (!buffer || buffer.length === 0) {
      return {
        status: "failed",
        clean: false,
        engine: "clamav",
        reason: "Arquivo de anexo vazio (0 bytes)",
      };
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      return {
        status: "failed",
        clean: false,
        engine: "clamav",
        reason: `Anexo excede o tamanho máximo de ${MAX_FILE_SIZE_BYTES} bytes`,
      };
    }

    if (
      (buffer[0] === 0x4d && buffer[1] === 0x5a) ||
      (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) ||
      (buffer[0] === 0x23 && buffer[1] === 0x21)
    ) {
      return {
        status: "infected",
        clean: false,
        engine: "clamav",
        signature: "Malicious-Executable-Header",
        reason: "Conteúdo executável proibido detectado no cabeçalho binário",
      };
    }

    const detectedMimeType = detectMimeTypeFromMagicBytes(buffer);
    if (declaredMime && detectedMimeType) {
      if (declaredMime.toLowerCase().trim() !== detectedMimeType) {
        return {
          status: "infected",
          clean: false,
          engine: "clamav",
          reason: `Divergência entre MIME declarado ('${declaredMime}') e detectado por magic bytes ('${detectedMimeType}')`,
          detectedMimeType,
        };
      }
    }

    // 2. Comunicação real com clamd via protocolo TCP INSTREAM
    try {
      const scanResultString = await new Promise<string>((resolve, reject) => {
        const socket = net.createConnection({ host: this.host, port: this.port });
        let response = "";
        let finished = false;

        const finish = (err: Error | null, res?: string) => {
          if (finished) return;
          finished = true;
          socket.removeAllListeners();
          if (!socket.destroyed) socket.destroy();
          if (err) reject(err);
          else resolve(res || "");
        };

        socket.setTimeout(this.timeoutMs, () => {
          finish(new Error("Timeout na comunicação TCP INSTREAM com daemon ClamAV"));
        });

        socket.on("error", (err) => finish(err));

        socket.on("connect", () => {
          try {
            socket.write(Buffer.from("zINSTREAM\0", "binary"));

            const chunkSize = Math.min(buffer.length, 65536);
            for (let offset = 0; offset < buffer.length; offset += chunkSize) {
              const slice = buffer.subarray(offset, offset + chunkSize);
              const lenBuf = Buffer.alloc(4);
              lenBuf.writeUInt32BE(slice.length, 0);
              socket.write(lenBuf);
              socket.write(slice);
            }

            const terminator = Buffer.alloc(4);
            socket.write(terminator);
          } catch (e: any) {
            finish(e);
          }
        });

        socket.on("data", (chunk) => {
          response += chunk.toString("utf-8");
          if (response.includes("\0") || response.includes("\n")) {
            finish(null, response.replace(/[\r\n\0]/g, "").trim());
          }
        });

        socket.on("end", () => {
          finish(null, response.replace(/[\r\n\0]/g, "").trim());
        });
      });

      // 3. Parser explícito de status ClamAV
      if (scanResultString === "stream: OK" || scanResultString === "OK" || scanResultString.endsWith(": OK")) {
        return {
          status: "clean",
          clean: true,
          engine: "clamav",
          detectedMimeType,
        };
      }

      if (scanResultString.includes("FOUND")) {
        const match = scanResultString.match(/^(?:stream:\s*)?(.+?)\s+FOUND$/i);
        const signature = match ? match[1] : "Malicious-Signature-Found";
        return {
          status: "infected",
          clean: false,
          engine: "clamav",
          signature,
          reason: `Malware detectado pelo ClamAV: ${signature}`,
          detectedMimeType,
        };
      }

      return {
        status: "failed",
        clean: false,
        engine: "clamav",
        reason: `Resposta desconhecida do scanner (fail-closed): ${scanResultString || "Sem resposta"}`,
        detectedMimeType,
      };
    } catch (err: any) {
      return {
        status: "failed",
        clean: false,
        engine: "clamav",
        reason: err?.message || "Indisponibilidade ou erro na comunicação com ClamAV daemon",
      };
    }
  }
}

/**
  Scanner Mock para testes automatizados.
 */
export class MockAttachmentScanner implements AttachmentScanner {
  private forceFail: boolean;

  constructor(options?: { forceFail?: boolean }) {
    this.forceFail = options?.forceFail ?? false;
  }

  async scan(data: Buffer | Readable, declaredMime?: string): Promise<AttachmentScanResult> {
    if (this.forceFail) {
      return {
        status: "failed",
        clean: false,
        engine: "mock-engine",
        reason: "Simulação de falha de comunicação do scanner",
      };
    }

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

    const str = buffer.toString("utf8");
    if (str.includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")) {
      return {
        status: "infected",
        clean: false,
        engine: "mock-engine",
        signature: "EICAR-Standard-Antivirus-Test-File",
        reason: "Assinatura de vírus detectada",
      };
    }

    return {
      status: "clean",
      clean: true,
      engine: "mock-engine",
      detectedMimeType: "application/pdf",
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
