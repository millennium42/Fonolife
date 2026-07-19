CREATE OR REPLACE FUNCTION require_doctor_assignment() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME IN ('sales', 'follow_up_tasks') AND NEW.doctor_id IS NULL THEN
    RAISE EXCEPTION 'médico é obrigatório';
  END IF;
  IF TG_TABLE_NAME = 'financial_entries'
     AND to_jsonb(NEW)->>'category' = 'service'
     AND NEW.doctor_id IS NULL
  THEN
    RAISE EXCEPTION 'médico é obrigatório para serviço';
  END IF;
  IF NEW.doctor_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM users WHERE id = NEW.doctor_id AND role = 'doctor' AND active
  ) THEN
    IF TG_TABLE_NAME = 'financial_entries' THEN
      IF NOT (
        NEW.reversal_of_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM financial_entries original
          WHERE original.id = NEW.reversal_of_id
            AND original.doctor_id IS NOT DISTINCT FROM NEW.doctor_id
        )
        OR NEW.sale_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM sales
          WHERE id = NEW.sale_id
            AND doctor_id IS NOT DISTINCT FROM NEW.doctor_id
        )
      ) THEN RAISE EXCEPTION 'médico ativo é obrigatório'; END IF;
    ELSE
      RAISE EXCEPTION 'médico ativo é obrigatório';
    END IF;
  END IF;
  RETURN NEW;
END $$;
