const production = process.env.NODE_ENV === 'production';
const demo = process.env.DEMO_MODE === 'true';
const allowProductionDemo = process.env.ALLOW_PRODUCTION_DEMO === 'true';
const authMemoryFallback = process.env.AUTH_MEMORY_FALLBACK === 'true' || (!production && process.env.AUTH_MEMORY_FALLBACK !== 'false');

if (production && demo && !allowProductionDemo) {
  throw new Error('CONFIG ERROR: DEMO_MODE cannot be enabled in production environment unless ALLOW_PRODUCTION_DEMO is explicitly set to true.');
}

if (production && process.env.AUTH_MEMORY_FALLBACK === 'true') {
  throw new Error('CONFIG ERROR: AUTH_MEMORY_FALLBACK cannot be enabled in production environment.');
}

const storageProvider = process.env.ATTACHMENT_STORAGE_PROVIDER ?? process.env.STORAGE_PROVIDER ?? (production ? 's3' : 'local');
const scannerProvider = process.env.ATTACHMENT_SCANNER_PROVIDER ?? (production ? 'clamav' : 'dev');
const s3Bucket = process.env.S3_BUCKET ?? 'fonolife-attachments-private';
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
}) {
  if (options.production) {
    if (options.storageProvider === "local") {
      throw new Error("CONFIG ERROR: LocalAttachmentStorage não pode ser utilizado em ambiente de produção.");
    }
    if (options.scannerProvider === "dev") {
      throw new Error("CONFIG ERROR: DevAttachmentScanner não pode ser utilizado em ambiente de produção.");
    }
    if (options.storageProvider === "s3") {
      if (!options.s3Bucket || !options.s3AccessKeyId || !options.s3SecretAccessKey) {
        throw new Error("CONFIG ERROR: S3_BUCKET, S3_ACCESS_KEY_ID e S3_SECRET_ACCESS_KEY são obrigatórios para storage S3 em produção.");
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
});

export const config = {
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://fonolife:fonolife@localhost:5432/fonolife',
  port: Number(process.env.PORT ?? 3000),
  origin: process.env.APP_ORIGIN ?? process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:5173',
  production,
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
  attachmentMaxBytes,
  attachmentDownloadTtlSeconds,
};
