-- Migration 014: Tabela de redações LGPD sem alterar patient_events imutável
CREATE TABLE IF NOT EXISTS patient_redactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT 'LGPD_ANONYMIZATION',
  redacted_at timestamptz NOT NULL DEFAULT now(),
  requested_by uuid REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS patient_redactions_patient_idx ON patient_redactions(patient_id);
