export interface CalendarDay {
  year: number;
  month: number;
  day: number;
  isCurrentMonth: boolean;
  dateString: string; // "YYYY-MM-DD" format
}

/**
 * Gera a grade de 42 células (6 semanas x 7 dias) para exibição do calendário,
 * preenchendo os dias do mês anterior e seguinte para completar as bordas.
 */
export function generateMonthGrid(year: number, month: number): CalendarDay[] {
  // Em JS, o mês no construtor de Date é zero-indexed, então (month - 1).
  const firstDay = new Date(year, month - 1, 1);
  const startDayOfWeek = firstDay.getDay(); // 0 (Dom) a 6 (Sáb)
  
  const lastDateOfMonth = new Date(year, month, 0).getDate();
  const lastDateOfPrevMonth = new Date(year, month - 1, 0).getDate();

  const grid: CalendarDay[] = [];
  
  // Dias do mês anterior
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = lastDateOfPrevMonth - i;
    grid.push({
      year: prevYear,
      month: prevMonth,
      day: d,
      isCurrentMonth: false,
      dateString: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    });
  }
  
  // Dias do mês atual
  for (let d = 1; d <= lastDateOfMonth; d++) {
    grid.push({
      year,
      month,
      day: d,
      isCurrentMonth: true,
      dateString: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    });
  }
  
  // Dias do próximo mês
  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth === 13) {
    nextMonth = 1;
    nextYear = year + 1;
  }
  const remaining = 42 - grid.length;
  for (let d = 1; d <= remaining; d++) {
    grid.push({
      year: nextYear,
      month: nextMonth,
      day: d,
      isCurrentMonth: false,
      dateString: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    });
  }
  
  return grid;
}

/**
 * Converte data ISO do backend em data local considerando America/Sao_Paulo.
 * Retorna YYYY-MM-DD para agrupamento correto.
 */
export function getSaoPauloDateString(isoString: string): string {
  // Pega a data formatada em pt-BR (dd/mm/yyyy) forçando o timezone local de SP
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(new Date(isoString));
  const d = parts.find(p => p.type === 'day')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const y = parts.find(p => p.type === 'year')?.value;
  return `${y}-${m}-${d}`;
}

export function getSaoPauloTimeString(isoString: string): string {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit'
  });
  return formatter.format(new Date(isoString));
}
