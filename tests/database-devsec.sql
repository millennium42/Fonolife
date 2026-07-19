\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
  actor uuid;
  patient uuid;
  account uuid;
  inactive_doctor uuid := gen_random_uuid();
BEGIN
  SELECT id INTO actor FROM users WHERE role = 'admin' AND active LIMIT 1;
  SELECT id INTO account FROM company_accounts WHERE active LIMIT 1;
  IF actor IS NULL OR account IS NULL THEN
    RAISE EXCEPTION 'seed necessário para o smoke de banco';
  END IF;
  INSERT INTO patients(id,name,phone,assigned_user_id,created_by)
  VALUES(gen_random_uuid(),'Paciente sintético DevSec','11900000000',actor,actor)
  RETURNING id INTO patient;

  BEGIN
    INSERT INTO financial_entries(
      id,entry_type,category,description,amount_cents,competence_on,occurred_on,
      payment_method,company_account_id,patient_id,created_by
    ) VALUES (
      gen_random_uuid(),'income','service','Serviço sem médico',1000,current_date,current_date,
      'pix',account,patient,actor
    );
    RAISE EXCEPTION 'controle financeiro sem médico falhou';
  EXCEPTION WHEN raise_exception THEN
    IF position('médico é obrigatório para serviço' in SQLERRM) = 0 THEN RAISE; END IF;
  END;

  BEGIN
    INSERT INTO follow_up_tasks(id,patient_id,title,due_on,created_by)
    VALUES(gen_random_uuid(),patient,'Retorno sem médico',current_date,actor);
    RAISE EXCEPTION 'controle de retorno sem médico falhou';
  EXCEPTION WHEN raise_exception THEN
    IF position('médico é obrigatório' in SQLERRM) = 0 THEN RAISE; END IF;
  END;

  INSERT INTO users(id,name,email,password_hash,role,active)
  VALUES(inactive_doctor,'Médico Inativo DevSec','medico.inativo.devsec@demo.local','teste','doctor',false);
  BEGIN
    INSERT INTO sales(
      id,client_request_id,patient_id,doctor_id,product,quantity,total_amount_cents,
      sold_on,company_account_id,created_by
    ) VALUES (
      gen_random_uuid(),gen_random_uuid(),patient,inactive_doctor,'Venda indevida',1,1000,
      current_date,account,actor
    );
    RAISE EXCEPTION 'controle de médico inativo falhou';
  EXCEPTION WHEN raise_exception THEN
    IF position('médico ativo é obrigatório' in SQLERRM) = 0 THEN RAISE; END IF;
  END;

  BEGIN
    UPDATE financial_entries
    SET amount_cents = amount_cents + 1
    WHERE id = (SELECT id FROM financial_entries LIMIT 1);
    RAISE EXCEPTION 'imutabilidade financeira falhou';
  EXCEPTION WHEN raise_exception THEN
    IF position('histórico financeiro é imutável' in SQLERRM) = 0 THEN RAISE; END IF;
  END;
END $$;

ROLLBACK;
