import { randomBytes, randomUUID } from 'node:crypto';
import Fastify, { type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import staticFiles from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pool } from './db/pool.js';
import { config } from './config.js';
import { hashPassword, hashToken, validCnpj, verifyPassword } from './domain/security.js';

type User = { id: string; name: string; email: string; role: 'admin'|'operator'; must_change_password: boolean };
declare module 'fastify' { interface FastifyRequest { currentUser?: User } }
const attempts = new Map<string, { count: number; reset: number }>();

export function buildApp() {
  const app = Fastify({ logger: true });
  app.register(cookie);
  app.setErrorHandler((error, request, reply) => {
    const failure = error as Error & { statusCode?: number };
    const status = Number(failure.statusCode ?? 500);
    request.log.error(error);
    reply.status(status).type('application/problem+json').send({ type: 'about:blank', title: status >= 500 ? 'Erro interno' : failure.message, status });
  });
  app.addHook('onRequest', async request => {
    if (!['GET','HEAD','OPTIONS'].includes(request.method)) {
      const origin = request.headers.origin;
      if (origin !== config.origin) throw Object.assign(new Error('Origem não permitida'), { statusCode: 403 });
    }
    const token = request.cookies.fonolife_session;
    if (!token) return;
    const result = await pool.query<User>(`SELECT u.id,u.name,u.email,u.role,u.must_change_password FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active`, [hashToken(token)]);
    request.currentUser = result.rows[0];
    if (request.currentUser?.must_change_password && !['/api/auth/me','/api/auth/change-password','/api/auth/logout'].includes(request.url)) throw Object.assign(new Error('Troque a senha temporária para continuar'), { statusCode: 403 });
  });
  const authenticated = async (request: FastifyRequest) => { if (!request.currentUser) throw Object.assign(new Error('Faça login para continuar'), { statusCode: 401 }); };
  const admin = async (request: FastifyRequest) => { await authenticated(request); if (request.currentUser?.role !== 'admin') throw Object.assign(new Error('Acesso restrito ao administrador'), { statusCode: 403 }); };
  const audit = (userId: string, action: string, entityType: string, entityId?: string, details = {}) => pool.query('INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)', [userId,action,entityType,entityId ?? null,details]);

  app.get('/api/health', async () => { await pool.query('SELECT 1'); return { status: 'ok' }; });
  app.post<{Body:{email?:string,password?:string}}>('/api/auth/login', async (request, reply) => {
    const key = request.ip; const now = Date.now(); const state = attempts.get(key);
    if (state && state.reset > now && state.count >= 5) return reply.code(429).send({ title: 'Muitas tentativas. Aguarde 15 minutos.', status: 429 });
    const email = request.body?.email?.trim().toLowerCase(); const password = request.body?.password;
    const result = email ? await pool.query('SELECT * FROM users WHERE email=$1 AND active', [email]) : { rows: [] };
    const user = result.rows[0];
    if (!user || !password || !await verifyPassword(password, user.password_hash)) {
      attempts.set(key, { count: state?.reset && state.reset > now ? state.count + 1 : 1, reset: now + 900_000 });
      return reply.code(401).send({ title: 'E-mail ou senha incorretos', status: 401 });
    }
    attempts.delete(key);
    const token = randomBytes(32).toString('base64url');
    await pool.query(`INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '8 hours')`, [randomUUID(),user.id,hashToken(token)]);
    await audit(user.id, 'login', 'user', user.id);
    reply.setCookie('fonolife_session', token, { httpOnly: true, sameSite: 'lax', secure: config.production, path: '/', maxAge: 28_800 });
    return { user: { id:user.id,name:user.name,email:user.email,role:user.role,mustChangePassword:user.must_change_password } };
  });
  app.post('/api/auth/logout', { preHandler: authenticated }, async (request, reply) => {
    const token = request.cookies.fonolife_session; if (token) await pool.query('DELETE FROM user_sessions WHERE token_hash=$1', [hashToken(token)]);
    await audit(request.currentUser!.id, 'logout', 'user', request.currentUser!.id); reply.clearCookie('fonolife_session', { path:'/' }); return reply.code(204).send();
  });
  app.get('/api/auth/me', { preHandler: authenticated }, async request => ({ user: request.currentUser }));
  app.post<{Body:{currentPassword?:string,newPassword?:string}}>('/api/auth/change-password', { preHandler: authenticated }, async (request, reply) => {
    const {currentPassword,newPassword}=request.body ?? {};
    const stored=await pool.query<{password_hash:string}>('SELECT password_hash FROM users WHERE id=$1',[request.currentUser!.id]);
    if(!currentPassword || !await verifyPassword(currentPassword,stored.rows[0].password_hash) || !newPassword || newPassword.length<8) return reply.code(400).type('application/problem+json').send({title:'Confira a senha atual e use ao menos 8 caracteres na nova senha',status:400});
    await pool.query('UPDATE users SET password_hash=$1,must_change_password=false WHERE id=$2',[await hashPassword(newPassword),request.currentUser!.id]);
    await audit(request.currentUser!.id,'change_password','user',request.currentUser!.id); return reply.code(204).send();
  });
  app.get('/api/admin/users', { preHandler: admin }, async () => ({ users: (await pool.query('SELECT id,name,email,role,active,must_change_password,created_at FROM users ORDER BY name')).rows }));
  app.post<{Body:{name:string,email:string,password:string,role:'admin'|'operator'}}>('/api/admin/users', { preHandler: admin }, async (request, reply) => {
    const {name,email,password,role}=request.body; if (!name?.trim() || !email?.includes('@') || !['admin','operator'].includes(role)) return reply.code(400).send({title:'Confira nome, e-mail e perfil',status:400});
    const id=randomUUID(); await pool.query('INSERT INTO users(id,name,email,password_hash,role,must_change_password) VALUES($1,$2,$3,$4,$5,true)',[id,name.trim(),email.trim().toLowerCase(),await hashPassword(password),role]);
    await audit(request.currentUser!.id,'create','user',id,{role}); return reply.code(201).send({id});
  });
  app.patch<{Params:{id:string};Body:{active?:boolean;role?:'admin'|'operator';temporaryPassword?:string}}>('/api/admin/users/:id', { preHandler: admin }, async (request,reply) => {
    const {active,role,temporaryPassword}=request.body ?? {}; if(role!==undefined&&!['admin','operator'].includes(role)) return reply.code(400).type('application/problem+json').send({title:'Perfil inválido',status:400});
    if(temporaryPassword!==undefined&&temporaryPassword.length<8) return reply.code(400).type('application/problem+json').send({title:'A senha temporária deve ter ao menos 8 caracteres',status:400});
    const client=await pool.connect(); try { await client.query('BEGIN'); await client.query('SELECT pg_advisory_xact_lock($1)',[740_043]);
      const target=await client.query<{role:string;active:boolean}>('SELECT role,active FROM users WHERE id=$1 FOR UPDATE',[request.params.id]); if(!target.rowCount) { await client.query('ROLLBACK'); return reply.code(404).type('application/problem+json').send({title:'Usuário não encontrado',status:404}); }
      const removesAdmin=target.rows[0].role==='admin'&&target.rows[0].active&&(active===false||role==='operator');
      if(removesAdmin){const count=await client.query<{count:string}>("SELECT count(*) FROM users WHERE role='admin' AND active");if(Number(count.rows[0].count)<=1){await client.query('ROLLBACK');return reply.code(409).type('application/problem+json').send({title:'Não é possível remover o último administrador',status:409});}}
      await client.query('UPDATE users SET active=COALESCE($1,active),role=COALESCE($2,role),password_hash=COALESCE($3,password_hash),must_change_password=CASE WHEN $3 IS NULL THEN must_change_password ELSE true END WHERE id=$4',[active??null,role??null,temporaryPassword?await hashPassword(temporaryPassword):null,request.params.id]);
      await client.query('INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)',[request.currentUser!.id,'update','user',request.params.id,{active,role,passwordReset:Boolean(temporaryPassword)}]); await client.query('COMMIT'); return reply.code(204).send();
    } catch(error){await client.query('ROLLBACK');throw error;} finally{client.release();}
  });
  app.get('/api/company-accounts', { preHandler: authenticated }, async () => ({ accounts: (await pool.query('SELECT id,trade_name,cnpj,short_label,active FROM company_accounts ORDER BY short_label')).rows }));
  app.post<{Body:{tradeName:string,cnpj:string,shortLabel:string}}>('/api/company-accounts', { preHandler: admin }, async (request,reply) => {
    const digits=request.body.cnpj?.replace(/\D/g,''); if(!validCnpj(digits ?? '')) return reply.code(400).send({title:'CNPJ inválido',status:400});
    const id=randomUUID(); await pool.query('INSERT INTO company_accounts(id,trade_name,cnpj,short_label) VALUES($1,$2,$3,$4)',[id,request.body.tradeName.trim(),digits,request.body.shortLabel.trim()]);
    await audit(request.currentUser!.id,'create','company_account',id); return reply.code(201).send({id});
  });

  const publicDir=resolve('dist/public');
  if(existsSync(publicDir)){ app.register(staticFiles,{root:publicDir}); app.setNotFoundHandler((request,reply)=>request.url.startsWith('/api/')?reply.code(404).send({title:'Não encontrado',status:404}):reply.sendFile('index.html')); }
  return app;
}
