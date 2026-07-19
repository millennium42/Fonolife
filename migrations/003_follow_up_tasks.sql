CREATE TABLE IF NOT EXISTS follow_up_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  title text NOT NULL CHECK (length(trim(title)) >= 2),
  due_on date NOT NULL,
  notes text NOT NULL DEFAULT '',
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid NOT NULL REFERENCES users(id),
  closed_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (completed_at IS NULL OR cancelled_at IS NULL),
  CHECK ((completed_at IS NULL AND cancelled_at IS NULL AND closed_by IS NULL)
      OR ((completed_at IS NOT NULL OR cancelled_at IS NOT NULL) AND closed_by IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS follow_up_tasks_open_due_idx
  ON follow_up_tasks(due_on, patient_id) WHERE completed_at IS NULL AND cancelled_at IS NULL;

CREATE OR REPLACE FUNCTION reject_follow_up_deletion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'follow_up_tasks preserva histórico e não pode ser excluída'; END $$;
DROP TRIGGER IF EXISTS follow_up_tasks_no_delete ON follow_up_tasks;
CREATE TRIGGER follow_up_tasks_no_delete BEFORE DELETE ON follow_up_tasks
FOR EACH ROW EXECUTE FUNCTION reject_follow_up_deletion();

CREATE OR REPLACE FUNCTION restrict_follow_up_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.completed_at IS NOT NULL OR OLD.cancelled_at IS NOT NULL
     OR NEW.patient_id IS DISTINCT FROM OLD.patient_id OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.due_on IS DISTINCT FROM OLD.due_on OR NEW.notes IS DISTINCT FROM OLD.notes
     OR NEW.created_by IS DISTINCT FROM OLD.created_by OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.closed_by IS NULL OR (NEW.completed_at IS NULL) = (NEW.cancelled_at IS NULL)
  THEN RAISE EXCEPTION 'follow_up_tasks aceita somente encerramento único'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS follow_up_tasks_restrict_update ON follow_up_tasks;
CREATE TRIGGER follow_up_tasks_restrict_update BEFORE UPDATE ON follow_up_tasks
FOR EACH ROW EXECUTE FUNCTION restrict_follow_up_update();
