-- Migration 023: Defesa em profundidade garantindo unicidade de anonimização LGPD por paciente
CREATE UNIQUE INDEX IF NOT EXISTS patient_redactions_patient_unique ON patient_redactions(patient_id);
