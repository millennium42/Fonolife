-- Migration 019: Categorias de anexos clínicos e observações clínicas
ALTER TABLE patient_attachments ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other' CHECK (category IN ('audiometry', 'exam_report', 'medical_request', 'other'));
ALTER TABLE patient_attachments ADD COLUMN IF NOT EXISTS clinical_notes text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_patient_attachments_category ON patient_attachments(patient_id, category);
