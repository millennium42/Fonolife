import { useState, useMemo } from "react";
import { generateMonthGrid, getSaoPauloDateString, getSaoPauloTimeString } from "./calendar.js";
import { Button } from "../../components/ui.js"; // Reuse UI components
import "./MonthCalendar.css";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId?: string;
  patientName?: string; // Assume we enrich this before passing, or just show ID for now
  scheduledAt: string; // ISO string
  durationMinutes: number;
  type: string;
  status: string;
  notes?: string;
}

interface MonthCalendarProps {
  appointments: Appointment[];
  onDayClick?: (dateString: string) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  initialYear?: number;
  initialMonth?: number; // 1-12
}

export function MonthCalendar({
  appointments,
  onDayClick,
  onAppointmentClick,
  initialYear = new Date().getFullYear(),
  initialMonth = new Date().getMonth() + 1,
  onMonthChange
}: MonthCalendarProps & { onMonthChange?: (year: number, month: number) => void }) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const updateDate = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
    onMonthChange?.(y, m);
  };

  const grid = useMemo(() => generateMonthGrid(year, month), [year, month]);

  // Group appointments by YYYY-MM-DD
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach(app => {
      const dateStr = getSaoPauloDateString(app.scheduledAt);
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(app);
    });
    // Sort appointments in each day by time
    map.forEach(list => {
      list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    });
    return map;
  }, [appointments]);

  const handlePrev = () => {
    if (month === 1) {
      updateDate(year - 1, 12);
    } else {
      updateDate(year, month - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      updateDate(year + 1, 1);
    } else {
      updateDate(year, month + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    updateDate(now.getFullYear(), now.getMonth() + 1);
  };

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
  const todayStr = getSaoPauloDateString(new Date().toISOString());

  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="month-calendar">
      <header className="month-calendar-header">
        <h2 className="month-calendar-title">{monthName} {year}</h2>
        <nav className="month-calendar-nav" aria-label="Navegação do calendário">
          <Button variant="outline" onClick={handlePrev} aria-label="Mês anterior">Anterior</Button>
          <Button variant="secondary" onClick={handleToday} aria-label="Ir para hoje">Hoje</Button>
          <Button variant="outline" onClick={handleNext} aria-label="Próximo mês">Próximo</Button>
        </nav>
      </header>
      
      <div className="month-calendar-grid">
        {weekdays.map(day => (
          <div key={day} className="month-calendar-weekday" aria-hidden="true">{day}</div>
        ))}
        
        {grid.map((cell, idx) => {
          const isToday = cell.dateString === todayStr;
          const dayAppointments = appointmentsByDate.get(cell.dateString) || [];
          const MAX_VISIBLE = 3;
          const visibleApps = dayAppointments.slice(0, MAX_VISIBLE);
          const hiddenCount = dayAppointments.length - MAX_VISIBLE;

          return (
            <div 
              key={idx} 
              className={`month-calendar-cell ${!cell.isCurrentMonth ? 'out-of-month' : ''} ${isToday ? 'today' : ''}`}
            >
              <div className="month-calendar-day-header">
                <span className="day-number" aria-label={isToday ? "Hoje" : undefined}>
                  {cell.day}
                </span>
                {onDayClick && (
                  <button 
                    className="day-action-button" 
                    onClick={() => onDayClick(cell.dateString)}
                    aria-label={`Adicionar agendamento para ${cell.dateString}`}
                    title="Novo agendamento"
                  >
                    +
                  </button>
                )}
              </div>
              
              <div className="appointments-list">
                {visibleApps.map(app => (
                  <button 
                    key={app.id} 
                    className={`appointment-chip status-${app.status}`}
                    onClick={() => onAppointmentClick && onAppointmentClick(app)}
                    aria-label={`Agendamento ${getSaoPauloTimeString(app.scheduledAt)} - ${app.status}`}
                  >
                    <span className="appointment-time">{getSaoPauloTimeString(app.scheduledAt)}</span>
                    <span className="appointment-patient">{app.patientName || 'Paciente'}</span>
                  </button>
                ))}
                
                {hiddenCount > 0 && (
                  <button 
                    className="more-button"
                    onClick={() => onDayClick && onDayClick(cell.dateString)}
                    aria-label={`Ver mais ${hiddenCount} agendamentos`}
                  >
                    +{hiddenCount} mais
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
