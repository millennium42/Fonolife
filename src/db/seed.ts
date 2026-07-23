import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { hashPassword } from '../domain/security.js';
import { pool } from './pool.js';

export async function seedDemo(force = false) {
  if (!config.demo && !force) throw new Error('Seed DEMO recusado: defina DEMO_MODE=true');
  const users = [
    ['Administrador Demo','admin@demo.local','admin123','admin', null, null],
    ['Operador Demo','operador@demo.local','operador123','operator', null, null],
    ['Dra. Sofia Lima','medico@demo.local','medico123','doctor', 'CRFa 2-19842', 'Audiologia Clínica']
  ] as const;
  for (const [name,email,password,role,license,specialty] of users) {
    await pool.query(
      `INSERT INTO users(id,name,email,password_hash,role,license_number,specialty) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(email) DO NOTHING`,
      [randomUUID(),name,email,await hashPassword(password),role,license,specialty]
    );
  }
  for (const [tradeName,cnpj,label] of [['Fonolife Centro','11.444.777/0001-61','Centro'],['Fonolife Norte','19.191.000/0001-00','Norte']]) await pool.query(`INSERT INTO company_accounts(id,trade_name,cnpj,short_label) VALUES($1,$2,$3,$4) ON CONFLICT(cnpj) DO NOTHING`, [randomUUID(),tradeName,cnpj.replace(/\D/g,''),label]);
}
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) seedDemo().then(() => pool.end()).catch(error => { console.error(error); process.exitCode=1; });
