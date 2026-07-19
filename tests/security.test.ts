import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, hashToken, validCnpj, verifyPassword } from '../src/domain/security.js';

test('scrypt autentica apenas a senha correta', async()=>{const hash=await hashPassword('admin123');assert.equal(await verifyPassword('admin123',hash),true);assert.equal(await verifyPassword('errada123',hash),false);});
test('tokens são armazenados somente como hash',()=>{assert.equal(hashToken('segredo').length,64);assert.notEqual(hashToken('segredo'),'segredo');});
test('valida CNPJ localmente',()=>{assert.equal(validCnpj('11.444.777/0001-61'),true);assert.equal(validCnpj('11.111.111/1111-11'),false);});
