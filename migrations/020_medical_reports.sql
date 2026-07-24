-- Migration 020: Tabela de Laudos Médicos e Fonoaudiológicos Estruturados
CREATE TABLE IF NOT EXISTS medical_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  title text NOT NULL CHECK (length(trim(title)) >= 3),
  diagnosis text NOT NULL CHECK (length(trim(diagnosis)) >= 3),
  audiometric_findings text NOT NULL DEFAULT '',
  recommendation text NOT NULL CHECK (length(trim(recommendation)) >= 3),
  conclusion text NOT NULL DEFAULT '',
  professional_name text NOT NULL CHECK (length(trim(professional_name)) >= 2),
  professional_license text NOT NULL CHECK (length(trim(professional_license)) >= 3),
  issued_by uuid NOT NULL REFERENCES users(id),
  issued_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_medical_reports_patient ON medical_reports(patient_id, issued_at DESC);

CREATE OR REPLACE FUNCTION reject_medical_report_changes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'medical_reports é imutável e append-only'; END $$;
DROP TRIGGER IF EXISTS medical_reports_immutable ON medical_reports;
CREATE TRIGGER medical_reports_immutable BEFORE UPDATE OR DELETE ON medical_reports
FOR EACH ROW EXECUTE FUNCTION reject_medical_report_changes();
