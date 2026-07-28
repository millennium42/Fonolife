import { randomUUID } from 'node:crypto';
import { pool } from './pool.js';
import { migrate } from './migrate.js';
import { hashPassword, isPasswordPolicyValid, MIN_PASSWORD_LENGTH } from '../domain/security.js';

const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.INITIAL_ADMIN_PASSWORD;
const name = process.env.INITIAL_ADMIN_NAME?.trim() || 'Administrador';

if (!email || !isPasswordPolicyValid(password)) throw new Error(`Defina INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD com ao menos ${MIN_PASSWORD_LENGTH} caracteres.`);
if (email.endsWith('@demo.invalid')) throw new Error('Identidades demonstrativas são proibidas para o administrador inicial.');

await migrate();
await pool.query(
  `INSERT INTO users(id,name,email,password_hash,role,must_change_password)
   VALUES($1,$2,$3,$4,'admin',true)
   ON CONFLICT(email) DO NOTHING`,
  [randomUUID(), name, email, await hashPassword(password)],
);
await pool.end();
console.log('Administrador inicial criado; a troca de senha será exigida no primeiro acesso.');
