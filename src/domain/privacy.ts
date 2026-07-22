export const ANONYMIZED_TEXT_PLACEHOLDER = "[DADOS REMOVIDOS LGPD]";
export const ANONYMIZED_PHONE = "5500000000000";

/**
 * Gera um nome pseudonimizado com base no UUID do paciente.
 */
export function anonymizePatientName(patientId: string): string {
  const shortId = typeof patientId === "string" && patientId.length >= 8 ? patientId.slice(0, 8) : "00000000";
  return `Paciente Anonimizado ${shortId}`;
}

/**
 * Verifica se um paciente já foi anonimizado anteriormente.
 */
export function isAnonymized(name: string): boolean {
  return typeof name === "string" && name.startsWith("Paciente Anonimizado");
}

/**
 * Formata o pacote completo de dados exportados do paciente para portabilidade LGPD (Art. 18).
 */
export function formatLgpdExportPackage(
  patient: Record<string, any>,
  timeline: any[],
  sales: any[],
  financial: any[],
  attachments: any[]
): Record<string, any> {
  return {
    exportMetadata: {
      exportedAt: new Date().toISOString(),
      formatVersion: "1.0",
      complianceNotice: "Exportação de dados pessoais para atendimento ao Direito de Portabilidade (LGPD - Art. 18, V)",
    },
    patientProfile: {
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      birthDate: patient.birth_date,
      guardianName: patient.guardian_name,
      contactSource: patient.contact_source,
      journeyStatus: patient.journey_status,
      careAlert: patient.care_alert,
      notes: patient.notes,
      createdAt: patient.created_at,
      anonymizedAt: patient.anonymized_at ?? null,
    },
    timelineHistory: timeline,
    salesHistory: sales,
    financialEntries: financial,
    attachmentsCatalog: attachments.map((a) => ({
      id: a.id,
      originalName: a.original_name,
      mimeType: a.mime_type,
      sizeBytes: a.size_bytes,
      fileHash: a.file_hash,
      createdAt: a.created_at,
    })),
  };
}
