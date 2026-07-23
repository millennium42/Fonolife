import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, hashToken, validCnpj, verifyPassword } from '../src/domain/security.js';

test('scrypt autentica apenas a senha correta', async()=>{const hash=await hashPassword('admin123');assert.equal(await verifyPassword('admin123',hash),true);assert.equal(await verifyPassword('errada123',hash),false);});
test('tokens são armazenados somente como hash',()=>{assert.equal(hashToken('segredo').length,64);assert.notEqual(hashToken('segredo'),'segredo');});
test('valida CNPJ localmente',()=>{assert.equal(validCnpj('11.444.777/0001-61'),true);assert.equal(validCnpj('11.111.111/1111-11'),false);});

import { canReadPatient, canWritePatient, canExportPatientData, canReadAttachment } from '../src/domain/security.js';

test('autorização por objeto (BOLA/IDOR): Admin e Operador acessam qualquer paciente', () => {
  const admin = { id: 'usr-admin', role: 'admin' as const };
  const operator = { id: 'usr-op', role: 'operator' as const };
  const patient = { id: 'pat-1', responsible_doctor_id: 'usr-doc1' };

  assert.equal(canReadPatient(admin, patient), true);
  assert.equal(canReadPatient(operator, patient), true);
  assert.equal(canWritePatient(admin, patient), true);
  assert.equal(canWritePatient(operator, patient), true);
  assert.equal(canExportPatientData(admin, patient), true);
  assert.equal(canReadAttachment(operator, patient), true);
});

test('autorização por objeto (BOLA/IDOR): Médico só acessa paciente vinculado', () => {
  const doc1 = { id: 'usr-doc1', role: 'doctor' as const };
  const doc2 = { id: 'usr-doc2', role: 'doctor' as const };
  const patient = { id: 'pat-1', responsible_doctor_id: 'usr-doc1' };

  assert.equal(canReadPatient(doc1, patient), true);
  assert.equal(canWritePatient(doc1, patient), true);
  assert.equal(canExportPatientData(doc1, patient), true);
  assert.equal(canReadAttachment(doc1, patient), true);

  assert.equal(canReadPatient(doc2, patient), false);
  assert.equal(canWritePatient(doc2, patient), false);
  assert.equal(canExportPatientData(doc2, patient), false);
  assert.equal(canReadAttachment(doc2, patient), false);
});

