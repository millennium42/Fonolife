import { useEffect, useState } from "react";
import { MonthCalendar, type Appointment } from "./MonthCalendar.js";
import { getSaoPauloDateString, getSaoPauloTimeString } from "./calendar.js";
import { Button } from "../../components/ui.js";

export function DashboardCalendar({ 
  user, 
  api, 
  PatientLink 
}: { 
  user: { role: string; id: string },
  api: (url: string, options?: any) => Promise<any>,
  PatientLink: React.ComponentType<{ id: string; name: string }>
}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [filterDoctorId, setFilterDoctorId] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(getSaoPauloDateString(new Date().toISOString()));

  const isAdminOrOperator = user.role === "admin" || user.role === "operator";

  // Buscar médicos para o filtro
  useEffect(() => {
    if (isAdminOrOperator) {
      api("/api/doctors")
        .then((data) => setDoctors(data.doctors || []))
        .catch(console.error); // Ignora erro do select de médicos para não derrubar calendário
    }
  }, [isAdminOrOperator]);

  // Buscar agendamentos
  useEffect(() => {
    setLoading(true);
    let url = `/api/appointments?year=${year}&month=${month}`;
    if (filterDoctorId && isAdminOrOperator) {
      url += `&doctorId=${filterDoctorId}`;
    }
    
    api(url)
      .then((data) => {
        setAppointments(data.appointments || []);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [year, month, filterDoctorId, isAdminOrOperator]);

  const handleDateChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const selectedAppointments = appointments.filter(
    (app) => getSaoPauloDateString(app.scheduledAt) === selectedDate
  ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());


  return (
    <div style={{ marginTop: "2rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 600px", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>Agenda</h2>
          {isAdminOrOperator && (
            <select 
              value={filterDoctorId} 
              onChange={(e) => setFilterDoctorId(e.target.value)}
              style={{ width: "auto", display: "inline-block" }}
              aria-label="Filtrar por profissional"
            >
              <option value="">Todos os profissionais</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
        </div>
        
        {error && <p className="error" role="alert">Erro ao carregar agenda: {error}</p>}
        <div style={{ position: "relative" }}>
          {loading && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.5)", zIndex: 10, display: "grid", placeItems: "center" }}>Carregando...</div>}
          <MonthCalendar
            appointments={appointments}
            initialYear={year}
            initialMonth={month}
            onMonthChange={handleDateChange}
            onDayClick={(date) => setSelectedDate(date)}
            onAppointmentClick={(app) => setSelectedDate(getSaoPauloDateString(app.scheduledAt))}
          />
        </div>
      </div>

      <div style={{ flex: "0 0 350px", minWidth: 0 }} className="card">
        <h3>Detalhes do Dia {selectedDate ? selectedDate.split("-").reverse().join("/") : ""}</h3>
        
        <div style={{ margin: "1rem 0" }}>
          <Button onClick={() => alert("Callback: Abrir modal de novo agendamento")} style={{ width: "100%" }}>
            + Novo agendamento
          </Button>
        </div>

        {selectedDate && selectedAppointments.length === 0 && (
          <p style={{ color: "var(--text-muted)" }}>Nenhum agendamento para este dia.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto", maxHeight: "600px" }}>
          {selectedAppointments.map(app => (
            <div key={app.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "0.75rem", borderLeft: `4px solid var(--primary)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <strong style={{ fontSize: "1.1rem" }}>{getSaoPauloTimeString(app.scheduledAt)}</strong>
                <span className={`appointment-chip status-${app.status}`} style={{ width: "auto" }}>{app.status}</span>
              </div>
              <p style={{ margin: "0 0 0.25rem" }}>
                Paciente: <PatientLink id={app.patientId} name={app.patientId} />
              </p>
              {isAdminOrOperator && (
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Profissional: {doctors.find(d => d.id === app.doctorId)?.name || app.doctorId}
                </p>
              )}
              <p style={{ margin: "0", fontSize: "0.85rem" }}>Tipo: {app.type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
