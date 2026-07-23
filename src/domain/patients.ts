export const PATIENT_STATUSES = ['new_lead','screening','assessment_scheduled','proposal','sale_completed','adaptation','follow_up','inactive'] as const;
export const CONTACT_SOURCES = ['referral','whatsapp','instagram','google','walk_in','other'] as const;
export const PATIENT_EVENT_TYPES = ['call','whatsapp','consultation','device_adjustment','cleaning','maintenance','exchange','warranty','clinical_note','scheduled_return'] as const;

export type PatientStatus = typeof PATIENT_STATUSES[number];
export type ContactSource = typeof CONTACT_SOURCES[number];
export type PatientEventType = typeof PATIENT_EVENT_TYPES[number];

export const isOneOf = <T extends string>(value: unknown, values: readonly T[]): value is T => typeof value === 'string' && values.includes(value as T);
export const normalizePhone = (value: unknown) => typeof value === 'string' ? value.replace(/\D/g, '') : '';
export const validPatientName = (value: unknown) => typeof value === 'string' && value.trim().length >= 2;
export const validPatientPhone = (value: unknown) => normalizePhone(value).length >= 10 && normalizePhone(value).length <= 13;
export const validDoctorId = (value: unknown) => value === null || value === undefined || (typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value));
