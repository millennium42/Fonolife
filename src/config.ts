export type AppEnvironment = "test" | "development" | "demo" | "production";

const appEnvironments = new Set<AppEnvironment>(["test", "development", "demo", "production"]);
const inferredAppEnv = process.env.NODE_ENV === "test"
  ? "test"
  : process.env.NODE_ENV === "production"
    ? "production"
    : "development";
const appEnv = process.env.APP_ENV ?? inferredAppEnv;

if (!appEnvironments.has(appEnv as AppEnvironment)) {
  throw new Error("CONFIG ERROR: APP_ENV must be test, development, demo or production.");
}

const production = appEnv === "production";

if (production && process.env.NODE_ENV && process.env.NODE_ENV !== "production") {
  throw new Error("CONFIG ERROR: NODE_ENV deve ser 'production' quando APP_ENV é 'production' (semântica unificada de segurança).");
}

const secureRuntime = production;
const demo = appEnv === "demo";
const authMemoryFallback =
  process.env.AUTH_MEMORY_FALLBACK === "true" ||
  ((appEnv === "development" || appEnv === "test") && process.env.AUTH_MEMORY_FALLBACK !== "false");

if (production && process.env.DEMO_MODE === "true") {
  throw new Error("CONFIG ERROR: demo features cannot be enabled in production.");
}

if (production && Object.keys(process.env).some((key) => key.startsWith("DEMO_") && process.env[key])) {
  throw new Error("CONFIG ERROR: demo configuration is forbidden in production.");
}

if ((production || demo) && process.env.AUTH_MEMORY_FALLBACK === "true") {
  throw new Error("CONFIG ERROR: AUTH_MEMORY_FALLBACK cannot be enabled in production or demo.");
}

const storageProvider = process.env.ATTACHMENT_STORAGE_PROVIDER ?? process.env.STORAGE_PROVIDER ?? (production ? 's3' : demo ? 'demo' : 'local');
const scannerProvider = process.env.ATTACHMENT_SCANNER_PROVIDER ?? (production ? 'clamav' : 'dev');
const clamavHost = process.env.CLAMAV_HOST ?? 'localhost';
const clamavPort = Number(process.env.CLAMAV_PORT ?? 3310);
const clamavTimeoutMs = Number(process.env.CLAMAV_TIMEOUT_MS ?? 10000);
const s3Bucket = process.env.S3_BUCKET ?? (production ? undefined : 'fonolife-attachments-private');
const s3Region = process.env.S3_REGION ?? 'us-east-1';
const s3Endpoint = process.env.S3_ENDPOINT;
const s3ForcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
const attachmentMaxBytes = Number(process.env.ATTACHMENT_MAX_BYTES ?? 10 * 1024 * 1024);
const attachmentDownloadTtlSeconds = Number(process.env.ATTACHMENT_DOWNLOAD_TTL_SECONDS ?? 300);

