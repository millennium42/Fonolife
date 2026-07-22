CREATE INDEX IF NOT EXISTS patient_events_whatsapp_idx ON patient_events(patient_id, event_type) WHERE event_type = 'whatsapp';
