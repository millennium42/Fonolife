export function validLicenseNumber(license?: string | null): boolean {
  if (!license) return false;
  const trimmed = license.trim();
  return trimmed.length >= 4 && trimmed.length <= 25;
}

export type CalendarDay = {
  dateString: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

export function buildCalendarDays(year: number, month: number, todayCivil?: string): CalendarDay[] {
  const days: CalendarDay[] = [];
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const startingDayOfWeek = firstDay.getUTCDay();
  const prevMonthLastDay = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const prevDay = prevMonthLastDay - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(prevDay).padStart(2, "0")}`;
    days.push({
      dateString: dateStr,
      dayOfMonth: prevDay,
      isCurrentMonth: false,
      isToday: dateStr === todayCivil,
    });
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({
      dateString: dateStr,
      dayOfMonth: d,
      isCurrentMonth: true,
      isToday: dateStr === todayCivil,
    });
  }

  const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length) % 7;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  for (let n = 1; n <= remaining; n++) {
    const dateStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
    days.push({
      dateString: dateStr,
      dayOfMonth: n,
      isCurrentMonth: false,
      isToday: dateStr === todayCivil,
    });
  }

  return days;
}
