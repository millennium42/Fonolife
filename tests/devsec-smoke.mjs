import assert from 'node:assert/strict';

const base='http://localhost:3000', origin=base;
const health=await fetch(`${base}/api/health`);
assert.equal(health.headers.get('x-content-type-options'),'nosniff');
assert.match(health.headers.get('content-security-policy')??'',/frame-ancestors 'none'/);
assert.match(health.headers.get('strict-transport-security')??'',/max-age=31536000/);

const missingOrigin=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
assert.equal(missingOrigin.status,403); assert.match(missingOrigin.headers.get('content-type')??'',/application\/problem\+json/);
const wrongOrigin=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{origin:'https://evil.invalid','content-type':'application/json'},body:'{}'});
assert.equal(wrongOrigin.status,403);

async function login(email,password){const response=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email,password})});assert.equal(response.status,200);const cookie=response.headers.getSetCookie()[0];assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=Lax/i);assert.match(cookie,/Secure/i);return cookie.split(';')[0];}
const operator=await login('operador@demo.local','operador123');
for(const path of ['/api/admin/users','/api/finance/summary']) assert.equal((await fetch(`${base}${path}`,{headers:{cookie:operator}})).status,403);
assert.equal((await fetch(`${base}/api/company-accounts`,{method:'POST',headers:{origin,cookie:operator,'content-type':'application/json'},body:'{}'})).status,403);
assert.equal((await fetch(`${base}/api/patients?search=${encodeURIComponent("' OR 1=1 --")}`,{headers:{cookie:operator}})).status,200);
assert.equal((await fetch(`${base}/api/auth/logout`,{method:'POST',headers:{origin,cookie:operator}})).status,204);
assert.equal((await fetch(`${base}/api/auth/me`,{headers:{cookie:operator}})).status,401);

for(let index=0;index<5;index++) await fetch(`${base}/api/auth/login`,{method:'POST',headers:{origin,'content-type':'application/json','x-forwarded-for':'203.0.113.9'},body:JSON.stringify({email:'nobody@invalid.local',password:'senha-invalida'})});
const limited=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{origin,'content-type':'application/json','x-forwarded-for':'203.0.113.9'},body:JSON.stringify({email:'nobody@invalid.local',password:'senha-invalida'})});
assert.equal(limited.status,429);
console.log('devsec-smoke: headers, cookie, CSRF, RBAC, Problem Details e rate limit aprovados');
