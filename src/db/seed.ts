import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { hashPassword } from '../domain/security.js';
import { pool } from './pool.js';

export async function seedDemo() {
  if (!config.demo) throw new Error('Seed DEMO recusado: defina DEMO_MODE=true');
  const users = [['Administrador Demo','admin@demo.local','admin123','admin'], ['Operador Demo','operador@demo.local','operador123','operator']] as const;
  for (const [name,email,password,role] of users) await pool.query(`INSERT INTO users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5) ON CONFLICT(email) DO NOTHING`, [randomUUID(),name,email,await hashPassword(password),role]);
  for (const [tradeName,cnpj,label] of [['Fonolife Centro','11.444.777/0001-61','Centro'],['Fonolife Norte','19.191.000/0001-00','Norte']]) await pool.query(`INSERT INTO company_accounts(id,trade_name,cnpj,short_label) VALUES($1,$2,$3,$4) ON CONFLICT(cnpj) DO NOTHING`, [randomUUID(),tradeName,cnpj.replace(/\D/g,''),label]);
}
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) seedDemo().then(() => pool.end()).catch(error => { console.error(error); process.exitCode=1; });
