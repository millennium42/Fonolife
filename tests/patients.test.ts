import test from 'node:test';
import assert from 'node:assert/strict';
import { isOneOf, normalizePhone, PATIENT_EVENT_TYPES, PATIENT_STATUSES, validPatientPhone } from '../src/domain/patients.js';
test('valida CRM',()=>{assert.equal(normalizePhone('(11) 99999-1234'),'11999991234');assert.equal(validPatientPhone('11999991234'),true);assert.equal(isOneOf('new_lead',PATIENT_STATUSES),true);assert.equal(isOneOf('clinical_note',PATIENT_EVENT_TYPES),true);});
