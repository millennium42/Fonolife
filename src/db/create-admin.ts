import { randomUUID } from 'node:crypto';
import { pool } from './pool.js';
import { migrate } from './migrate.js';
import { hashPassword } from '../domain/security.js';

const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.INITIAL_ADMIN_PASSWORD;
const name = process.env.INITIAL_ADMIN_NAME?.trim() || 'Administrador';

if (!email || !password || password.length < 12) throw new Error('Defina INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD com ao menos 12 caracteres.');
if (email.endsWith('@demo.local') || password === 'admin123') throw new Error('Credenciais DEMO são proibidas para o administrador inicial.');

await migrate();
await pool.query(
  `INSERT INTO users(id,name,email,password_hash,role,must_change_password)
   VALUES($1,$2,$3,$4,'admin',true)
   ON CONFLICT(email) DO NOTHING`,
  [randomUUID(), name, email, await hashPassword(password)],
);
await pool.end();
console.log('Administrador inicial criado; a troca de senha será exigida no primeiro acesso.');
