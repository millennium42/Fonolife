import pg from 'pg';
import { config } from '../config.js';

const isCloudOrProduction = config.production || Boolean(process.env.DATABASE_SSL);
const ssl = isCloudOrProduction
  ? { rejectUnauthorized: false }
  : false;

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl,
});

