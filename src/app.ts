import { randomBytes, randomUUID } from 'node:crypto';
import Fastify, { type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import staticFiles from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pool } from './db/pool.js';
import { config } from './config.js';
import { hashPassword, hashToken, validCnpj, verifyPassword } from './domain/security.js';
import { CONTACT_SOURCES, isOneOf, normalizePhone, PATIENT_EVENT_TYPES, PATIENT_STATUSES, validPatientName, validPatientPhone } from './domain/patients.js';

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

  app.get<{Querystring:{search?:string;status?:string;overdue?:string;archived?:string}}>('/api/patients', { preHandler: authenticated }, async request => {
    const {search='',status,overdue,archived}=request.query;
    if(status && !isOneOf(status,PATIENT_STATUSES)) throw Object.assign(new Error('Status inválido'),{statusCode:400});
    const terms:string[]=[]; const values:unknown[]=[];
    if(archived!=='true') terms.push('p.archived_at IS NULL');
    if(status){values.push(status);terms.push(`p.journey_status=$${values.length}`);}
    if(search.trim()){values.push(`%${search.trim()}%`);terms.push(`(p.name ILIKE $${values.length} OR p.phone LIKE regexp_replace($${values.length}, '\\D', '', 'g'))`);}
    if(overdue==='true') terms.push("p.next_contact_on < (now() AT TIME ZONE 'America/Sao_Paulo')::date");
    const patients=await pool.query(`SELECT p.id,p.name,p.phone,p.journey_status,p.contact_source,p.care_alert,p.next_contact_on,p.archived_at,p.version,u.name assigned_user_name FROM patients p JOIN users u ON u.id=p.assigned_user_id ${terms.length?'WHERE '+terms.join(' AND '):''} ORDER BY (p.next_contact_on < (now() AT TIME ZONE 'America/Sao_Paulo')::date) DESC,p.next_contact_on NULLS LAST,p.name LIMIT 200`,values);
    return {patients:patients.rows};
  });
  app.post<{Body:{name?:string;phone?:string;birthDate?:string;guardianName?:string;contactSource?:string;status?:string;notes?:string;careAlert?:string;nextContactOn?:string;assignedUserId?:string}}>('/api/patients',{preHandler:authenticated},async(request,reply)=>{
    const body=request.body??{}; const phone=normalizePhone(body.phone); const source=body.contactSource??'other'; const status=body.status??'new_lead';
    if(!validPatientName(body.name)||!validPatientPhone(phone)||!isOneOf(source,CONTACT_SOURCES)||!isOneOf(status,PATIENT_STATUSES)) return reply.code(400).type('application/problem+json').send({title:'Informe nome, telefone válido, origem e status',status:400});
    const assigned=body.assignedUserId??request.currentUser!.id; const duplicate=await pool.query('SELECT id,name FROM patients WHERE phone=$1 AND archived_at IS NULL LIMIT 1',[phone]); const id=randomUUID();
    await pool.query(`WITH created AS (INSERT INTO patients(id,name,phone,birth_date,guardian_name,contact_source,journey_status,notes,care_alert,next_contact_on,assigned_user_id,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id) INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) SELECT $12,'create','patient',id,jsonb_build_object('status',$6::text) FROM created`,[id,body.name!.trim(),phone,body.birthDate||null,body.guardianName?.trim()||null,source,status,body.notes?.trim()||'',body.careAlert?.trim()||'',body.nextContactOn||null,assigned,request.currentUser!.id]);
    return reply.code(201).send({id,warning:duplicate.rows[0]?`Telefone também usado por ${duplicate.rows[0].name}`:null});
  });
  app.get<{Params:{id:string}}>('/api/patients/:id',{preHandler:authenticated},async(request,reply)=>{
    const patient=await pool.query(`SELECT p.*,u.name assigned_user_name FROM patients p JOIN users u ON u.id=p.assigned_user_id WHERE p.id=$1`,[request.params.id]);
    if(!patient.rowCount)return reply.code(404).type('application/problem+json').send({title:'Paciente não encontrado',status:404}); return {patient:patient.rows[0]};
  });
  app.patch<{Params:{id:string};Body:{version?:number;name?:string;phone?:string;birthDate?:string|null;guardianName?:string|null;contactSource?:string;status?:string;notes?:string;careAlert?:string;nextContactOn?:string|null;assignedUserId?:string}}>('/api/patients/:id',{preHandler:authenticated},async(request,reply)=>{
    const body=request.body??{}; const phone=normalizePhone(body.phone);
    if(!Number.isInteger(body.version)||!validPatientName(body.name)||!validPatientPhone(phone)||!isOneOf(body.contactSource,CONTACT_SOURCES)||!isOneOf(body.status,PATIENT_STATUSES)) return reply.code(400).type('application/problem+json').send({title:'Confira os dados do paciente',status:400});
    const result=await pool.query(`WITH updated AS (UPDATE patients SET name=$1,phone=$2,birth_date=$3,guardian_name=$4,contact_source=$5,journey_status=$6,notes=$7,care_alert=$8,next_contact_on=$9,assigned_user_id=COALESCE($10,assigned_user_id),version=version+1,updated_at=now() WHERE id=$11 AND version=$12 AND archived_at IS NULL RETURNING id,version), audited AS (INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) SELECT $13,'update','patient',id,jsonb_build_object('version',version) FROM updated) SELECT version FROM updated`,[body.name!.trim(),phone,body.birthDate||null,body.guardianName?.trim()||null,body.contactSource,body.status,body.notes?.trim()||'',body.careAlert?.trim()||'',body.nextContactOn||null,body.assignedUserId||null,request.params.id,body.version,request.currentUser!.id]);
    if(!result.rowCount){const exists=await pool.query('SELECT 1 FROM patients WHERE id=$1',[request.params.id]);return reply.code(exists.rowCount?409:404).type('application/problem+json').send({title:exists.rowCount?'Esta ficha foi alterada por outra pessoa. Recarregue antes de salvar.':'Paciente não encontrado',status:exists.rowCount?409:404});}
    return {version:result.rows[0].version};
  });
  app.post<{Params:{id:string};Body:{version?:number}}>('/api/patients/:id/archive',{preHandler:authenticated},async(request,reply)=>{
    if(!Number.isInteger(request.body?.version)) return reply.code(400).type('application/problem+json').send({title:'Versão da ficha obrigatória',status:400});
    const result=await pool.query(`WITH archived AS (UPDATE patients SET archived_at=now(),journey_status='inactive',version=version+1,updated_at=now() WHERE id=$1 AND version=$2 AND archived_at IS NULL RETURNING id), audited AS (INSERT INTO audit_events(user_id,action,entity_type,entity_id) SELECT $3,'archive','patient',id FROM archived) SELECT id FROM archived`,[request.params.id,request.body.version,request.currentUser!.id]);
    if(!result.rowCount){const exists=await pool.query('SELECT 1 FROM patients WHERE id=$1',[request.params.id]);return reply.code(exists.rowCount?409:404).type('application/problem+json').send({title:exists.rowCount?'A ficha mudou. Recarregue antes de arquivar.':'Paciente não encontrado',status:exists.rowCount?409:404});} return reply.code(204).send();
  });
  app.post<{Params:{id:string};Body:{eventType?:string;description?:string;occurredAt?:string}}>('/api/patients/:id/events',{preHandler:authenticated},async(request,reply)=>{
    const {eventType,description,occurredAt}=request.body??{}; if(!isOneOf(eventType,PATIENT_EVENT_TYPES)||!description?.trim()||description.trim().length<2)return reply.code(400).type('application/problem+json').send({title:'Escolha o tipo e descreva a interação',status:400});
    const event=await pool.query(`WITH created AS (INSERT INTO patient_events(id,patient_id,event_type,description,occurred_at,created_by) SELECT $1,p.id,$3,$4,COALESCE($5::timestamptz,now()),$6 FROM patients p WHERE p.id=$2 AND p.archived_at IS NULL RETURNING id), audited AS (INSERT INTO audit_events(user_id,action,entity_type,entity_id,details) SELECT $6,'create','patient_event',id,jsonb_build_object('patientId',$2::text,'eventType',$3::text) FROM created) SELECT id FROM created`,[randomUUID(),request.params.id,eventType,description.trim(),occurredAt||null,request.currentUser!.id]);
    if(!event.rowCount)return reply.code(404).type('application/problem+json').send({title:'Paciente não encontrado',status:404}); return reply.code(201).send({id:event.rows[0].id});
  });
  app.get<{Params:{id:string}}>('/api/patients/:id/timeline',{preHandler:authenticated},async(request)=>({items:(await pool.query(`SELECT e.id,'event' kind,e.event_type type,e.description,e.occurred_at occurred_at,u.name author FROM patient_events e JOIN users u ON u.id=e.created_by WHERE e.patient_id=$1 UNION ALL SELECT p.id,'patient_created','patient_created','Paciente cadastrado',p.created_at,u.name FROM patients p JOIN users u ON u.id=p.created_by WHERE p.id=$1 ORDER BY occurred_at DESC`,[request.params.id])).rows}));
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
