import { normalizePhone, validPatientPhone } from "./patients.js";

/**
 * Normaliza um telefone celular brasileiro de 11 dígitos para a formatação internacional E.164 (55 + DDD + Número).
 */
export function formatE164Phone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (!validPatientPhone(normalized)) return "";
  return `55${normalized}`;
}

/**
 * Gera uma URL segura do WhatsApp (wa.me) com codificação estrita de texto contra injeções.
 */
export function buildWhatsAppLink(phone: string, text: string): string {
  const e164 = formatE164Phone(phone);
  if (!e164) return "";
  const encodedText = encodeURIComponent(text.trim());
  return `https://wa.me/${e164}?text=${encodedText}`;
}

/**
 * Templates operacionais padronizados para mensagens de acompanhamento na Fonolife.
 */
export const WHATSAPP_TEMPLATES = {
  followUpReminder: (patientName: string, dateStr: string) =>
    `Olá, ${patientName.trim()}! Passando para lembrar sobre seu retorno agendado na clínica Fonolife para ${dateStr}. Como está seu acompanhamento?`,

  postSaleD7: (patientName: string) =>
    `Olá, ${patientName.trim()}! Como está sendo sua primeira semana de adaptação com o seu novo aparelho auditivo da Fonolife? Estamos à disposição para qualquer dúvida!`,

  postSaleD30: (patientName: string) =>
    `Olá, ${patientName.trim()}! Completamos 30 dias do seu aparelho auditivo Fonolife. Como está percebendo os sons no seu dia a dia?`,

  postSaleD90: (patientName: string) =>
    `Olá, ${patientName.trim()}! Faz 90 dias que você está com seu aparelho auditivo. Gostaria de agendar uma revisão preventiva gratuita na clínica Fonolife?`,
};
