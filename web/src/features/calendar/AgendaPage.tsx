import { useEffect, useState } from "react";
import { MonthCalendar, type Appointment } from "./MonthCalendar.js";
import { getSaoPauloDateString, getSaoPauloTimeString } from "./calendar.js";
import { Button, Card, EmptyState } from "../../components/ui.js";
import { AppointmentModal, type AppointmentPayload } from "./AppointmentModal.js";

export function AgendaPage({ 
  user, 
  api, 
  PatientLink, 
  initialPatientIdForSchedule 
}: { 
  user: { role: string; id: string },
  api: (url: string, options?: any) => Promise<any>,
  PatientLink: React.ComponentType<{ id: string; name: string }>,
  initialPatientIdForSchedule?: string | null
}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [filterDoctorId, setFilterDoctorId] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(getSaoPauloDateString(new Date().toISOString()));

  // Modal State
  const [modalOpen, setModalOpen] = useState(!!initialPatientIdForSchedule);
  const [modalInitialData, setModalInitialData] = useState<Partial<AppointmentPayload> | undefined>(
    initialPatientIdForSchedule ? { patientId: initialPatientIdForSchedule } : undefined
  );

  const isAdminOrOperator = user.role === "admin" || user.role === "operator";

  // Buscar médicos para o filtro
  useEffect(() => {
    if (isAdminOrOperator) {
      api("/api/doctors")
        .then((data) => setDoctors(data.doctors || []))
        .catch(console.error);
    }
  }, [isAdminOrOperator, api]);

  const loadAppointments = () => {
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
  };

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, filterDoctorId, isAdminOrOperator]);

  const handleDateChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const selectedAppointments = appointments.filter(
    (app) => getSaoPauloDateString(app.scheduledAt) === selectedDate
  ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const handleNewAppointment = () => {
    setModalInitialData(selectedDate ? { scheduledAt: `${selectedDate}T08:00:00Z` } : undefined);
    setModalOpen(true);
  };

  const handleEditAppointment = (app: Appointment) => {
    setModalInitialData({
      id: app.id,
      patientId: app.patientId,
      doctorId: app.doctorId || "",
      scheduledAt: app.scheduledAt,
      durationMinutes: app.durationMinutes,
      type: app.type,
      status: app.status,
      notes: app.notes,
    });
    setModalOpen(true);
  };

  const handleCancelAppointment = async (app: Appointment) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;
    try {
      await api(`/api/appointments/${app.id}`, { method: "PATCH", body: JSON.stringify({ status: "cancelled" }) });
      loadAppointments();
    } catch (err: any) {
      alert("Erro ao cancelar: " + err.message);
    }
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ margin: 0 }}>Agenda Mensal</h2>
        
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {isAdminOrOperator && (
            <select 
              value={filterDoctorId} 
              onChange={(e) => setFilterDoctorId(e.target.value)}
              aria-label="Filtrar por profissional"
            >
              <option value="">Todos os profissionais</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
          <Button onClick={handleNewAppointment}>+ Novo Agendamento</Button>
        </div>
      </div>

      {error && <p className="error" role="alert">Erro ao carregar agenda: {error}</p>}
      
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
        <div style={{ flex: "1 1 600px", minWidth: 0, position: "relative" }}>
          {loading && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.5)", zIndex: 10, display: "grid", placeItems: "center" }}>Carregando...</div>}
          <MonthCalendar
            appointments={appointments}
            initialYear={year}
            initialMonth={month}
            onMonthChange={handleDateChange}
            onDayClick={(date) => setSelectedDate(date)}
            onAppointmentClick={(app) => handleEditAppointment(app)}
          />
        </div>

        <div style={{ flex: "0 0 350px", minWidth: 0 }}>
          <h3 style={{ marginTop: 0 }}>Lista do Dia {selectedDate ? selectedDate.split("-").reverse().join("/") : ""}</h3>
          
          {selectedDate && selectedAppointments.length === 0 && (
            <EmptyState>Nenhum agendamento para este dia.</EmptyState>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto", maxHeight: "600px" }}>
            {selectedAppointments.map(app => (
              <div key={app.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "0.75rem", borderLeft: `4px solid var(--primary)`, background: app.status === "cancelled" ? "var(--bg)" : "transparent" }}>
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
                
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                  <Button variant="outline" className="compact-button" onClick={() => handleEditAppointment(app)}>Editar</Button>
                  {app.status !== "cancelled" && (
                    <Button variant="danger" className="compact-button" onClick={() => handleCancelAppointment(app)}>Cancelar</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AppointmentModal 
        isOpen={modalOpen} 
        onClose={() => { setModalOpen(false); setModalInitialData(undefined); }} 
        onSave={() => {
          setModalOpen(false);
          setModalInitialData(undefined);
          loadAppointments();
        }}
        api={api} 
        user={user} 
        initialData={modalInitialData}
      />
    </Card>
  );
}
