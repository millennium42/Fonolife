export interface MedicalReportPayload {
  title?: string;
  diagnosis?: string;
  audiometricFindings?: string;
  recommendation?: string;
  conclusion?: string;
  professionalLicense?: string;
}

export function validMedicalReport(payload: MedicalReportPayload): boolean {
  const titleValid = Boolean(payload.title?.trim() && payload.title.trim().length >= 3);
  const diagnosisValid = Boolean(payload.diagnosis?.trim() && payload.diagnosis.trim().length >= 3);
  const recommendationValid = Boolean(payload.recommendation?.trim() && payload.recommendation.trim().length >= 3);
  const licenseValid = Boolean(payload.professionalLicense?.trim() && payload.professionalLicense.trim().length >= 3);

  return titleValid && diagnosisValid && recommendationValid && licenseValid;
}
