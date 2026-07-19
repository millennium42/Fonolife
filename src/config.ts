export const config = {
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://fonolife:fonolife@localhost:5432/fonolife',
  port: Number(process.env.PORT ?? 3000),
  origin: process.env.APP_ORIGIN ?? 'http://localhost:5173',
  production: process.env.NODE_ENV === 'production',
  demo: process.env.DEMO_MODE === 'true'
};
