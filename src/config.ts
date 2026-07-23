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

export const config = {
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://fonolife:fonolife@localhost:5432/fonolife',
  port: Number(process.env.PORT ?? 3000),
  origin: process.env.APP_ORIGIN ?? process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:5173',
  production,
  demo,
  authMemoryFallback,
  storageProvider: process.env.STORAGE_PROVIDER ?? 'local',
  s3Bucket: process.env.S3_BUCKET ?? 'fonolife-attachments-private',
  s3Region: process.env.S3_REGION ?? 'us-east-1',
  s3Endpoint: process.env.S3_ENDPOINT,
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
};

