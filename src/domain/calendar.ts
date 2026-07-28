/**
 * Retorna o último dia real do mês (28, 29, 30 ou 31),
 * resolvendo corretamente anos bissextos e datas civis no calendário.
 * @param year Ano (ex: 2026, 2028)
 * @param month Mês no intervalo [1..12]
 */
export function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
