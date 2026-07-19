import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const origin='http://localhost:3000';
async function login(email,password){const response=await fetch(`${origin}/api/auth/login`,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email,password})});assert.equal(response.status,200);return response.headers.getSetCookie()[0].split(';')[0];}
async function call(path,cookie,options={}){return fetch(`${origin}${path}`,{...options,headers:{origin,cookie,'content-type':'application/json',...options.headers}});}

const admin=await login('admin@demo.local','admin123');
const operator=await login('operador@demo.local','operador123');
const accounts=await (await call('/api/company-accounts',operator)).json();
const clientRequestId=randomUUID(), amountCents=12345;
const payload={clientRequestId,entryType:'income',category:'other_income',description:'Smoke financeiro idempotente',amountCents,competenceOn:'2026-07-18',occurredOn:'2026-07-18',paymentMethod:'pix',companyAccountId:accounts.accounts[0].id};
const first=await call('/api/finance/entries',operator,{method:'POST',body:JSON.stringify(payload)}), firstBody=await first.json();
assert.equal(first.status,201);
const retry=await call('/api/finance/entries',operator,{method:'POST',body:JSON.stringify(payload)}), retryBody=await retry.json();
assert.equal(retry.status,200); assert.equal(retryBody.id,firstBody.id);
assert.equal((await call('/api/finance/summary',operator)).status,403);
const summary=await (await call('/api/finance/summary',admin)).json();
assert.ok(summary.consolidated.income_cents>=amountCents);
const reversed=await call(`/api/finance/entries/${firstBody.id}/reverse`,admin,{method:'POST',body:JSON.stringify({clientRequestId:randomUUID(),reason:'correção smoke',occurredOn:'2026-07-18'})});
assert.equal(reversed.status,201);
assert.equal((await call(`/api/finance/entries/${firstBody.id}/reverse`,operator,{method:'POST',body:JSON.stringify({clientRequestId:randomUUID(),reason:'negado',occurredOn:'2026-07-18'})})).status,403);
console.log('finance-smoke: idempotência, saldo, estorno e RBAC aprovados');