export function validateAttachmentConfig(options: {
  production: boolean;
  storageProvider: string;
  scannerProvider: string;
  s3Bucket?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  clamavHost?: string;
  clamavPort?: number;
  clamavTimeoutMs?: number;
  origin?: string;
  port?: number;
  attachmentMaxBytes?: number;
  attachmentDownloadTtlSeconds?: number;
}) {
  const checkPort = options.port ?? Number(process.env.PORT ?? 3000);
  const checkMaxBytes = options.attachmentMaxBytes ?? Number(process.env.ATTACHMENT_MAX_BYTES ?? 10 * 1024 * 1024);
  const checkTtl = options.attachmentDownloadTtlSeconds ?? Number(process.env.ATTACHMENT_DOWNLOAD_TTL_SECONDS ?? 300);
  if (!Number.isFinite(checkPort) || checkPort <= 0 || !Number.isFinite(checkMaxBytes) || checkMaxBytes <= 0 || !Number.isFinite(checkTtl) || checkTtl <= 0) {
    throw new Error("CONFIG ERROR: Valores numéricos de configuração (PORT, ATTACHMENT_MAX_BYTES, ATTACHMENT_DOWNLOAD_TTL_SECONDS) devem ser finitos positivos.");
  }

  if (options.production) {
    const checkOrigin = options.origin ?? process.env.APP_ORIGIN ?? process.env.RENDER_EXTERNAL_URL ?? "";
    if (checkOrigin && !checkOrigin.startsWith("https://")) {
      throw new Error("CONFIG ERROR: APP_ORIGIN obrigatoriamente deve utilizar HTTPS em ambiente de produção.");
    }
    if (options.storageProvider === "local") {
      throw new Error("CONFIG ERROR: LocalAttachmentStorage não pode ser utilizado em ambiente de produção.");
    }
    if (options.storageProvider === "demo" || options.storageProvider === "memory" || options.storageProvider !== "s3") {
      throw new Error(`CONFIG ERROR: Provider de storage '${options.storageProvider}' não pode ser utilizado em ambiente de produção (obrigatório 's3' e sem modo mock/memória).`);
    }
    if (options.scannerProvider === "dev" || options.scannerProvider === "mock") {
      throw new Error("CONFIG ERROR: DevAttachmentScanner não pode ser utilizado em ambiente de produção.");
    }
    if (options.scannerProvider !== "clamav") {
      throw new Error(`CONFIG ERROR: Provider de scanner '${options.scannerProvider}' não pode ser utilizado em ambiente de produção (obrigatório 'clamav').`);
    }
    const checkHost = options.clamavHost ?? process.env.CLAMAV_HOST ?? "localhost";
    const checkPortClam = options.clamavPort ?? Number(process.env.CLAMAV_PORT ?? 3310);
    const checkTimeout = options.clamavTimeoutMs ?? Number(process.env.CLAMAV_TIMEOUT_MS ?? 10000);
    if (!checkHost || isNaN(checkPortClam) || !Number.isFinite(checkPortClam) || checkPortClam <= 0 || checkPortClam > 65535 || isNaN(checkTimeout) || !Number.isFinite(checkTimeout) || checkTimeout <= 0) {
      throw new Error("CONFIG ERROR: Configuração de host, porta ou timeout para ClamAV é inválida em produção.");
    }
    if (options.storageProvider === "s3") {
      const hasExplicitCreds = !!(options.s3AccessKeyId && options.s3SecretAccessKey);
      const hasProviderChain = !!(process.env.AWS_ROLE_ARN || process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI || process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI || process.env.AWS_WEB_IDENTITY_TOKEN_FILE);
      if (!options.s3Bucket || (!hasExplicitCreds && !hasProviderChain)) {
        throw new Error("CONFIG ERROR: S3_BUCKET, S3_ACCESS_KEY_ID e S3_SECRET_ACCESS_KEY são obrigatórios para storage S3 em produção (ou configuração de IAM provider chain).");
      }
    }
  }
}

// Executa validação de startup para a configuração atual
validateAttachmentConfig({
  production,
  storageProvider,
  scannerProvider,
  s3Bucket,
  s3AccessKeyId,
  s3SecretAccessKey,
  clamavHost,
  clamavPort,
  clamavTimeoutMs,
  origin: process.env.APP_ORIGIN ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:5173",
  port: Number(process.env.PORT ?? 3000),
  attachmentMaxBytes,
  attachmentDownloadTtlSeconds,
});

export const config = {
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://fonolife:fonolife@localhost:5432/fonolife',
  port: Number(process.env.PORT ?? 3000),
  origin: process.env.APP_ORIGIN ?? process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:5173',
  appEnv: appEnv as AppEnvironment,
  production,
  secureRuntime,
  demo,
  authMemoryFallback,
  storageProvider,
  scannerProvider,
  s3Bucket,
  s3Region,
  s3Endpoint,
  s3ForcePathStyle,
  s3AccessKeyId,
  s3SecretAccessKey,
  clamavHost,
  clamavPort,
  clamavTimeoutMs,
  attachmentMaxBytes,
  attachmentDownloadTtlSeconds,
};
